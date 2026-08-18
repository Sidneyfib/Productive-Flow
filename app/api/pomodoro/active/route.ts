import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getActiveTimer, updateActiveTimer } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const timer = getActiveTimer(user.id);
    return NextResponse.json({ timer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar timer' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { taskId, projectId, type, totalSeconds, remainingSeconds, isRunning } = body;

    const now = Date.now();
    let startedAtTimestamp = null;
    let targetEndTimestamp = null;

    if (isRunning && remainingSeconds > 0) {
      startedAtTimestamp = now;
      targetEndTimestamp = now + remainingSeconds * 1000;
    }

    const updated = await updateActiveTimer(user.id, {
      taskId: taskId !== undefined ? taskId : undefined,
      projectId: projectId !== undefined ? projectId : undefined,
      type: type || undefined,
      totalSeconds: typeof totalSeconds === 'number' ? totalSeconds : undefined,
      remainingSeconds: typeof remainingSeconds === 'number' ? remainingSeconds : undefined,
      isRunning: Boolean(isRunning),
      startedAtTimestamp,
      targetEndTimestamp,
    });

    return NextResponse.json({ timer: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar timer' }, { status: 500 });
  }
}
