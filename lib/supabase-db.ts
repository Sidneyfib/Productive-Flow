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

// ----------------- MUTATION HELPERS (SUPABASE) -----------------

export async function upsertSupabaseUser(user: User, preferences?: Partial<UserPreference>): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  try {
    // 1. Upsert User
    await supabase.from('users').upsert(
      {
        id: user.id,
        name: user.name,
        last_name: user.lastName || '',
        email: user.email.toLowerCase(),
        password_hash: user.passwordHash,
        avatar: user.avatar,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    // 2. Upsert Preferences
    if (preferences) {
      await supabase.from('user_preferences').upsert(
        {
          user_id: user.id,
          focus_duration: preferences.focusDuration ?? 25,
          short_break_duration: preferences.shortBreakDuration ?? 5,
          long_break_duration: preferences.longBreakDuration ?? 15,
          auto_start_breaks: preferences.autoStartBreaks ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    }
  } catch (err) {
    console.error('[Supabase] Error upserting user:', err);
  }
}

export async function updateSupabaseUserPreferences(
  userId: string,
  prefs: Partial<UserPreference>
): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  try {
    await supabase.from('user_preferences').upsert(
      {
        user_id: userId,
        ...(prefs.focusDuration !== undefined ? { focus_duration: prefs.focusDuration } : {}),
        ...(prefs.shortBreakDuration !== undefined ? { short_break_duration: prefs.shortBreakDuration } : {}),
        ...(prefs.longBreakDuration !== undefined ? { long_break_duration: prefs.longBreakDuration } : {}),
        ...(prefs.autoStartBreaks !== undefined ? { auto_start_breaks: prefs.autoStartBreaks } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch (err) {
    console.error('[Supabase] Error updating user preferences:', err);
  }
}

export async function insertSupabaseProject(project: Project): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  try {
    await supabase.from('projects').insert({
      id: project.id,
      user_id: project.userId,
      name: project.name,
      description: project.description || '',
      color: project.color || '#0f172a',
      icon: project.icon || 'folder',
      status: project.status,
      deadline: project.deadline || null,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    });
  } catch (err) {
    console.error('[Supabase] Error inserting project:', err);
  }
}

export async function updateSupabaseProject(
  projectId: string,
  userId: string,
  updates: Partial<Project>
): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  try {
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.icon !== undefined) payload.icon = updates.icon;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.deadline !== undefined) payload.deadline = updates.deadline;

    await supabase.from('projects').update(payload).eq('id', projectId).eq('user_id', userId);
  } catch (err) {
    console.error('[Supabase] Error updating project:', err);
  }
}

export async function deleteSupabaseProject(projectId: string, userId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  try {
    await supabase.from('projects').delete().eq('id', projectId).eq('user_id', userId);
  } catch (err) {
    console.error('[Supabase] Error deleting project:', err);
  }
}

export async function insertSupabaseTask(task: Task): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  try {
    await supabase.from('tasks').insert({
      id: task.id,
      user_id: task.userId,
      project_id: task.projectId || null,
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      estimated_pomodoros: task.estimatedPomodoros,
      due_date: task.dueDate || null,
      completed_at: task.completedAt || null,
      created_at: task.createdAt,
      updated_at: task.updatedAt,
    });
  } catch (err) {
    console.error('[Supabase] Error inserting task:', err);
  }
}

export async function updateSupabaseTask(
  taskId: string,
  userId: string,
  updates: Partial<Task>
): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  try {
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.estimatedPomodoros !== undefined) payload.estimated_pomodoros = updates.estimatedPomodoros;
    if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
    if (updates.projectId !== undefined) payload.project_id = updates.projectId;
    if (updates.completedAt !== undefined) payload.completed_at = updates.completedAt;

    await supabase.from('tasks').update(payload).eq('id', taskId).eq('user_id', userId);
  } catch (err) {
    console.error('[Supabase] Error updating task:', err);
  }
}

export async function deleteSupabaseTask(taskId: string, userId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  try {
    await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
  } catch (err) {
    console.error('[Supabase] Error deleting task:', err);
  }
}

export async function insertSupabaseSession(session: PomodoroSession): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  try {
    await supabase.from('pomodoro_sessions').insert({
      id: session.id,
      user_id: session.userId,
      project_id: session.projectId || null,
      task_id: session.taskId || null,
      type: session.type,
      duration_minutes: session.durationMinutes,
      completed: session.completed,
      started_at: session.startedAt,
      ended_at: session.endedAt,
      notes: session.notes || '',
      created_at: session.createdAt,
    });
  } catch (err) {
    console.error('[Supabase] Error inserting session:', err);
  }
}

export async function getSupabaseActiveTimer(userId: string): Promise<ActiveTimerState | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('active_timers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      userId: data.user_id,
      taskId: data.task_id || null,
      projectId: data.project_id || null,
      type: data.type,
      totalSeconds: data.total_seconds,
      remainingSeconds: data.remaining_seconds,
      isRunning: data.is_running,
      startedAtTimestamp: data.started_at_timestamp ? Number(data.started_at_timestamp) : null,
      targetEndTimestamp: data.target_end_timestamp ? Number(data.target_end_timestamp) : null,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error('[Supabase] Error getting active timer:', err);
    return null;
  }
}

export async function upsertSupabaseActiveTimer(timer: ActiveTimerState): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  try {
    await supabase.from('active_timers').upsert(
      {
        user_id: timer.userId,
        task_id: timer.taskId || null,
        project_id: timer.projectId || null,
        type: timer.type,
        total_seconds: timer.totalSeconds,
        remaining_seconds: timer.remainingSeconds,
        is_running: timer.isRunning,
        started_at_timestamp: timer.startedAtTimestamp,
        target_end_timestamp: timer.targetEndTimestamp,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch (err) {
    console.error('[Supabase] Error upserting active timer:', err);
  }
}
