import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export type Role = "admin" | "professor" | "aluno";

export type User = {
  id: string;
  usuario: string;
  nome: string;
  senhaHash: string;
  role: Role;
};

// Usuários fake (pra testar AGORA)
export const users: User[] = [
  {
    id: "1",
    usuario: "admin",
    nome: "Administrador",
    senhaHash: bcrypt.hashSync("admin123", 10),
    role: "admin",
  },
  {
    id: "2",
    usuario: "prof",
    nome: "Professor",
    senhaHash: bcrypt.hashSync("prof123", 10),
    role: "professor",
  },
  {
    id: "3",
    nome: "Guilherme",
    usuario: "aluno",
    senhaHash: bcrypt.hashSync("aluno123", 10),
    role: "aluno",
  },
];

const loginSchema = z.object({
  usuario: z.string().min(1, "Usuário obrigatório"),
  senha: z.string().min(1, "Senha obrigatória"),
});

export function authRouter(jwtSecret: string) {
  const router = Router();

  router.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados inválidos",
        issues: parsed.error.flatten().fieldErrors,
      });
    }

    const { usuario, senha } = parsed.data;

    const user = users.find((u) => u.usuario === usuario);
    if (!user) {
      return res.status(401).json({ message: "Usuário ou senha inválidos" });
    }

    const senhaValida = await bcrypt.compare(senha, user.senhaHash);
    if (!senhaValida) {
      return res.status(401).json({ message: "Usuário ou senha inválidos" });
    }

    const token = jwt.sign(
      { sub: user.id, usuario: user.usuario, role: user.role },
      jwtSecret,
      { expiresIn: "2h" }
    );

    return res.status(200).json({
      message: "Login realizado com sucesso!",
      token,
      user: {
        id: user.id,
        usuario: user.usuario,
        nome: user.nome,
        role: user.role,
      },
    });
  });

  return router;
}
