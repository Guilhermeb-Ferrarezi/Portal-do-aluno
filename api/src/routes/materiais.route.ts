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
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

type MaterialRow = {
  id: string;
  titulo: string;
  tipo: "arquivo" | "link";
  modulo: string;
  descricao: string | null;
  url: string;
  created_by: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

const createMaterialSchema = z.object({
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  tipo: z.enum(["arquivo", "link"]),
  modulo: z.string().min(1, "Módulo é obrigatório"),
  descricao: z.string().optional().nullable(),
  url: z.string().optional(), // Para tipo="link"
});

const updateMaterialSchema = z.object({
  titulo: z.string().min(3).optional(),
  tipo: z.enum(["arquivo", "link"]).optional(),
  modulo: z.string().min(1).optional(),
  descricao: z.string().optional().nullable(),
  url: z.string().optional(),
});

function transformMaterial(row: MaterialRow) {
  return {
    id: row.id,
    titulo: row.titulo,
    tipo: row.tipo,
    modulo: row.modulo,
    descricao: row.descricao,
    url: row.url,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function materiaisRouter(jwtSecret: string) {
  const router = express.Router();

  // GET /materiais - Listar todos (com filtro opcional por modulo)
  router.get("/materiais", authGuard(jwtSecret), async (req: AuthRequest, res) => {
    try {
      const { modulo } = req.query;

      let query = "SELECT * FROM materiais ORDER BY created_at DESC";
      const params: string[] = [];

      if (modulo) {
        query += " WHERE modulo = $1";
        params.push(modulo as string);
      }

      const result = await pool.query(query, params);
      const materiais = result.rows.map(transformMaterial);

      res.json(materiais);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao listar materiais" });
    }
  });

  // GET /materiais/:id - Obter detalhes
  router.get("/materiais/:id", authGuard(jwtSecret), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query("SELECT * FROM materiais WHERE id = $1", [
        id,
      ]);

      if (result.rows.length === 0) {
        res.status(404).json({ message: "Material não encontrado" });
        return;
      }

      const material = transformMaterial(result.rows[0]);
      res.json(material);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao obter material" });
    }
  });

  // POST /materiais - Criar novo
  router.post(
    "/materiais",
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
          data = createMaterialSchema.parse(req.body);
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
            res
              .status(400)
              .json({ message: "Arquivo é obrigatório para tipo 'arquivo'" });
            return;
          }

          fileUrl = await uploadToR2(req.file);
        } else if (data.tipo === "link") {
          // Validar URL
          if (!data.url) {
            res.status(400).json({ message: "URL é obrigatória para tipo 'link'" });
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
          `INSERT INTO materiais (titulo, tipo, modulo, descricao, url, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
           RETURNING *`,
          [data.titulo, data.tipo, data.modulo, data.descricao || null, fileUrl, userId]
        );

        const material = transformMaterial(result.rows[0]);
        res.status(201).json({ message: "Material criado com sucesso", material });
      } catch (error) {
        console.error(error);
        res.status(500).json({error});
      }
    }
  );

  // PUT /materiais/:id - Atualizar
  router.put(
    "/materiais/:id",
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
          data = updateMaterialSchema.parse(req.body);
        } catch (error) {
          if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.issues[0].message });
            return;
          }
          throw error;
        }

        // Buscar material atual
        const materialResult = await pool.query(
          "SELECT * FROM materiais WHERE id = $1",
          [id]
        );

        if (materialResult.rows.length === 0) {
          res.status(404).json({ message: "Material não encontrado" });
          return;
        }

        const material = materialResult.rows[0];

        // Verificar permissão (criador ou admin)
        if (userRole !== "admin" && material.created_by !== userId) {
          res.status(403).json({ message: "Você não tem permissão para atualizar este material" });
          return;
        }

        // Processar arquivo se enviado
        let fileUrl = data.url || material.url;

        if (req.file) {
          // Se tinha arquivo anterior, deletar do R2
          if (material.tipo === "arquivo") {
            await deleteFromR2(material.url);
          }
          // Upload novo arquivo
          fileUrl = await uploadToR2(req.file);
        }

        // Validar URL se for tipo link
        if (data.tipo === "link" && data.url) {
          try {
            new URL(data.url);
          } catch {
            res.status(400).json({ message: "URL inválida" });
            return;
          }
        }

        // Atualizar no banco
        const result = await pool.query(
          `UPDATE materiais
           SET titulo = COALESCE($1, titulo),
               tipo = COALESCE($2, tipo),
               modulo = COALESCE($3, modulo),
               descricao = COALESCE($4, descricao),
               url = $5,
               updated_at = NOW()
           WHERE id = $6
           RETURNING *`,
          [
            data.titulo,
            data.tipo,
            data.modulo,
            data.descricao,
            fileUrl,
            id,
          ]
        );

        const updatedMaterial = transformMaterial(result.rows[0]);
        res.json({ message: "Material atualizado com sucesso", material: updatedMaterial });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao atualizar material" });
      }
    }
  );

  // DELETE /materiais/:id - Deletar
  router.delete(
    "/materiais/:id",
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

        // Buscar material
        const materialResult = await pool.query(
          "SELECT * FROM materiais WHERE id = $1",
          [id]
        );

        if (materialResult.rows.length === 0) {
          res.status(404).json({ message: "Material não encontrado" });
          return;
        }

        const material = materialResult.rows[0];

        // Verificar permissão (criador ou admin)
        if (userRole !== "admin" && material.created_by !== userId) {
          res.status(403).json({ message: "Você não tem permissão para deletar este material" });
          return;
        }

        // Deletar arquivo do R2 se for tipo arquivo
        if (material.tipo === "arquivo") {
          await deleteFromR2(material.url);
        }

        // Deletar do banco
        await pool.query("DELETE FROM materiais WHERE id = $1", [id]);

        res.json({ message: "Material deletado com sucesso" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao deletar material" });
      }
    }
  );

  return router;
}
