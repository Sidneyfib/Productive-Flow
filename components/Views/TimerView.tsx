'use client';

import React, { useState, useEffect } from 'react';
import { useFlow } from '@/context/FlowContext';
import { useAuth } from '@/context/AuthContext';
import { SessionType } from '@/lib/types';
import { ambientNoise } from '@/lib/audio';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  ListTodo,
  FileText,
} from 'lucide-react';

export default function TimerView() {
  const { user } = useAuth();
  const {
    activeTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    skipTimer,
    setTimerType,
    tasks,
    projects,
    selectTaskForTimer,
  } = useFlow();

  const [soundType, setSoundType] = useState<'off' | 'rain' | 'pink' | 'white'>('off');
  const [soundVolume, setSoundVolume] = useState(0.15);
  const [focusNotes, setFocusNotes] = useState('');

  // Active task details
  const activeTask = tasks.find((t) => t.id === activeTimer.taskId);
  const activeProject = projects.find((p) => p.id === (activeTask?.projectId || activeTimer.projectId));

  // Sound manager listener
  useEffect(() => {
    if (soundType === 'off' || !activeTimer.isRunning) {
      ambientNoise.stop();
    } else {
      ambientNoise.start(soundType === 'rain' ? 'rain' : soundType === 'white' ? 'white' : 'pink', soundVolume);
    }
    return () => {
      ambientNoise.stop();
    };
  }, [soundType, activeTimer.isRunning, soundVolume]);

  const handleVolumeChange = (vol: number) => {
    setSoundVolume(vol);
    ambientNoise.setVolume(vol);
  };

  // Format timer
  const minutes = Math.floor(activeTimer.remainingSeconds / 60);
  const seconds = activeTimer.remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Progress percentage for SVG ring
  const progress =
    activeTimer.totalSeconds > 0
      ? (activeTimer.totalSeconds - activeTimer.remainingSeconds) / activeTimer.totalSeconds
      : 0;
  const strokeDashoffset = 754 - 754 * progress; // 2 * PI * 120 approx 754

  return (
    <div id="timer-view" className="max-w-4xl mx-auto space-y-5">
      {/* Immersive Timer Main Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col items-center justify-between min-h-[520px] relative overflow-hidden">
        {/* Ambient Top Line */}
        <div
          className={`absolute top-0 inset-x-0 h-1 transition-all duration-700 ${
            activeTimer.isRunning ? 'bg-rose-500 animate-pulse' : 'bg-slate-200'
          }`}
        />

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
          {[
            { type: 'focus', label: `Foco (${user?.focusDuration || 25}m)` },
            { type: 'short_break', label: `Pausa Curta (${user?.shortBreakDuration || 5}m)` },
            { type: 'long_break', label: `Pausa Longa (${user?.longBreakDuration || 15}m)` },
          ].map((mode) => (
            <button
              key={mode.type}
              id={`timer-mode-${mode.type}`}
              onClick={() => setTimerType(mode.type as SessionType)}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTimer.type === mode.type
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Big Circular Timer Display */}
        <div className="my-4 relative flex flex-col items-center justify-center">
          <div className="relative w-60 h-60 sm:w-72 sm:h-72 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 280 280">
              {/* Background Ring */}
              <circle
                cx="140"
                cy="140"
                r="120"
                className="stroke-slate-100"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Animated Foreground Ring */}
              <circle
                cx="140"
                cy="140"
                r="120"
                className={`transition-all duration-1000 ease-linear ${
                  activeTimer.type === 'focus' ? 'stroke-rose-500' : 'stroke-emerald-500'
                }`}
                strokeWidth="10"
                strokeDasharray="754"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Digits and Status */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-5xl sm:text-6xl font-black text-slate-900 tracking-tight tabular-nums">
                {formattedTime}
              </span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeTimer.isRunning ? 'bg-rose-500 animate-ping' : 'bg-slate-400'
                  }`}
                />
                <span>{activeTimer.isRunning ? 'Sessão em Andamento' : 'Pausado'}</span>
              </span>
            </div>
          </div>

          {/* Pomodoro Cycle Dots (4 dots) */}
          <div className="flex items-center gap-1.5 mt-3">
            {[1, 2, 3, 4].map((dot) => (
              <div
                key={dot}
                className={`w-2.5 h-2.5 rounded-full border transition-all ${
                  activeTimer.type === 'focus'
                    ? 'bg-rose-500 border-rose-500 shadow-xs'
                    : 'bg-slate-200 border-slate-300'
                }`}
                title={`Ciclo Pomodoro ${dot}`}
              />
            ))}
          </div>
        </div>

        {/* Task Attachment Dropdown */}
        <div className="w-full max-w-md bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <ListTodo className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate">
                {activeTask ? activeTask.title : 'Sem tarefa selecionada'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {activeProject ? activeProject.name : 'Vincule uma tarefa para computar pomodoros'}
              </p>
            </div>
          </div>

          <select
            id="timer-task-selector"
            value={activeTimer.taskId || ''}
            onChange={(e) => selectTaskForTimer(e.target.value || null)}
            className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-hidden"
          >
            <option value="">Selecionar Tarefa...</option>
            {tasks
              .filter((t) => t.status !== 'completed')
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
          </select>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            id="timer-reset-btn"
            onClick={resetTimer}
            title="Reiniciar Sessão"
            className="p-3 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="timer-main-toggle-btn"
            onClick={activeTimer.isRunning ? pauseTimer : startTimer}
            className={`py-3 px-7 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
              activeTimer.isRunning
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-rose-500 hover:bg-rose-600 text-white'
            }`}
          >
            {activeTimer.isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pausar Foco</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar Foco</span>
              </>
            )}
          </button>

          <button
            id="timer-skip-btn"
            onClick={skipTimer}
            title="Pular para próximo intervalo"
            className="p-3 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ambient Sound & Focus Notes Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ambient Sound Player */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-rose-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Sons de Foco</h3>
            </div>
            {soundType !== 'off' && activeTimer.isRunning && (
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Ativo
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { type: 'off', label: 'Desativado' },
              { type: 'rain', label: 'Chuva' },
              { type: 'pink', label: 'Rosa' },
              { type: 'white', label: 'Branco' },
            ].map((snd) => (
              <button
                key={snd.type}
                type="button"
                onClick={() => setSoundType(snd.type as any)}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold border transition-all ${
                  soundType === snd.type
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {snd.label}
              </button>
            ))}
          </div>

          {soundType !== 'off' && (
            <div className="flex items-center gap-2.5 pt-1">
              <span className="text-xs text-slate-500">Volume:</span>
              <input
                type="range"
                min="0.05"
                max="0.4"
                step="0.01"
                value={soundVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 accent-rose-500"
              />
              <span className="text-xs font-mono font-bold text-slate-800 tabular-nums">
                {Math.round(soundVolume * 250)}%
              </span>
            </div>
          )}
        </div>

        {/* Quick Scratchpad / Focus Notes */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Anotações Rápidas</h3>
          </div>
          <textarea
            rows={3}
            value={focusNotes}
            onChange={(e) => setFocusNotes(e.target.value)}
            placeholder="Anote pensamentos ou tarefas paralelas para não se distrair agora..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-slate-400 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
