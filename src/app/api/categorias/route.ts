import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT id, nome
      FROM categorias
      ORDER BY nome ASC
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { nome } = await request.json();

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome da categoria é obrigatório' },
        { status: 400 }
      );
    }

    const { rows } = await sql`
      INSERT INTO categorias (nome)
      VALUES (${nome})
      ON CONFLICT (nome) DO NOTHING
      RETURNING id, nome
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar categoria' },
      { status: 500 }
    );
  }
} 