'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFlow } from '@/context/FlowContext';
import { UserWithPreferences } from '@/lib/types';
import {
  User as UserIcon,
  Timer,
  LogOut,
  Sparkles,
  Save,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

interface ProfileFormProps {
  user: UserWithPreferences;
}

function ProfileContent({ user }: ProfileFormProps) {
  const { updateProfile, logout } = useAuth();
  const { stats, showToast } = useFlow();

  const [name, setName] = useState(user.name || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [avatar, setAvatar] = useState(user.avatar || AVATAR_OPTIONS[0]);
  const [focusDuration, setFocusDuration] = useState(user.focusDuration || 25);
  const [shortBreakDuration, setShortBreakDuration] = useState(user.shortBreakDuration || 5);
  const [longBreakDuration, setLongBreakDuration] = useState(user.longBreakDuration || 15);
  const [autoStartBreaks, setAutoStartBreaks] = useState(user.autoStartBreaks ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured?: boolean;
    connected?: boolean;
    message?: string;
    metrics?: any;
    error?: string;
  } | null>(null);
  const [checkingSupabase, setCheckingSupabase] = useState(false);

  const checkSupabase = React.useCallback(async () => {
    setCheckingSupabase(true);
    try {
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      setSupabaseStatus(data);
    } catch {
      setSupabaseStatus({ configured: false, message: 'Falha ao consultar status do Supabase' });
    } finally {
      setCheckingSupabase(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    fetch('/api/supabase/status')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setSupabaseStatus(data);
      })
      .catch(() => {
        if (isMounted) {
          setSupabaseStatus({ configured: false, message: 'Falha ao consultar status do Supabase' });
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        lastName: lastName.trim(),
        avatar,
        focusDuration: Number(focusDuration),
        shortBreakDuration: Number(shortBreakDuration),
        longBreakDuration: Number(longBreakDuration),
        autoStartBreaks,
      });
      showToast('Perfil e preferências atualizados com sucesso!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar alterações', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="profile-view" className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Meu Perfil</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie suas informações pessoais e personalize a duração dos seus ciclos Pomodoro.
          </p>
        </div>

        <button
          id="profile-logout-btn"
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold rounded-lg transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Encerrar Sessão</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: User Identity Card (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center text-center space-y-3.5">
          <div className="relative">
            <img
              src={avatar || AVATAR_OPTIONS[0]}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-xs"
            />
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white text-[10px] shadow-xs">
              <Sparkles className="w-3 h-3" />
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              {user.name} {user.lastName || ''}
            </h3>
            <p className="text-xs text-slate-500">{user.email}</p>
            <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              Flow Pro Member
            </span>
          </div>

          <div className="w-full pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Sessões</p>
              <p className="text-sm font-black text-slate-900 tabular-nums">
                {stats?.totalPomodorosCompleted || 0}
              </p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Foco Total</p>
              <p className="text-sm font-black text-slate-900 tabular-nums">
                {stats?.deepWorkHours || 0}h
              </p>
            </div>
          </div>

          {/* Quick Avatar Picker */}
          <div className="w-full pt-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Escolher Avatar
            </p>
            <div className="flex items-center justify-center gap-2">
              {AVATAR_OPTIONS.map((imgUrl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAvatar(imgUrl)}
                  className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                    avatar === imgUrl ? 'border-rose-500 scale-105 shadow-xs' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="Avatar option" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Form Settings (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <form onSubmit={handleSave} className="space-y-5">
            {/* Section 1: Basic Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <UserIcon className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Informações Básicas</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome</label>
                  <input
                    id="profile-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sobrenome</label>
                  <input
                    id="profile-lastname-input"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail (Imutável)</label>
                <input
                  type="email"
                  disabled
                  value={user.email || ''}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Section 2: Pomodoro Preferences */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Timer className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Preferências do Pomodoro</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tempo de Foco (min)
                  </label>
                  <input
                    id="pref-focus-duration"
                    type="number"
                    min="5"
                    max="90"
                    value={focusDuration}
                    onChange={(e) => setFocusDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pausa Curta (min)
                  </label>
                  <input
                    id="pref-short-break"
                    type="number"
                    min="1"
                    max="30"
                    value={shortBreakDuration}
                    onChange={(e) => setShortBreakDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pausa Longa (min)
                  </label>
                  <input
                    id="pref-long-break"
                    type="number"
                    min="5"
                    max="60"
                    value={longBreakDuration}
                    onChange={(e) => setLongBreakDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:border-slate-400"
                  />
                </div>
              </div>

              {/* Auto Start Breaks Switch */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-900">Auto-iniciar Pausas</p>
                  <p className="text-[11px] text-slate-500">
                    Iniciar automaticamente a contagem regressiva da pausa após o término do foco.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoStartBreaks(!autoStartBreaks)}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                    autoStartBreaks ? 'bg-rose-500 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>

            {/* Section 3: Supabase Integration Status */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-rose-500" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Integração Supabase (PostgreSQL)</h3>
                </div>
                <button
                  type="button"
                  onClick={checkSupabase}
                  disabled={checkingSupabase}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${checkingSupabase ? 'animate-spin text-rose-500' : ''}`} />
                  <span>{checkingSupabase ? 'Verificando...' : 'Verificar Status'}</span>
                </button>
              </div>

              <div className={`p-3.5 rounded-lg border text-xs ${
                supabaseStatus?.connected
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : supabaseStatus?.configured
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-start gap-2.5">
                  {supabaseStatus?.connected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${supabaseStatus?.configured ? 'text-amber-600' : 'text-slate-400'}`} />
                  )}
                  <div className="space-y-1 flex-1">
                    <p className="font-bold">
                      {supabaseStatus?.connected
                        ? 'Supabase Conectado e Operacional'
                        : supabaseStatus?.configured
                        ? 'Configurado, aguardando execução das migrações'
                        : 'Persistência Local Ativa (Supabase não configurado)'}
                    </p>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      {supabaseStatus?.message || 'Verificando conexão...'}
                    </p>
                    {supabaseStatus?.metrics && (
                      <div className="flex flex-wrap gap-3 pt-1.5 text-[11px] font-semibold text-emerald-800">
                        <span>Usuários: {supabaseStatus.metrics.totalUsers}</span>
                        <span>•</span>
                        <span>Projetos: {supabaseStatus.metrics.totalProjects}</span>
                        <span>•</span>
                        <span>Tarefas: {supabaseStatus.metrics.totalTasks}</span>
                        <span>•</span>
                        <span>Sessões: {supabaseStatus.metrics.totalSessions}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                id="profile-save-btn"
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProfileView() {
  const { user } = useAuth();

  if (!user) return null;

  return <ProfileContent key={user.id} user={user} />;
}
