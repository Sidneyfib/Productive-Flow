import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getSessionsByUserId, recordPomodoroSession } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const limit = Number(req.nextUrl.searchParams.get('limit')) || 100;
    const sessions = getSessionsByUserId(user.id, limit);

    return NextResponse.json({ sessions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar histórico' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { taskId, projectId, type, durationMinutes, completed, startedAt, endedAt, notes } = body;

    if (!type || typeof durationMinutes !== 'number') {
      return NextResponse.json({ error: 'Tipo e duração da sessão são obrigatórios' }, { status: 400 });
    }

    const session = await recordPomodoroSession(user.id, {
      taskId: taskId || null,
      projectId: projectId || null,
      type,
      durationMinutes,
      completed: completed !== false,
      startedAt: startedAt || new Date(Date.now() - durationMinutes * 60000).toISOString(),
      endedAt: endedAt || new Date().toISOString(),
      notes: notes || '',
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao registrar sessão' }, { status: 500 });
  }
}
