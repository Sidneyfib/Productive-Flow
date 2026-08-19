import { getSupabaseServerClient, isSupabaseConfigured } from './supabase';
import {
  User,
  UserPreference,
  UserWithPreferences,
  Project,
  Task,
  PomodoroSession,
  ActiveTimerState,
} from './types';

export { isSupabaseConfigured };

// ----------------- USER & PREFERENCES (SUPABASE) -----------------

export async function getSupabaseUserByEmail(email: string): Promise<User | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email.trim().toLowerCase())
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    lastName: data.last_name || '',
    email: data.email,
    passwordHash: data.password_hash,
    avatar: data.avatar,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getSupabaseUserById(userId: string): Promise<User | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    lastName: data.last_name || '',
    email: data.email,
    passwordHash: data.password_hash,
    avatar: data.avatar,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getSupabaseUserPreferences(userId: string): Promise<UserPreference | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    focusDuration: data.focus_duration,
    shortBreakDuration: data.short_break_duration,
    longBreakDuration: data.long_break_duration,
    autoStartBreaks: data.auto_start_breaks,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getSupabaseUserWithPreferences(userId: string): Promise<UserWithPreferences | null> {
  const user = await getSupabaseUserById(userId);
  if (!user) return null;

  let prefs = await getSupabaseUserPreferences(userId);
  if (!prefs) {
    prefs = {
      id: `pref-${userId}`,
      userId,
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      autoStartBreaks: true,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  return {
    ...user,
    focusDuration: prefs.focusDuration,
    shortBreakDuration: prefs.shortBreakDuration,
    longBreakDuration: prefs.longBreakDuration,
    autoStartBreaks: prefs.autoStartBreaks,
  };
}

// ----------------- PROJECTS (SUPABASE) -----------------

export async function getSupabaseProjects(userId: string): Promise<Project[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((p) => ({
    id: p.id,
    userId: p.user_id,
    name: p.name,
    description: p.description || '',
    color: p.color || '#0f172a',
    icon: p.icon || 'folder',
    status: p.status,
    deadline: p.deadline || undefined,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));
}

// ----------------- TASKS (SUPABASE WITH DYNAMIC COUNTS) -----------------

export async function getSupabaseTasks(userId: string): Promise<Task[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (tasksError || !tasks) return [];

  // Query completed focus sessions to compute completedPomodoros dynamically (3FN)
  const { data: sessions } = await supabase
    .from('pomodoro_sessions')
    .select('task_id')
    .eq('user_id', userId)
    .eq('type', 'focus')
    .eq('completed', true);

  const countMap: Record<string, number> = {};
  sessions?.forEach((s) => {
    if (s.task_id) {
      countMap[s.task_id] = (countMap[s.task_id] || 0) + 1;
    }
  });

  return tasks.map((t) => ({
    id: t.id,
    userId: t.user_id,
    projectId: t.project_id || null,
    title: t.title,
    description: t.description || '',
    priority: t.priority,
    status: t.status,
    estimatedPomodoros: t.estimated_pomodoros || 1,
    completedPomodoros: countMap[t.id] || 0,
    dueDate: t.due_date || undefined,
    completedAt: t.completed_at || null,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));
}

// ----------------- SESSIONS (SUPABASE WITH DYNAMIC JOIN) -----------------

export async function getSupabaseSessions(userId: string, limit = 100): Promise<PomodoroSession[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select(`
      *,
      task:tasks(id, title),
      project:projects(id, name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    projectId: s.project_id || null,
    taskId: s.task_id || null,
    type: s.type,
    durationMinutes: s.duration_minutes,
    completed: s.completed,
    startedAt: s.started_at,
    endedAt: s.ended_at,
    notes: s.notes || '',
    createdAt: s.created_at,
    taskTitle: s.task?.title,
    projectName: s.project?.name,
  }));
}
