import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { authGuard } from "../middlewares/auth";
import { requireRole } from "../middlewares/requireRole";
import type { AuthRequest } from "../middlewares/auth";

type TipoResposta = "codigo" | "texto";

type SubmissaoRow = {
  id: string;
  exercicio_id: string;
  aluno_id: string;
  resposta: string;
  tipo_resposta: TipoResposta;
  linguagem: string | null;
  nota: number | null;
  corrigida: boolean;
  feedback_professor: string | null;
  created_at: string;
  updated_at: string;
};

const createSubmissaoSchema = z.object({
  resposta: z.string().min(1, "Resposta não pode estar vazia"),
  tipo_resposta: z.enum(["codigo", "texto"]),
  linguagem: z.string().optional().nullable(),
});

const corrigirSubmissaoSchema = z.object({
  nota: z.number().min(0).max(100),
  feedback: z.string().optional(),
});

function normalizarCodigo(codigo: string): string {
  return codigo
    .replace(/\s+/g, " ")
    .replace(/\n/g, " ")
    .trim();
}

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Calcula similaridade simples entre dois textos (Levenshtein distance aproximada)
function calcularSimilaridade(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  let diffs = 0;
  for (let i = 0; i < maxLen; i++) {
    if ((a[i] || "") !== (b[i] || "")) diffs++;
  }

  return 1 - diffs / maxLen;
}

function corrigirAutomaticamente(
  resposta: string,
  gabarito: string | null,
  tipo: TipoResposta
): number | null {
  if (!gabarito) return null;

  if (tipo === "texto") {
    const respostaNorm = normalizarTexto(resposta);
    const gabaritoNorm = normalizarTexto(gabarito);
    const similaridade = calcularSimilaridade(respostaNorm, gabaritoNorm);
    return Math.round(similaridade * 100);
  }

  if (tipo === "codigo") {
    const respostaLimpa = normalizarCodigo(resposta);
    const gabaritoLimpo = normalizarCodigo(gabarito);
    return respostaLimpa === gabaritoLimpo ? 100 : 0;
  }

  return null;
}

export function submissoesRouter(jwtSecret: string) {
  const router = Router();

  // POST /exercicios/:exercicioId/submissoes - Enviar resposta
  router.post(
    "/exercicios/:exercicioId/submissoes",
    authGuard(jwtSecret),
    async (req: AuthRequest, res) => {
      const { exercicioId } = req.params;
      const alunoId = req.user?.sub;

      if (!alunoId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const parsed = createSubmissaoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        });
      }

      try {
        // Verificar se exercício existe
        const exercicio = await pool.query(
          `SELECT id, gabarito, tipo_exercicio FROM exercicios WHERE id = $1 AND publicado = true`,
          [exercicioId]
        );

        if (exercicio.rows.length === 0) {
          return res.status(404).json({ message: "Exercício não encontrado" });
        }

        const exRow = exercicio.rows[0];
        const gabarito = exRow.gabarito;
        const { resposta, tipo_resposta, linguagem } = parsed.data;

        // Corrigir automaticamente se houver gabarito
        const notaAuto = corrigirAutomaticamente(resposta, gabarito, tipo_resposta);

        // Inserir submissão
        const result = await pool.query<SubmissaoRow>(
          `INSERT INTO submissoes (exercicio_id, aluno_id, resposta, tipo_resposta, linguagem, nota, corrigida)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            exercicioId,
            alunoId,
            resposta,
            tipo_resposta,
            linguagem ?? null,
            notaAuto, // nota automática se houver gabarito
            gabarito ? true : false, // marcar como corrigida se há gabarito
          ]
        );

        const submissao = result.rows[0];

        return res.status(201).json({
          message: "Submissão enviada com sucesso!",
          submissao: {
            id: submissao.id,
            exercicioId: submissao.exercicio_id,
            alunoId: submissao.aluno_id,
            resposta: submissao.resposta,
            tipoResposta: submissao.tipo_resposta,
            linguagem: submissao.linguagem,
            nota: submissao.nota,
            corrigida: submissao.corrigida,
            feedbackProfessor: submissao.feedback_professor,
            createdAt: submissao.created_at,
          },
        });
      } catch (error) {
        console.error("Erro ao criar submissão:", error);
        return res.status(500).json({ message: "Erro ao criar submissão" });
      }
    }
  );

  // GET /exercicios/:exercicioId/minhas-submissoes - Ver minhas tentativas
  router.get(
    "/exercicios/:exercicioId/minhas-submissoes",
    authGuard(jwtSecret),
    async (req: AuthRequest, res) => {
      const { exercicioId } = req.params;
      const alunoId = req.user?.sub;

      if (!alunoId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      try {
        const result = await pool.query<SubmissaoRow>(
          `SELECT * FROM submissoes
           WHERE exercicio_id = $1 AND aluno_id = $2
           ORDER BY created_at DESC`,
          [exercicioId, alunoId]
        );

        return res.json(
          result.rows.map((row) => ({
            id: row.id,
            exercicioId: row.exercicio_id,
            alunoId: row.aluno_id,
            resposta: row.resposta,
            tipoResposta: row.tipo_resposta,
            linguagem: row.linguagem,
            nota: row.nota,
            corrigida: row.corrigida,
            feedbackProfessor: row.feedback_professor,
            createdAt: row.created_at,
          }))
        );
      } catch (error) {
        console.error("Erro ao buscar submissões:", error);
        return res.status(500).json({ message: "Erro ao buscar submissões" });
      }
    }
  );

  // GET /minhas-submissoes - Ver todas as minhas submissões
  router.get("/minhas-submissoes", authGuard(jwtSecret), async (req: AuthRequest, res) => {
    const alunoId = req.user?.sub;

    if (!alunoId) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    try {
      const result = await pool.query<
        SubmissaoRow & {
          exercicio_titulo: string;
          exercicio_modulo: string;
        }
      >(
        `SELECT s.*, e.titulo as exercicio_titulo, e.modulo as exercicio_modulo
         FROM submissoes s
         JOIN exercicios e ON s.exercicio_id = e.id
         WHERE s.aluno_id = $1
         ORDER BY s.created_at DESC`,
        [alunoId]
      );

      return res.json(
        result.rows.map((row) => ({
          id: row.id,
          exercicioId: row.exercicio_id,
          exercicioTitulo: row.exercicio_titulo,
          exercicioModulo: row.exercicio_modulo,
          alunoId: row.aluno_id,
          resposta: row.resposta,
          tipoResposta: row.tipo_resposta,
          linguagem: row.linguagem,
          nota: row.nota,
          corrigida: row.corrigida,
          feedbackProfessor: row.feedback_professor,
          createdAt: row.created_at,
        }))
      );
    } catch (error) {
      console.error("Erro ao buscar submissões:", error);
      return res.status(500).json({ message: "Erro ao buscar submissões" });
    }
  });

  // GET /exercicios/:exercicioId/submissoes - Listar submissões (admin/professor)
  router.get(
    "/exercicios/:exercicioId/submissoes",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req: AuthRequest, res) => {
      const { exercicioId } = req.params;

      try {
        const result = await pool.query<
          SubmissaoRow & {
            usuario: string;
            nome_aluno: string;
          }
        >(
          `SELECT s.*, u.usuario, u.nome as nome_aluno
           FROM submissoes s
           JOIN users u ON s.aluno_id = u.id
           WHERE s.exercicio_id = $1
           ORDER BY s.created_at DESC`,
          [exercicioId]
        );

        return res.json(
          result.rows.map((row) => ({
            id: row.id,
            exercicioId: row.exercicio_id,
            alunoId: row.aluno_id,
            alunoUsuario: row.usuario,
            alunoNome: row.nome_aluno,
            resposta: row.resposta,
            tipoResposta: row.tipo_resposta,
            linguagem: row.linguagem,
            nota: row.nota,
            corrigida: row.corrigida,
            feedbackProfessor: row.feedback_professor,
            createdAt: row.created_at,
          }))
        );
      } catch (error) {
        console.error("Erro ao buscar submissões:", error);
        return res.status(500).json({ message: "Erro ao buscar submissões" });
      }
    }
  );

  // PUT /submissoes/:submissaoId/corrigir - Corrigir submissão (admin/professor)
  router.put(
    "/submissoes/:submissaoId/corrigir",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req: AuthRequest, res) => {
      const { submissaoId } = req.params;

      const parsed = corrigirSubmissaoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        });
      }

      const { nota, feedback } = parsed.data;

      try {
        const result = await pool.query<SubmissaoRow>(
          `UPDATE submissoes
           SET nota = $1, feedback_professor = $2, corrigida = true, updated_at = NOW()
           WHERE id = $3
           RETURNING *`,
          [nota, feedback ?? null, submissaoId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ message: "Submissão não encontrada" });
        }

        const submissao = result.rows[0];

        return res.json({
          message: "Submissão corrigida com sucesso!",
          submissao: {
            id: submissao.id,
            exercicioId: submissao.exercicio_id,
            alunoId: submissao.aluno_id,
            resposta: submissao.resposta,
            tipoResposta: submissao.tipo_resposta,
            linguagem: submissao.linguagem,
            nota: submissao.nota,
            corrigida: submissao.corrigida,
            feedbackProfessor: submissao.feedback_professor,
            createdAt: submissao.created_at,
          },
        });
      } catch (error) {
        console.error("Erro ao corrigir submissão:", error);
        return res.status(500).json({ message: "Erro ao corrigir submissão" });
      }
    }
  );

  return router;
}
