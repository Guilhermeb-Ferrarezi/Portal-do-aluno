-- Script para adicionar suporte a templates de exercícios
-- Execute este script para migrar o banco de dados

-- Adicionar coluna is_template se não existir
ALTER TABLE exercicios
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- Criar índice para facilitar queries de templates
CREATE INDEX IF NOT EXISTS idx_exercicios_is_template ON exercicios(is_template) WHERE is_template = true;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'exercicios' AND column_name = 'is_template';
