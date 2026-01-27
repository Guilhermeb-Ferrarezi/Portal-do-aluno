import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { exerciciosRouter } from "./routes/exercicios.route";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(10),
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:5173,https://portaldoaluno.santos-tech.com"),
});

const env = envSchema.parse(process.env);
const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

const app = express();

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ===== ROTAS SEM PREFIXO (local / simples) =====
app.use("/auth", authRouter(env.JWT_SECRET));
app.use(usersRouter(env.JWT_SECRET));
app.use(exerciciosRouter(env.JWT_SECRET));

// ===== ROTAS COM /api (pra prod/proxy) =====
app.use("/api/auth", authRouter(env.JWT_SECRET));
app.use("/api", usersRouter(env.JWT_SECRET));
// (se usersRouter registra /users, vira /api/users)
app.use("/api", exerciciosRouter(env.JWT_SECRET));
// (se exerciciosRouter registra /exercicios, vira /api/exercicios)

// handler de 404 (pra você enxergar rota errada rápido)
app.use((req, res) => {
  res.status(404).json({
    message: "Not Found",
    path: req.path,
  });
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ message: "Erro interno" });
  }
);

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`API rodando na porta ${env.PORT}`);
});
