import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT id, nome, categoria, preco, imagem, descricao, tipovenda, codigobarra
      FROM produtos
      ORDER BY nome ASC
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { nome, categoria, preco, imagem, descricao, tipovenda, codigobarra } = await request.json();

    if (!nome || !categoria || !preco) {
      return NextResponse.json(
        { error: 'Nome, categoria e preço são obrigatórios' },
        { status: 400 }
      );
    }

    const { rows } = await sql`
      INSERT INTO produtos (nome, categoria, preco, imagem, descricao, tipovenda, codigobarra)
      VALUES (${nome}, ${categoria}, ${preco}, ${imagem || ''}, ${descricao || ''}, ${tipovenda || 'un'}, ${codigobarra || ''})
      RETURNING id, nome, categoria, preco, imagem, descricao, tipovenda, codigobarra
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar produto' },
      { status: 500 }
    );
  }
} 