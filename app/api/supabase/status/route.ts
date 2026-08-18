import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  const isConfigured = isSupabaseConfigured();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!isConfigured) {
    return NextResponse.json({
      configured: false,
      message: 'Supabase não está configurado. As credenciais ainda não foram preenchidas no ambiente.',
      details: {
        hasUrl: Boolean(url && !url.includes('your-project')),
        hasAnonKey,
        hasServiceKey,
      },
    });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({
      configured: false,
      message: 'Não foi possível inicializar o cliente Supabase.',
    });
  }

  try {
    // Check if tables exist and are accessible
    const { count: usersCount, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      return NextResponse.json({
        configured: true,
        connected: false,
        message: 'Conectado ao Supabase, mas as tabelas ainda não foram criadas. Execute as migrações em supabase/schema.sql.',
        error: usersError.message,
      });
    }

    const { count: projectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    const { count: tasksCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    const { count: sessionsCount } = await supabase
      .from('pomodoro_sessions')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      configured: true,
      connected: true,
      message: 'Supabase conectado e operacional com esquema 3FN!',
      metrics: {
        totalUsers: usersCount ?? 0,
        totalProjects: projectsCount ?? 0,
        totalTasks: tasksCount ?? 0,
        totalSessions: sessionsCount ?? 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      configured: true,
      connected: false,
      message: 'Erro ao testar conexão com o Supabase.',
      error: err.message,
    });
  }
}
