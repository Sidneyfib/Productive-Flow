'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { Project, Task, PomodoroSession, ActiveTimerState, ProductivityStats, SessionType } from '@/lib/types';
import { playChime, playClickSound } from '@/lib/audio';
import confetti from 'canvas-confetti';

export type NavTab = 'dashboard' | 'projects' | 'tasks' | 'timer' | 'history' | 'stats' | 'profile';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface FlowContextType {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  projects: Project[];
  tasks: Task[];
  sessions: PomodoroSession[];
  stats: ProductivityStats | null;
  activeTimer: ActiveTimerState;
  isLoadingData: boolean;
  isOnline: boolean;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  
  // Timer Controls
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  setTimerType: (type: SessionType) => void;
  selectTaskForTimer: (taskId: string | null) => void;
  
  // Project Actions
  addProject: (data: Partial<Project>) => Promise<Project>;
  updateProjectAction: (id: string, updates: Partial<Project>) => Promise<Project>;
  deleteProjectAction: (id: string) => Promise<void>;
  
  // Task Actions
  addTask: (data: Partial<Task>) => Promise<Task>;
  updateTaskAction: (id: string, updates: Partial<Task>) => Promise<Task>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  deleteTaskAction: (id: string) => Promise<void>;

  // Session Logging
  logCompletedSession: (notes?: string) => Promise<void>;
  
  // Modals
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  editingTask: Task | null;
  openNewTaskModal: (projectId?: string) => void;
  openEditTaskModal: (task: Task) => void;
  
  isProjectModalOpen: boolean;
  setIsProjectModalOpen: (open: boolean) => void;
  editingProject: Project | null;
  openNewProjectModal: () => void;
  openEditProjectModal: (project: Project) => void;
  
  isCelebrationModalOpen: boolean;
  setIsCelebrationModalOpen: (open: boolean) => void;
  
  // Sync
  refreshData: () => Promise<void>;
}

const FlowContext = createContext<FlowContextType | undefined>(undefined);

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [stats, setStats] = useState<ProductivityStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCelebrationModalOpen, setIsCelebrationModalOpen] = useState(false);

  // Active Timer state
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState>({
    userId: user?.id || '',
    type: 'focus',
    totalSeconds: (user?.focusDuration || 25) * 60,
    remainingSeconds: (user?.focusDuration || 25) * 60,
    isRunning: false,
    startedAtTimestamp: null,
    targetEndTimestamp: null,
    updatedAt: new Date().toISOString(),
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimerDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initial and on-user-change Data Load
  const refreshData = useCallback(async () => {
    if (!user) {
      setIsLoadingData(false);
      return;
    }

    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        setTasks(data.tasks || []);
        setSessions(data.sessions || []);
        setStats(data.stats || null);
        if (data.timer) {
          setActiveTimer(data.timer);
        }
      }
    } catch (err) {
      console.error('Error fetching data bundle:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Conexão restabelecida. Sincronizando dados...', 'info');
      refreshData();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Modo offline ativo. Suas alterações locais serão sincronizadas ao reconectar.', 'info');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [showToast, refreshData]);

  // Initial user sync
  useEffect(() => {
    let isSubscribed = true;
    async function loadInitialData() {
      if (!user) {
        if (isSubscribed) setIsLoadingData(false);
        return;
      }
      try {
        const res = await fetch('/api/sync');
        if (res.ok && isSubscribed) {
          const data = await res.json();
          setProjects(data.projects || []);
          setTasks(data.tasks || []);
          setSessions(data.sessions || []);
          setStats(data.stats || null);
          if (data.timer) {
            setActiveTimer(data.timer);
          }
        }
      } catch (err) {
        console.error('Error fetching sync bundle:', err);
      } finally {
        if (isSubscribed) setIsLoadingData(false);
      }
    }

    loadInitialData();

    return () => {
      isSubscribed = false;
    };
  }, [user]);

  // Sync Timer state to backend with debounce
  const syncTimerToBackend = useCallback((timerState: ActiveTimerState) => {
    if (syncTimerDebounceRef.current) {
      clearTimeout(syncTimerDebounceRef.current);
    }
    syncTimerDebounceRef.current = setTimeout(async () => {
      try {
        await fetch('/api/pomodoro/active', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(timerState),
        });
      } catch (err) {
        console.error('Failed to persist timer state:', err);
      }
    }, 500);
  }, []);

  // Request browser notification permission once
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Complete session handler
  const handleTimerComplete = useCallback(async () => {
    playChime(activeTimer.type === 'focus' ? 'focus_completed' : 'break_completed');

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Flow - Sessão Concluída!', {
        body: activeTimer.type === 'focus' ? 'Parabéns! Ciclo de foco finalizado com sucesso.' : 'A pausa terminou. Hora de voltar ao foco!',
        icon: '/icon.png',
      });
    }

    if (activeTimer.type === 'focus') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ba0035', '#009668', '#000000', '#dae2fd'],
        });
      } catch {}

      setIsCelebrationModalOpen(true);

      // Record completed session in DB
      try {
        const res = await fetch('/api/pomodoro/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: activeTimer.taskId,
            projectId: activeTimer.projectId,
            type: 'focus',
            durationMinutes: Math.round(activeTimer.totalSeconds / 60),
            completed: true,
            startedAt: new Date(Date.now() - activeTimer.totalSeconds * 1000).toISOString(),
            endedAt: new Date().toISOString(),
          }),
        });

        if (res.ok) {
          refreshData();
          showToast('Sessão Pomodoro concluída e registrada!', 'success');
        }
      } catch (err) {
        console.error('Failed to log session:', err);
      }

      // Next: Short break if auto-start
      const shortBreakDuration = (user?.shortBreakDuration || 5) * 60;
      const nextTimer: ActiveTimerState = {
        ...activeTimer,
        type: 'short_break',
        totalSeconds: shortBreakDuration,
        remainingSeconds: shortBreakDuration,
        isRunning: user?.autoStartBreaks ?? true,
        startedAtTimestamp: user?.autoStartBreaks ? Date.now() : null,
        targetEndTimestamp: user?.autoStartBreaks ? Date.now() + shortBreakDuration * 1000 : null,
        updatedAt: new Date().toISOString(),
      };
      setActiveTimer(nextTimer);
      syncTimerToBackend(nextTimer);
    } else {
      // Break completed -> Next focus
      const focusDuration = (user?.focusDuration || 25) * 60;
      const nextTimer: ActiveTimerState = {
        ...activeTimer,
        type: 'focus',
        totalSeconds: focusDuration,
        remainingSeconds: focusDuration,
        isRunning: false,
        startedAtTimestamp: null,
        targetEndTimestamp: null,
        updatedAt: new Date().toISOString(),
      };
      setActiveTimer(nextTimer);
      syncTimerToBackend(nextTimer);
      showToast('Pausa concluída! Pronto para o próximo ciclo de foco.', 'info');
    }
  }, [activeTimer, user, refreshData, showToast, syncTimerToBackend]);

  // Master Clock Interval
  useEffect(() => {
    if (activeTimer.isRunning) {
      timerRef.current = setInterval(() => {
        setActiveTimer((prev) => {
          if (!prev.isRunning) return prev;

          // If targetEndTimestamp is set, calculate accurately to avoid background sleep drift
          if (prev.targetEndTimestamp) {
            const now = Date.now();
            const diff = Math.max(0, Math.round((prev.targetEndTimestamp - now) / 1000));
            if (diff === 0) {
              clearInterval(timerRef.current!);
              handleTimerComplete();
              return {
                ...prev,
                remainingSeconds: 0,
                isRunning: false,
                startedAtTimestamp: null,
                targetEndTimestamp: null,
              };
            }
            return { ...prev, remainingSeconds: diff };
          }

          if (prev.remainingSeconds <= 1) {
            clearInterval(timerRef.current!);
            handleTimerComplete();
            return {
              ...prev,
              remainingSeconds: 0,
              isRunning: false,
              startedAtTimestamp: null,
              targetEndTimestamp: null,
            };
          }

          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeTimer.isRunning, activeTimer.targetEndTimestamp, handleTimerComplete]);

  // TIMER CONTROLS
  const startTimer = useCallback(() => {
    playClickSound();
    const now = Date.now();
    const targetEnd = now + activeTimer.remainingSeconds * 1000;
    const updated: ActiveTimerState = {
      ...activeTimer,
      isRunning: true,
      startedAtTimestamp: now,
      targetEndTimestamp: targetEnd,
      updatedAt: new Date().toISOString(),
    };
    setActiveTimer(updated);
    syncTimerToBackend(updated);
  }, [activeTimer, syncTimerToBackend]);

  const pauseTimer = useCallback(() => {
    playClickSound();
    const updated: ActiveTimerState = {
      ...activeTimer,
      isRunning: false,
      startedAtTimestamp: null,
      targetEndTimestamp: null,
      updatedAt: new Date().toISOString(),
    };
    setActiveTimer(updated);
    syncTimerToBackend(updated);
  }, [activeTimer, syncTimerToBackend]);

  const resetTimer = useCallback(() => {
    playClickSound();
    const duration =
      activeTimer.type === 'focus'
        ? (user?.focusDuration || 25) * 60
        : activeTimer.type === 'short_break'
        ? (user?.shortBreakDuration || 5) * 60
        : (user?.longBreakDuration || 15) * 60;

    const updated: ActiveTimerState = {
      ...activeTimer,
      totalSeconds: duration,
      remainingSeconds: duration,
      isRunning: false,
      startedAtTimestamp: null,
      targetEndTimestamp: null,
      updatedAt: new Date().toISOString(),
    };
    setActiveTimer(updated);
    syncTimerToBackend(updated);
  }, [activeTimer, user, syncTimerToBackend]);

  const skipTimer = useCallback(() => {
    playClickSound();
    let nextType: SessionType = 'focus';
    let durationMinutes = user?.focusDuration || 25;

    if (activeTimer.type === 'focus') {
      nextType = 'short_break';
      durationMinutes = user?.shortBreakDuration || 5;
    } else {
      nextType = 'focus';
      durationMinutes = user?.focusDuration || 25;
    }

    const durationSeconds = durationMinutes * 60;
    const updated: ActiveTimerState = {
      ...activeTimer,
      type: nextType,
      totalSeconds: durationSeconds,
      remainingSeconds: durationSeconds,
      isRunning: false,
      startedAtTimestamp: null,
      targetEndTimestamp: null,
      updatedAt: new Date().toISOString(),
    };
    setActiveTimer(updated);
    syncTimerToBackend(updated);
    showToast(`Alternado para ${nextType === 'focus' ? 'Foco' : 'Pausa'}.`, 'info');
  }, [activeTimer, user, syncTimerToBackend, showToast]);

  const setTimerType = useCallback(
    (type: SessionType) => {
      playClickSound();
      let durationMinutes = 25;
      if (type === 'focus') durationMinutes = user?.focusDuration || 25;
      if (type === 'short_break') durationMinutes = user?.shortBreakDuration || 5;
      if (type === 'long_break') durationMinutes = user?.longBreakDuration || 15;

      const durationSeconds = durationMinutes * 60;
      const updated: ActiveTimerState = {
        ...activeTimer,
        type,
        totalSeconds: durationSeconds,
        remainingSeconds: durationSeconds,
        isRunning: false,
        startedAtTimestamp: null,
        targetEndTimestamp: null,
        updatedAt: new Date().toISOString(),
      };
      setActiveTimer(updated);
      syncTimerToBackend(updated);
    },
    [activeTimer, user, syncTimerToBackend]
  );

  const selectTaskForTimer = useCallback(
    (taskId: string | null) => {
      const task = tasks.find((t) => t.id === taskId);
      const updated: ActiveTimerState = {
        ...activeTimer,
        taskId: taskId || null,
        projectId: task ? task.projectId || null : activeTimer.projectId,
        updatedAt: new Date().toISOString(),
      };
      setActiveTimer(updated);
      syncTimerToBackend(updated);
      if (task) {
        showToast(`Tarefa ativa: "${task.title}"`, 'info');
      }
    },
    [activeTimer, tasks, syncTimerToBackend, showToast]
  );

  // PROJECT ACTIONS
  const addProject = async (data: Partial<Project>): Promise<Project> => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao criar projeto');

    setProjects((prev) => [result.project, ...prev]);
    showToast(`Projeto "${result.project.name}" criado com sucesso!`, 'success');
    refreshData();
    return result.project;
  };

  const updateProjectAction = async (id: string, updates: Partial<Project>): Promise<Project> => {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao atualizar projeto');

    setProjects((prev) => prev.map((p) => (p.id === id ? result.project : p)));
    showToast('Projeto atualizado com sucesso!', 'success');
    refreshData();
    return result.project;
  };

  const deleteProjectAction = async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao excluir projeto');
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
    showToast('Projeto excluído com sucesso!', 'success');
    refreshData();
  };

  // TASK ACTIONS
  const addTask = async (data: Partial<Task>): Promise<Task> => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao criar tarefa');

    setTasks((prev) => [result.task, ...prev]);
    showToast(`Tarefa "${result.task.title}" adicionada!`, 'success');
    refreshData();
    return result.task;
  };

  const updateTaskAction = async (id: string, updates: Partial<Task>): Promise<Task> => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao atualizar tarefa');

    setTasks((prev) => prev.map((t) => (t.id === id ? result.task : t)));
    showToast('Tarefa atualizada!', 'success');
    refreshData();
    return result.task;
  };

  const toggleTaskStatus = async (taskId: string) => {
    const current = tasks.find((t) => t.id === taskId);
    if (!current) return;

    const nextStatus = current.status === 'completed' ? 'todo' : 'completed';
    playClickSound();

    if (nextStatus === 'completed') {
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch {}
    }

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: nextStatus, completedAt: nextStatus === 'completed' ? new Date().toISOString() : null }
          : t
      )
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        throw new Error('Falha ao atualizar tarefa');
      }
      showToast(nextStatus === 'completed' ? 'Tarefa concluída! Parabéns!' : 'Tarefa marcada como pendente.', 'success');
      refreshData();
    } catch {
      // Revert optimistic update
      setTasks((prev) => prev.map((t) => (t.id === taskId ? current : t)));
      showToast('Erro ao atualizar status da tarefa', 'error');
    }
  };

  const deleteTaskAction = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao excluir tarefa');
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Tarefa excluída!', 'info');
    refreshData();
  };

  const logCompletedSession = async (notes?: string) => {
    if (notes && sessions.length > 0) {
      const latest = sessions[0];
      try {
        await fetch('/api/pomodoro/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: latest.taskId,
            projectId: latest.projectId,
            type: latest.type,
            durationMinutes: latest.durationMinutes,
            completed: true,
            notes,
          }),
        });
      } catch {}
    }
  };

  // Modals helpers
  const openNewTaskModal = (projectId?: string) => {
    setEditingTask(projectId ? ({ projectId } as any) : null);
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const openNewProjectModal = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const openEditProjectModal = (project: Project) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  return (
    <FlowContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        projects,
        tasks,
        sessions,
        stats,
        activeTimer,
        isLoadingData,
        isOnline,
        toasts,
        showToast,
        dismissToast,
        startTimer,
        pauseTimer,
        resetTimer,
        skipTimer,
        setTimerType,
        selectTaskForTimer,
        addProject,
        updateProjectAction,
        deleteProjectAction,
        addTask,
        updateTaskAction,
        toggleTaskStatus,
        deleteTaskAction,
        logCompletedSession,
        isTaskModalOpen,
        setIsTaskModalOpen,
        editingTask,
        openNewTaskModal,
        openEditTaskModal,
        isProjectModalOpen,
        setIsProjectModalOpen,
        editingProject,
        openNewProjectModal,
        openEditProjectModal,
        isCelebrationModalOpen,
        setIsCelebrationModalOpen,
        refreshData,
      }}
    >
      {children}
    </FlowContext.Provider>
  );
}

export function useFlow() {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return context;
}
