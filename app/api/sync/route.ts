import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, sanitizeUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  getProjectsByUserId,
  getTasksByUserId,
  getSessionsByUserId,
  getActiveTimer,
  calculateUserStats,
} from '@/lib/db';
import {
  getSupabaseProjects,
  getSupabaseTasks,
  getSupabaseSessions,
  getSupabaseActiveTimer,
  calculateSupabaseUserStats,
} from '@/lib/supabase-db';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    let projects = [];
    let tasks = [];
    let sessions = [];
    let timer = null;
    let stats = null;

    if (isSupabaseConfigured()) {
      try {
        const [supProjects, supTasks, supSessions, supTimer, supStats] = await Promise.all([
          getSupabaseProjects(user.id),
          getSupabaseTasks(user.id),
          getSupabaseSessions(user.id, 50),
          getSupabaseActiveTimer(user.id),
          calculateSupabaseUserStats(user.id),
        ]);
        projects = supProjects;
        tasks = supTasks;
        sessions = supSessions;
        timer = supTimer;
        stats = supStats;
      } catch (supErr) {
        console.warn('Supabase sync query failed, falling back to local storage:', supErr);
        projects = getProjectsByUserId(user.id);
        tasks = getTasksByUserId(user.id);
        sessions = getSessionsByUserId(user.id, 50);
        timer = getActiveTimer(user.id);
        stats = calculateUserStats(user.id);
      }
    } else {
      projects = getProjectsByUserId(user.id);
      tasks = getTasksByUserId(user.id);
      sessions = getSessionsByUserId(user.id, 50);
      timer = getActiveTimer(user.id);
      stats = calculateUserStats(user.id);
    }

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
