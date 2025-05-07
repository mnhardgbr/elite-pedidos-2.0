import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { nome, categoria, preco, imagem, descricao } = await request.json();

    if (!nome || !categoria || !preco || !imagem || !descricao) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    const { rows } = await sql`
      UPDATE produtos
      SET nome = ${nome},
          categoria = ${categoria},
          preco = ${preco},
          imagem = ${imagem},
          descricao = ${descricao}
      WHERE id = ${params.id}
      RETURNING id, nome, categoria, preco, imagem, descricao
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Erro ao editar produto:', error);
    return NextResponse.json(
      { error: 'Erro ao editar produto' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { rows } = await sql`
      DELETE FROM produtos
      WHERE id = ${params.id}
      RETURNING id
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir produto' },
      { status: 500 }
    );
  }
} 