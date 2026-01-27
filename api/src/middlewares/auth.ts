import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type Role = "admin" | "professor" | "aluno";

export type JwtPayload = {
  sub: string;
  usuario: string;
  role: Role;
  iat: number;
  exp: number;
};

export type AuthRequest = Request & { user?: JwtPayload };

export function authGuard(jwtSecret: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Token ausente" });

    try {
      const payload = jwt.verify(token, jwtSecret) as JwtPayload;
      req.user = payload;
      return next();
    } catch {
      return res.status(401).json({ message: "Token inválido ou expirado" });
    }
  };
}
