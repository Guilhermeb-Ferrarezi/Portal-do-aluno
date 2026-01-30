import { pool } from "../db";

export async function runMigrations() {
  try {
    console.log("🔄 Iniciando migrações do banco de dados...");

    // Migração: Adicionar coluna mouse_regras à tabela exercicios
    console.log("📋 Adicionando coluna mouse_regras...");
    await pool.query(`
      ALTER TABLE exercicios
      ADD COLUMN IF NOT EXISTS mouse_regras TEXT;
    `);

    // Verificar se a coluna foi adicionada
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'exercicios' AND column_name = 'mouse_regras';
    `);

    if (result.rows.length > 0) {
      console.log("✅ Coluna mouse_regras verificada:", result.rows[0]);
    } else {
      console.warn("⚠️  Coluna mouse_regras não encontrada após criar");
    }

    console.log("✅ Migrações completadas com sucesso!");
  } catch (error) {
    console.error("⚠️  Aviso: Não foi possível executar migrações do banco de dados.");
    console.error("   O servidor continuará em execução, mas certifique-se de que a coluna 'mouse_regras' existe na tabela 'exercicios'.");
    console.error("   Erro:", (error as Error).message);
    // Não lançar erro para permitir que o servidor inicie mesmo se o BD estiver temporariamente indisponível
  }
}
