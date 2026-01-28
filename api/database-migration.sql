-- =====================================================
-- MIGRATION: Adicionar Campo Categoria à Tabela Turmas
-- =====================================================
-- Data: 2026-01-28
-- Descrição: Adiciona um novo campo "categoria" à tabela turmas
--           para classificar turmas por área (Programação ou Informática)
-- =====================================================

-- Adicionar coluna categoria à tabela turmas
ALTER TABLE turmas ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'programacao' CHECK (categoria IN ('programacao', 'informatica'));

-- Adicionar índice para melhorar performance em queries por categoria
CREATE INDEX IF NOT EXISTS idx_turmas_categoria ON turmas(categoria);

-- (Opcional) Se você quiser definir categorias específicas para turmas existentes:
-- UPDATE turmas SET categoria = 'programacao' WHERE nome ILIKE '%programação%' OR nome ILIKE '%codigo%';
-- UPDATE turmas SET categoria = 'informatica' WHERE nome ILIKE '%informatica%' OR nome ILIKE '%ti%';

-- Verificar se a coluna foi adicionada com sucesso
-- SELECT id, nome, tipo, categoria FROM turmas LIMIT 5;
