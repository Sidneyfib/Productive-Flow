'use client';

import React from 'react';
import { useFlow, NavTab } from '@/context/FlowContext';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Timer,
  History,
  BarChart3,
  User as UserIcon,
  Play,
  Pause,
  LogOut,
  WifiOff,
  Flame,
  Plus,
} from 'lucide-react';

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export default function SideNavBar() {
  const { currentTab, setCurrentTab, activeTimer, startTimer, pauseTimer, tasks, stats, isOnline, openNewTaskModal } = useFlow();
  const { user, logout } = useAuth();

  const pendingTasksCount = tasks.filter((t) => t.status !== 'completed').length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projetos', icon: FolderKanban },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined },
    { id: 'timer', label: 'Sessão Pomodoro', icon: Timer },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
    { id: 'profile', label: 'Perfil', icon: UserIcon },
  ];

  const formatTimerShort = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <aside
      id="flow-side-navbar"
      className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 h-screen sticky top-0 z-30 select-none justify-between"
    >
      {/* Top Section: Logo & Brand */}
      <div>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div
            onClick={() => setCurrentTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                Flow
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </span>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Deep Work Mode</p>
            </div>
          </div>
        </div>

        {/* Offline indicator if disconnected */}
        {!isOnline && (
          <div className="mx-3 mt-3 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-amber-400 text-xs">
            <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Modo Offline Ativo</span>
          </div>
        )}

        {/* Navigation Section */}
        <div className="px-4 pt-4 pb-1">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Navegação Principal</p>
        </div>

        <nav className="px-2 py-1 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white border-r-4 border-rose-500 font-semibold shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Middle/Bottom: Quick Action & Mini Active Timer Card */}
      <div className="p-3 space-y-2.5 border-t border-slate-800 bg-slate-950/40">
        {/* Quick Pomodoro Widget */}
        <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <span className={`w-2 h-2 rounded-full ${activeTimer.isRunning ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`} />
              <span>{activeTimer.type === 'focus' ? 'Foco Ativo' : 'Intervalo'}</span>
            </div>
            <span className="font-mono font-bold text-sm text-white tabular-nums">
              {formatTimerShort(activeTimer.remainingSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="sidebar-timer-toggle-btn"
              onClick={activeTimer.isRunning ? pauseTimer : startTimer}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTimer.isRunning
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
              }`}
            >
              {activeTimer.isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Iniciar</span>
                </>
              )}
            </button>
            <button
              id="sidebar-new-task-btn"
              onClick={() => openNewTaskModal()}
              title="Criar Nova Tarefa"
              className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Streak indicator */}
        {stats && stats.streakDays > 0 && (
          <div className="px-3 py-1.5 bg-slate-800/40 rounded-lg border border-slate-700/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Sequência</span>
            </div>
            <span className="font-bold text-rose-400">{stats.streakDays} {stats.streakDays === 1 ? 'Dia' : 'Dias'}</span>
          </div>
        )}

        {/* User Card & Logout */}
        <div className="pt-1 flex items-center justify-between">
          <div
            onClick={() => setCurrentTab('profile')}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
          >
            <div className="relative flex-shrink-0">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user?.name || 'Avatar'}
                className="w-8 h-8 rounded-full object-cover border border-slate-700"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">
                {user?.name} {user?.lastName || ''}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            id="sidebar-logout-btn"
            onClick={logout}
            title="Encerrar Sessão (Logout)"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
