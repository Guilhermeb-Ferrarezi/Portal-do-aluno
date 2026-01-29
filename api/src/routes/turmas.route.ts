import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { authGuard } from "../middlewares/auth";
import { requireRole } from "../middlewares/requireRole";
import type { AuthRequest } from "../middlewares/auth";

type DbTurmaRow = {
  id: string;
  nome: string;
  tipo: "turma" | "particular";
  professor_id: string | null;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

const createTurmaSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  tipo: z.enum(["turma", "particular"]),
  professor_id: z.string().uuid("Professor ID inválido").optional().nullable(),
  descricao: z.string().optional().nullable(),
});

const updateTurmaSchema = createTurmaSchema.partial();

export function turmasRouter(jwtSecret: string) {
  const router = Router();

  // GET /turmas - Listar turmas (baseado no role do usuário)
  router.get("/turmas", authGuard(jwtSecret), async (req: AuthRequest, res) => {
    const userId = req.user!.sub;
    const userRole = req.user!.role;

    let query = `
      SELECT id, nome, tipo, professor_id, descricao, ativo, created_at, updated_at
      FROM turmas
      WHERE ativo = true
    `;
    const params: any[] = [];

    // Admin vê todas as turmas
    if (userRole === "admin") {
      // Sem filtros adicionais
    }
    // Professor vê apenas suas turmas
    else if (userRole === "professor") {
      query += ` AND professor_id = $1`;
      params.push(userId);
    }
    // Aluno vê turmas que pertence
    else {
      query += `
        AND id IN (
          SELECT turma_id FROM aluno_turma WHERE aluno_id = $1
        )
      `;
      params.push(userId);
    }

    query += " ORDER BY created_at DESC";

    const r = await pool.query<DbTurmaRow>(query, params);

    return res.json(
      r.rows.map((row) => ({
        id: row.id,
        nome: row.nome,
        tipo: row.tipo,
        professorId: row.professor_id,
        descricao: row.descricao,
        ativo: row.ativo,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    );
  });

  // GET /turmas/meus-responsaveis - Retorna turmas que o usuário é responsável (professor_id)
  router.get("/turmas/meus-responsaveis/count", authGuard(jwtSecret), async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.sub;
      const result = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM turmas WHERE ativo = true AND professor_id = $1`,
        [userId]
      );
      const total = parseInt(result.rows[0]?.count ?? "0", 10);
      return res.json({ total });
    } catch (error) {
      console.error("Erro ao contar turmas responsáveis:", error);
      return res.status(500).json({ message: "Erro ao contar turmas responsáveis" });
    }
  });

  // GET /turmas/total - Retorna o total de turmas do sistema
  router.get("/turmas/total", authGuard(jwtSecret), async (_req: AuthRequest, res) => {
    try {
      const result = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM turmas WHERE ativo = true`
      );
      const total = parseInt(result.rows[0]?.count ?? "0", 10);
      return res.json({ total });
    } catch (error) {
      console.error("Erro ao contar turmas:", error);
      return res.status(500).json({ message: "Erro ao contar turmas" });
    }
  });

  // GET /turmas/:id - Detalhes de uma turma com alunos e exercícios
  router.get("/turmas/:id", authGuard(jwtSecret), async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.sub;
    const userRole = req.user!.role;

    // Verificar se existe
    const checkTurma = await pool.query<DbTurmaRow>(
      `SELECT * FROM turmas WHERE id = $1`,
      [id]
    );

    if (checkTurma.rows.length === 0) {
      return res.status(404).json({ message: "Turma não encontrada" });
    }

    const turma = checkTurma.rows[0];

    // Verificar permissão: professor só vê suas turmas, aluno vê turmas que pertence
    if (userRole === "professor" && turma.professor_id !== userId) {
      return res.status(403).json({ message: "Sem permissão" });
    } else if (userRole === "aluno") {
      const hasAccess = await pool.query(
        `SELECT 1 FROM aluno_turma WHERE aluno_id = $1 AND turma_id = $2`,
        [userId, id]
      );
      if (hasAccess.rows.length === 0) {
        return res.status(403).json({ message: "Sem permissão" });
      }
    }

    // Buscar alunos da turma
    const alunosR = await pool.query(
      `
      SELECT u.id, u.usuario, u.nome, u.role
      FROM users u
      JOIN aluno_turma at ON u.id = at.aluno_id
      WHERE at.turma_id = $1
      ORDER BY u.nome
      `,
      [id]
    );

    // Buscar exercícios atribuídos
    const exerciciosR = await pool.query(
      `
      SELECT e.id, e.titulo, e.modulo
      FROM exercicios e
      JOIN exercicio_turma et ON e.id = et.exercicio_id
      WHERE et.turma_id = $1
      ORDER BY e.created_at DESC
      `,
      [id]
    );

    return res.json({
      id: turma.id,
      nome: turma.nome,
      tipo: turma.tipo,
      professorId: turma.professor_id,
      descricao: turma.descricao,
      ativo: turma.ativo,
      createdAt: turma.created_at,
      updatedAt: turma.updated_at,
      alunos: alunosR.rows.map((row) => ({
        id: row.id,
        usuario: row.usuario,
        nome: row.nome,
        role: row.role,
      })),
      exercicios: exerciciosR.rows.map((row) => ({
        id: row.id,
        titulo: row.titulo,
        modulo: row.modulo,
      })),
    });
  });

  // POST /turmas - Criar turma
  router.post(
    "/turmas",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req: AuthRequest, res) => {
      const parsed = createTurmaSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        });
      }

      const { nome, tipo, professor_id, descricao } = parsed.data;
      const userRole = req.user!.role;
      const userId = req.user!.sub;

      // Admin pode se auto-atribuir se não passar professor_id
      // Professor continua sempre se auto-atribuindo
      const finalProfessorId =
        userRole === "professor"
          ? userId
          : professor_id ?? (userRole === "admin" ? userId : null);

      const created = await pool.query<DbTurmaRow>(
        `INSERT INTO turmas (nome, tipo, professor_id, descricao)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [nome, tipo, finalProfessorId, descricao ?? null]
      );

      const row = created.rows[0];
      return res.status(201).json({
        message: "Turma criada com sucesso!",
        turma: {
          id: row.id,
          nome: row.nome,
          tipo: row.tipo,
          professorId: row.professor_id,
          descricao: row.descricao,
          ativo: row.ativo,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      });
    }
  );

  // PUT /turmas/:id - Atualizar turma
  router.put(
    "/turmas/:id",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req: AuthRequest, res) => {
      const { id } = req.params;
      const userId = req.user!.sub;
      const userRole = req.user!.role;

      const parsed = updateTurmaSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        });
      }

      // Verificar se existe
      const checkTurma = await pool.query<DbTurmaRow>(
        `SELECT * FROM turmas WHERE id = $1`,
        [id]
      );

      if (checkTurma.rows.length === 0) {
        return res.status(404).json({ message: "Turma não encontrada" });
      }

      const turma = checkTurma.rows[0];

      // Professor só pode editar suas turmas
      if (userRole === "professor" && turma.professor_id !== userId) {
        return res.status(403).json({ message: "Sem permissão" });
      }

      const { nome, tipo, professor_id, descricao } = parsed.data;

      const campos: string[] = [];
      const valores: any[] = [];
      let idx = 1;

      if (nome !== undefined) {
        campos.push(`nome = $${idx++}`);
        valores.push(nome);
      }

      if (tipo !== undefined) {
        campos.push(`tipo = $${idx++}`);
        valores.push(tipo);
      }

      if (descricao !== undefined) {
        campos.push(`descricao = $${idx++}`);
        valores.push(descricao);
      }

      const temProfessorId = Object.prototype.hasOwnProperty.call(parsed.data, "professor_id");
      if (userRole === "admin" && temProfessorId) {
        campos.push(`professor_id = $${idx++}`);
        valores.push(professor_id);
      }

      campos.push("updated_at = NOW()");

      const updated = await pool.query<DbTurmaRow>(
        `UPDATE turmas
         SET ${campos.join(", ")}
         WHERE id = $${idx}
         RETURNING *`,
        [...valores, id]
      );
      const row = updated.rows[0];
      return res.json({
        message: "Turma atualizada!",
        turma: {
          id: row.id,
          nome: row.nome,
          tipo: row.tipo,
          professorId: row.professor_id,
          descricao: row.descricao,
          ativo: row.ativo,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      });
    }
  );

  // DELETE /turmas/:id - Deletar turma
  router.delete(
    "/turmas/:id",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req: AuthRequest, res) => {
      const { id } = req.params;
      const userId = req.user!.sub;
      const userRole = req.user!.role;

      // Verificar se existe
      const checkTurma = await pool.query<DbTurmaRow>(
        `SELECT * FROM turmas WHERE id = $1`,
        [id]
      );

      if (checkTurma.rows.length === 0) {
        return res.status(404).json({ message: "Turma não encontrada" });
      }

      const turma = checkTurma.rows[0];

      // Professor só pode deletar suas turmas
      if (userRole === "professor" && turma.professor_id !== userId) {
        return res.status(403).json({ message: "Sem permissão" });
      }

      // Deletar relações (cascata automática no banco)
      await pool.query(`DELETE FROM turmas WHERE id = $1`, [id]);

      return res.json({ message: "Turma deletada com sucesso" });
    }
  );

  // POST /turmas/:id/alunos - Adicionar alunos à turma
  router.post(
    "/turmas/:id/alunos",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req: AuthRequest, res) => {
      const { id } = req.params;
      const { aluno_ids } = req.body;
      const userId = req.user!.sub;
      const userRole = req.user!.role;

      if (!Array.isArray(aluno_ids) || aluno_ids.length === 0) {
        return res.status(400).json({ message: "aluno_ids deve ser um array não vazio" });
      }

      // Verificar se turma existe
      const checkTurma = await pool.query<DbTurmaRow>(
        `SELECT * FROM turmas WHERE id = $1`,
        [id]
      );

      if (checkTurma.rows.length === 0) {
        return res.status(404).json({ message: "Turma não encontrada" });
      }

      const turma = checkTurma.rows[0];

      // Professor só pode adicionar alunos em suas turmas
      if (userRole === "professor" && turma.professor_id !== userId) {
        return res.status(403).json({ message: "Sem permissão" });
      }

      // Adicionar alunos
      for (const alunoId of aluno_ids) {
        try {
          await pool.query(
            `INSERT INTO aluno_turma (aluno_id, turma_id)
             VALUES ($1, $2)
             ON CONFLICT (aluno_id, turma_id) DO NOTHING`,
            [alunoId, id]
          );
        } catch (e) {
          // Ignorar erros de constraint (aluno já está na turma)
        }
      }

      return res.json({ message: "Alunos adicionados com sucesso" });
    }
  );

  // DELETE /turmas/:id/alunos/:alunoId - Remover aluno da turma
  router.delete(
    "/turmas/:id/alunos/:alunoId",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req: AuthRequest, res) => {
      const { id, alunoId } = req.params;
      const userId = req.user!.sub;
      const userRole = req.user!.role;

      // Verificar se turma existe
      const checkTurma = await pool.query<DbTurmaRow>(
        `SELECT * FROM turmas WHERE id = $1`,
        [id]
      );

      if (checkTurma.rows.length === 0) {
        return res.status(404).json({ message: "Turma não encontrada" });
      }

      const turma = checkTurma.rows[0];

      // Professor só pode remover alunos de suas turmas
      if (userRole === "professor" && turma.professor_id !== userId) {
        return res.status(403).json({ message: "Sem permissão" });
      }

      // Remover aluno
      await pool.query(
        `DELETE FROM aluno_turma WHERE aluno_id = $1 AND turma_id = $2`,
        [alunoId, id]
      );

      return res.json({ message: "Aluno removido da turma" });
    }
  );

  // POST /turmas/:id/exercicios - Atribuir exercícios à turma
  router.post(
    "/turmas/:id/exercicios",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req: AuthRequest, res) => {
      const { id } = req.params;
      const { exercicio_ids } = req.body;
      const userId = req.user!.sub;
      const userRole = req.user!.role;

      if (!Array.isArray(exercicio_ids) || exercicio_ids.length === 0) {
        return res.status(400).json({ message: "exercicio_ids deve ser um array não vazio" });
      }

      // Verificar se turma existe
      const checkTurma = await pool.query<DbTurmaRow>(
        `SELECT * FROM turmas WHERE id = $1`,
        [id]
      );

      if (checkTurma.rows.length === 0) {
        return res.status(404).json({ message: "Turma não encontrada" });
      }

      const turma = checkTurma.rows[0];

      // Professor só pode atribuir exercícios em suas turmas
      if (userRole === "professor" && turma.professor_id !== userId) {
        return res.status(403).json({ message: "Sem permissão" });
      }

      // Atribuir exercícios
      for (const exercicioId of exercicio_ids) {
        try {
          await pool.query(
            `INSERT INTO exercicio_turma (exercicio_id, turma_id)
             VALUES ($1, $2)
             ON CONFLICT (exercicio_id, turma_id) DO NOTHING`,
            [exercicioId, id]
          );
        } catch (e) {
          // Ignorar erros de constraint
        }
      }

      return res.json({ message: "Exercícios atribuídos com sucesso" });
    }
  );

  // DELETE /turmas/:id/exercicios/:exercicioId - Remover exercício da turma
  router.delete(
    "/turmas/:id/exercicios/:exercicioId",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req: AuthRequest, res) => {
      const { id, exercicioId } = req.params;
      const userId = req.user!.sub;
      const userRole = req.user!.role;

      // Verificar se turma existe
      const checkTurma = await pool.query<DbTurmaRow>(
        `SELECT * FROM turmas WHERE id = $1`,
        [id]
      );

      if (checkTurma.rows.length === 0) {
        return res.status(404).json({ message: "Turma não encontrada" });
      }

      const turma = checkTurma.rows[0];

      // Professor só pode remover exercícios de suas turmas
      if (userRole === "professor" && turma.professor_id !== userId) {
        return res.status(403).json({ message: "Sem permissão" });
      }

      // Remover exercício
      await pool.query(
        `DELETE FROM exercicio_turma WHERE exercicio_id = $1 AND turma_id = $2`,
        [exercicioId, id]
      );

      return res.json({ message: "Exercício removido da turma" });
    }
  );

  return router;
}
