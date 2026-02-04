import express from "express";
import { z } from "zod";
import multer from "multer";
import { pool } from "../db";
import { authGuard, type AuthRequest } from "../middlewares/auth";
import { requireRole } from "../middlewares/requireRole";
import { uploadToR2, deleteFromR2 } from "../utils/uploadR2";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB para vídeos
  },
});

type VideoaulaRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  modulo: string;
  duracao: string | null;
  tipo: "youtube" | "vimeo" | "arquivo";
  url: string;
  created_by: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  turmas?: Array<{ id: string; nome: string; tipo: string }>;
};

const createVideoaulaSchema = z.object({
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  descricao: z.string().optional().nullable(),
  modulo: z.string().min(1, "Módulo é obrigatório"),
  duracao: z.string().optional().nullable(),
  tipo: z.enum(["youtube", "vimeo", "arquivo"]),
  url: z.string().optional(), // Para tipo="youtube" ou "vimeo"
});

const updateVideoaulaSchema = z.object({
  titulo: z.string().min(3).optional(),
  descricao: z.string().optional().nullable(),
  modulo: z.string().min(1).optional(),
  duracao: z.string().optional().nullable(),
  tipo: z.enum(["youtube", "vimeo", "arquivo"]).optional(),
  url: z.string().optional(),
});

function transformVideoaula(row: VideoaulaRow) {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    modulo: row.modulo,
    duracao: row.duracao,
    tipo: row.tipo,
    url: row.url,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    turmas: row.turmas && row.turmas.length > 0 ? row.turmas : undefined,
  };
}

export function videoaulasRouter(jwtSecret: string) {
  const router = express.Router();

  // GET /videoaulas - Listar todas (com filtro opcional por modulo)
  router.get("/videoaulas", authGuard(jwtSecret), async (req: AuthRequest, res) => {
    try {
      const { modulo } = req.query;
      const userRole = req.user?.role;
      const userId = req.user?.sub;

      let query = `
        SELECT
          v.id, v.titulo, v.descricao, v.modulo, v.duracao, v.tipo, v.url,
          v.created_by, v.created_at, v.updated_at,
          COALESCE(
            json_agg(
              json_build_object('id', t.id, 'nome', t.nome, 'tipo', t.tipo)
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'
          ) as turmas
        FROM videoaulas v
        LEFT JOIN videoaula_turma vt ON v.id = vt.videoaula_id
        LEFT JOIN turmas t ON vt.turma_id = t.id
      `;

      const conditions: string[] = [];
      const params: any[] = [];

      // Se aluno, filtrar por turmas do aluno ou videoaulas sem turma (visíveis para todos)
      if (userRole === "aluno") {
        conditions.push(`(
          vt.turma_id IN (
            SELECT turma_id FROM aluno_turma WHERE aluno_id = $${params.length + 1}
          )
          OR vt.turma_id IS NULL
        )`);
        params.push(userId);
      }

      // Filtro por módulo
      if (modulo) {
        conditions.push(`v.modulo = $${params.length + 1}`);
        params.push(modulo as string);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      query += ` GROUP BY v.id ORDER BY v.created_at DESC`;

      const result = await pool.query(query, params);
      const videoaulas = result.rows.map(transformVideoaula);

      res.json(videoaulas);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao listar videoaulas" });
    }
  });

  // GET /videoaulas/:id - Obter detalhes
  router.get("/videoaulas/:id", authGuard(jwtSecret), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT
          v.id, v.titulo, v.descricao, v.modulo, v.duracao, v.tipo, v.url,
          v.created_by, v.created_at, v.updated_at,
          COALESCE(
            json_agg(
              json_build_object('id', t.id, 'nome', t.nome, 'tipo', t.tipo)
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'
          ) as turmas
        FROM videoaulas v
        LEFT JOIN videoaula_turma vt ON v.id = vt.videoaula_id
        LEFT JOIN turmas t ON vt.turma_id = t.id
        WHERE v.id = $1
        GROUP BY v.id
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        res.status(404).json({ message: "Videoaula não encontrada" });
        return;
      }

      const videoaula = transformVideoaula(result.rows[0]);
      res.json(videoaula);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao obter videoaula" });
    }
  });

  // POST /videoaulas - Criar nova
  router.post(
    "/videoaulas",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    upload.single("file"),
    async (req: AuthRequest, res) => {
      try {
        const userId = req.user?.sub;

        if (!userId) {
          res.status(401).json({ message: "Usuário não identificado" });
          return;
        }

        // Parse body
        let data;
        try {
          data = createVideoaulaSchema.parse(req.body);
        } catch (error) {
          if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.issues[0].message });
            return;
          }
          throw error;
        }

        // Validar URL
        let fileUrl = data.url;

        if (data.tipo === "arquivo") {
          // Fazer upload do arquivo
          if (!req.file) {
            res.status(400).json({
              message: "Arquivo é obrigatório para tipo 'arquivo'",
            });
            return;
          }

          fileUrl = await uploadToR2(req.file);
        } else if (data.tipo === "youtube" || data.tipo === "vimeo") {
          // Validar URL
          if (!data.url) {
            res.status(400).json({
              message: `URL é obrigatória para tipo '${data.tipo}'`,
            });
            return;
          }

          try {
            new URL(data.url);
          } catch {
            res.status(400).json({ message: "URL inválida" });
            return;
          }
        }

        // Inserir no banco
        const result = await pool.query(
          `INSERT INTO videoaulas (titulo, descricao, modulo, duracao, tipo, url, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           RETURNING *`,
          [
            data.titulo,
            data.descricao || null,
            data.modulo,
            data.duracao || null,
            data.tipo,
            fileUrl,
            userId,
          ]
        );

        const videoaulaId = result.rows[0].id;

        // Processar turma_ids se fornecido
        if (req.body.turma_ids) {
          try {
            const turmaIds = JSON.parse(req.body.turma_ids);
            if (Array.isArray(turmaIds) && turmaIds.length > 0) {
              for (const turmaId of turmaIds) {
                await pool.query(
                  `INSERT INTO videoaula_turma (videoaula_id, turma_id)
                   VALUES ($1, $2)
                   ON CONFLICT (videoaula_id, turma_id) DO NOTHING`,
                  [videoaulaId, turmaId]
                );
              }
            }
          } catch (err) {
            console.error("Erro ao processar turma_ids:", err);
          }
        }

        // Buscar videoaula com turmas para retornar
        const videoaulaCompleta = await pool.query(
          `
          SELECT
            v.id, v.titulo, v.descricao, v.modulo, v.duracao, v.tipo, v.url,
            v.created_by, v.created_at, v.updated_at,
            COALESCE(
              json_agg(
                json_build_object('id', t.id, 'nome', t.nome, 'tipo', t.tipo)
              ) FILTER (WHERE t.id IS NOT NULL),
              '[]'
            ) as turmas
          FROM videoaulas v
          LEFT JOIN videoaula_turma vt ON v.id = vt.videoaula_id
          LEFT JOIN turmas t ON vt.turma_id = t.id
          WHERE v.id = $1
          GROUP BY v.id
          `,
          [videoaulaId]
        );

        const videoaula = transformVideoaula(videoaulaCompleta.rows[0]);
        res.status(201).json({ message: "Videoaula criada com sucesso", videoaula });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao criar videoaula" });
      }
    }
  );

  // PUT /videoaulas/:id - Atualizar
  router.put(
    "/videoaulas/:id",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    upload.single("file"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const userId = req.user?.sub;
        const userRole = req.user?.role;

        if (!userId) {
          res.status(401).json({ message: "Usuário não identificado" });
          return;
        }

        // Validar dados
        let data;
        try {
          data = updateVideoaulaSchema.parse(req.body);
        } catch (error) {
          if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.issues[0].message });
            return;
          }
          throw error;
        }

        // Buscar videoaula atual
        const videoaulaResult = await pool.query(
          "SELECT * FROM videoaulas WHERE id = $1",
          [id]
        );

        if (videoaulaResult.rows.length === 0) {
          res.status(404).json({ message: "Videoaula não encontrada" });
          return;
        }

        const videoaula = videoaulaResult.rows[0];

        // Verificar permissão (criador ou admin)
        if (userRole !== "admin" && videoaula.created_by !== userId) {
          res.status(403).json({
            message: "Você não tem permissão para atualizar esta videoaula",
          });
          return;
        }

        // Processar arquivo se enviado
        let fileUrl = data.url || videoaula.url;

        if (req.file) {
          // Se tinha arquivo anterior, deletar do R2
          if (videoaula.tipo === "arquivo") {
            await deleteFromR2(videoaula.url);
          }
          // Upload novo arquivo
          fileUrl = await uploadToR2(req.file);
        }

        // Validar URL se for tipo youtube/vimeo
        if ((data.tipo === "youtube" || data.tipo === "vimeo") && data.url) {
          try {
            new URL(data.url);
          } catch {
            res.status(400).json({ message: "URL inválida" });
            return;
          }
        }

        // Atualizar no banco
        const result = await pool.query(
          `UPDATE videoaulas
           SET titulo = COALESCE($1, titulo),
               descricao = COALESCE($2, descricao),
               modulo = COALESCE($3, modulo),
               duracao = COALESCE($4, duracao),
               tipo = COALESCE($5, tipo),
               url = $6,
               updated_at = NOW()
           WHERE id = $7
           RETURNING *`,
          [data.titulo, data.descricao, data.modulo, data.duracao, data.tipo, fileUrl, id]
        );

        // Processar turma_ids se fornecido
        if (req.body.turma_ids) {
          try {
            // Limpar atribuições antigas
            await pool.query("DELETE FROM videoaula_turma WHERE videoaula_id = $1", [id]);

            // Inserir novas atribuições
            const turmaIds = JSON.parse(req.body.turma_ids);
            if (Array.isArray(turmaIds) && turmaIds.length > 0) {
              for (const turmaId of turmaIds) {
                await pool.query(
                  `INSERT INTO videoaula_turma (videoaula_id, turma_id)
                   VALUES ($1, $2)
                   ON CONFLICT (videoaula_id, turma_id) DO NOTHING`,
                  [id, turmaId]
                );
              }
            }
          } catch (err) {
            console.error("Erro ao processar turma_ids:", err);
          }
        }

        // Buscar videoaula com turmas para retornar
        const videoaulaCompleta = await pool.query(
          `
          SELECT
            v.id, v.titulo, v.descricao, v.modulo, v.duracao, v.tipo, v.url,
            v.created_by, v.created_at, v.updated_at,
            COALESCE(
              json_agg(
                json_build_object('id', t.id, 'nome', t.nome, 'tipo', t.tipo)
              ) FILTER (WHERE t.id IS NOT NULL),
              '[]'
            ) as turmas
          FROM videoaulas v
          LEFT JOIN videoaula_turma vt ON v.id = vt.videoaula_id
          LEFT JOIN turmas t ON vt.turma_id = t.id
          WHERE v.id = $1
          GROUP BY v.id
          `,
          [id]
        );

        const updatedVideoaula = transformVideoaula(videoaulaCompleta.rows[0]);
        res.json({
          message: "Videoaula atualizada com sucesso",
          videoaula: updatedVideoaula,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao atualizar videoaula" });
      }
    }
  );

  // DELETE /videoaulas/:id - Deletar
  router.delete(
    "/videoaulas/:id",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const userId = req.user?.sub;
        const userRole = req.user?.role;

        if (!userId) {
          res.status(401).json({ message: "Usuário não identificado" });
          return;
        }

        // Buscar videoaula
        const videoaulaResult = await pool.query(
          "SELECT * FROM videoaulas WHERE id = $1",
          [id]
        );

        if (videoaulaResult.rows.length === 0) {
          res.status(404).json({ message: "Videoaula não encontrada" });
          return;
        }

        const videoaula = videoaulaResult.rows[0];

        // Verificar permissão (criador ou admin)
        if (userRole !== "admin" && videoaula.created_by !== userId) {
          res.status(403).json({
            message: "Você não tem permissão para deletar esta videoaula",
          });
          return;
        }

        // Deletar arquivo do R2 se for tipo arquivo
        if (videoaula.tipo === "arquivo") {
          await deleteFromR2(videoaula.url);
        }

        // Deletar do banco
        void await pool.query("DELETE FROM videoaulas WHERE id = $1", [id]);

        res.json({ message: "Videoaula deletada com sucesso" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao deletar videoaula" });
      }
    }
  );

  // POST /videoaulas/:id/turmas - Atribuir videoaula a turmas
  router.post(
    "/videoaulas/:id/turmas",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { turma_ids } = req.body;

        if (!Array.isArray(turma_ids) || turma_ids.length === 0) {
          return res.status(400).json({
            message: "turma_ids deve ser um array não-vazio",
          });
        }

        // Limpar atribuições antigas
        await pool.query("DELETE FROM videoaula_turma WHERE videoaula_id = $1", [id]);

        // Inserir novas atribuições
        for (const turmaId of turma_ids) {
          await pool.query(
            `INSERT INTO videoaula_turma (videoaula_id, turma_id)
             VALUES ($1, $2)
             ON CONFLICT (videoaula_id, turma_id) DO NOTHING`,
            [id, turmaId]
          );
        }

        res.json({ message: "Videoaula atribuída às turmas com sucesso" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao atribuir videoaula" });
      }
    }
  );

  // DELETE /videoaulas/:id/turmas/:turmaId - Remover videoaula de uma turma
  router.delete(
    "/videoaulas/:id/turmas/:turmaId",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req: AuthRequest, res) => {
      try {
        const { id, turmaId } = req.params;

        await pool.query(
          `DELETE FROM videoaula_turma WHERE videoaula_id = $1 AND turma_id = $2`,
          [id, turmaId]
        );

        res.json({ message: "Videoaula removida da turma" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao remover videoaula" });
      }
    }
  );

  return router;
}
