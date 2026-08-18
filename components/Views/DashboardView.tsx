'use client';

import React from 'react';
import { useFlow } from '@/context/FlowContext';
import { useAuth } from '@/context/AuthContext';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Circle,
  Plus,
  ArrowRight,
  TrendingUp,
  FolderKanban,
  CheckSquare,
  Flame,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function DashboardView() {
  const { user } = useAuth();
  const {
    projects,
    tasks,
    stats,
    activeTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    selectTaskForTimer,
    toggleTaskStatus,
    openNewTaskModal,
    openNewProjectModal,
    setCurrentTab,
  } = useFlow();

  // Active task details
  const activeTask = tasks.find((t) => t.id === activeTimer.taskId);
  const activeProject = projects.find((p) => p.id === (activeTask?.projectId || activeTimer.projectId));

  // Today date formatted in Portuguese
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Today's tasks
  const todayTasks = tasks.slice(0, 5);

  // Active projects (top 3)
  const activeProjects = projects.slice(0, 3);

  // Timer format
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Progress percentage for circular ring
  const progressRatio =
    activeTimer.totalSeconds > 0
      ? (activeTimer.totalSeconds - activeTimer.remainingSeconds) / activeTimer.totalSeconds
      : 0;
  const strokeDashoffset = 283 - 283 * progressRatio;

  return (
    <div id="dashboard-view" className="space-y-5 max-w-7xl mx-auto">
      {/* Header Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{capitalize(todayFormatted)}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Olá, {user?.name || 'Focado'}!
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pronto para mais um ciclo de foco profundo? Organize seu dia e alcance suas metas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="dashboard-new-task-btn"
            onClick={() => openNewTaskModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </button>
          <button
            id="dashboard-go-timer-btn"
            onClick={() => setCurrentTab('timer')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Timer className="w-4 h-4 text-rose-500" />
            <span>Abrir Timer</span>
          </button>
        </div>
      </div>

      {/* 4 Top KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Focus Time */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Foco Total</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{stats?.deepWorkHours || 0}h</span>
            <span className="text-xs text-slate-500 ml-1">acumuladas</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Hoje: {stats?.todayFocusTimeMinutes || 0} min</p>
        </div>

        {/* Metric 2: Pomodoros Done */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pomodoros</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{stats?.totalPomodorosCompleted || 0}</span>
            <span className="text-xs text-emerald-600 font-bold ml-1.5 bg-emerald-50 px-1.5 py-0.5 rounded">100%</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Sessões concluídas</p>
        </div>

        {/* Metric 3: Streak */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sequência</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{stats?.streakDays || 0}</span>
            <span className="text-xs text-slate-500 ml-1">dias seguidos</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Constância diária</p>
        </div>

        {/* Metric 4: Tasks Progress */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tarefas</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{stats?.completionRate || 100}%</span>
            <span className="text-xs text-slate-500 ml-1">eficiência</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{tasks.filter(t => t.status === 'completed').length}/{tasks.length} concluídas</p>
        </div>
      </div>

      {/* Top 2 Main Action Cards: Active Focus Widget & Weekly Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Active Focus Card (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
              <span className={`w-2 h-2 rounded-full ${activeTimer.isRunning ? 'bg-rose-500 animate-ping' : 'bg-slate-400'}`} />
              <span>{activeTimer.type === 'focus' ? 'Foco Atual' : 'Intervalo de Descanso'}</span>
            </div>
            <button
              onClick={() => setCurrentTab('timer')}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
            >
              <span>Ver Imersivo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Circular Progress & Big Timer */}
          <div className="my-2 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-slate-100"
                  strokeWidth="6"
                  fill="transparent"
                />
                {/* Animated Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-rose-500 transition-all duration-1000 ease-linear"
                  strokeWidth="6"
                  strokeDasharray="283"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                  {formatTimer(activeTimer.remainingSeconds)}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                  {activeTimer.isRunning ? 'Em Andamento' : 'Pausado'}
                </span>
              </div>
            </div>

            {/* Task Info Attached */}
            <div className="mt-3 text-center max-w-xs px-2">
              <p className="text-xs font-bold text-slate-900 truncate">
                {activeTask ? activeTask.title : 'Nenhuma tarefa vinculada'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {activeProject ? activeProject.name : 'Modo Foco Geral'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <button
              onClick={resetTimer}
              title="Reiniciar Timer"
              className="p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              id="dashboard-timer-toggle-btn"
              onClick={activeTimer.isRunning ? pauseTimer : startTimer}
              className={`flex-1 max-w-[160px] py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
                activeTimer.isRunning
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-rose-500 hover:bg-rose-600 text-white'
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
                  <span>Iniciar Foco</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Weekly Productivity & Stats Summary (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Progresso Semanal de Foco</h3>
                <p className="text-xs text-slate-500">
                  {stats?.totalPomodorosCompleted || 0} Pomodoros concluídos • Meta diária: 6 Pomodoros
                </p>
              </div>
              <button
                onClick={() => setCurrentTab('stats')}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
              >
                <span>Ver Estatísticas</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Interactive Bar Chart for Week */}
            <div className="my-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-end justify-between h-32 pt-3 gap-2">
                {stats?.weeklyProgress.map((day, idx) => {
                  const maxDailyGoal = 8;
                  const heightPercent = Math.min(100, Math.round((day.pomodoros / maxDailyGoal) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.pomodoros}
                      </span>
                      <div className="w-full bg-slate-200/80 rounded-md h-20 flex items-end overflow-hidden p-0.5">
                        <div
                          style={{ height: `${Math.max(8, heightPercent)}%` }}
                          className={`w-full rounded transition-all duration-500 ${
                            day.isToday
                              ? 'bg-rose-500'
                              : day.pomodoros > 0
                              ? 'bg-slate-800'
                              : 'bg-slate-300'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          day.isToday ? 'text-rose-500' : 'text-slate-600'
                        }`}
                      >
                        {day.dayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            <div className="p-2 bg-slate-50 rounded-lg text-center border border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Horas Foco</p>
              <p className="text-sm font-black text-slate-900 tabular-nums">{stats?.deepWorkHours || 0}h</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-center border border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Conclusão</p>
              <p className="text-sm font-black text-slate-900 tabular-nums">{stats?.completionRate || 100}%</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-center border border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Sequência</p>
              <p className="text-sm font-black text-rose-500 flex items-center justify-center gap-1 tabular-nums">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{stats?.streakDays || 0} d</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Today's Tasks & Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's Tasks (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-rose-500" />
              <h3 className="font-bold text-sm text-slate-900">Tarefas Prioritárias</h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => openNewTaskModal()}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
              <button
                onClick={() => setCurrentTab('tasks')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <span>Ver Todas</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {todayTasks.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500">Nenhuma tarefa pendente. Comece adicionando uma tarefa!</p>
              <button
                onClick={() => openNewTaskModal()}
                className="mt-2 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg"
              >
                + Criar Primeira Tarefa
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {todayTasks.map((task) => {
                const isDone = task.status === 'completed';
                const isSelected = activeTimer.taskId === task.id;
                const project = projects.find((p) => p.id === task.projectId);

                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-all ${
                      isSelected
                        ? 'bg-rose-50/60 border-rose-200 shadow-xs'
                        : isDone
                        ? 'bg-slate-50/60 border-slate-100 opacity-60'
                        : 'bg-slate-50/40 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <div className="overflow-hidden">
                        <p
                          className={`text-xs font-semibold truncate ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {project && (
                            <span className="text-[10px] font-medium text-slate-600 px-1.5 py-0.2 rounded bg-slate-200/70">
                              {project.name}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            🍅 {task.completedPomodoros}/{task.estimatedPomodoros}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isDone && (
                        <button
                          onClick={() => selectTaskForTimer(isSelected ? null : task.id)}
                          title={isSelected ? 'Tarefa Ativa no Timer' : 'Definir como Tarefa Ativa'}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                            isSelected
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{isSelected ? 'Ativa' : 'Focar'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Projects (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-slate-800" />
              <h3 className="font-bold text-sm text-slate-900">Projetos Ativos</h3>
            </div>
            <button
              onClick={() => setCurrentTab('projects')}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
            >
              <span>Ver Projetos</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {activeProjects.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500">Nenhum projeto cadastrado.</p>
              <button
                onClick={() => openNewProjectModal()}
                className="mt-2 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg"
              >
                + Criar Projeto
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {activeProjects.map((proj) => {
                const projTasks = tasks.filter((t) => t.projectId === proj.id);
                const completedCount = projTasks.filter((t) => t.status === 'completed').length;
                const totalCount = projTasks.length;
                const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                return (
                  <div
                    key={proj.id}
                    onClick={() => setCurrentTab('projects')}
                    className="p-3 bg-slate-50/50 rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: proj.color || '#f43f5e' }}
                        />
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {proj.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 tabular-nums">{percent}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: proj.color || '#f43f5e',
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                      <span>
                        {completedCount}/{totalCount} Concluídas
                      </span>
                      {proj.deadline && (
                        <span>Entrega: {new Date(proj.deadline).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
