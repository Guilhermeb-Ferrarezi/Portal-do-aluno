import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { pool } from "../db";
import { authGuard } from "../middlewares/auth";
import { requireRole } from "../middlewares/requireRole";
import type { AuthRequest, Role } from "../middlewares/auth";

type DbUserRow = {
  id: string;
  usuario: string;
  nome: string;
  role: Role;
  ativo: boolean;
  created_at: string; // pode ser Date dependendo do pg, mas string funciona bem
};

const createUserSchema = z.object({
  usuario: z.string().min(3, "Usuário muito curto"),
  nome: z.string().min(2, "Nome obrigatório"),
  senha: z.string().min(6, "Senha muito curta"),
  role: z.enum(["admin", "professor", "aluno"]).optional(),
  ativo: z.boolean().optional(),
});

export function usersRouter(jwtSecret: string) {
  const router = Router();

  // Quem tá logado (pra testar token e pegar role/nome no front)
  router.get("/users/me", authGuard(jwtSecret), async (req: AuthRequest, res) => {
    const userId = req.user!.sub;

    const r = await pool.query<DbUserRow>(
      `SELECT id, usuario, nome, role, ativo, created_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [userId]
    );

    if (!r.rowCount) return res.status(404).json({ message: "Usuário não encontrado" });

    const u = r.rows[0];
    return res.json({
      id: u.id,
      usuario: u.usuario,
      nome: u.nome,
      role: u.role,
      ativo: u.ativo,
      createdAt: u.created_at,
    });
  });

  // Listar usuários (admin) ou professores (admin/professor)
  router.get(
    "/users",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req: AuthRequest, res) => {
      const userRole = req.user!.role;
      const roleFilter = req.query.role as string | undefined;

      let query = `SELECT id, usuario, nome, role, ativo, created_at
         FROM users
         WHERE ativo = true`;

      // Se for professor, só pode ver professores (para atribuir turmas)
      if (userRole === "professor" && !roleFilter) {
        query += ` AND role = 'professor'`;
      }

      // Se solicitou filtro específico e é admin, aplica
      if (roleFilter && userRole === "admin") {
        query += ` AND role = $1`;
      } else if (roleFilter && userRole === "professor") {
        // Professor só pode ver professores, ignora outro filtro
        query += ` AND role = 'professor'`;
      }

      query += ` ORDER BY created_at DESC LIMIT 200`;

      const params = roleFilter && userRole === "admin" ? [roleFilter] : [];
      const r = await pool.query<DbUserRow>(query, params);

      return res.json(
        r.rows.map((u) => ({
          id: u.id,
          usuario: u.usuario,
          nome: u.nome,
          role: u.role,
          ativo: u.ativo,
          createdAt: u.created_at,
        }))
      );
    }
  );

  // Criar usuário:
  // - admin pode criar admin/professor/aluno
  // - professor pode criar APENAS aluno (se tentar outro, força aluno)
  router.post(
    "/users",
    authGuard(jwtSecret),
    requireRole(["admin"]),
    async (req: AuthRequest, res) => {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        });
      }

      const { usuario, nome, senha } = parsed.data;

      const role: Role = (parsed.data.role ?? "aluno") as Role;

      const ativo = parsed.data.ativo ?? true;

      const senhaHash = await bcrypt.hash(senha, 10);

      try {
        const created = await pool.query<DbUserRow>(
          `INSERT INTO users (usuario, nome, senha_hash, role, ativo)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, usuario, nome, role, ativo, created_at`,
          [usuario.trim(), nome.trim(), senhaHash, role, ativo]
        );

        const u = created.rows[0];
        return res.status(201).json({
          message: "Usuário criado com sucesso!",
          user: {
            id: u.id,
            usuario: u.usuario,
            nome: u.nome,
            role: u.role,
            ativo: u.ativo,
            createdAt: u.created_at,
          },
        });
      } catch (err: any) {
        // unique violation (usuario)
        if (err?.code === "23505") {
          return res.status(409).json({ message: "Usuário já existe" });
        }
        console.error(err);
        return res.status(500).json({ message: "Erro interno" });
      }
    }
  );

  return router;
}
