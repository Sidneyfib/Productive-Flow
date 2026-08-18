import { getSupabaseServerClient, isSupabaseConfigured } from './supabase';
import bcrypt from 'bcryptjs';
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

// ----------------- USERS & PREFERENCES -----------------

export async function getSupabaseUserByEmail(email: string): Promise<User | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email.trim().toLowerCase())
      .maybeSingle();

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
  } catch (err) {
    console.error('Error fetching Supabase user by email:', err);
    return null;
  }
}

export async function getSupabaseUserById(userId: string): Promise<User | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

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
  } catch (err) {
    console.error('Error fetching Supabase user by id:', err);
    return null;
  }
}

export async function getSupabaseUserPreferences(userId: string): Promise<UserPreference | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

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
  } catch (err) {
    console.error('Error fetching Supabase user preferences:', err);
    return null;
  }
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

export async function createSupabaseUser(userData: {
  name: string;
  lastName?: string;
  email: string;
  password: string;
}): Promise<UserWithPreferences | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const normalizedEmail = userData.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(userData.password, 10);
  const now = new Date().toISOString();

  try {
    // 1. Insert into users table
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        name: userData.name.trim(),
        last_name: userData.lastName?.trim() || '',
        email: normalizedEmail,
        password_hash: passwordHash,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (userError || !newUser) {
      console.error('Failed to create user in Supabase:', userError);
      throw new Error(userError?.message || 'Falha ao registrar usuário no Supabase');
    }

    const userId = newUser.id;

    // 2. Insert into user_preferences table (3FN 1:1)
    const { data: newPref, error: prefError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        focus_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        auto_start_breaks: true,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (prefError) {
      console.warn('Failed to insert user preferences in Supabase:', prefError);
    }

    // 3. Insert default project
    await supabase.from('projects').insert({
      user_id: userId,
      name: 'Geral',
      description: 'Projeto inicial para tarefas gerais',
      color: '#0f172a',
      icon: 'folder',
      status: 'in_progress',
      created_at: now,
      updated_at: now,
    });

    // 4. Initialize active timer
    await supabase.from('active_timers').insert({
      user_id: userId,
      type: 'focus',
      total_seconds: 25 * 60,
      remaining_seconds: 25 * 60,
      is_running: false,
      started_at_timestamp: null,
      target_end_timestamp: null,
      updated_at: now,
    });

    return {
      id: userId,
      name: newUser.name,
      lastName: newUser.last_name || '',
      email: newUser.email,
      passwordHash: newUser.password_hash,
      avatar: newUser.avatar,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at,
      focusDuration: newPref?.focus_duration || 25,
      shortBreakDuration: newPref?.short_break_duration || 5,
      longBreakDuration: newPref?.long_break_duration || 15,
      autoStartBreaks: newPref?.auto_start_breaks ?? true,
    };
  } catch (err: any) {
    console.error('Supabase create user error:', err);
    throw err;
  }
}

export async function updateSupabaseUser(
  userId: string,
  updates: Partial<User & { focusDuration?: number; shortBreakDuration?: number; longBreakDuration?: number; autoStartBreaks?: boolean }>
): Promise<UserWithPreferences | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const { focusDuration, shortBreakDuration, longBreakDuration, autoStartBreaks, ...profileUpdates } = updates;

  try {
    const userUpdatePayload: any = { updated_at: now };
    if (profileUpdates.name !== undefined) userUpdatePayload.name = profileUpdates.name;
    if (profileUpdates.lastName !== undefined) userUpdatePayload.last_name = profileUpdates.lastName;
    if (profileUpdates.avatar !== undefined) userUpdatePayload.avatar = profileUpdates.avatar;

    const { data: updatedUser, error: userError } = await supabase
      .from('users')
      .update(userUpdatePayload)
      .eq('id', userId)
      .select()
      .single();

    if (userError) throw userError;

    // Update preferences
    const prefUpdatePayload: any = { updated_at: now };
    if (focusDuration !== undefined) prefUpdatePayload.focus_duration = focusDuration;
    if (shortBreakDuration !== undefined) prefUpdatePayload.short_break_duration = shortBreakDuration;
    if (longBreakDuration !== undefined) prefUpdatePayload.long_break_duration = longBreakDuration;
    if (autoStartBreaks !== undefined) prefUpdatePayload.auto_start_breaks = autoStartBreaks;

    const { data: updatedPref } = await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, ...prefUpdatePayload })
      .select()
      .single();

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      lastName: updatedUser.last_name || '',
      email: updatedUser.email,
      passwordHash: updatedUser.password_hash,
      avatar: updatedUser.avatar,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
      focusDuration: updatedPref?.focus_duration ?? 25,
      shortBreakDuration: updatedPref?.short_break_duration ?? 5,
      longBreakDuration: updatedPref?.long_break_duration ?? 15,
      autoStartBreaks: updatedPref?.auto_start_breaks ?? true,
    };
  } catch (err) {
    console.error('Error updating Supabase user:', err);
    throw err;
  }
}

// ----------------- PROJECTS -----------------

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

export async function createSupabaseProject(
  userId: string,
  projectData: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    status?: Project['status'];
    deadline?: string;
  }
): Promise<Project | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: projectData.name.trim(),
      description: projectData.description?.trim() || '',
      color: projectData.color || '#0f172a',
      icon: projectData.icon || 'folder',
      status: projectData.status || 'in_progress',
      deadline: projectData.deadline || null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Falha ao criar projeto no Supabase');
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description || '',
    color: data.color || '#0f172a',
    icon: data.icon || 'folder',
    status: data.status,
    deadline: data.deadline || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateSupabaseProject(
  userId: string,
  projectId: string,
  updates: Partial<Project>
): Promise<Project | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const payload: any = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.description !== undefined) payload.description = updates.description.trim();
  if (updates.color !== undefined) payload.color = updates.color;
  if (updates.icon !== undefined) payload.icon = updates.icon;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.deadline !== undefined) payload.deadline = updates.deadline || null;

  const { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Falha ao atualizar projeto no Supabase');
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description || '',
    color: data.color || '#0f172a',
    icon: data.icon || 'folder',
    status: data.status,
    deadline: data.deadline || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deleteSupabaseProject(userId: string, projectId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// ----------------- TASKS -----------------

export async function getSupabaseTasks(userId: string): Promise<Task[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (tasksError || !tasks) return [];

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

export async function createSupabaseTask(
  userId: string,
  taskData: {
    title: string;
    description?: string;
    projectId?: string | null;
    priority?: Task['priority'];
    status?: Task['status'];
    estimatedPomodoros?: number;
    dueDate?: string;
  }
): Promise<Task | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      project_id: taskData.projectId || null,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || '',
      priority: taskData.priority || 'medium',
      status: taskData.status || 'todo',
      estimated_pomodoros: Number(taskData.estimatedPomodoros) || 1,
      due_date: taskData.dueDate || null,
      completed_at: null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Falha ao criar tarefa no Supabase');
  }

  return {
    id: data.id,
    userId: data.user_id,
    projectId: data.project_id || null,
    title: data.title,
    description: data.description || '',
    priority: data.priority,
    status: data.status,
    estimatedPomodoros: data.estimated_pomodoros || 1,
    completedPomodoros: 0,
    dueDate: data.due_date || undefined,
    completedAt: data.completed_at || null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateSupabaseTask(
  userId: string,
  taskId: string,
  updates: Partial<Task>
): Promise<Task | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const payload: any = { updated_at: now };

  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.description !== undefined) payload.description = updates.description.trim();
  if (updates.projectId !== undefined) payload.project_id = updates.projectId || null;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.status !== undefined) {
    payload.status = updates.status;
    if (updates.status === 'completed') {
      payload.completed_at = now;
    } else {
      payload.completed_at = null;
    }
  }
  if (updates.estimatedPomodoros !== undefined) payload.estimated_pomodoros = Number(updates.estimatedPomodoros) || 1;
  if (updates.dueDate !== undefined) payload.due_date = updates.dueDate || null;

  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Falha ao atualizar tarefa no Supabase');
  }

  // Count completed pomodoros
  const { data: sessions } = await supabase
    .from('pomodoro_sessions')
    .select('id')
    .eq('task_id', taskId)
    .eq('type', 'focus')
    .eq('completed', true);

  return {
    id: data.id,
    userId: data.user_id,
    projectId: data.project_id || null,
    title: data.title,
    description: data.description || '',
    priority: data.priority,
    status: data.status,
    estimatedPomodoros: data.estimated_pomodoros || 1,
    completedPomodoros: sessions?.length || 0,
    dueDate: data.due_date || undefined,
    completedAt: data.completed_at || null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deleteSupabaseTask(userId: string, taskId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// ----------------- POMODORO SESSIONS -----------------

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

export async function recordSupabasePomodoroSession(
  userId: string,
  sessionData: {
    taskId?: string | null;
    projectId?: string | null;
    type: PomodoroSession['type'];
    durationMinutes: number;
    completed: boolean;
    startedAt: string;
    endedAt: string;
    notes?: string;
  }
): Promise<PomodoroSession | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .insert({
      user_id: userId,
      project_id: sessionData.projectId || null,
      task_id: sessionData.taskId || null,
      type: sessionData.type,
      duration_minutes: sessionData.durationMinutes,
      completed: sessionData.completed,
      started_at: sessionData.startedAt,
      ended_at: sessionData.endedAt,
      notes: sessionData.notes || '',
      created_at: now,
    })
    .select(`
      *,
      task:tasks(id, title),
      project:projects(id, name)
    `)
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Falha ao gravar sessão Pomodoro no Supabase');
  }

  return {
    id: data.id,
    userId: data.user_id,
    projectId: data.project_id || null,
    taskId: data.task_id || null,
    type: data.type,
    durationMinutes: data.duration_minutes,
    completed: data.completed,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    notes: data.notes || '',
    createdAt: data.created_at,
    taskTitle: data.task?.title,
    projectName: data.project?.name,
  };
}

// ----------------- ACTIVE TIMERS -----------------

export async function getSupabaseActiveTimer(userId: string): Promise<ActiveTimerState | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('active_timers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

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
}

export async function updateSupabaseActiveTimer(
  userId: string,
  stateUpdates: Partial<ActiveTimerState>
): Promise<ActiveTimerState | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const payload: any = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  if (stateUpdates.taskId !== undefined) payload.task_id = stateUpdates.taskId || null;
  if (stateUpdates.projectId !== undefined) payload.project_id = stateUpdates.projectId || null;
  if (stateUpdates.type !== undefined) payload.type = stateUpdates.type;
  if (stateUpdates.totalSeconds !== undefined) payload.total_seconds = stateUpdates.totalSeconds;
  if (stateUpdates.remainingSeconds !== undefined) payload.remaining_seconds = stateUpdates.remainingSeconds;
  if (stateUpdates.isRunning !== undefined) payload.is_running = stateUpdates.isRunning;
  if (stateUpdates.startedAtTimestamp !== undefined) payload.started_at_timestamp = stateUpdates.startedAtTimestamp;
  if (stateUpdates.targetEndTimestamp !== undefined) payload.target_end_timestamp = stateUpdates.targetEndTimestamp;

  const { data, error } = await supabase
    .from('active_timers')
    .upsert(payload)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Falha ao atualizar timer no Supabase');
  }

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
}
