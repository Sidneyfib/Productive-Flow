import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getProjectById, updateProject, deleteProject } from '@/lib/db';
import { updateSupabaseProject, deleteSupabaseProject } from '@/lib/supabase-db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await context.params;
    const project = getProjectById(id, user.id);
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar projeto' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    if (isSupabaseConfigured()) {
      try {
        const updated = await updateSupabaseProject(user.id, id, body);
        if (updated) {
          return NextResponse.json({ project: updated });
        }
      } catch (err) {
        console.warn('Supabase update project failed, fallback to local db:', err);
      }
    }

    const updated = await updateProject(user.id, id, body);
    return NextResponse.json({ project: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar projeto' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await context.params;

    if (isSupabaseConfigured()) {
      try {
        await deleteSupabaseProject(user.id, id);
        return NextResponse.json({ message: 'Projeto excluído com sucesso' });
      } catch (err) {
        console.warn('Supabase delete project failed, fallback to local db:', err);
      }
    }

    await deleteProject(user.id, id);
    return NextResponse.json({ message: 'Projeto excluído com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao excluir projeto' }, { status: 500 });
  }
}
