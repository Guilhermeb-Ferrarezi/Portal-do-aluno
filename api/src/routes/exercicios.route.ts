import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { authGuard } from "../middlewares/auth";
import { requireRole } from "../middlewares/requireRole";
import type { AuthRequest } from "../middlewares/auth";

type DBDate = string | Date;
type TipoExercicio = "codigo" | "texto";

type ExercicioRow = {
  id: string;
  titulo: string;
  descricao: string;
  modulo: string;
  tema: string | null;
  prazo: DBDate | null;
  publicado: boolean;
  created_by: string | null;
  tipo_exercicio: TipoExercicio | null;
  gabarito: string | null;
  linguagem_esperada: string | null;
  created_at: DBDate;
  updated_at: DBDate;
};

function detectarTipoExercicio(titulo: string, descricao: string): TipoExercicio {
  const texto = `${titulo} ${descricao}`.toLowerCase();

  const palavrasCodigo = [
    "código",
    "codigo",
    "programar",
    "implementar",
    "função",
    "funcao",
    "algoritmo",
    "script",
    "class",
    "def",
    "function",
    "const",
    "let",
    "var",
    "criar um programa",
    "escrever um código",
    "escrever codigo",
  ];

  const palavrasTexto = [
    "dissertação",
    "dissertacao",
    "redação",
    "redacao",
    "escrever sobre",
    "descrever",
    "explicar",
    "argumento",
    "opinião",
    "opiniao",
    "análise",
    "analise",
    "resumo",
    "resenha",
    "texto",
    "redação",
  ];

  const scoreCodigo = palavrasCodigo.filter((p) => texto.includes(p)).length;
  const scoreTexto = palavrasTexto.filter((p) => texto.includes(p)).length;

  if (scoreCodigo > scoreTexto) return "codigo";
  if (scoreTexto > scoreCodigo) return "texto";

  // Default: se tem símbolos de código, considera código
  if (/[{}<>=;()\[\]]/.test(texto)) return "codigo";

  return "texto"; // fallback padrão
}

const createSchema = z.object({
  titulo: z.string().min(2, "Título obrigatório"),
  descricao: z.string().min(2, "Descrição obrigatória"),
  modulo: z.string().min(1, "Módulo obrigatório"),
  tema: z.string().optional().nullable(),
  prazo: z.coerce.date().optional().nullable(),
  publicado: z.boolean().optional(),
  gabarito: z.string().optional().nullable(),
  linguagem_esperada: z.string().optional().nullable(),
});

export function exerciciosRouter(jwtSecret: string) {
  const router = Router();

  // GET /exercicios - Listar todos os exercícios públicos
  router.get("/exercicios", async (_req, res) => {
    const r = await pool.query<ExercicioRow>(
      `SELECT id, titulo, descricao, modulo, tema, prazo, publicado, created_by, tipo_exercicio, gabarito, linguagem_esperada, created_at, updated_at
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
        tipoExercicio: row.tipo_exercicio,
        createdAt: row.created_at,
      }))
    );
  });

  // GET /exercicios/:id - Pegar detalhes de um exercício específico
  router.get("/exercicios/:id", async (req, res) => {
    const { id } = req.params;

    const r = await pool.query<ExercicioRow>(
      `SELECT id, titulo, descricao, modulo, tema, prazo, publicado, created_by, tipo_exercicio, gabarito, linguagem_esperada, created_at, updated_at
       FROM exercicios
       WHERE id = $1 AND publicado = true`,
      [id]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ message: "Exercício não encontrado" });
    }

    const row = r.rows[0];
    return res.json({
      id: row.id,
      titulo: row.titulo,
      descricao: row.descricao,
      modulo: row.modulo,
      tema: row.tema,
      prazo: row.prazo,
      publicado: row.publicado,
      tipoExercicio: row.tipo_exercicio,
      gabarito: row.gabarito, // Não retornar gabarito para alunos? Considerar isso
      linguagemEsperada: row.linguagem_esperada,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
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

      const { titulo, descricao, modulo, tema, prazo, publicado, gabarito, linguagem_esperada } = parsed.data;

      // Detectar tipo automaticamente
      const tipoExercicio = detectarTipoExercicio(titulo, descricao);

      const created = await pool.query<ExercicioRow>(
        `INSERT INTO exercicios (titulo, descricao, modulo, tema, prazo, publicado, created_by, tipo_exercicio, gabarito, linguagem_esperada)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, titulo, descricao, modulo, tema, prazo, publicado, created_by, tipo_exercicio, gabarito, linguagem_esperada, created_at, updated_at`,
        [
          titulo,
          descricao,
          modulo,
          tema ?? null,
          prazo ?? null,
          publicado ?? true,
          req.user?.sub ?? null,
          tipoExercicio,
          gabarito ?? null,
          linguagem_esperada ?? null,
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
          tipoExercicio: row.tipo_exercicio,
          gabarito: row.gabarito,
          linguagemEsperada: row.linguagem_esperada,
          createdAt: row.created_at,
        },
      });
    }
  );

  // Protegido: só admin/professor pode atualizar
  router.put(
    "/exercicios/:id",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req: AuthRequest, res) => {
      const { id } = req.params;

      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        });
      }

      // Verificar se exercício existe
      const checkExercicio = await pool.query<ExercicioRow>(
        `SELECT id FROM exercicios WHERE id = $1`,
        [id]
      );

      if (checkExercicio.rows.length === 0) {
        return res.status(404).json({ message: "Exercício não encontrado" });
      }

      const { titulo, descricao, modulo, tema, prazo, publicado, gabarito, linguagem_esperada } = parsed.data;

      // Detectar tipo automaticamente
      const tipoExercicio = detectarTipoExercicio(titulo, descricao);

      const updated = await pool.query<ExercicioRow>(
        `UPDATE exercicios
         SET titulo = $1, descricao = $2, modulo = $3, tema = $4, prazo = $5,
             publicado = $6, tipo_exercicio = $7, gabarito = $8, linguagem_esperada = $9,
             updated_at = NOW()
         WHERE id = $10
         RETURNING id, titulo, descricao, modulo, tema, prazo, publicado, created_by, tipo_exercicio, gabarito, linguagem_esperada, created_at, updated_at`,
        [
          titulo,
          descricao,
          modulo,
          tema ?? null,
          prazo ?? null,
          publicado ?? true,
          tipoExercicio,
          gabarito ?? null,
          linguagem_esperada ?? null,
          id,
        ]
      );

      const row = updated.rows[0];
      return res.json({
        message: "Exercício atualizado!",
        exercicio: {
          id: row.id,
          titulo: row.titulo,
          descricao: row.descricao,
          modulo: row.modulo,
          tema: row.tema,
          prazo: row.prazo,
          publicado: row.publicado,
          tipoExercicio: row.tipo_exercicio,
          gabarito: row.gabarito,
          linguagemEsperada: row.linguagem_esperada,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      });
    }
  );

  // Protegido: só admin/professor pode deletar
  router.delete(
    "/exercicios/:id",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req: AuthRequest, res) => {
      const { id } = req.params;

      // Verificar se exercício existe
      const checkExercicio = await pool.query<ExercicioRow>(
        `SELECT id FROM exercicios WHERE id = $1`,
        [id]
      );

      if (checkExercicio.rows.length === 0) {
        return res.status(404).json({ message: "Exercício não encontrado" });
      }

      // Deletar submissões primeiro (cascade)
      await pool.query(
        `DELETE FROM submissoes WHERE exercicio_id = $1`,
        [id]
      );

      // Deletar exercício
      await pool.query(
        `DELETE FROM exercicios WHERE id = $1`,
        [id]
      );

      return res.json({ message: "Exercício deletado com sucesso" });
    }
  );

  return router;
}
