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

    // Migração: Adicionar coluna multipla_regras à tabela exercicios
    console.log("📋 Adicionando coluna multipla_regras...");
    await pool.query(`
      ALTER TABLE exercicios
      ADD COLUMN IF NOT EXISTS multipla_regras TEXT;
    `);

    // Verificar se a coluna foi adicionada
    const resultMultipla = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'exercicios' AND column_name = 'multipla_regras';
    `);

    if (resultMultipla.rows.length > 0) {
      console.log("✅ Coluna multipla_regras verificada:", resultMultipla.rows[0]);
    } else {
      console.warn("⚠️  Coluna multipla_regras não encontrada após criar");
    }

    // Migração: Adicionar campos de cronograma em turmas
    console.log("📅 Adicionando campos de cronograma em turmas...");
    await pool.query(`
      ALTER TABLE turmas
      ADD COLUMN IF NOT EXISTS data_inicio DATE,
      ADD COLUMN IF NOT EXISTS duracao_semanas INTEGER DEFAULT 12,
      ADD COLUMN IF NOT EXISTS cronograma_ativo BOOLEAN DEFAULT false;
    `);

    // Migração: Criar tabela cronograma_turma
    console.log("📅 Criando tabela cronograma_turma...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cronograma_turma (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
        exercicio_id UUID NOT NULL REFERENCES exercicios(id) ON DELETE CASCADE,
        semana INTEGER NOT NULL,
        ordem INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(turma_id, exercicio_id, semana)
      );
    `);

    // Criar índices para melhor performance
    console.log("📅 Criando índices para cronograma...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cronograma_turma_id ON cronograma_turma(turma_id);
      CREATE INDEX IF NOT EXISTS idx_cronograma_semana ON cronograma_turma(turma_id, semana);
    `);

    console.log("✅ Sistema de cronograma criado!");

    console.log("✅ Migrações completadas com sucesso!");
  } catch (error) {
    console.error("⚠️  Aviso: Não foi possível executar migrações do banco de dados.");
    console.error("   O servidor continuará em execução, mas certifique-se de que a coluna 'mouse_regras' existe na tabela 'exercicios'.");
    console.error("   Erro:", (error as Error).message);
    // Não lançar erro para permitir que o servidor inicie mesmo se o BD estiver temporariamente indisponível
  }
}
