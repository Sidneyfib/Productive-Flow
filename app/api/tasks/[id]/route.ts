import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getTaskById, updateTask, deleteTask } from '@/lib/db';
import { updateSupabaseTask, deleteSupabaseTask } from '@/lib/supabase-db';

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
    const task = getTaskById(id, user.id);
    if (!task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar tarefa' }, { status: 500 });
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
        const updated = await updateSupabaseTask(user.id, id, body);
        if (updated) {
          return NextResponse.json({ task: updated });
        }
      } catch (err) {
        console.warn('Supabase update task failed, fallback to local db:', err);
      }
    }

    const updated = await updateTask(user.id, id, body);
    return NextResponse.json({ task: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar tarefa' }, { status: 500 });
  }
}

export async function PATCH(
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
        const updated = await updateSupabaseTask(user.id, id, body);
        if (updated) {
          return NextResponse.json({ task: updated });
        }
      } catch (err) {
        console.warn('Supabase patch task failed, fallback to local db:', err);
      }
    }

    const updated = await updateTask(user.id, id, body);
    return NextResponse.json({ task: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar status da tarefa' }, { status: 500 });
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
        await deleteSupabaseTask(user.id, id);
        return NextResponse.json({ message: 'Tarefa excluída com sucesso' });
      } catch (err) {
        console.warn('Supabase delete task failed, fallback to local db:', err);
      }
    }

    await deleteTask(user.id, id);
    return NextResponse.json({ message: 'Tarefa excluída com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao excluir tarefa' }, { status: 500 });
  }
}
