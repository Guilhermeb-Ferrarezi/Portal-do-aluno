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
  published_at: DBDate | null;
  created_by: string | null;
  tipo_exercicio: TipoExercicio | null;
  gabarito: string | null;
  linguagem_esperada: string | null;
  is_template: boolean;
  mouse_regras: string | null;
  multipla_regras: string | null;
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
    "looping",
    "mostra",
    "for",
    "while",
    "repetindo",
    "lista",
    "percorrendo",
    "número",
    "numero",
    "programa",
    "ação",
    "açao",
    "acao",
    "log",
    "()" ,
    "js",
    "python",
    "c#",
    "c++",
    "javaScript",
    "hello"
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
  published_at: z.coerce.date().optional().nullable(),
  gabarito: z.string().optional().nullable(),
  linguagem_esperada: z.string().optional().nullable(),
  is_template: z.boolean().optional().default(false),
  mouse_regras: z.string().optional().nullable(),
  multipla_regras: z.string().optional().nullable(),
});

export function exerciciosRouter(jwtSecret: string) {
  const router = Router();

  // GET /exercicios - Listar todos os exercícios públicos
  router.get("/exercicios", authGuard(jwtSecret), async (req: AuthRequest, res) => {
    const filtroTemplate = " AND is_template = false";

    const r = await pool.query<ExercicioRow>(
      `SELECT id, titulo, descricao, modulo, tema, prazo, publicado, published_at, created_by, tipo_exercicio, gabarito, linguagem_esperada, is_template, mouse_regras, multipla_regras, created_at, updated_at
       FROM exercicios
       WHERE publicado = true AND (published_at IS NULL OR published_at <= NOW())${filtroTemplate}
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
        publishedAt: row.published_at,
        tipoExercicio: row.tipo_exercicio,
        is_template: row.is_template,
        mouse_regras: row.mouse_regras,
        multipla_regras: row.multipla_regras,
        createdAt: row.created_at,
      }))
    );
  });

  // GET /exercicios/:id - Pegar detalhes de um exercício específico
  router.get("/exercicios/:id", authGuard(jwtSecret), async (req: AuthRequest, res) => {
    const isAluno = req.user?.role === "aluno";
    const filtroTemplate = isAluno ? " AND is_template = false" : "";
    const { id } = req.params;

    const r = await pool.query<ExercicioRow>(
      `SELECT id, titulo, descricao, modulo, tema, prazo, publicado, published_at, created_by, tipo_exercicio, gabarito, linguagem_esperada, is_template, mouse_regras, multipla_regras, created_at, updated_at
       FROM exercicios
       WHERE id = $1 AND publicado = true AND (published_at IS NULL OR published_at <= NOW())${filtroTemplate}`,
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
      publishedAt: row.published_at,
      publicado: row.publicado,
      tipoExercicio: row.tipo_exercicio,
      gabarito: row.gabarito, // Não retornar gabarito para alunos? Considerar isso
      linguagemEsperada: row.linguagem_esperada,
      is_template: row.is_template,
      mouse_regras: row.mouse_regras,
      multipla_regras: row.multipla_regras,
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

      const { titulo, descricao, modulo, tema, prazo, publicado, published_at, gabarito, linguagem_esperada, is_template, mouse_regras, multipla_regras } = parsed.data;

      // Detectar tipo automaticamente
      const tipoExercicio = detectarTipoExercicio(titulo, descricao);

      // Se tem published_at, publicado deve ser false até que a data chegue
      const shouldPublish = published_at ? false : (publicado ?? true);

      const created = await pool.query<ExercicioRow>(
        `INSERT INTO exercicios (titulo, descricao, modulo, tema, prazo, publicado, published_at, created_by, tipo_exercicio, gabarito, linguagem_esperada, is_template, mouse_regras, multipla_regras)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id, titulo, descricao, modulo, tema, prazo, publicado, created_by, tipo_exercicio, gabarito, linguagem_esperada, is_template, mouse_regras, multipla_regras, created_at, updated_at`,
        [
          titulo,
          descricao,
          modulo,
          tema ?? null,
          prazo ?? null,
          shouldPublish,
          published_at ?? null,
          req.user?.sub ?? null,
          tipoExercicio,
          gabarito ?? null,
          linguagem_esperada ?? null,
          is_template ?? false,
          mouse_regras ?? null,
          multipla_regras ?? null,
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
          mouse_regras: row.mouse_regras,
          multipla_regras: row.multipla_regras,
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

      const { titulo, descricao, modulo, tema, prazo, publicado, gabarito, linguagem_esperada, mouse_regras, multipla_regras } = parsed.data;

      // Detectar tipo automaticamente
      const tipoExercicio = detectarTipoExercicio(titulo, descricao);

      const updated = await pool.query<ExercicioRow>(
        `UPDATE exercicios
         SET titulo = $1, descricao = $2, modulo = $3, tema = $4, prazo = $5,
             publicado = $6, tipo_exercicio = $7, gabarito = $8, linguagem_esperada = $9,
             mouse_regras = $10, multipla_regras = $11, updated_at = NOW()
         WHERE id = $12
         RETURNING id, titulo, descricao, modulo, tema, prazo, publicado, created_by, tipo_exercicio, gabarito, linguagem_esperada, mouse_regras, multipla_regras, created_at, updated_at`,
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
          mouse_regras ?? null,
          multipla_regras ?? null,
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
          mouse_regras: row.mouse_regras,
          multipla_regras: row.multipla_regras,
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

  // GET /exercicios/templates - Listar templates (apenas admin)
  router.get(
    "/templates",
    authGuard(jwtSecret),
    requireRole(["admin"]),
    async (_req: AuthRequest, res) => {
      try {
        const result = await pool.query<ExercicioRow>(
          `SELECT id, titulo, descricao, modulo, tema, prazo, publicado, published_at,
                   created_by, tipo_exercicio, gabarito, linguagem_esperada, is_template,
                   mouse_regras, multipla_regras, created_at, updated_at
           FROM exercicios
           WHERE is_template = true
           ORDER BY modulo, titulo ASC`
        );

        return res.json({
          templates: result.rows.map((row) => ({
            id: row.id,
            titulo: row.titulo,
            descricao: row.descricao,
            modulo: row.modulo,
            tema: row.tema,
            tipoExercicio: row.tipo_exercicio,
            mouse_regras: row.mouse_regras,
            multipla_regras: row.multipla_regras,
            createdAt: row.created_at,
          })),
        });
      } catch (error) {
        console.error("Erro ao listar templates:", error);
        return res.status(500).json({ message: "Erro ao listar templates" });
      }
    }
  );

  // POST /exercicios/templates/:id/duplicate - Duplicar template (apenas admin)
  router.post(
    "/templates/:id/duplicate",
    authGuard(jwtSecret),
    requireRole(["admin"]),
    async (req: AuthRequest, res) => {
      const { id } = req.params;
      const { nova_titulo } = req.body;

      try {
        // Buscar template
        const templateResult = await pool.query<ExercicioRow>(
          `SELECT * FROM exercicios WHERE id = $1 AND is_template = true`,
          [id]
        );

        if (templateResult.rows.length === 0) {
          return res.status(404).json({ message: "Template não encontrado" });
        }

        const template = templateResult.rows[0];

        // Duplicar exercício
        const result = await pool.query<ExercicioRow>(
          `INSERT INTO exercicios (
            id, titulo, descricao, modulo, tema, prazo, publicado, published_at,
            created_by, gabarito, linguagem_esperada, is_template, mouse_regras, multipla_regras, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, $11, $12, NOW(), NOW()
          ) RETURNING *`,
          [
            nova_titulo || template.titulo,
            template.descricao,
            template.modulo,
            template.tema,
            template.prazo,
            true,
            null,
            req.user?.sub,
            template.gabarito,
            template.linguagem_esperada,
            template.mouse_regras,
            template.multipla_regras,
          ]
        );

        const newExercicio = result.rows[0];
        return res.status(201).json({
          message: "Template duplicado com sucesso!",
          exercicio: {
            id: newExercicio.id,
            titulo: newExercicio.titulo,
            modulo: newExercicio.modulo,
            tipoExercicio: newExercicio.tipo_exercicio,
            createdAt: newExercicio.created_at,
          },
        });
      } catch (error) {
        console.error("Erro ao duplicar template:", error);
        return res.status(500).json({ message: "Erro ao duplicar template" });
      }
    }
  );

  // PUT /exercicios/:id/marcar-como-template - Marcar exercício como template (apenas admin)
  router.put(
    "/:id/marcar-como-template",
    authGuard(jwtSecret),
    requireRole(["admin"]),
    async (req: AuthRequest, res) => {
      const { id } = req.params;
      const { is_template } = req.body;

      try {
        const result = await pool.query<ExercicioRow>(
          `UPDATE exercicios
           SET is_template = $1, updated_at = NOW()
           WHERE id = $2
           RETURNING *`,
          [is_template === true, id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ message: "Exercício não encontrado" });
        }

        const updated = result.rows[0];
        return res.json({
          message: `Exercício marcado como ${updated.is_template ? "template" : "exercício normal"}`,
          exercicio: {
            id: updated.id,
            titulo: updated.titulo,
            isTemplate: updated.is_template,
          },
        });
      } catch (error) {
        console.error("Erro ao marcar template:", error);
        return res.status(500).json({ message: "Erro ao marcar template" });
      }
    }
  );

  // SEED - Criar exercícios do Dia 1 (apenas admin)
  router.post(
    "/seed/dia1",
    authGuard(jwtSecret),
    requireRole(["admin"]),
    async (req: AuthRequest, res) => {
      try {
        // Verificar se já existem exercícios do Dia 1
        const checkExisting = await pool.query(
          `SELECT COUNT(*) as count FROM exercicios WHERE modulo = 'Dia 1 - Primeiro Contato'`
        );

        if (checkExisting.rows[0].count > 0) {
          return res.status(400).json({
            message:
              "Exercícios do Dia 1 já foram criados. Delete-os primeiro se quiser recriá-los.",
          });
        }

        // Exercício 1: Navegação no Portal
        const ex1 = await pool.query<ExercicioRow>(
          `INSERT INTO exercicios (id, titulo, descricao, modulo, tema, publicado, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
           RETURNING *`,
          [
            "Dia 1: Navegação no Portal",
            `## 🎯 Objetivo
Aprender a navegar no portal do aluno e encontrar elementos-chave.

## 📋 Questões

### Q1: Onde fica o menu principal?
- A) No topo da página
- B) Na barra lateral esquerda
- C) No rodapé
- D) Não existe menu

### Q2: Onde você acessa as aulas?
- A) Na aba "Trilha do Curso"
- B) Na aba "Materiais"
- C) Na aba "Videoaulas Bônus"
- D) Em "Dashboard"

### Q3: Como você submete um exercício?
- A) Pelo menu de configurações
- B) Clicando no botão de envio na página do exercício
- C) Por email
- D) Não é possível submeter

### Q4: Qual aba mostra seu perfil e informações pessoais?
- A) Dashboard
- B) Exercícios
- C) Perfil
- D) Turmas

## 📝 Respostas Corretas
Q1: B | Q2: A | Q3: B | Q4: C`,
            "Dia 1 - Primeiro Contato",
            "Navegação no Portal"
          ]
        );

        // Exercício 2: Conhecendo o Mouse
        const ex2 = await pool.query<ExercicioRow>(
          `INSERT INTO exercicios (id, titulo, descricao, modulo, tema, publicado, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
           RETURNING *`,
          [
            "Dia 1: Conhecendo o Mouse",
            `## 🎯 Objetivo
Aprender a usar o mouse corretamente e entender seus componentes.

## 🖱️ Componentes do Mouse

### Botão Esquerdo
- Usado para clicar em botões e links
- Seleção de texto

### Botão Direito
- Abre menu de contexto
- Não assuste, é seguro explorar!

### Rodinha (Scroll)
- Rola a página para cima e para baixo

## 📋 Tarefas Práticas

1. **Clique em 5 botões diferentes** no portal (Dashboard, Exercícios, Turmas, Materiais, Perfil)
2. **Rolar uma página até o final** - role toda a página de exercícios
3. **Voltar ao topo** - use a rodinha para voltar
4. **Clique direito em um elemento** - veja o menu de contexto

## 💡 Dica
Use a caixa abaixo para praticar! Clique e veja o rastreamento do seu mouse.

## ✅ Desafio
Quando completar, descreva qual foi seu maior desafio ao usar o mouse.`,
            "Dia 1 - Primeiro Contato",
            "Controle do Mouse"
          ]
        );

        // Exercício 3: Clique Consciente
        const ex3 = await pool.query<ExercicioRow>(
          `INSERT INTO exercicios (id, titulo, descricao, modulo, tema, publicado, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
           RETURNING *`,
          [
            "Dia 1: Clique Consciente",
            `## 🎯 Objetivo
Entender os diferentes tipos de cliques e perder o medo de explorar.

## 🖱️ Tipos de Cliques

### Clique Simples
- Ativa botões
- Seleciona opções
- Abre links

### Clique Duplo
- Abre arquivos
- Abre pastas
- Ativa edição

### Clique Direito
- Abre menu de opções
- Oferece alternativas
- Totalmente seguro!

## 📋 Tarefas Práticas

1. **Clique simples** em um botão (UMA VEZ)
2. **Clique duplo** em um item (DUAS VEZES rápidas)
3. **Clique direito** em um elemento (observe o menu)

## 🎓 Objetivo Oculto
Você está aprendendo que **não dá para quebrar nada!** O computador foi feito para resistir.

## 💡 Interatividade
Use a caixa abaixo para praticar todos os tipos de cliques!

## ✅ Feedback
Descreva:
- Qual tipo de clique foi mais fácil?
- Qual tipo foi mais desafiador?
- Perdeu o medo?`,
            "Dia 1 - Primeiro Contato",
            "Controle do Mouse e Cliques"
          ]
        );

        return res.status(201).json({
          message: "Exercícios do Dia 1 criados com sucesso!",
          exercicios: [
            {
              id: ex1.rows[0].id,
              titulo: ex1.rows[0].titulo,
              modulo: ex1.rows[0].modulo,
            },
            {
              id: ex2.rows[0].id,
              titulo: ex2.rows[0].titulo,
              modulo: ex2.rows[0].modulo,
            },
            {
              id: ex3.rows[0].id,
              titulo: ex3.rows[0].titulo,
              modulo: ex3.rows[0].modulo,
            },
          ],
        });
      } catch (error) {
        console.error("Erro ao seeding exercícios:", error);
        return res.status(500).json({ message: "Erro ao criar exercícios" });
      }
    }
  );

  return router;
}
