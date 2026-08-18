'use client';

import React, { useState } from 'react';
import { useFlow } from '@/context/FlowContext';
import { Trophy, Coffee, Play, X, Sparkles, CheckCircle2 } from 'lucide-react';

export default function CelebrationModal() {
  const { isCelebrationModalOpen, setIsCelebrationModalOpen, startTimer, setTimerType, logCompletedSession } = useFlow();
  const [notes, setNotes] = useState('');

  if (!isCelebrationModalOpen) return null;

  const handleStartBreak = () => {
    if (notes.trim()) {
      logCompletedSession(notes.trim());
    }
    setTimerType('short_break');
    startTimer();
    setIsCelebrationModalOpen(false);
    setNotes('');
  };

  const handleContinueFocus = () => {
    if (notes.trim()) {
      logCompletedSession(notes.trim());
    }
    setTimerType('focus');
    startTimer();
    setIsCelebrationModalOpen(false);
    setNotes('');
  };

  const handleClose = () => {
    if (notes.trim()) {
      logCompletedSession(notes.trim());
    }
    setIsCelebrationModalOpen(false);
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200 overflow-hidden text-center p-6 space-y-4">
        {/* Celebration Icon */}
        <div className="relative mx-auto w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
          <Trophy className="w-8 h-8 animate-bounce" />
          <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-amber-500" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Ciclo de Foco Concluído! 🎉
          </h2>
          <p className="text-xs text-slate-500">
            Excelente progresso! Você acabou de concluir mais 25 minutos de trabalho focado.
          </p>
        </div>

        {/* Reflection / Session notes input */}
        <div className="text-left bg-slate-50 p-3 rounded-lg border border-slate-200">
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
            <span>O que você produziu nesta sessão?</span>
          </label>
          <textarea
            id="celebration-notes-input"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Concluí o fluxo de login e organizei as tarefas prioritárias..."
            className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs text-slate-900 focus:outline-hidden focus:border-slate-400 resize-none"
          />
        </div>

        {/* Action Options */}
        <div className="space-y-2 pt-1">
          <button
            id="celebration-start-break-btn"
            onClick={handleStartBreak}
            className="w-full py-2.5 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Coffee className="w-4 h-4" />
            <span>Fazer Pausa Curta (5 min)</span>
          </button>

          <button
            id="celebration-continue-focus-btn"
            onClick={handleContinueFocus}
            className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Iniciar Próximo Ciclo de Foco (25 min)</span>
          </button>

          <button
            onClick={handleClose}
            className="w-full py-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            Fechar e Descansar
          </button>
        </div>
      </div>
    </div>
  );
}
