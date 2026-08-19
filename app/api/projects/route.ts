import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getProjectsByUserId, createProject } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const projects = getProjectsByUserId(user.id);
    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao listar projetos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, color, icon, status, deadline } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome do projeto é obrigatório' }, { status: 400 });
    }

    const project = await createProject(user.id, {
      name,
      description,
      color,
      icon,
      status,
      deadline,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar projeto' }, { status: 500 });
  }
}
