'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Timer,
  ArrowRight,
  Zap,
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  RefreshCw,
  Check,
} from 'lucide-react';

interface AuthFeedback {
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  code?: string;
  field?: 'name' | 'lastName' | 'email' | 'password' | 'confirmPassword' | 'general';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function AuthView() {
  const { login, register, loginAsDemo } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Feedback and loading states
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Password strength calculation for registration
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score === 1) return { score: 1, label: 'Fraca', color: 'bg-rose-500', text: 'text-rose-600' };
    if (score === 2) return { score: 2, label: 'Média', color: 'bg-amber-500', text: 'text-amber-600' };
    return { score: 3, label: 'Forte', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const passwordStrength = getPasswordStrength(password);

  // Helper to parse backend and client errors into rich user feedback
  const parseAuthError = (err: any, mode: 'login' | 'register' | 'demo'): AuthFeedback => {
    const rawMsg: string = err?.message || String(err || '');
    const code: string = err?.code || '';
    const field: any = err?.field;

    // 1. Invalid credentials
    if (
      code === 'INVALID_CREDENTIALS' ||
      rawMsg.toLowerCase().includes('credenciais') ||
      rawMsg.toLowerCase().includes('incorret') ||
      rawMsg.toLowerCase().includes('inválid')
    ) {
      return {
        type: 'error',
        title: 'Credenciais Incorretas',
        message: 'O e-mail ou a senha digitados não estão corretos. Verifique se o teclado está com Caps Lock ativado.',
        code: 'INVALID_CREDENTIALS',
        field: 'password',
        action: {
          label: 'Preencher com Conta Demo',
          onClick: () => {
            setEmail('lucas.mendes@example.com');
            setPassword('flow123');
            setFeedback(null);
          },
        },
      };
    }

    // 2. Email already registered
    if (
      code === 'EMAIL_ALREADY_EXISTS' ||
      rawMsg.toLowerCase().includes('já está cadastrado') ||
      rawMsg.toLowerCase().includes('already exists') ||
      rawMsg.toLowerCase().includes('já existe')
    ) {
      return {
        type: 'warning',
        title: 'E-mail Já Cadastrado',
        message: `O e-mail "${email}" já possui uma conta no Flow. Você pode fazer o login diretamente.`,
        code: 'EMAIL_ALREADY_EXISTS',
        field: 'email',
        action: {
          label: 'Fazer Login com este E-mail',
          onClick: () => {
            setIsRegister(false);
            setPassword('');
            setConfirmPassword('');
            setFeedback({
              type: 'info',
              title: 'Pronto para Entrar',
              message: `Digite a senha cadastrada para o e-mail ${email}.`,
              field: 'password',
            });
          },
        },
      };
    }

    // 3. Weak password
    if (
      code === 'WEAK_PASSWORD' ||
      rawMsg.toLowerCase().includes('mínimo 6 caracteres') ||
      rawMsg.toLowerCase().includes('senha deve')
    ) {
      return {
        type: 'error',
        title: 'Senha Muito Curta',
        message: 'A sua senha precisa ter pelo menos 6 caracteres para garantir a segurança da conta.',
        code: 'WEAK_PASSWORD',
        field: 'password',
      };
    }

    // 4. Invalid email format
    if (
      code === 'INVALID_EMAIL' ||
      rawMsg.toLowerCase().includes('e-mail válido') ||
      rawMsg.toLowerCase().includes('invalid email')
    ) {
      return {
        type: 'error',
        title: 'Formato de E-mail Inválido',
        message: 'Por favor, informe um endereço de e-mail válido (ex: seu.nome@exemplo.com).',
        code: 'INVALID_EMAIL',
        field: 'email',
      };
    }

    // 5. Missing fields
    if (code.startsWith('MISSING_') || rawMsg.toLowerCase().includes('obrigatório')) {
      return {
        type: 'error',
        title: 'Campos Obrigatórios',
        message: rawMsg || 'Por favor, preencha todos os campos obrigatórios para continuar.',
        code: 'MISSING_FIELDS',
        field: field || 'general',
      };
    }

    // 6. Network or server error
    if (
      code === 'SERVER_ERROR' ||
      rawMsg.toLowerCase().includes('failed to fetch') ||
      rawMsg.toLowerCase().includes('network') ||
      rawMsg.toLowerCase().includes('conexão') ||
      rawMsg.toLowerCase().includes('servidor')
    ) {
      return {
        type: 'error',
        title: 'Falha de Conexão',
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou tente novamente.',
        code: 'SERVER_ERROR',
        action: {
          label: 'Tentar Novamente',
          onClick: () => {
            if (mode === 'demo') handleDemoLogin();
          },
        },
      };
    }

    // Fallback error
    return {
      type: 'error',
      title: 'Não foi possível concluir a ação',
      message: rawMsg || 'Ocorreu um erro inesperado. Por favor, verifique os dados informados e tente novamente.',
      code: 'UNKNOWN_ERROR',
    };
  };

  // Client-side validation prior to request
  const validateForm = (): AuthFeedback | null => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (isRegister) {
      if (!name.trim()) {
        return {
          type: 'error',
          title: 'Nome Obrigatório',
          message: 'Por favor, insira o seu primeiro nome.',
          field: 'name',
        };
      }
      if (name.trim().length < 2) {
        return {
          type: 'error',
          title: 'Nome Inválido',
          message: 'O nome deve ter pelo menos 2 caracteres.',
          field: 'name',
        };
      }
    }

    if (!trimmedEmail) {
      return {
        type: 'error',
        title: 'E-mail Obrigatório',
        message: 'Por favor, informe seu endereço de e-mail.',
        field: 'email',
      };
    }

    if (!emailRegex.test(trimmedEmail)) {
      return {
        type: 'error',
        title: 'Formato de E-mail Inválido',
        message: 'Insira um e-mail com formato válido, como exemplo@dominio.com.',
        field: 'email',
      };
    }

    if (!password) {
      return {
        type: 'error',
        title: 'Senha Obrigatória',
        message: 'Por favor, digite sua senha de acesso.',
        field: 'password',
      };
    }

    if (isRegister) {
      if (password.length < 6) {
        return {
          type: 'error',
          title: 'Senha Curta Demais',
          message: 'A senha precisa ter no mínimo 6 caracteres.',
          field: 'password',
        };
      }
      if (confirmPassword && password !== confirmPassword) {
        return {
          type: 'error',
          title: 'Senhas Diferentes',
          message: 'A confirmação de senha não confere com a senha digitada acima.',
          field: 'confirmPassword',
        };
      }
      if (!confirmPassword) {
        return {
          type: 'error',
          title: 'Confirmação de Senha Obrigatória',
          message: 'Por favor, digite a senha novamente para confirmar.',
          field: 'confirmPassword',
        };
      }
    }

    return null;
  };

  const handleInputChange = (field: 'name' | 'lastName' | 'email' | 'password' | 'confirmPassword', value: string) => {
    // Clear feedback if current field caused it
    if (feedback && feedback.field === field) {
      setFeedback(null);
    }

    if (field === 'name') setName(value);
    if (field === 'lastName') setLastName(value);
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'confirmPassword') setConfirmPassword(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Run client-side pre-validation
    const validationError = validateForm();
    if (validationError) {
      setFeedback(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register(name.trim(), email.trim().toLowerCase(), password, lastName.trim());
        setFeedback({
          type: 'success',
          title: 'Conta Criada com Sucesso!',
          message: 'Bem-vindo ao Flow! Preparando seu ambiente de foco...',
        });
      } else {
        await login(email.trim().toLowerCase(), password);
        setFeedback({
          type: 'success',
          title: 'Autenticado com Sucesso!',
          message: 'Carregando seus projetos e métricas de foco...',
        });
      }
    } catch (err: any) {
      const parsed = parseAuthError(err, isRegister ? 'register' : 'login');
      setFeedback(parsed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setFeedback(null);
    setIsSubmitting(true);
    try {
      await loginAsDemo();
      setFeedback({
        type: 'success',
        title: 'Bem-vindo, Lucas Mendes!',
        message: 'Acessando como usuário de demonstração...',
      });
    } catch (err: any) {
      const parsed = parseAuthError(err, 'demo');
      setFeedback(parsed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = (newMode: boolean) => {
    setIsRegister(newMode);
    setFeedback(null);
    setPassword('');
    setConfirmPassword('');
  };

  // Helper styles for inputs with error states
  const getInputClasses = (fieldKey: 'name' | 'lastName' | 'email' | 'password' | 'confirmPassword', hasLeftIcon = true) => {
    const hasError = feedback?.field === fieldKey;
    const baseClasses = `w-full ${hasLeftIcon ? 'pl-9' : 'px-3'} py-2.5 bg-slate-50 border rounded-lg text-xs text-slate-900 transition-colors focus:outline-hidden`;
    
    if (hasError) {
      return `${baseClasses} border-rose-400 bg-rose-50/20 text-rose-950 focus:border-rose-500 focus:ring-1 focus:ring-rose-400`;
    }
    return `${baseClasses} border-slate-200 focus:border-slate-400 focus:bg-white`;
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-4 sm:p-6">
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

          {/* Enhanced Feedback Message Banner */}
          {feedback && (
            <div
              id="auth-feedback-alert"
              role="alert"
              aria-live="polite"
              className={`mb-5 p-3.5 rounded-lg border text-xs animate-in fade-in slide-in-from-top-1 transition-all ${
                feedback.type === 'error'
                  ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                  : feedback.type === 'warning'
                  ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                  : feedback.type === 'success'
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                  : 'bg-sky-50/90 border-sky-200 text-sky-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 mt-0.5">
                  {feedback.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
                  {feedback.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {feedback.type === 'info' && <Info className="w-4 h-4 text-sky-600" />}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs leading-tight mb-0.5">{feedback.title}</h4>
                  <p className="text-[11px] leading-relaxed opacity-90">{feedback.message}</p>

                  {feedback.action && (
                    <div className="mt-2 pt-1.5 border-t border-current/10">
                      <button
                        id="auth-feedback-action-btn"
                        type="button"
                        onClick={feedback.action.onClick}
                        className="inline-flex items-center gap-1.5 font-bold text-[11px] underline hover:no-underline cursor-pointer transition-opacity hover:opacity-80"
                      >
                        <span>{feedback.action.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  id="auth-feedback-close-btn"
                  type="button"
                  onClick={() => setFeedback(null)}
                  aria-label="Fechar mensagem de alerta"
                  className="flex-shrink-0 p-1 rounded-md text-current opacity-60 hover:opacity-100 hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {isRegister && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="register-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon
                      className={`w-4 h-4 absolute left-3 top-3 transition-colors ${
                        feedback?.field === 'name' ? 'text-rose-500' : 'text-slate-400'
                      }`}
                    />
                    <input
                      id="register-name-input"
                      type="text"
                      required
                      placeholder="Lucas"
                      value={name}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={getInputClasses('name', true)}
                    />
                  </div>
                  {feedback?.field === 'name' && (
                    <span className="block mt-1 text-[11px] text-rose-600 font-medium">Informe seu nome</span>
                  )}
                </div>

                <div>
                  <label htmlFor="register-lastname-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Sobrenome <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    id="register-lastname-input"
                    type="text"
                    placeholder="Mendes"
                    value={lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={getInputClasses('lastName', false)}
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="auth-email-input" className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail
                  className={`w-4 h-4 absolute left-3 top-3 transition-colors ${
                    feedback?.field === 'email' ? 'text-rose-500' : 'text-slate-400'
                  }`}
                />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={getInputClasses('email', true)}
                />
              </div>
              {feedback?.field === 'email' && (
                <span className="block mt-1 text-[11px] text-rose-600 font-medium">Verifique o endereço de e-mail</span>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="auth-password-input" className="block text-xs font-semibold text-slate-700">
                  Senha <span className="text-rose-500">*</span>
                </label>
                {!isRegister && (
                  <button
                    id="auth-forgot-password-tip-btn"
                    type="button"
                    onClick={() => {
                      setFeedback({
                        type: 'info',
                        title: 'Dica de Acesso',
                        message: 'Se estiver testando o aplicativo pela primeira vez, use o botão "Entrar com Conta Demo" logo abaixo.',
                      });
                    }}
                    className="text-[11px] text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>

              <div className="relative">
                <Lock
                  className={`w-4 h-4 absolute left-3 top-3 transition-colors ${
                    feedback?.field === 'password' ? 'text-rose-500' : 'text-slate-400'
                  }`}
                />
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  placeholder={isRegister ? 'Mínimo de 6 caracteres' : '••••••••'}
                  value={password}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`${getInputClasses('password', true)} pr-10`}
                />
                <button
                  id="auth-toggle-password-btn"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer rounded-md"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator (Register only) */}
              {isRegister && password.length > 0 && (
                <div className="mt-2 p-2 bg-slate-50 rounded-md border border-slate-100">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-600 font-medium">Força da senha:</span>
                    <span className={`font-bold ${passwordStrength.text}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 h-1.5">
                    <div className={`rounded-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-200'}`} />
                    <div className={`rounded-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-200'}`} />
                    <div className={`rounded-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-200'}`} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500">
                    {password.length >= 6 ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                    )}
                    <span>Pelo menos 6 caracteres</span>
                  </div>
                </div>
              )}

              {feedback?.field === 'password' && (
                <span className="block mt-1 text-[11px] text-rose-600 font-medium">
                  {feedback.code === 'INVALID_CREDENTIALS' ? 'Senha incorreta' : 'Verifique a senha informada'}
                </span>
              )}
            </div>

            {/* Confirm Password Input (Register only) */}
            {isRegister && (
              <div>
                <label htmlFor="auth-confirm-password-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmar Senha <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    className={`w-4 h-4 absolute left-3 top-3 transition-colors ${
                      feedback?.field === 'confirmPassword' ? 'text-rose-500' : 'text-slate-400'
                    }`}
                  />
                  <input
                    id="auth-confirm-password-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Repita sua senha"
                    value={confirmPassword}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`${getInputClasses('confirmPassword', true)} pr-10`}
                  />
                  <button
                    id="auth-toggle-confirm-password-btn"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Exibir confirmação de senha'}
                    className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer rounded-md"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {confirmPassword.length > 0 && password === confirmPassword && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>As senhas coincidem perfeitamente.</span>
                  </div>
                )}

                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>As senhas ainda não são iguais.</span>
                  </div>
                )}

                {feedback?.field === 'confirmPassword' && (
                  <span className="block mt-1 text-[11px] text-rose-600 font-medium">Confirme a mesma senha</span>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 mt-3 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Criar Conta' : 'Entrar na Conta'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Shortcut */}
          {!isRegister && (
            <div className="mt-3">
              <button
                id="demo-login-btn"
                type="button"
                onClick={handleDemoLogin}
                disabled={isSubmitting}
                className="w-full py-2 px-3 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-200 active:bg-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Entrar com Conta Demo (Lucas Mendes)</span>
              </button>
            </div>
          )}
        </div>

        {/* Toggle between Login and Register */}
        <div className="pt-5 border-t border-slate-100 text-center text-xs text-slate-500 mt-4">
          {isRegister ? (
            <p>
              Já possui uma conta?{' '}
              <button
                id="auth-switch-to-login-btn"
                type="button"
                onClick={() => toggleMode(false)}
                className="font-bold text-rose-500 hover:underline ml-1 cursor-pointer"
              >
                Fazer Login
              </button>
            </p>
          ) : (
            <p>
              Não tem uma conta ainda?{' '}
              <button
                id="auth-switch-to-register-btn"
                type="button"
                onClick={() => toggleMode(true)}
                className="font-bold text-rose-500 hover:underline ml-1 cursor-pointer"
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
