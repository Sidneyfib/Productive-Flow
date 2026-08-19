import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getActiveTimer, updateActiveTimer } from '@/lib/db';
import { getSupabaseActiveTimer, updateSupabaseActiveTimer } from '@/lib/supabase-db';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (isSupabaseConfigured()) {
      try {
        const timer = await getSupabaseActiveTimer(user.id);
        if (timer) {
          return NextResponse.json({ timer });
        }
      } catch (err) {
        console.warn('Supabase timer fetch failed, fallback to local db:', err);
      }
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

    if (isSupabaseConfigured()) {
      try {
        const updated = await updateSupabaseActiveTimer(user.id, {
          taskId: taskId !== undefined ? taskId : undefined,
          projectId: projectId !== undefined ? projectId : undefined,
          type: type || undefined,
          totalSeconds: typeof totalSeconds === 'number' ? totalSeconds : undefined,
          remainingSeconds: typeof remainingSeconds === 'number' ? remainingSeconds : undefined,
          isRunning: Boolean(isRunning),
          startedAtTimestamp,
          targetEndTimestamp,
        });
        if (updated) {
          return NextResponse.json({ timer: updated });
        }
      } catch (err) {
        console.warn('Supabase update timer failed, fallback to local db:', err);
      }
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
