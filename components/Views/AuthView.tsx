'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Timer, ArrowRight, Lock, Mail, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthView() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const errors: { name?: string; email?: string; password?: string } = {};

    if (isRegister && !name.trim()) {
      errors.name = 'Por favor, informe seu nome.';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = 'O campo de e-mail é obrigatório.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Digite um e-mail válido (ex: seu.nome@email.com).';
    }

    if (!password) {
      errors.password = 'A senha é obrigatória.';
    } else if (password.length < 6) {
      errors.password = 'A senha deve ter pelo menos 6 caracteres.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register(name.trim(), email.trim(), password, lastName.trim());
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Não foi possível completar a operação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: 'name' | 'email' | 'password' | 'lastName', value: string) => {
    if (errorMsg) setErrorMsg('');
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    if (field === 'name') setName(value);
    else if (field === 'lastName') setLastName(value);
    else if (field === 'email') setEmail(value);
    else if (field === 'password') setPassword(value);
  };

  const switchMode = (registerMode: boolean) => {
    setIsRegister(registerMode);
    setErrorMsg('');
    setFieldErrors({});
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

          {/* General Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 animate-in fade-in flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-900">
                  {isRegister ? 'Falha ao criar conta' : 'Não foi possível entrar'}
                </p>
                <p className="leading-relaxed text-rose-700">{errorMsg}</p>
                {!isRegister && errorMsg.includes('Nenhuma conta encontrada') && (
                  <button
                    type="button"
                    onClick={() => switchMode(true)}
                    className="mt-1 font-bold text-rose-600 hover:text-rose-700 underline text-[11px] block"
                  >
                    Deseja cadastrar uma nova conta com este e-mail?
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {isRegister && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className={`w-4 h-4 absolute left-3 top-2.5 ${fieldErrors.name ? 'text-rose-400' : 'text-slate-400'}`} />
                    <input
                      id="register-name-input"
                      type="text"
                      placeholder="Lucas"
                      value={name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-xs text-slate-900 focus:outline-hidden transition-colors ${
                        fieldErrors.name
                          ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                          : 'border-slate-200 focus:border-slate-400'
                      }`}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sobrenome</label>
                  <input
                    id="register-lastname-input"
                    type="text"
                    placeholder="Mendes"
                    value={lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-slate-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3 top-2.5 ${fieldErrors.email ? 'text-rose-400' : 'text-slate-400'}`} />
                <input
                  id="auth-email-input"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-xs text-slate-900 focus:outline-hidden transition-colors ${
                    fieldErrors.email
                      ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:border-slate-400'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Senha <span className="text-rose-500">*</span>
                </label>
              </div>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3 top-2.5 ${fieldErrors.password ? 'text-rose-400' : 'text-slate-400'}`} />
                <input
                  id="auth-password-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-xs text-slate-900 focus:outline-hidden transition-colors ${
                    fieldErrors.password
                      ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:border-slate-400'
                  }`}
                />
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.password}</p>
              )}
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
                onClick={() => switchMode(false)}
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
                onClick={() => switchMode(true)}
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
