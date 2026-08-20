'use client';

import React, { useState } from 'react';
import { useFlow, NavTab } from '@/context/FlowContext';
import { useAuth } from '@/context/AuthContext';
import {
  Menu,
  X,
  Plus,
  Timer,
  Play,
  Pause,
  User as UserIcon,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  History,
  BarChart3,
  LogOut,
  Sparkles,
  WifiOff,
} from 'lucide-react';

export default function TopNavBar() {
  const { currentTab, setCurrentTab, activeTimer, startTimer, pauseTimer, openNewTaskModal, openNewProjectModal, isOnline } = useFlow();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getScreenTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: 'Visão geral e sessões ativas' };
      case 'projects':
        return { title: 'Projetos', subtitle: 'Gerenciamento e status de iniciativas' };
      case 'tasks':
        return { title: 'Tarefas', subtitle: 'Organize suas entregas e prioridades' };
      case 'timer':
        return { title: 'Sessão Pomodoro', subtitle: 'Modo imersivo de foco profundo' };
      case 'history':
        return { title: 'Histórico', subtitle: 'Registro detalhado de produtividade' };
      case 'stats':
        return { title: 'Estatísticas', subtitle: 'Métricas de foco e desempenho' };
      case 'profile':
        return { title: 'Meu Perfil', subtitle: 'Configurações de conta e durações Pomodoro' };
      default:
        return { title: 'Flow', subtitle: 'Deep Work Mode' };
    }
  };

  const { title, subtitle } = getScreenTitle(currentTab);

  const formatTimerDigits = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <header
      id="flow-top-navbar"
      className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs"
    >
      {/* Left: Mobile Hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 rounded-lg text-slate-700 hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div>
          <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight leading-none">
            {title}
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-500 leading-tight mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Right: Active Live Timer Widget + Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Offline Badge */}
        {!isOnline && (
          <div
            id="offline-indicator-badge"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold"
            title="Conexão perdida. Modo offline ativo."
          >
            <WifiOff className="w-3.5 h-3.5 animate-pulse text-amber-600" />
            <span className="hidden sm:inline">Offline</span>
          </div>
        )}

        {/* Floating Active Timer Chip */}
        <div
          onClick={() => setCurrentTab('timer')}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg border cursor-pointer transition-all ${
            activeTimer.isRunning
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${activeTimer.isRunning ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="font-mono text-xs font-bold tabular-nums">{formatTimerDigits(activeTimer.remainingSeconds)}</span>
          <button
            id="top-nav-timer-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              activeTimer.isRunning ? pauseTimer() : startTimer();
            }}
            className="p-1 rounded-md hover:bg-black/10 transition-colors"
          >
            {activeTimer.isRunning ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
          </button>
        </div>

        {/* New Task Button */}
        <button
          id="top-nav-add-task-btn"
          onClick={() => openNewTaskModal()}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Tarefa</span>
        </button>

        {/* User Avatar Button */}
        <button
          id="top-nav-profile-btn"
          onClick={() => setCurrentTab('profile')}
          className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-slate-300 transition-all"
        >
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt="User"
            className="w-7 h-7 rounded-full object-cover border border-slate-200"
          />
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bg-slate-900 border-b border-slate-800 p-4 shadow-xl z-40 space-y-2 text-slate-300">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-800">
            <button
              onClick={() => {
                openNewTaskModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-500 text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Tarefa</span>
            </button>
            <button
              onClick={() => {
                openNewProjectModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Projeto</span>
            </button>
          </div>

          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'projects', label: 'Projetos', icon: FolderKanban },
            { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
            { id: 'timer', label: 'Sessão Pomodoro', icon: Timer },
            { id: 'history', label: 'Histórico', icon: History },
            { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
            { id: 'profile', label: 'Perfil', icon: UserIcon },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id as NavTab);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                  isActive
                    ? 'bg-slate-800 text-white border-l-4 border-rose-500'
                    : 'text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>{user?.email}</span>
            <button
              onClick={logout}
              className="text-xs text-rose-400 font-medium flex items-center gap-1 py-1 px-2 hover:bg-slate-800 rounded-lg"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
