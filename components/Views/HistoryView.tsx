'use client';

import React, { useState } from 'react';
import { useFlow } from '@/context/FlowContext';
import {
  History,
  Timer,
  CheckCircle2,
  Flame,
  Clock,
  Calendar,
  Coffee,
  ArrowUpRight,
} from 'lucide-react';

export default function HistoryView() {
  const { sessions, stats } = useFlow();
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const filteredSessions = sessions.filter((s) => {
    if (timeFilter === 'all') return true;
    const sessionDate = new Date(s.createdAt);
    const now = new Date();

    if (timeFilter === 'today') {
      return sessionDate.toDateString() === now.toDateString();
    }
    if (timeFilter === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
      return sessionDate >= oneWeekAgo;
    }
    if (timeFilter === 'month') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 86400000);
      return sessionDate >= oneMonthAgo;
    }
    return true;
  });

  const totalFilteredMinutes = filteredSessions.reduce((acc, s) => acc + (s.durationMinutes || 25), 0);
  const totalFilteredHours = Number((totalFilteredMinutes / 60).toFixed(1));

  return (
    <div id="history-view" className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Histórico de Foco</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Resumo detalhado de cada sessão Pomodoro concluída, reflexões e tarefas associadas.
        </p>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tempo Total de Foco</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">
              {stats?.deepWorkHours || 0}h
            </span>
            <span className="text-xs text-slate-500">acumuladas</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full"
              style={{ width: `${Math.min(100, ((stats?.deepWorkHours || 0) / 40) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pomodoros Concluídos</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">
              {stats?.totalPomodorosCompleted || 0}
            </span>
            <span className="text-xs text-emerald-700 font-semibold flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              100% verificado
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {stats?.todayFocusTimeMinutes || 0} minutos focados hoje
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sequência Ativa</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-500 tabular-nums">
              {stats?.streakDays || 0} {stats?.streakDays === 1 ? 'Dia' : 'Dias'}
            </span>
            <span className="text-xs text-slate-500">consecutivos</span>
          </div>
          <p className="text-[11px] text-slate-500">Constância diária preservada</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'Todo o Período' },
            { key: 'today', label: 'Hoje' },
            { key: 'week', label: 'Esta Semana' },
            { key: 'month', label: 'Este Mês' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTimeFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeFilter === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-semibold text-slate-500 hidden sm:block">
          {filteredSessions.length} {filteredSessions.length === 1 ? 'sessão' : 'sessões'} ({totalFilteredHours}h)
        </span>
      </div>

      {/* Sessions Timeline List */}
      {filteredSessions.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
          <History className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Nenhum registro no período</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Complete seus ciclos de foco no Timer para que eles apareçam registrados aqui no seu histórico.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSessions.map((session) => {
            const isFocus = session.type === 'focus';
            const dateObj = new Date(session.createdAt);
            const formattedDate = dateObj.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={session.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isFocus ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}
                  >
                    {isFocus ? <Timer className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        {session.taskTitle || (isFocus ? 'Ciclo de Foco Livre' : 'Intervalo de Descanso')}
                      </h4>
                      {session.projectName && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {session.projectName}
                        </span>
                      )}
                    </div>

                    {session.notes && (
                      <p className="text-[11px] text-slate-500 mt-0.5 italic">
                        &ldquo;{session.notes}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedDate}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2.5 self-end sm:self-center">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-50 text-slate-800 border border-slate-200 tabular-nums">
                    {session.durationMinutes} min
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Concluído
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
