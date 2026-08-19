import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, sanitizeUser } from '@/lib/auth';
import {
  getProjectsByUserId,
  getTasksByUserId,
  getSessionsByUserId,
  getActiveTimer,
  calculateUserStats,
} from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const projects = getProjectsByUserId(user.id);
    const tasks = getTasksByUserId(user.id);
    const sessions = getSessionsByUserId(user.id, 50);
    const timer = getActiveTimer(user.id);
    const stats = calculateUserStats(user.id);

    return NextResponse.json({
      user: sanitizeUser(user),
      projects,
      tasks,
      sessions,
      timer,
      stats,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao sincronizar dados' }, { status: 500 });
  }
}
