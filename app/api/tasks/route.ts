import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getTasksByUserId, createTask } from '@/lib/db';
import { getSupabaseTasks, createSupabaseTask } from '@/lib/supabase-db';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let tasks: any[] = [];

    if (isSupabaseConfigured()) {
      try {
        tasks = await getSupabaseTasks(user.id);
      } catch (err) {
        console.warn('Supabase tasks fetch failed, fallback to local db:', err);
        tasks = getTasksByUserId(user.id);
      }
    } else {
      tasks = getTasksByUserId(user.id);
    }

    if (projectId) {
      tasks = tasks.filter((t) => t.projectId === projectId);
    }
    if (status) {
      tasks = tasks.filter((t) => t.status === status);
    }
    if (priority) {
      tasks = tasks.filter((t) => t.priority === priority);
    }

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao listar tarefas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, projectId, priority, status, estimatedPomodoros, dueDate } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Título da tarefa é obrigatório' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      try {
        const task = await createSupabaseTask(user.id, {
          title,
          description,
          projectId,
          priority,
          status,
          estimatedPomodoros,
          dueDate,
        });
        if (task) {
          return NextResponse.json({ task }, { status: 201 });
        }
      } catch (err) {
        console.warn('Supabase create task failed, fallback to local db:', err);
      }
    }

    const task = await createTask(user.id, {
      title,
      description,
      projectId,
      priority,
      status,
      estimatedPomodoros,
      dueDate,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar tarefa' }, { status: 500 });
  }
}
