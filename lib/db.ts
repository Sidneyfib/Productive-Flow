import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  UserPreference,
  UserWithPreferences,
  Project,
  Task,
  PomodoroSession,
  ActiveTimerState,
  ProductivityStats,
} from './types';

/**
 * Normalized 3FN Database Schema
 */
export interface DatabaseSchema {
  version: number;
  users: User[];
  userPreferences: UserPreference[];
  projects: Project[];
  tasks: Omit<Task, 'completedPomodoros'>[];
  sessions: Omit<PomodoroSession, 'taskTitle' | 'projectName'>[];
  activeTimers: Record<string, ActiveTimerState>; // key is userId
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'flow_database.json');

// In-memory cache
let cachedDb: DatabaseSchema | null = null;
let isSaving = false;
let pendingSave = false;

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function createInitialSeedData(): DatabaseSchema {
  const now = new Date().toISOString();
  const demoUserId = 'user-lucas-demo-1';
  const defaultPasswordHash = bcrypt.hashSync('flow123', 10);

  // 1. Normalized User
  const demoUser: User = {
    id: demoUserId,
    name: 'Lucas',
    lastName: 'Mendes',
    email: 'lucas.mendes@example.com',
    passwordHash: defaultPasswordHash,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: now,
    updatedAt: now,
  };

  // 2. Normalized UserPreference (1:1 with User)
  const demoUserPref: UserPreference = {
    id: `pref-${demoUserId}`,
    userId: demoUserId,
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: true,
    createdAt: now,
    updatedAt: now,
  };

  // 3. Projects
  const project1: Project = {
    id: 'proj-1',
    userId: demoUserId,
    name: 'Redesign Website',
    description: 'Reformulação completa do site institucional focando em conversão e nova identidade visual.',
    color: '#0f172a',
    icon: 'language',
    status: 'in_progress',
    deadline: '2026-10-24',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: now,
  };

  const project2: Project = {
    id: 'proj-2',
    userId: demoUserId,
    name: 'App Mobile v2.0',
    description: 'Desenvolvimento das novas features de gamificação para o aplicativo iOS e Android.',
    color: '#f43f5e',
    icon: 'smartphone',
    status: 'delayed',
    deadline: '2026-10-12',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: now,
  };

  const project3: Project = {
    id: 'proj-3',
    userId: demoUserId,
    name: 'Campanha Black Friday',
    description: 'Criação de assets, landing pages e configuração de anúncios para a campanha anual.',
    color: '#10b981',
    icon: 'campaign',
    status: 'planning',
    deadline: '2026-11-15',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: now,
  };

  const project4: Project = {
    id: 'proj-4',
    userId: demoUserId,
    name: 'Rotina & Administração',
    description: 'Tarefas de rotina, e-mails, alinhamentos e planejamento diário.',
    color: '#64748b',
    icon: 'mail',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: now,
  };

  // 4. Normalized Tasks (no stored completedPomodoros derivative count)
  const task1: Omit<Task, 'completedPomodoros'> = {
    id: 'task-1',
    userId: demoUserId,
    projectId: project1.id,
    title: 'Redesign da Landing Page',
    description: 'Criar wireframes e protótipos em alta fidelidade da nova página inicial.',
    priority: 'high',
    status: 'in_progress',
    estimatedPomodoros: 4,
    dueDate: '2026-08-18T18:00:00Z',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: now,
  };

  const task2: Omit<Task, 'completedPomodoros'> = {
    id: 'task-2',
    userId: demoUserId,
    projectId: project2.id,
    title: 'Revisar PR #42',
    description: 'Code review detalhado do módulo de autenticação e perfil do aplicativo.',
    priority: 'medium',
    status: 'in_progress',
    estimatedPomodoros: 1,
    dueDate: '2026-08-19T14:00:00Z',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: now,
  };

  const task3: Omit<Task, 'completedPomodoros'> = {
    id: 'task-3',
    userId: demoUserId,
    projectId: project1.id,
    title: 'Finalizar wireframes da tela inicial',
    description: 'Ajustar espaçamentos, tipografia e hierarquia visual conforme especificações.',
    priority: 'high',
    status: 'todo',
    estimatedPomodoros: 3,
    dueDate: '2026-08-18T14:00:00Z',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: now,
  };

  const task4: Omit<Task, 'completedPomodoros'> = {
    id: 'task-4',
    userId: demoUserId,
    projectId: project3.id,
    title: 'Revisar copy da landing page',
    description: 'Revisão textual e gatilhos de conversão para a oferta promocional.',
    priority: 'medium',
    status: 'todo',
    estimatedPomodoros: 2,
    dueDate: '2026-08-19T10:00:00Z',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: now,
  };

  const task5: Omit<Task, 'completedPomodoros'> = {
    id: 'task-5',
    userId: demoUserId,
    projectId: project4.id,
    title: 'Daily Standup & Alinhamento',
    description: 'Reunião diária de sincronização da equipe.',
    priority: 'low',
    status: 'completed',
    estimatedPomodoros: 1,
    completedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: now,
  };

  const task6: Omit<Task, 'completedPomodoros'> = {
    id: 'task-6',
    userId: demoUserId,
    projectId: project4.id,
    title: 'Responder emails de suporte',
    description: 'Triagem de dúvidas técnicas de usuários.',
    priority: 'low',
    status: 'completed',
    estimatedPomodoros: 1,
    completedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: now,
  };

  // 5. Normalized Sessions (pure FKs, no duplicate string titles)
  const sessions: Omit<PomodoroSession, 'taskTitle' | 'projectName'>[] = [
    {
      id: 'sess-1',
      userId: demoUserId,
      projectId: project1.id,
      taskId: task1.id,
      type: 'focus',
      durationMinutes: 25,
      completed: true,
      startedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      endedAt: new Date(Date.now() - 5.5 * 3600000).toISOString(),
      notes: 'Foco nos layouts de cabeçalho e herói da landing page.',
      createdAt: new Date(Date.now() - 5.5 * 3600000).toISOString(),
    },
    {
      id: 'sess-2',
      userId: demoUserId,
      projectId: project1.id,
      taskId: task1.id,
      type: 'focus',
      durationMinutes: 25,
      completed: true,
      startedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
      endedAt: new Date(Date.now() - 4.5 * 3600000).toISOString(),
      notes: 'Grid responsivo e prototipação interativa.',
      createdAt: new Date(Date.now() - 4.5 * 3600000).toISOString(),
    },
    {
      id: 'sess-3',
      userId: demoUserId,
      projectId: project2.id,
      taskId: task2.id,
      type: 'focus',
      durationMinutes: 25,
      completed: true,
      startedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      endedAt: new Date(Date.now() - 3.5 * 3600000).toISOString(),
      notes: 'Endpoints de autenticação e sanitização de dados.',
      createdAt: new Date(Date.now() - 3.5 * 3600000).toISOString(),
    },
    {
      id: 'sess-4',
      userId: demoUserId,
      projectId: project4.id,
      taskId: task5.id,
      type: 'focus',
      durationMinutes: 25,
      completed: true,
      startedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      endedAt: new Date(Date.now() - 2.5 * 3600000).toISOString(),
      notes: 'Limpeza da caixa de entrada e planejamento do sprint.',
      createdAt: new Date(Date.now() - 2.5 * 3600000).toISOString(),
    },
  ];

  return {
    version: 2,
    users: [demoUser],
    userPreferences: [demoUserPref],
    projects: [project1, project2, project3, project4],
    tasks: [task1, task2, task3, task4, task5, task6],
    sessions: sessions,
    activeTimers: {
      [demoUserId]: {
        userId: demoUserId,
        taskId: task1.id,
        projectId: project1.id,
        type: 'focus',
        totalSeconds: 25 * 60,
        remainingSeconds: 25 * 60,
        isRunning: false,
        startedAtTimestamp: null,
        targetEndTimestamp: null,
        updatedAt: now,
      },
    },
  };
}

/**
 * Ensures schema migration from legacy/unnormalized version to Normalized 3FN
 */
function migrateSchemaIfNeeded(parsed: any): DatabaseSchema {
  const now = new Date().toISOString();
  if (!parsed.userPreferences || !Array.isArray(parsed.userPreferences)) {
    parsed.userPreferences = [];
  }

  // Migrate any legacy user preference columns into userPreferences table
  if (Array.isArray(parsed.users)) {
    for (const u of parsed.users) {
      const existingPref = parsed.userPreferences.find((p: UserPreference) => p.userId === u.id);
      if (!existingPref) {
        parsed.userPreferences.push({
          id: `pref-${u.id}`,
          userId: u.id,
          focusDuration: u.focusDuration || 25,
          shortBreakDuration: u.shortBreakDuration || 5,
          longBreakDuration: u.longBreakDuration || 15,
          autoStartBreaks: u.autoStartBreaks ?? true,
          createdAt: u.createdAt || now,
          updatedAt: u.updatedAt || now,
        });
      }
      // Remove unnormalized preference fields from User entity
      delete u.focusDuration;
      delete u.shortBreakDuration;
      delete u.longBreakDuration;
      delete u.autoStartBreaks;
    }
  }

  // Strip redundant snapshot strings from sessions if present to keep 3FN
  if (Array.isArray(parsed.sessions)) {
    parsed.sessions = parsed.sessions.map((s: any) => {
      const { taskTitle, projectName, ...normalizedSession } = s;
      return normalizedSession;
    });
  }

  // Strip derivative completedPomodoros from task records
  if (Array.isArray(parsed.tasks)) {
    parsed.tasks = parsed.tasks.map((t: any) => {
      const { completedPomodoros, ...normalizedTask } = t;
      return normalizedTask;
    });
  }

  parsed.version = 2;
  return parsed as DatabaseSchema;
}

export function loadDatabase(): DatabaseSchema {
  if (cachedDb) {
    return cachedDb;
  }

  ensureDataDirectory();

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.users)) {
        cachedDb = migrateSchemaIfNeeded(parsed);
        return cachedDb;
      }
    } catch (err) {
      console.error('Error reading database file, creating fresh seed:', err);
    }
  }

  const seed = createInitialSeedData();
  cachedDb = seed;
  saveDatabaseSync(seed);
  return seed;
}

export function saveDatabaseSync(db: DatabaseSchema) {
  ensureDataDirectory();
  cachedDb = db;
  const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE);
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

export async function saveDatabase(db: DatabaseSchema): Promise<void> {
  cachedDb = db;
  if (isSaving) {
    pendingSave = true;
    return;
  }

  isSaving = true;
  try {
    ensureDataDirectory();
    const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
    await fs.promises.writeFile(tempPath, JSON.stringify(db, null, 2), 'utf-8');
    await fs.promises.rename(tempPath, DB_FILE);
  } catch (err) {
    console.error('Failed async database save:', err);
  } finally {
    isSaving = false;
    if (pendingSave) {
      pendingSave = false;
      await saveDatabase(cachedDb);
    }
  }
}

// ----------------- USER & PREFERENCES OPERATIONS -----------------
export function getUserByEmail(email: string): User | undefined {
  const db = loadDatabase();
  return db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}

export function getUserById(id: string): User | undefined {
  const db = loadDatabase();
  return db.users.find((u) => u.id === id);
}

export function getUserPreferences(userId: string): UserPreference {
  const db = loadDatabase();
  let pref = db.userPreferences.find((p) => p.userId === userId);
  if (!pref) {
    const now = new Date().toISOString();
    pref = {
      id: `pref-${userId}`,
      userId,
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      autoStartBreaks: true,
      createdAt: now,
      updatedAt: now,
    };
    db.userPreferences.push(pref);
    saveDatabaseSync(db);
  }
  return pref;
}

export function getUserWithPreferences(userId: string): UserWithPreferences | null {
  const user = getUserById(userId);
  if (!user) return null;
  const pref = getUserPreferences(userId);
  return {
    ...user,
    focusDuration: pref.focusDuration,
    shortBreakDuration: pref.shortBreakDuration,
    longBreakDuration: pref.longBreakDuration,
    autoStartBreaks: pref.autoStartBreaks,
  };
}

export async function createUser(userData: {
  name: string;
  lastName?: string;
  email: string;
  password: string;
}): Promise<UserWithPreferences> {
  const db = loadDatabase();
  const normalizedEmail = userData.email.trim().toLowerCase();

  if (getUserByEmail(normalizedEmail)) {
    throw new Error('E-mail já cadastrado');
  }

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(userData.password, 10);
  const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  // 1. Insert User
  const newUser: User = {
    id: userId,
    name: userData.name.trim(),
    lastName: userData.lastName?.trim() || '',
    email: normalizedEmail,
    passwordHash,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: now,
    updatedAt: now,
  };
  db.users.push(newUser);

  // 2. Insert UserPreference (Normalized 1:1)
  const newPref: UserPreference = {
    id: `pref-${userId}`,
    userId,
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: true,
    createdAt: now,
    updatedAt: now,
  };
  db.userPreferences.push(newPref);

  // 3. Initialize default project
  const defaultProject: Project = {
    id: `proj-${Date.now()}-1`,
    userId,
    name: 'Geral',
    description: 'Projeto inicial para tarefas gerais',
    color: '#0f172a',
    icon: 'folder',
    status: 'in_progress',
    createdAt: now,
    updatedAt: now,
  };
  db.projects.push(defaultProject);

  // 4. Initialize active timer
  db.activeTimers[userId] = {
    userId,
    type: 'focus',
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    isRunning: false,
    startedAtTimestamp: null,
    targetEndTimestamp: null,
    updatedAt: now,
  };

  await saveDatabase(db);
  return {
    ...newUser,
    focusDuration: newPref.focusDuration,
    shortBreakDuration: newPref.shortBreakDuration,
    longBreakDuration: newPref.longBreakDuration,
    autoStartBreaks: newPref.autoStartBreaks,
  };
}

export async function updateUser(
  userId: string,
  updates: Partial<User & { focusDuration?: number; shortBreakDuration?: number; longBreakDuration?: number; autoStartBreaks?: boolean }>
): Promise<UserWithPreferences> {
  const db = loadDatabase();
  const userIndex = db.users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    throw new Error('Usuário não encontrado');
  }

  const existing = db.users[userIndex];
  const now = new Date().toISOString();

  // Separate User profile updates
  const { focusDuration, shortBreakDuration, longBreakDuration, autoStartBreaks, ...profileUpdates } = updates;
  const updatedUser: User = {
    ...existing,
    ...profileUpdates,
    id: existing.id,
    updatedAt: now,
  };
  db.users[userIndex] = updatedUser;

  // Update UserPreference table
  const pref = getUserPreferences(userId);
  const prefIndex = db.userPreferences.findIndex((p) => p.userId === userId);
  const updatedPref: UserPreference = {
    ...pref,
    ...(typeof focusDuration === 'number' ? { focusDuration } : {}),
    ...(typeof shortBreakDuration === 'number' ? { shortBreakDuration } : {}),
    ...(typeof longBreakDuration === 'number' ? { longBreakDuration } : {}),
    ...(typeof autoStartBreaks === 'boolean' ? { autoStartBreaks } : {}),
    updatedAt: now,
  };

  if (prefIndex >= 0) {
    db.userPreferences[prefIndex] = updatedPref;
  } else {
    db.userPreferences.push(updatedPref);
  }

  await saveDatabase(db);
  return {
    ...updatedUser,
    focusDuration: updatedPref.focusDuration,
    shortBreakDuration: updatedPref.shortBreakDuration,
    longBreakDuration: updatedPref.longBreakDuration,
    autoStartBreaks: updatedPref.autoStartBreaks,
  };
}

// ----------------- PROJECT OPERATIONS -----------------
export function getProjectsByUserId(userId: string): Project[] {
  const db = loadDatabase();
  return db.projects.filter((p) => p.userId === userId);
}

export function getProjectById(projectId: string, userId: string): Project | undefined {
  const db = loadDatabase();
  return db.projects.find((p) => p.id === projectId && p.userId === userId);
}

export async function createProject(
  userId: string,
  projectData: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    status?: Project['status'];
    deadline?: string;
  }
): Promise<Project> {
  const db = loadDatabase();
  const now = new Date().toISOString();

  const newProject: Project = {
    id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    userId,
    name: projectData.name.trim(),
    description: projectData.description?.trim() || '',
    color: projectData.color || '#0f172a',
    icon: projectData.icon || 'folder',
    status: projectData.status || 'in_progress',
    deadline: projectData.deadline || undefined,
    createdAt: now,
    updatedAt: now,
  };

  db.projects.push(newProject);
  await saveDatabase(db);
  return newProject;
}

export async function updateProject(userId: string, projectId: string, updates: Partial<Project>): Promise<Project> {
  const db = loadDatabase();
  const index = db.projects.findIndex((p) => p.id === projectId && p.userId === userId);
  if (index === -1) {
    throw new Error('Projeto não encontrado');
  }

  const existing = db.projects[index];
  const updatedProject: Project = {
    ...existing,
    ...updates,
    id: existing.id,
    userId: existing.userId,
    updatedAt: new Date().toISOString(),
  };

  db.projects[index] = updatedProject;
  await saveDatabase(db);
  return updatedProject;
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  const db = loadDatabase();
  db.projects = db.projects.filter((p) => !(p.id === projectId && p.userId === userId));

  // Referential integrity: Nullify projectId on associated tasks & sessions
  const now = new Date().toISOString();
  db.tasks = db.tasks.map((t) => {
    if (t.userId === userId && t.projectId === projectId) {
      return { ...t, projectId: null, updatedAt: now };
    }
    return t;
  });

  db.sessions = db.sessions.map((s) => {
    if (s.userId === userId && s.projectId === projectId) {
      return { ...s, projectId: null };
    }
    return s;
  });

  await saveDatabase(db);
}

// ----------------- TASK OPERATIONS (WITH DYNAMIC NORMALIZED COUNTS) -----------------
export function getTasksByUserId(userId: string): Task[] {
  const db = loadDatabase();
  const userTasks = db.tasks.filter((t) => t.userId === userId);

  // Compute completedPomodoros dynamically via COUNT(sessions)
  return userTasks.map((task) => {
    const completedCount = db.sessions.filter(
      (s) => s.taskId === task.id && s.type === 'focus' && s.completed
    ).length;

    return {
      ...task,
      completedPomodoros: completedCount,
    };
  });
}

export function getTaskById(taskId: string, userId: string): Task | undefined {
  const db = loadDatabase();
  const task = db.tasks.find((t) => t.id === taskId && t.userId === userId);
  if (!task) return undefined;

  const completedCount = db.sessions.filter(
    (s) => s.taskId === task.id && s.type === 'focus' && s.completed
  ).length;

  return {
    ...task,
    completedPomodoros: completedCount,
  };
}

export async function createTask(
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
): Promise<Task> {
  const db = loadDatabase();
  const now = new Date().toISOString();

  if (taskData.projectId) {
    const projectExists = db.projects.some((p) => p.id === taskData.projectId && p.userId === userId);
    if (!projectExists) {
      taskData.projectId = null;
    }
  }

  const newTaskRaw: Omit<Task, 'completedPomodoros'> = {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    userId,
    projectId: taskData.projectId || null,
    title: taskData.title.trim(),
    description: taskData.description?.trim() || '',
    priority: taskData.priority || 'medium',
    status: taskData.status || 'todo',
    estimatedPomodoros: Number(taskData.estimatedPomodoros) || 1,
    dueDate: taskData.dueDate || undefined,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  db.tasks.push(newTaskRaw);
  await saveDatabase(db);

  return {
    ...newTaskRaw,
    completedPomodoros: 0,
  };
}

export async function updateTask(userId: string, taskId: string, updates: Partial<Task>): Promise<Task> {
  const db = loadDatabase();
  const index = db.tasks.findIndex((t) => t.id === taskId && t.userId === userId);
  if (index === -1) {
    throw new Error('Tarefa não encontrada');
  }

  const existing = db.tasks[index];
  const isCompleting = updates.status === 'completed' && existing.status !== 'completed';
  const isUncompleting = updates.status && updates.status !== 'completed' && existing.status === 'completed';

  let completedAt = existing.completedAt;
  if (isCompleting) {
    completedAt = new Date().toISOString();
  } else if (isUncompleting) {
    completedAt = null;
  }

  const { completedPomodoros, ...validFields } = updates;
  const updatedTask: Omit<Task, 'completedPomodoros'> = {
    ...existing,
    ...validFields,
    completedAt,
    id: existing.id,
    userId: existing.userId,
    updatedAt: new Date().toISOString(),
  };

  db.tasks[index] = updatedTask;
  await saveDatabase(db);

  const completedCount = db.sessions.filter(
    (s) => s.taskId === taskId && s.type === 'focus' && s.completed
  ).length;

  return {
    ...updatedTask,
    completedPomodoros: completedCount,
  };
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const db = loadDatabase();
  db.tasks = db.tasks.filter((t) => !(t.id === taskId && t.userId === userId));

  // Nullify taskId on sessions for referential integrity
  db.sessions = db.sessions.map((s) => {
    if (s.taskId === taskId) {
      return { ...s, taskId: null };
    }
    return s;
  });

  // Clear active timer if pointing to this task
  if (db.activeTimers[userId]?.taskId === taskId) {
    db.activeTimers[userId].taskId = null;
  }

  await saveDatabase(db);
}

// ----------------- POMODORO SESSIONS (WITH DYNAMIC JOIN RESOLUTION) -----------------
export function getSessionsByUserId(userId: string, limit = 100): PomodoroSession[] {
  const db = loadDatabase();
  const userSessions = db.sessions
    .filter((s) => s.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  // Relational resolution (JOIN): lookup title from task and project dynamically
  const projectMap = new Map(db.projects.map((p) => [p.id, p.name]));
  const taskMap = new Map(db.tasks.map((t) => [t.id, t.title]));

  return userSessions.map((session) => {
    let taskTitle: string | undefined;
    let projectName: string | undefined;

    if (session.taskId) {
      taskTitle = taskMap.get(session.taskId);
    }
    if (session.projectId) {
      projectName = projectMap.get(session.projectId);
    }

    return {
      ...session,
      taskTitle,
      projectName,
    };
  });
}

export async function recordPomodoroSession(
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
): Promise<PomodoroSession> {
  const db = loadDatabase();
  const now = new Date().toISOString();

  let resolvedProjectId = sessionData.projectId || null;

  // If task provided, ensure foreign key relationship
  if (sessionData.taskId) {
    const task = db.tasks.find((t) => t.id === sessionData.taskId && t.userId === userId);
    if (task && !resolvedProjectId && task.projectId) {
      resolvedProjectId = task.projectId;
    }
  }

  // Normalized record (no duplicate taskTitle or projectName stored on disk)
  const newSessionRaw: Omit<PomodoroSession, 'taskTitle' | 'projectName'> = {
    id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    userId,
    taskId: sessionData.taskId || null,
    projectId: resolvedProjectId,
    type: sessionData.type,
    durationMinutes: sessionData.durationMinutes,
    completed: sessionData.completed,
    startedAt: sessionData.startedAt,
    endedAt: sessionData.endedAt,
    notes: sessionData.notes || '',
    createdAt: now,
  };

  db.sessions.push(newSessionRaw);
  await saveDatabase(db);

  // Return with dynamically joined titles for instant API response
  const project = resolvedProjectId ? db.projects.find((p) => p.id === resolvedProjectId) : null;
  const task = sessionData.taskId ? db.tasks.find((t) => t.id === sessionData.taskId) : null;

  return {
    ...newSessionRaw,
    taskTitle: task?.title,
    projectName: project?.name,
  };
}

export function getActiveTimer(userId: string): ActiveTimerState {
  const db = loadDatabase();
  const timer = db.activeTimers[userId];
  if (!timer) {
    const pref = getUserPreferences(userId);
    const defaultDuration = (pref.focusDuration || 25) * 60;
    const initial: ActiveTimerState = {
      userId,
      type: 'focus',
      totalSeconds: defaultDuration,
      remainingSeconds: defaultDuration,
      isRunning: false,
      startedAtTimestamp: null,
      targetEndTimestamp: null,
      updatedAt: new Date().toISOString(),
    };
    db.activeTimers[userId] = initial;
    saveDatabaseSync(db);
    return initial;
  }

  if (timer.isRunning && timer.targetEndTimestamp) {
    const nowMs = Date.now();
    const remaining = Math.max(0, Math.round((timer.targetEndTimestamp - nowMs) / 1000));
    if (remaining === 0) {
      timer.isRunning = false;
      timer.remainingSeconds = 0;
      timer.startedAtTimestamp = null;
      timer.targetEndTimestamp = null;
    } else {
      timer.remainingSeconds = remaining;
    }
  }

  return timer;
}

export async function updateActiveTimer(userId: string, stateUpdates: Partial<ActiveTimerState>): Promise<ActiveTimerState> {
  const db = loadDatabase();
  const current = getActiveTimer(userId);

  const updated: ActiveTimerState = {
    ...current,
    ...stateUpdates,
    userId,
    updatedAt: new Date().toISOString(),
  };

  db.activeTimers[userId] = updated;
  await saveDatabase(db);
  return updated;
}

// ----------------- PRODUCTIVITY STATS CALCULATION -----------------
export function calculateUserStats(userId: string): ProductivityStats {
  const db = loadDatabase();
  const userSessions = db.sessions.filter((s) => s.userId === userId && s.type === 'focus' && s.completed);
  const userTasks = db.tasks.filter((t) => t.userId === userId);
  const userProjects = db.projects.filter((p) => p.userId === userId);

  const totalPomodorosCompleted = userSessions.length;
  const totalFocusTimeMinutes = userSessions.reduce((acc, s) => acc + (s.durationMinutes || 25), 0);
  const deepWorkHours = Number((totalFocusTimeMinutes / 60).toFixed(1));

  // Today metrics
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todaySessions = userSessions.filter((s) => s.createdAt.startsWith(todayDateStr));
  const todayFocusTimeMinutes = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 25), 0);

  const todayCompletedTasks = userTasks.filter(
    (t) => t.status === 'completed' && t.completedAt && t.completedAt.startsWith(todayDateStr)
  ).length;

  // Completion Rate
  const totalTasks = userTasks.length;
  const completedTasksCount = userTasks.filter((t) => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 100;

  // Daily average pomodoros
  const sessionDates = new Set(userSessions.map((s) => s.createdAt.split('T')[0]));
  const activeDaysCount = Math.max(1, sessionDates.size);
  const dailyAveragePomodoros = Number((totalPomodorosCompleted / activeDaysCount).toFixed(1));

  // Streak calculation
  let streakDays = 0;
  const dayMs = 86400000;
  let checkDate = new Date();
  const checkDateStr = checkDate.toISOString().split('T')[0];
  let hasSessionToday = sessionDates.has(checkDateStr);

  if (!hasSessionToday) {
    const yesterday = new Date(Date.now() - dayMs).toISOString().split('T')[0];
    if (sessionDates.has(yesterday)) {
      checkDate = new Date(Date.now() - dayMs);
      hasSessionToday = true;
    }
  }

  if (hasSessionToday) {
    while (true) {
      const dateKey = checkDate.toISOString().split('T')[0];
      if (sessionDates.has(dateKey)) {
        streakDays++;
        checkDate = new Date(checkDate.getTime() - dayMs);
      } else {
        break;
      }
    }
  }
  if (streakDays === 0 && totalPomodorosCompleted > 0) {
    streakDays = 1;
  }

  // Weekly Progress
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayKeys = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const now = new Date();
  const currentDayOfWeek = now.getDay();

  const mondayOffset = (currentDayOfWeek + 6) % 7;
  const monday = new Date(now.getTime() - mondayOffset * dayMs);
  monday.setHours(0, 0, 0, 0);

  const weeklyProgress = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday.getTime() + i * dayMs);
    const dayDateStr = dayDate.toISOString().split('T')[0];
    const daySessions = userSessions.filter((s) => s.createdAt.startsWith(dayDateStr));
    const dayPomodoros = daySessions.length;
    const dayMins = daySessions.reduce((acc, s) => acc + (s.durationMinutes || 25), 0);
    const dayIndex = dayDate.getDay();

    weeklyProgress.push({
      dayKey: dayKeys[dayIndex],
      dayName: dayNames[dayIndex],
      pomodoros: dayPomodoros,
      minutes: dayMins,
      isToday: dayDateStr === todayDateStr,
    });
  }

  // Project Distribution
  const projectMinsMap: Record<string, number> = {};
  userSessions.forEach((s) => {
    const pId = s.projectId || 'unassigned';
    projectMinsMap[pId] = (projectMinsMap[pId] || 0) + (s.durationMinutes || 25);
  });

  const projectDistribution = userProjects.map((p) => {
    const mins = projectMinsMap[p.id] || 0;
    const hours = Number((mins / 60).toFixed(1));
    const percentage = totalFocusTimeMinutes > 0 ? Math.round((mins / totalFocusTimeMinutes) * 100) : 0;
    return {
      projectId: p.id,
      projectName: p.name,
      color: p.color || '#0f172a',
      minutes: mins,
      hours,
      percentage,
    };
  });

  if (projectMinsMap['unassigned']) {
    const mins = projectMinsMap['unassigned'];
    const hours = Number((mins / 60).toFixed(1));
    const percentage = totalFocusTimeMinutes > 0 ? Math.round((mins / totalFocusTimeMinutes) * 100) : 0;
    projectDistribution.push({
      projectId: 'unassigned',
      projectName: 'Tarefas Gerais',
      color: '#64748b',
      minutes: mins,
      hours,
      percentage,
    });
  }

  return {
    dailyAveragePomodoros,
    deepWorkHours,
    completionRate,
    streakDays,
    totalPomodorosCompleted,
    totalFocusTimeMinutes,
    todayFocusTimeMinutes,
    todayCompletedTasks,
    weeklyProgress,
    projectDistribution,
  };
}
