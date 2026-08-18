'use client';

import React, { useState } from 'react';
import { useFlow } from '@/context/FlowContext';
import { Project, ProjectStatus } from '@/lib/types';
import {
  FolderKanban,
  Plus,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
} from 'lucide-react';

export default function ProjectsView() {
  const { projects, tasks, openNewProjectModal, openEditProjectModal, deleteProjectAction, openNewTaskModal, setCurrentTab } = useFlow();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'in_progress':
        return { label: 'Em andamento', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'delayed':
        return { label: 'Atrasado', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'planning':
        return { label: 'Planejamento', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'completed':
        return { label: 'Concluído', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: status, color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  return (
    <div id="projects-view" className="space-y-5 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Projetos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie suas iniciativas, metas e acompanhe a taxa de conclusão de cada entrega.
          </p>
        </div>

        <button
          id="projects-add-btn"
          onClick={() => openNewProjectModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {[
          { key: 'all', label: 'Todos os Projetos' },
          { key: 'in_progress', label: 'Em andamento' },
          { key: 'delayed', label: 'Atrasados' },
          { key: 'planning', label: 'Planejamento' },
          { key: 'completed', label: 'Concluídos' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterStatus === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
          <FolderKanban className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Nenhum projeto encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filterStatus === 'all'
              ? 'Você ainda não possui projetos criados. Crie seu primeiro projeto para organizar suas tarefas e focar melhor!'
              : 'Não há projetos com o status selecionado.'}
          </p>
          {filterStatus === 'all' && (
            <button
              onClick={() => openNewProjectModal()}
              className="mt-2 px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg"
            >
              + Criar Primeiro Projeto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const projTasks = tasks.filter((t) => t.projectId === project.id);
            const totalTasks = projTasks.length;
            const completedTasks = projTasks.filter((t) => t.status === 'completed').length;
            const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const statusBadge = getStatusBadge(project.status);

            return (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between relative group hover:border-slate-300 transition-all"
              >
                <div>
                  {/* Card Top: Color dot, Title & Status */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color || '#f43f5e' }}
                      />
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{project.name}</h3>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === project.id ? null : project.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === project.id && (
                        <div className="absolute right-0 top-7 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 text-xs">
                          <button
                            onClick={() => {
                              openEditProjectModal(project);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja realmente excluir o projeto "${project.name}"?`)) {
                                deleteProjectAction(project.id);
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

                  {/* Status Pill */}
                  <div className="mb-2.5">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.2 rounded border ${statusBadge.color}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3 min-h-[32px]">
                    {project.description || 'Sem descrição cadastrada.'}
                  </p>

                  {/* Progress Stats */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Progresso</span>
                      <span className="tabular-nums">{percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: project.color || '#f43f5e',
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>
                        {completedTasks}/{totalTasks} Tarefas
                      </span>
                      {project.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(project.deadline).toLocaleDateString('pt-BR')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openNewTaskModal(project.id)}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Tarefa</span>
                  </button>
                  <button
                    onClick={() => setCurrentTab('tasks')}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                    title="Ver tarefas deste projeto"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
