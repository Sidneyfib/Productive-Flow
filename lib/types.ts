export type UserRole = 'user' | 'admin';

/**
 * Normalized 3FN User Entity (Authentication & Profile Identity)
 */
export interface User {
  id: string;
  name: string;
  lastName?: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Normalized 3FN UserPreference Entity (1:1 with User)
 * Stores timer configurations and personal productivity preferences
 */
export interface UserPreference {
  id: string;
  userId: string;
  focusDuration: number; // in minutes (default 25)
  shortBreakDuration: number; // in minutes (default 5)
  longBreakDuration: number; // in minutes (default 15)
  autoStartBreaks: boolean; // default true
  createdAt: string;
  updatedAt: string;
}

/**
 * Combined User with Preferences for client auth sessions and views
 */
export interface UserWithPreferences extends User {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
}

export type ProjectStatus = 'in_progress' | 'delayed' | 'planning' | 'completed';

/**
 * Normalized 3FN Project Entity
 */
export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: ProjectStatus;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

/**
 * Normalized 3FN Task Entity
 * Note: completedPomodoros is computed dynamically via COUNT(sessions)
 * but provided in queried results for convenient UI consumption
 */
export interface Task {
  id: string;
  userId: string;
  projectId?: string | null;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedPomodoros: number;
  completedPomodoros?: number;
  dueDate?: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SessionType = 'focus' | 'short_break' | 'long_break';

/**
 * Normalized 3FN PomodoroSession Entity
 * Stores only foreign keys (userId, projectId, taskId) without redundant string titles.
 * Titles are resolved dynamically via relational queries/JOINs.
 */
export interface PomodoroSession {
  id: string;
  userId: string;
  projectId?: string | null;
  taskId?: string | null;
  type: SessionType;
  durationMinutes: number;
  completed: boolean;
  startedAt: string;
  endedAt: string;
  notes?: string;
  createdAt: string;

  // Dynamically resolved fields via relational query (JOIN)
  taskTitle?: string;
  projectName?: string;
}

export interface ActiveTimerState {
  userId: string;
  taskId?: string | null;
  projectId?: string | null;
  type: SessionType;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  startedAtTimestamp?: number | null; // ms timestamp when timer resumed
  targetEndTimestamp?: number | null; // ms timestamp when current session will finish
  updatedAt: string;
}

export interface ProductivityStats {
  dailyAveragePomodoros: number;
  deepWorkHours: number;
  completionRate: number;
  streakDays: number;
  totalPomodorosCompleted: number;
  totalFocusTimeMinutes: number;
  todayFocusTimeMinutes: number;
  todayCompletedTasks: number;
  weeklyProgress: {
    dayKey: string; // 'S', 'T', 'Q', 'Q', 'S', 'S', 'D'
    dayName: string;
    pomodoros: number;
    minutes: number;
    isToday: boolean;
  }[];
  projectDistribution: {
    projectId: string;
    projectName: string;
    color: string;
    minutes: number;
    hours: number;
    percentage: number;
  }[];
}

export interface AuthResponse {
  user: Omit<UserWithPreferences, 'passwordHash'>;
  token: string;
}
