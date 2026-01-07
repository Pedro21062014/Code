
import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { AppLogo, GoogleIcon, GithubIcon, SparklesIcon, SunIcon, MoonIcon } from './Icons';
import { Theme } from '../types';
import Turnstile from 'react-turnstile';

interface AuthPageProps {
  onBack: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack, theme, onThemeChange }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  
  // Apenas checkbox de termos
  const [termsAccepted, setTermsAccepted] = useState(false);

  const toggleTheme = () => {
    onThemeChange(theme === 'dark' ? 'light' : 'dark');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!captchaToken) {
        setError("Por favor, complete a verificação de segurança.");
        return;
    }

    if (!isLoginView && !termsAccepted) {
        setError("Você precisa aceitar os Termos de Uso e a Política de Privacidade para criar uma conta.");
        return;
    }

    setLoading(true);
    
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // O App.tsx detectará a mudança de estado do usuário automaticamente
    } catch (err: any) {
      let errorMessage = err.message;
      if (err.code === 'auth/email-already-in-use') errorMessage = 'Este e-mail já está em uso.';
      if (err.code === 'auth/wrong-password') errorMessage = 'Senha incorreta.';
      if (err.code === 'auth/user-not-found') errorMessage = 'Usuário não encontrado.';
      if (err.code === 'auth/weak-password') errorMessage = 'A senha é muito fraca.';
      if (err.code === 'auth/invalid-credential') errorMessage = 'Credenciais inválidas.';
      setError(errorMessage);
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    if (!captchaToken) {
        setError("Por favor, complete a verificação de segurança.");
        return;
    }
    if (!isLoginView && !termsAccepted) {
        setError("Você precisa aceitar os Termos de Uso para continuar.");
        return;
    }

    setLoading(true);
    setError(null);
    try {
        const provider = new GoogleAuthProvider();
        // Add Drive Scope
        provider.addScope('https://www.googleapis.com/auth/drive.file');
        await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    if (!captchaToken) {
        setError("Por favor, complete a verificação de segurança.");
        return;
    }
    if (!isLoginView && !termsAccepted) {
        setError("Você precisa aceitar os Termos de Uso para continuar.");
        return;
    }

    setLoading(true);
    setError(null);
    try {
        const provider = new GithubAuthProvider();
        // Solicita escopo de repositório para permitir sincronização automática
        provider.addScope('repo');
        
        const result = await signInWithPopup(auth, provider);
        
        // Extrai o token de acesso
        const credential = GithubAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;

        if (token && result.user) {
            // Salva o token no banco de dados para ser usado pelas integrações
            await setDoc(doc(db, "users", result.user.uid), {
                github_access_token: token,
                email: result.user.email
            }, { merge: true });
        }
        // App.tsx redirecionará automaticamente
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-[#09090b] text-gray-900 dark:text-white flex transition-colors duration-300 overflow-hidden">
      
      {/* Lado Esquerdo - Formulário */}
      <div className="w-full lg:w-1/2 flex flex-col h-full relative z-10 bg-gray-50 dark:bg-[#09090b]">
        
        {/* Scroll Container para o formulário */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12">
            
            {/* Header Simples */}
            <div className="flex items-center justify-between mb-8 lg:mb-12">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={onBack}>
                    <AppLogo className="w-8 h-8 text-gray-900 dark:text-white group-hover:scale-105 transition-transform" />
                    <span className="font-bold text-lg tracking-tight">codegen<span className="font-light opacity-50">studio</span></span>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={toggleTheme} 
                        className="p-2 rounded-full text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                        {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                    </button>
                    <button onClick={onBack} className="text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                        Voltar
                    </button>
                </div>
            </div>

            <div className="flex flex-col justify-center max-w-md mx-auto w-full pb-8">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3 text-gray-900 dark:text-white">
                        {isLoginView ? 'Bem-vindo de volta' : 'Crie sua conta'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isLoginView ? 'Entre para continuar construindo o futuro.' : 'Comece a gerar código com IA em segundos.'}
                    </p>
                </div>

                {/* Social Buttons */}
                <div className="flex flex-col gap-3 mb-6">
                    <button 
                        type="button" 
                        onClick={handleGoogleLogin} 
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-white text-gray-900 font-semibold rounded-xl border border-gray-200 dark:border-transparent hover:bg-gray-50 dark:hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait shadow-sm"
                    >
                        <GoogleIcon className="w-5 h-5" />
                        <span>{isLoginView ? 'Entrar com Google' : 'Registrar com Google'}</span>
                    </button>

                    <button 
                        type="button" 
                        onClick={handleGithubLogin} 
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#24292e] text-white font-semibold rounded-xl border border-transparent hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait shadow-sm"
                    >
                        <GithubIcon className="w-5 h-5 text-white" />
                        <span>{isLoginView ? 'Entrar com GitHub' : 'Registrar com GitHub'}</span>
                    </button>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200 dark:border-[#27272a]"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-gray-50 dark:bg-[#09090b] px-3 text-gray-500">Ou continue com email</span>
                    </div>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder="seu@email.com"
                            className="w-full px-4 py-3 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all shadow-sm dark:shadow-none"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="password"className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Senha</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all shadow-sm dark:shadow-none"
                        />
                    </div>

                    {/* Checkbox Termos (Apenas Registro) */}
                    {!isLoginView && (
                        <div className="flex items-start gap-3 py-1">
                            <div className="flex items-center h-5">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="w-4 h-4 border border-gray-300 dark:border-[#3f3f46] rounded bg-white dark:bg-[#18181b] text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 dark:focus:ring-offset-[#09090b] cursor-pointer"
                                />
                            </div>
                            <label htmlFor="terms" className="text-xs text-gray-600 dark:text-gray-400 leading-snug select-none cursor-pointer">
                                Eu li e aceito os <a href="#" className="underline hover:text-black dark:hover:text-white transition-colors">Termos de Serviço</a> e a <a href="#" className="underline hover:text-black dark:hover:text-white transition-colors">Política de Privacidade</a> do Codegen Studio.
                            </label>
                        </div>
                    )}
                    
                    <div className="flex justify-center my-2">
                        <Turnstile
                            sitekey="0x4AAAAAAACLHAa5iRa3ivhDh"
                            onVerify={(token) => setCaptchaToken(token)}
                            theme={theme}
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full py-3 px-4 bg-gray-900 dark:bg-[#27272a] text-white font-semibold rounded-xl hover:bg-black dark:hover:bg-[#3f3f46] transition-all border border-transparent dark:border-[#3f3f46] active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait mt-2 shadow-lg dark:shadow-none"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Processando...
                            </div>
                        ) : (
                            isLoginView ? 'Continuar' : 'Criar Conta'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isLoginView ? "Não tem uma conta?" : "Já tem uma conta?"}{' '}
                        <button 
                            onClick={() => { 
                                setIsLoginView(!isLoginView); 
                                setError(null); 
                            }} 
                            className="font-semibold text-gray-900 dark:text-white hover:underline transition-all"
                        >
                            {isLoginView ? "Inscreva-se" : "Faça Login"}
                        </button>
                    </p>
                </div>
            </div>

            {/* Footer Links */}
            <div className="mt-12 flex gap-6 justify-center text-xs text-gray-500 dark:text-gray-600 pb-8">
                <a href="#" className="hover:text-gray-900 dark:hover:text-gray-400 transition-colors">Termos de Serviço</a>
                <a href="#" className="hover:text-gray-900 dark:hover:text-gray-400 transition-colors">Política de Privacidade</a>
            </div>
        </div>
      </div>

      {/* Lado Direito - Visual (Escondido no Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-gray-100 dark:bg-[#050505] relative items-center justify-center overflow-hidden border-l border-gray-200 dark:border-[#27272a]">
         {/* Background Effects */}
         <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
         
         <div className="relative z-10 p-12 max-w-lg">
            <div className="bg-white/60 dark:bg-[#121214]/50 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                    <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                    "Transforme suas ideias em aplicações reais na velocidade do pensamento."
                </h2>
                <div className="flex items-center gap-3 mt-6">
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-[#121214]"></div>
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-[#121214]"></div>
                        <div className="w-8 h-8 rounded-full bg-gray-400 dark:bg-gray-500 border-2 border-white dark:border-[#121214]"></div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">+2.000 devs construindo agora</p>
                </div>
            </div>

            {/* Code Snippet Decoration */}
            <div className="absolute -bottom-10 -right-10 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#27272a] p-4 rounded-xl opacity-60 scale-90 rotate-[-5deg] pointer-events-none shadow-xl">
                <div className="flex gap-1.5 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                </div>
                <div className="space-y-1.5">
                    <div className="h-2 w-32 bg-gray-200 dark:bg-white/20 rounded-full"></div>
                    <div className="h-2 w-24 bg-gray-200 dark:bg-white/10 rounded-full"></div>
                    <div className="h-2 w-28 bg-gray-200 dark:bg-white/10 rounded-full"></div>
                </div>
            </div>
         </div>
      </div>

    </div>
  );
};
