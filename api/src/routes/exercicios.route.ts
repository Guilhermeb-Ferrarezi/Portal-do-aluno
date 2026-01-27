import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { authGuard } from "../middlewares/auth";
import { requireRole } from "../middlewares/requireRole";
import type { AuthRequest } from "../middlewares/auth";

type DBDate = string | Date;

type ExercicioRow = {
  id: string;
  titulo: string;
  descricao: string;
  modulo: string;
  tema: string | null;
  prazo: DBDate | null;
  publicado: boolean;
  created_by: string | null;
  created_at: DBDate;
  updated_at: DBDate;
};

const createSchema = z.object({
  titulo: z.string().min(2, "Título obrigatório"),
  descricao: z.string().min(2, "Descrição obrigatória"),
  modulo: z.string().min(1, "Módulo obrigatório"),
  tema: z.string().optional().nullable(),
  prazo: z.coerce.date().optional().nullable(),
  publicado: z.boolean().optional(),
});

export function exerciciosRouter(jwtSecret: string) {
  const router = Router();

  // Público: qualquer um pode ver
  router.get("/exercicios", async (_req, res) => {
    const r = await pool.query<ExercicioRow>(
      `SELECT id, titulo, descricao, modulo, tema, prazo, publicado, created_by, created_at, updated_at
       FROM exercicios
       WHERE publicado = true
       ORDER BY created_at DESC`
    );

    return res.json(
      r.rows.map((row) => ({
        id: row.id,
        titulo: row.titulo,
        descricao: row.descricao,
        modulo: row.modulo,
        tema: row.tema,
        prazo: row.prazo,
        createdAt: row.created_at,
      }))
    );
  });

  // Protegido: só admin/professor cria
  router.post(
    "/exercicios",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req: AuthRequest, res) => {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        });
      }

      const { titulo, descricao, modulo, tema, prazo, publicado } = parsed.data;

      const created = await pool.query<ExercicioRow>(
        `INSERT INTO exercicios (titulo, descricao, modulo, tema, prazo, publicado, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, titulo, descricao, modulo, tema, prazo, publicado, created_by, created_at, updated_at`,
        [
          titulo,
          descricao,
          modulo,
          tema ?? null,
          prazo ?? null,
          publicado ?? true,
          req.user?.sub ?? null,
        ]
      );

      const row = created.rows[0];
      return res.status(201).json({
        message: "Exercício criado!",
        exercicio: {
          id: row.id,
          titulo: row.titulo,
          descricao: row.descricao,
          modulo: row.modulo,
          tema: row.tema,
          prazo: row.prazo,
          publicado: row.publicado,
          createdAt: row.created_at,
        },
      });
    }
  );

  return router;
}
