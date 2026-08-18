'use client';

import React from 'react';
import { useFlow } from '@/context/FlowContext';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  PieChart,
} from 'lucide-react';

export default function StatsView() {
  const { stats, projects, sessions } = useFlow();

  const totalPomodoros = stats?.totalPomodorosCompleted || 0;
  const deepWorkHours = stats?.deepWorkHours || 0;
  const completionRate = stats?.completionRate || 100;
  const dailyAverage = stats?.dailyAveragePomodoros || 0;

  return (
    <div id="stats-view" className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Estatísticas</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Métricas consolidadas de produtividade, distribuição de tempo por projeto e consistência.
        </p>
      </div>

      {/* 3 Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Média / Dia</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{dailyAverage}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              +12% ritmo
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Pomodoros por dia ativo</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Foco Profundo</span>
            <div className="p-1.5 rounded-lg bg-slate-900 text-white">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{deepWorkHours}h</span>
            <span className="text-xs text-slate-500">tempo total</span>
          </div>
          <p className="text-[11px] text-slate-500">{(deepWorkHours * 60).toFixed(0)} minutos acumulados</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Taxa Conclusão</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{completionRate}%</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              Alta Eficiência
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Tarefas entregues com sucesso</p>
        </div>
      </div>

      {/* Main Charts: Weekly Productivity & Project Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Weekly Productivity Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-sm text-slate-900">Foco Semanal Detalhado</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">Seg - Dom</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Constância de ciclos Pomodoro finalizados a cada dia desta semana.
            </p>

            {/* Interactive Column Bars */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-end justify-between h-36 pt-3 gap-2">
                {stats?.weeklyProgress.map((day, idx) => {
                  const maxDailyGoal = 8;
                  const heightPercent = Math.min(100, Math.round((day.pomodoros / maxDailyGoal) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.pomodoros}🍅
                      </span>
                      <div className="w-full bg-slate-200/80 rounded-md h-24 flex items-end overflow-hidden p-0.5">
                        <div
                          style={{ height: `${Math.max(10, heightPercent)}%` }}
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

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-4">
            <span>Meta recomendada: 6 a 8 pomodoros por dia útil</span>
            <span className="font-bold text-slate-900">{totalPomodoros} no total</span>
          </div>
        </div>

        {/* Project Time Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4 text-slate-800" />
              <h3 className="font-bold text-sm text-slate-900">Distribuição por Projeto</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Porcentagem de tempo de foco alocado em cada projeto.
            </p>

            {/* Visual Multi-Segment Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex mb-4">
              {stats?.projectDistribution.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color || '#f43f5e',
                  }}
                  className="h-full transition-all hover:opacity-80"
                  title={`${item.projectName}: ${item.percentage}%`}
                />
              ))}
            </div>

            {/* Breakdown List */}
            <div className="space-y-2">
              {stats?.projectDistribution.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Nenhum dado de projeto registrado ainda.</p>
              ) : (
                stats?.projectDistribution.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color || '#f43f5e' }}
                      />
                      <span className="font-bold text-slate-900 truncate">{item.projectName}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-500 font-medium">{item.hours}h</span>
                      <span className="font-bold text-slate-800 px-1.5 py-0.2 rounded bg-slate-200/80">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center mt-3">
            Sincronizado no banco persistente
          </div>
        </div>
      </div>
    </div>
  );
}
