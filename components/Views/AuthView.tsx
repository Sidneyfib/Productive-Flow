'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Timer, ArrowRight, Lock, Mail, User as UserIcon } from 'lucide-react';

export default function AuthView() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register(name, email, password, lastName);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro. Verifique seus dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden p-6 sm:p-8 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-rose-500 flex items-center justify-center text-white shadow-xs">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 flex items-center gap-1.5 leading-none">
                Flow
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
              </span>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Deep Work Mode</p>
            </div>
          </div>

          {/* Header Title */}
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isRegister ? 'Crie sua conta' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isRegister
                ? 'Organize projetos, tarefas e domine seu tempo com foco profundo.'
                : 'Entre para acessar seus projetos, tarefas e métricas de foco.'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="register-name-input"
                      type="text"
                      required
                      placeholder="Lucas"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sobrenome</label>
                  <input
                    id="register-lastname-input"
                    type="text"
                    placeholder="Mendes"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Senha</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-400"
                />
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Carregando...' : isRegister ? 'Criar Conta' : 'Entrar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Toggle between Login and Register */}
        <div className="pt-5 mt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          {isRegister ? (
            <p>
              Já possui uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMsg('');
                }}
                className="font-bold text-rose-500 hover:underline ml-1"
              >
                Fazer Login
              </button>
            </p>
          ) : (
            <p>
              Não tem uma conta ainda?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMsg('');
                }}
                className="font-bold text-rose-500 hover:underline ml-1"
              >
                Cadastre-se gratuitamente
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
