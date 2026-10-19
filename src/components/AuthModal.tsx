import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Lock, Mail, User, Sparkles, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, login, register, openAuthModal } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(authModalMode);
  
  // Login fields
  const [loginInput, setLoginInput] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  // Register fields
  const [regEmail, setRegEmail] = useState<string>('');
  const [regNick, setRegNick] = useState<string>('');
  const [regName, setRegName] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');

  // Forgot password fields
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [forgotSuccess, setForgotSuccess] = useState<string>('');
  const [demoCode, setDemoCode] = useState<string>('');

  // States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Sync mode with context
  React.useEffect(() => {
    setMode(authModalMode);
    setErrorMsg('');
  }, [authModalMode, authModalOpen]);

  if (!authModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !loginPassword) {
      setErrorMsg('Preencha seu @nick ou e-mail e sua senha.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await login(loginInput.trim(), loginPassword);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Erro ao fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regNick.trim() || !regName.trim() || !regPassword) {
      setErrorMsg('Todos os campos são obrigatórios.');
      return;
    }

    const cleanNick = regNick.trim().toLowerCase().replace(/^@/, '');
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanNick)) {
      setErrorMsg('O @nick deve ter entre 3 e 20 caracteres (apenas letras, números e sublinhados).');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await register({
        email: regEmail.trim(),
        username: cleanNick,
        displayName: regName.trim(),
        password: regPassword
      });
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Erro ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMsg('Informe seu e-mail cadastrado.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.forgotPassword(forgotEmail.trim());
      setForgotSuccess(res.message);
      if (res.demoToken) {
        setDemoCode(res.demoToken);
        setResetToken(res.demoToken);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Erro ao processar recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim() || !newPassword) {
      setErrorMsg('Preencha o código e a nova senha.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await api.resetPassword({
        email: forgotEmail.trim(),
        resetToken: resetToken.trim(),
        newPassword
      });
      setForgotSuccess('Senha atualizada com sucesso! Agora você já pode entrar.');
      setMode('login');
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Erro ao redefinir senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0E1322] border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-2 text-center">
          <h2 className="text-xl font-bold text-white font-display">
            {mode === 'login' ? 'Entrar na Comunidade' : mode === 'register' ? 'Criar Conta' : 'Recuperar Acesso'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' 
              ? 'Conecte-se para participar de debates e colecionar emblemas'
              : mode === 'register'
              ? 'Escolha seu @nick exclusivo e receba seu primeiro emblema'
              : 'Informe seu e-mail para receber as instruções'}
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mx-6 my-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Form area */}
        <div className="p-6 pt-2">
          
          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  @Nick ou E-mail
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={loginInput}
                    onChange={e => setLoginInput(e.target.value)}
                    placeholder="fern_arcana ou fern@hikari.community"
                    className="w-full bg-[#141B2D] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-400">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Sua senha secreta"
                    className="w-full bg-[#141B2D] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 mt-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg shadow-lg shadow-indigo-600/30 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Entrar na Conta</span>
              </button>

              <div className="text-center pt-3 text-xs text-slate-400">
                Ainda não possui conta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Cadastre-se grátis
                </button>
              </div>

              {/* Demo accounts hint */}
              <div className="mt-4 p-2.5 rounded-lg bg-white/5 border border-white/5 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Contas de demonstração:</span>
                <div className="mt-1 flex items-center gap-2 flex-wrap text-[10px]">
                  <span className="text-indigo-300">@fern_arcana</span>
                  <span>·</span>
                  <span className="text-indigo-300">@satoru_infinity</span>
                  <span>·</span>
                  <span>Senha: <code className="text-slate-300 font-mono">hikari123</code></span>
                </div>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Ex: Fern Zoltraak"
                  className="w-full bg-[#141B2D] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-400">
                    @Nick Exclusivo
                  </label>
                  <span className="text-[10px] text-slate-400">3-20 letras, números, _</span>
                </div>
                <div className="relative">
                  <span className="text-slate-400 absolute left-3 top-2 text-xs font-mono">@</span>
                  <input
                    type="text"
                    value={regNick}
                    onChange={e => setRegNick(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="fern_arcana"
                    className="w-full bg-[#141B2D] border border-white/10 rounded-lg pl-7 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full bg-[#141B2D] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Senha (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Crie uma senha segura"
                    className="w-full bg-[#141B2D] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-800/30 text-[11px] text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Ao cadastrar, você recebe automaticamente o emblema <strong>Chama Pioneira Hikari</strong>!</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 mt-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg shadow-lg shadow-indigo-600/30 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Criar Minha Conta</span>
              </button>

              <div className="text-center pt-2 text-xs text-slate-400">
                Já possui conta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Fazer login
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <div className="space-y-3.5">
              {forgotSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300">
                  {forgotSuccess}
                </div>
              )}

              {!demoCode ? (
                <form onSubmit={handleForgotRequest} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      E-mail cadastrado
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="fern@hikari.community"
                      className="w-full bg-[#141B2D] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>Solicitar Código de Redefinição</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Código de Recuperação
                    </label>
                    <input
                      type="text"
                      value={resetToken}
                      onChange={e => setResetToken(e.target.value)}
                      className="w-full bg-[#141B2D] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-[#141B2D] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>Atualizar Senha</span>
                  </button>
                </form>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Voltar para o login
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
