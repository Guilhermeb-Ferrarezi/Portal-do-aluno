-- Script para adicionar suporte a regras de Mouse Interativo
-- Execute este script para migrar o banco de dados

-- Adicionar coluna mouse_regras se não existir
ALTER TABLE exercicios
ADD COLUMN IF NOT EXISTS mouse_regras TEXT;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'exercicios' AND column_name = 'mouse_regras';
