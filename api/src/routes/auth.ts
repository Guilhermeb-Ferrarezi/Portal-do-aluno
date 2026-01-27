import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

type User = {
  id: string;
  usuario: string;
  nome: string;
  senhaHash: string;
  role: "admin" | "aluno";
};

// Usuário fake (pra testar AGORA)
// login: admin
// senha: admin123
const users: User[] = [
  {
    id: "1",
    usuario: "admin",
    nome: "Administrador",
    senhaHash: bcrypt.hashSync("admin123", 10),
    role: "admin",
  },
];

const loginSchema = z.object({
  usuario: z.string().min(1, "Usuário obrigatório"),
  senha: z.string().min(1, "Senha obrigatória"),
});

export function authRouter(jwtSecret: string) {
  const router = Router();

  router.post("/login", async (req, res) => {
    const { usuario, senha } = req.body;

    const user = users.find((u) => u.usuario === usuario);

    if (!user) {
      return res.status(401).json({
        message: "Usuário não encontrado",
      });
    }

    const senhaValida = await bcrypt.compare(senha, user.senhaHash);

    if (!senhaValida) {
      return res.status(401).json({
        message: "Senha inválida",
      });
    }

    return res.status(200).json({
      message: "Login realizado com sucesso!",
      token: "token-aqui",
      user: {
        id: user.id,
        usuario: user.usuario,
      },
    });
  });

  return router;
}
