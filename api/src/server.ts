import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { authRouter } from "./routes/auth";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(10),
  CORS_ORIGIN: z.string().default("http://localhost:5173")
});

const env = envSchema.parse(process.env);

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter(env.JWT_SECRET));

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Erro interno" });
});

app.listen(env.PORT, () => {
  console.log(`API rodando em http://localhost:${env.PORT}`);
});
