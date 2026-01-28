-- ============================================
-- SCRIPT DE SETUP DO BANCO DE DADOS
-- Sistema de Turmas e Exercícios
-- ============================================

-- ============================================
-- 1. TABELA DE TURMAS
-- ============================================
CREATE TABLE IF NOT EXISTS turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('turma', 'particular')),
  professor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. TABELA DE RELAÇÃO ALUNO-TURMA (N:M)
-- ============================================
CREATE TABLE IF NOT EXISTS aluno_turma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  data_entrada TIMESTAMP DEFAULT NOW(),
  UNIQUE(aluno_id, turma_id)
);

-- ============================================
-- 3. TABELA DE RELAÇÃO EXERCÍCIO-TURMA (N:M)
-- ============================================
CREATE TABLE IF NOT EXISTS exercicio_turma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercicio_id UUID NOT NULL REFERENCES exercicios(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  data_atribuicao TIMESTAMP DEFAULT NOW(),
  UNIQUE(exercicio_id, turma_id)
);

-- ============================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_aluno_turma_aluno ON aluno_turma(aluno_id);
CREATE INDEX IF NOT EXISTS idx_aluno_turma_turma ON aluno_turma(turma_id);
CREATE INDEX IF NOT EXISTS idx_exercicio_turma_exercicio ON exercicio_turma(exercicio_id);
CREATE INDEX IF NOT EXISTS idx_exercicio_turma_turma ON exercicio_turma(turma_id);
CREATE INDEX IF NOT EXISTS idx_turmas_professor ON turmas(professor_id);
CREATE INDEX IF NOT EXISTS idx_turmas_ativo ON turmas(ativo);

-- ============================================
-- 5. DADOS INICIAIS (OPCIONAL)
-- ============================================
-- Descomente abaixo se desejar inserir dados de exemplo

-- INSERT INTO turmas (nome, tipo, descricao)
-- VALUES ('Turma A 2024', 'turma', 'Primeira turma de teste');

-- INSERT INTO turmas (nome, tipo, descricao)
-- VALUES ('Turma B 2024', 'turma', 'Segunda turma de teste');
