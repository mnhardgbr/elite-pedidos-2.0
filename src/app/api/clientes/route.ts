import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { nome, email, senha } = await req.json();
    console.log('Recebido:', { nome, email });
    if (!nome || !email || !senha) {
      console.log('Dados obrigatórios faltando');
      return NextResponse.json({ erro: 'Dados obrigatórios faltando.' }, { status: 400 });
    }

    // Verifica se o email já está cadastrado
    const clienteExistente = await prisma.cliente.findUnique({ where: { email } });
    if (clienteExistente) {
      console.log('Email já cadastrado');
      return NextResponse.json({ erro: 'Email já cadastrado.' }, { status: 409 });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);
    console.log('Senha hash:', senhaHash);

    // Insere o cliente
    await prisma.cliente.create({
      data: {
        nome,
        email,
        senha: senhaHash,
      },
    });
    console.log('Cliente inserido com sucesso');

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error);
    return NextResponse.json({ erro: 'Erro ao cadastrar cliente.' }, { status: 500 });
  }
} 