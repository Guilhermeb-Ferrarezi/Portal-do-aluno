import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { users, Role, User } from "./auth";

type JwtPayload = {
  sub: string;
  usuario: string;
  role: Role;
  iat: number;
  exp: number;
};

function authGuard(jwtSecret: string) {
  return (req: any, res: any, next: any) => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Token ausente" });
    }

    try {
      const payload = jwt.verify(token, jwtSecret) as JwtPayload;
      req.user = payload; // guarda no req
      next();
    } catch {
      return res.status(401).json({ message: "Token inválido ou expirado" });
    }
  };
}

function requireRole(allowed: Role[]) {
  return (req: any, res: any, next: any) => {
    const role = req.user?.role as Role | undefined;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ message: "Sem permissão" });
    }
    next();
  };
}

const createUserSchema = z.object({
  usuario: z.string().min(3, "Usuário muito curto"),
  nome: z.string().min(2, "Nome obrigatório"),
  senha: z.string().min(6, "Senha muito curta"),
  role: z.enum(["admin", "professor", "aluno"]).default("aluno"),
});

export function usersRouter(jwtSecret: string) {
  const router = Router();

  // POST /users -> criar usuário (só admin/professor)
  router.post(
    "/users",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    async (req, res) => {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        });
      }

      const { usuario, nome, senha, role } = parsed.data;

      const exists = users.some((u) => u.usuario === usuario);
      if (exists) {
        return res.status(409).json({ message: "Usuário já existe" });
      }

      const senhaHash = await bcrypt.hash(senha, 10);

      const newUser: User = {
        id: String(Date.now()),
        usuario,
        nome,
        senhaHash,
        role,
      };

      users.push(newUser);

      return res.status(201).json({
        message: "Usuário criado com sucesso!",
        user: {
          id: newUser.id,
          usuario: newUser.usuario,
          nome: newUser.nome,
          role: newUser.role,
        },
      });
    }
  );

  // (opcional) GET /users -> listar (só admin/professor)
  router.get(
    "/users",
    authGuard(jwtSecret),
    requireRole(["admin", "professor"]),
    (req, res) => {
      const list = users.map((u) => ({
        id: u.id,
        usuario: u.usuario,
        nome: u.nome,
        role: u.role,
      }));
      return res.json(list);
    }
  );

  return router;
}
