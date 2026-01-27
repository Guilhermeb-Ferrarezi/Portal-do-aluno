import type { NextFunction, Response } from "express";
import type { AuthRequest, Role } from "./auth";

export function requireRole(allowed: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ message: "Sem permissão" });
    }
    return next();
  };
}
