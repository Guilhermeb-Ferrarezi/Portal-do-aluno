import cron from "node-cron";
import { pool } from "../db";

/**
 * Job que verifica a cada 5 minutos se há exercícios agendados
 * que devem ser publicados (published_at <= agora)
 */
export function startPublishScheduledExercisesJob() {
  // Rodar a cada 5 minutos
  cron.schedule("*/5 * * * *", async () => {
    try {
      const result = await pool.query(
        `UPDATE exercicios
         SET publicado = true, updated_at = NOW()
         WHERE publicado = false
           AND published_at IS NOT NULL
           AND published_at <= NOW()
         RETURNING id, titulo`
      );

      if (result.rowCount && result.rowCount > 0) {
        console.log(
          `✅ ${result.rowCount} exercício(s) publicado(s) automaticamente:`,
          result.rows.map((r) => r.titulo)
        );
      }
    } catch (error) {
      console.error(
        "❌ Erro ao publicar exercícios agendados:",
        error
      );
    }
  });

  console.log("📅 Job de publicação automática iniciado (a cada 5 min)");
}
