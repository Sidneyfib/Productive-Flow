'use client';

import React, { useState } from 'react';
import { useFlow } from '@/context/FlowContext';
import { Task, TaskPriority, TaskStatus } from '@/lib/types';
import {
  CheckSquare,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Play,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  Filter,
  Clock,
  Flame,
  AlertTriangle,
} from 'lucide-react';

export default function TasksView() {
  const {
    tasks,
    projects,
    activeTimer,
    toggleTaskStatus,
    selectTaskForTimer,
    openNewTaskModal,
    openEditTaskModal,
    deleteTaskAction,
    setCurrentTab,
  } = useFlow();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Priority badge helper
  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'high':
        return { label: 'Alta', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'medium':
        return { label: 'Média', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'low':
        return { label: 'Baixa', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: p, color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? task.status !== 'completed'
        : task.status === statusFilter;

    const matchesPriority = priorityFilter === 'all' ? true : task.priority === priorityFilter;

    const matchesProject = projectFilter === 'all' ? true : task.projectId === projectFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  // Daily task metrics
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const dailyProgressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Upcoming deadlines (tasks with due dates sorted)
  const nowMs = new Date().getTime();
  const upcomingDeadlines = tasks
    .filter((t) => t.status !== 'completed' && t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 4);

  return (
    <div id="tasks-view" className="space-y-5 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tarefas</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize suas entregas, filtre por prioridade e vincule tarefas às sessões Pomodoro.
          </p>
        </div>

        <button
          id="tasks-add-btn"
          onClick={() => openNewTaskModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Tarefa</span>
        </button>
      </div>

      {/* Main Grid: Tasks List (8 cols) + Side Widgets (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Filters & Tasks List (8 cols) */}
        <div className="lg:col-span-8 space-y-3.5">
          {/* Search & Filters Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="tasks-search-input"
                type="text"
                placeholder="Buscar tarefas por título ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                id="tasks-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendentes</option>
                <option value="in_progress">Em Progresso</option>
                <option value="completed">Concluídas</option>
              </select>

              <select
                id="tasks-priority-filter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden"
              >
                <option value="all">Todas as Prioridades</option>
                <option value="high">Prioridade Alta</option>
                <option value="medium">Prioridade Média</option>
                <option value="low">Prioridade Baixa</option>
              </select>

              <select
                id="tasks-project-filter"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden"
              >
                <option value="all">Todos os Projetos</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
              <CheckSquare className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Nenhuma tarefa encontrada</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tente ajustar os filtros de busca ou crie uma nova tarefa para começar a focar!
              </p>
              <button
                onClick={() => openNewTaskModal()}
                className="mt-2 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg"
              >
                + Criar Tarefa
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => {
                const isDone = task.status === 'completed';
                const isSelectedForTimer = activeTimer.taskId === task.id;
                const project = projects.find((p) => p.id === task.projectId);
                const priorityBadge = getPriorityBadge(task.priority);

                return (
                  <div
                    key={task.id}
                    className={`bg-white p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative ${
                      isSelectedForTimer
                        ? 'border-rose-300 bg-rose-50/40 shadow-xs'
                        : isDone
                        ? 'border-slate-200/60 bg-slate-50/50 opacity-65'
                        : 'border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Left: Checkbox & Info */}
                    <div className="flex items-start sm:items-center gap-3 overflow-hidden">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className="mt-0.5 sm:mt-0 text-slate-400 hover:text-slate-700 flex-shrink-0 transition-colors"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="overflow-hidden">
                        <p
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </p>

                        {task.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {project && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.2 rounded border"
                              style={{
                                borderColor: `${project.color}30`,
                                color: project.color,
                                backgroundColor: `${project.color}10`,
                              }}
                            >
                              {project.name}
                            </span>
                          )}

                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${priorityBadge.color}`}
                          >
                            {priorityBadge.label}
                          </span>

                          <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                            🍅 {task.completedPomodoros}/{task.estimatedPomodoros}
                          </span>

                          {task.dueDate && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center justify-end gap-1.5 self-end sm:self-center">
                      {!isDone && (
                        <button
                          onClick={() => {
                            selectTaskForTimer(isSelectedForTimer ? null : task.id);
                            if (!isSelectedForTimer) {
                              setCurrentTab('timer');
                            }
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isSelectedForTimer
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{isSelectedForTimer ? 'No Timer' : 'Focar'}</span>
                        </button>
                      )}

                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === task.id && (
                          <div className="absolute right-0 top-7 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 text-xs">
                            <button
                              onClick={() => {
                                openEditTaskModal(task);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja excluir a tarefa "${task.title}"?`)) {
                                  deleteTaskAction(task.id);
                                }
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Widgets (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Daily Progress Widget */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Progresso de Hoje</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900 tabular-nums">
                  {completedTasksCount}/{totalTasksCount}
                </p>
                <p className="text-xs text-slate-500">Tarefas concluídas</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center font-black text-xs text-rose-500 border-2 border-rose-500 tabular-nums">
                {dailyProgressPercent}%
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${dailyProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Upcoming Deadlines Widget */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Próximos Prazos</h3>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">Nenhuma tarefa com prazo pendente.</p>
            ) : (
              <div className="space-y-1.5">
                {upcomingDeadlines.map((t) => {
                  const dueDateObj = new Date(t.dueDate!);
                  const diffDays = Math.ceil((dueDateObj.getTime() - nowMs) / (1000 * 3600 * 24));
                  const isUrgent = diffDays <= 1;

                  return (
                    <div
                      key={t.id}
                      onClick={() => openEditTaskModal(t)}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 hover:border-slate-300 cursor-pointer transition-colors flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-900 truncate">{t.title}</p>
                        <span className="text-[10px] text-slate-500">
                          {dueDateObj.toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {diffDays < 0 ? 'Atrasado' : diffDays === 0 ? 'Hoje' : `Em ${diffDays}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
