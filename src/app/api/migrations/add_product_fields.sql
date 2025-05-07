-- Add new columns to produtos table
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS tipovenda VARCHAR(10) DEFAULT 'un',
ADD COLUMN IF NOT EXISTS codigobarra VARCHAR(50) DEFAULT '';

-- Create categorias table if it doesn't exist
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- Create produtos table if it doesn't exist
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    imagem TEXT,
    descricao TEXT,
    tipovenda VARCHAR(10) DEFAULT 'un',
    codigobarra VARCHAR(50) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 