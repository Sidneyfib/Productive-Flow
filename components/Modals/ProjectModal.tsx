'use client';

import React, { useState } from 'react';
import { useFlow } from '@/context/FlowContext';
import { Project, ProjectStatus } from '@/lib/types';
import { X, FolderKanban, Palette } from 'lucide-react';

const COLOR_PALETTE = [
  '#0f172a', // Slate-900
  '#f43f5e', // Rose-500
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#64748b', // Slate-500
];

interface ProjectModalFormProps {
  editingProject: Project | null;
  onClose: () => void;
}

function ProjectModalForm({ editingProject, onClose }: ProjectModalFormProps) {
  const { addProject, updateProjectAction, showToast } = useFlow();

  const [name, setName] = useState(editingProject?.name || '');
  const [description, setDescription] = useState(editingProject?.description || '');
  const [color, setColor] = useState(editingProject?.color || '#f43f5e');
  const [status, setStatus] = useState<ProjectStatus>(editingProject?.status || 'in_progress');
  const [deadline, setDeadline] = useState<string>(() => {
    if (editingProject?.deadline) return editingProject.deadline.split('T')[0];
    const future = new Date();
    future.setDate(future.getDate() + 30);
    return future.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Por favor, informe o nome do projeto', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProject && editingProject.id) {
        await updateProjectAction(editingProject.id, {
          name: name.trim(),
          description: description.trim(),
          color,
          status,
          deadline: deadline || undefined,
        });
      } else {
        await addProject({
          name: name.trim(),
          description: description.trim(),
          color,
          status,
          deadline: deadline || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar projeto', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-slate-900 text-white">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {editingProject && editingProject.id ? 'Editar Projeto' : 'Novo Projeto'}
            </h2>
            <p className="text-[11px] text-slate-500">Agrupe tarefas e controle o progresso por iniciativa</p>
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
            Nome do Projeto <span className="text-rose-500">*</span>
          </label>
          <input
            id="project-name-input"
            type="text"
            required
            placeholder="Ex: Redesign Website"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-400 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
          <textarea
            id="project-description-input"
            rows={2}
            placeholder="Objetivos e escopo deste projeto..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-400 transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status Inicial</label>
            <select
              id="project-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-400"
            >
              <option value="in_progress">Em andamento</option>
              <option value="planning">Planejamento</option>
              <option value="delayed">Atrasado</option>
              <option value="completed">Concluído</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Data Limite (Deadline)</label>
            <input
              id="project-deadline-input"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-400"
            />
          </div>
        </div>

        {/* Color Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-slate-500" />
            <span>Cor do Projeto</span>
          </label>
          <div className="flex items-center gap-2">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-800 shadow-xs' : 'hover:scale-110 opacity-80'
                }`}
              />
            ))}
          </div>
        </div>

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
            id="save-project-modal-btn"
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : editingProject && editingProject.id ? 'Salvar Alterações' : 'Criar Projeto'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProjectModal() {
  const { isProjectModalOpen, setIsProjectModalOpen, editingProject } = useFlow();

  if (!isProjectModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <ProjectModalForm
        key={editingProject?.id || 'new-project'}
        editingProject={editingProject}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </div>
  );
}
