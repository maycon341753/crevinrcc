-- Adiciona coluna data_nascimento à tabela funcionarios
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS data_nascimento DATE;
