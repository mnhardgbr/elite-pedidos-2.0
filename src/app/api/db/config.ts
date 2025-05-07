import { sql } from '@vercel/postgres';

export async function initDB() {
  try {
    // Lê o conteúdo do arquivo schema.sql
    const schema = `
      -- Criar tabela de produtos se não existir
      CREATE TABLE IF NOT EXISTS produtos (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          categoria VARCHAR(100) NOT NULL,
          preco DECIMAL(10,2) NOT NULL,
          imagem TEXT,
          descricao TEXT,
          tipovenda VARCHAR(10) DEFAULT 'un',
          codigobarra VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Criar tabela de categorias se não existir
      CREATE TABLE IF NOT EXISTS categorias (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Executa o schema
    await sql.query(schema);
    
    console.log('Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
} 