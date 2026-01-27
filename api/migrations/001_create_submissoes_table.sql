-- Criar tabela de submissões
CREATE TABLE submissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercicio_id UUID NOT NULL REFERENCES exercicios(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resposta TEXT NOT NULL,
  tipo_resposta VARCHAR(20) NOT NULL CHECK (tipo_resposta IN ('codigo', 'texto')),
  linguagem VARCHAR(50) NULL,
  nota DECIMAL(5,2) NULL CHECK (nota >= 0 AND nota <= 100),
  corrigida BOOLEAN DEFAULT false,
  feedback_professor TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_submissoes_exercicio ON submissoes(exercicio_id);
CREATE INDEX idx_submissoes_aluno ON submissoes(aluno_id);
CREATE INDEX idx_submissoes_created_at ON submissoes(created_at DESC);
CREATE INDEX idx_submissoes_exercicio_aluno ON submissoes(exercicio_id, aluno_id);

-- Adicionar colunas na tabela exercicios
ALTER TABLE exercicios
ADD COLUMN tipo_exercicio VARCHAR(20) NULL CHECK (tipo_exercicio IN ('codigo', 'texto')),
ADD COLUMN gabarito TEXT NULL,
ADD COLUMN linguagem_esperada VARCHAR(50) NULL;

-- Criar índice para buscar exercícios por tipo
CREATE INDEX idx_exercicios_tipo ON exercicios(tipo_exercicio);
