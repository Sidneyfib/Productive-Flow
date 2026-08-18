'use client';

import React, { useState } from 'react';
import { useFlow } from '@/context/FlowContext';
import { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { X, CheckSquare } from 'lucide-react';

interface TaskModalFormProps {
  editingTask: Task | null;
  onClose: () => void;
}

function TaskModalForm({ editingTask, onClose }: TaskModalFormProps) {
  const { addTask, updateTaskAction, projects, showToast } = useFlow();

  const [title, setTitle] = useState(editingTask?.title || '');
  const [description, setDescription] = useState(editingTask?.description || '');
  const [projectId, setProjectId] = useState<string>(
    editingTask?.projectId || (projects[0]?.id || '')
  );
  const [priority, setPriority] = useState<TaskPriority>(editingTask?.priority || 'medium');
  const [status, setStatus] = useState<TaskStatus>(editingTask?.status || 'todo');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState<number>(
    editingTask?.estimatedPomodoros || 2
  );
  const [dueDate, setDueDate] = useState<string>(() => {
    if (editingTask?.dueDate) return editingTask.dueDate.split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Por favor, informe o título da tarefa', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTask && editingTask.id) {
        await updateTaskAction(editingTask.id, {
          title: title.trim(),
          description: description.trim(),
          projectId: projectId || null,
          priority,
          status,
          estimatedPomodoros: Number(estimatedPomodoros) || 1,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        });
      } else {
        await addTask({
          title: title.trim(),
          description: description.trim(),
          projectId: projectId || null,
          priority,
          status,
          estimatedPomodoros: Number(estimatedPomodoros) || 1,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        });
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar tarefa', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {editingTask && editingTask.id ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h2>
            <p className="text-[11px] text-slate-500">Defina os detalhes e estime seus ciclos de foco</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Título da Tarefa <span className="text-rose-500">*</span>
          </label>
          <input
            id="task-title-input"
            type="text"
            required
            placeholder="Ex: Redesign da Landing Page"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-400 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição (Opcional)</label>
          <textarea
            id="task-description-input"
            rows={2}
            placeholder="Anotações sobre a entrega, critérios de aceitação..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-400 transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Projeto Associado</label>
            <select
              id="task-project-select"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-400"
            >
              <option value="">Sem Projeto (Geral)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Entrega</label>
            <input
              id="task-due-date-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Priority Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridade</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { key: 'high', label: 'Alta', color: 'border-rose-300 text-rose-700 bg-rose-50' },
                { key: 'medium', label: 'Média', color: 'border-amber-300 text-amber-700 bg-amber-50' },
                { key: 'low', label: 'Baixa', color: 'border-emerald-300 text-emerald-700 bg-emerald-50' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPriority(item.key as TaskPriority)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                    priority === item.key
                      ? `${item.color} ring-1 ring-slate-800`
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Pomodoros Counter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estimativa (Ciclos Pomodoro)
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEstimatedPomodoros(Math.max(1, estimatedPomodoros - 1))}
                className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                -
              </button>
              <div className="flex-1 text-center font-bold text-xs text-slate-900 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                {estimatedPomodoros} 🍅
              </div>
              <button
                type="button"
                onClick={() => setEstimatedPomodoros(Math.min(12, estimatedPomodoros + 1))}
                className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {editingTask && editingTask.id && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
            >
              <option value="todo">Pendente (A Fazer)</option>
              <option value="in_progress">Em Progresso</option>
              <option value="completed">Concluída</option>
            </select>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            id="save-task-modal-btn"
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : editingTask && editingTask.id ? 'Salvar Alterações' : 'Criar Tarefa'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TaskModal() {
  const { isTaskModalOpen, setIsTaskModalOpen, editingTask } = useFlow();

  if (!isTaskModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <TaskModalForm
        key={editingTask?.id || 'new-task'}
        editingTask={editingTask}
        onClose={() => setIsTaskModalOpen(false)}
      />
    </div>
  );
}
