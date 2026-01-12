
import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { AppLogo, GoogleIcon, GithubIcon, SunIcon, MoonIcon, CheckCircleIcon } from './Icons';
import { Theme } from '../types';

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
  
  // Apenas checkbox de termos
  const [termsAccepted, setTermsAccepted] = useState(false);

  const toggleTheme = () => {
    onThemeChange(theme === 'dark' ? 'light' : 'dark');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
    if (!isLoginView && !termsAccepted) {
        setError("Você precisa aceitar os Termos de Uso para continuar.");
        return;
    }

    setLoading(true);
    setError(null);
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
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
    <div className="min-h-screen w-full flex bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* Left Column - Auth Form */}
      <div className="w-full lg:w-[45%] flex flex-col relative z-10 bg-white dark:bg-[#09090b] border-r border-transparent dark:border-[#27272a]/50">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 lg:p-8">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={onBack}>
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black transition-transform group-hover:scale-95">
                    <AppLogo className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg tracking-tight">codegen</span>
            </div>
            {/* Theme Toggle */}
             <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12 py-8">
            <div className="w-full max-w-sm space-y-8">
                
                {/* Titles */}
                <div className="space-y-2 text-center lg:text-left">
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                        {isLoginView ? 'Bem-vindo de volta' : 'Crie sua conta'}
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {isLoginView ? 'Entre para continuar construindo.' : 'Comece a gerar código com IA em segundos.'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleAuth} className="space-y-4">
                    {/* Inputs with cleaner styling */}
                    <div className="space-y-4">
                        <div className="group">
                            <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-500 mb-1.5 ml-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                placeholder="name@example.com"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-500 mb-1.5 ml-1">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {/* Terms Checkbox */}
                    {!isLoginView && (
                        <div className="flex items-start gap-3 py-1">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-blue-600 focus:ring-offset-0 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="terms" className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed cursor-pointer select-none">
                                Eu concordo com os <a href="#" className="underline hover:text-zinc-900 dark:hover:text-white">Termos de Serviço</a> e a <a href="#" className="underline hover:text-zinc-900 dark:hover:text-white">Política de Privacidade</a>.
                            </label>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-shake">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full h-11 flex items-center justify-center bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-wait shadow-lg dark:shadow-white/10"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : (isLoginView ? 'Entrar' : 'Criar Conta')}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200 dark:border-zinc-800"></span></div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-white dark:bg-[#09090b] px-3 text-zinc-400">Ou continue com</span></div>
                </div>

                {/* Social Auth */}
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleGoogleLogin} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:bg-zinc-50 dark:hover:bg-[#202023] transition-colors text-sm font-medium">
                        <GoogleIcon className="w-4 h-4" /> Google
                    </button>
                    <button onClick={handleGithubLogin} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:bg-zinc-50 dark:hover:bg-[#202023] transition-colors text-sm font-medium">
                        <GithubIcon className="w-4 h-4 text-black dark:text-white" /> GitHub
                    </button>
                </div>

                {/* Switch Mode */}
                <div className="text-center text-sm text-zinc-500">
                    {isLoginView ? "Não tem uma conta?" : "Já tem uma conta?"}{' '}
                    <button onClick={() => { setIsLoginView(!isLoginView); setError(null); }} className="font-semibold text-zinc-900 dark:text-white hover:underline">
                        {isLoginView ? "Cadastre-se" : "Faça Login"}
                    </button>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-[10px] text-zinc-400">
            &copy; {new Date().getFullYear()} Codegen Studio. All rights reserved.
        </div>
      </div>

      {/* Right Column - Visual */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-zinc-900 items-center justify-center">
         {/* Background & Effects */}
         <div className="absolute inset-0 bg-[#050505]">
             <div className="absolute top-[-25%] right-[-25%] w-[80%] h-[80%] bg-purple-500/10 rounded-full blur-[150px] animate-pulse" style={{animationDuration:'10s'}}></div>
             <div className="absolute bottom-[-25%] left-[-25%] w-[80%] h-[80%] bg-blue-500/10 rounded-full blur-[150px] animate-pulse" style={{animationDuration:'8s', animationDelay:'2s'}}></div>
             
             {/* Grid overlay */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
             <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
         </div>

         {/* Content Card */}
         <div className="relative z-10 max-w-lg p-10">
             <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                 {/* Shine effect */}
                 <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                 
                 {/* PRO ANIMATION: Replacing the Sparkles Icon Box */}
                 <div className="w-16 h-16 relative mb-8 flex items-center justify-center">
                    {/* Glow */}
                    <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl animate-pulse"></div>
                    {/* Container */}
                    <div className="relative w-full h-full bg-black/80 border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden backdrop-blur-md shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent"></div>
                        {/* Spinning Elements - Technical Abstract Look */}
                        <div className="absolute w-8 h-8 border border-blue-400/50 rounded-[4px] animate-[spin_6s_linear_infinite]"></div>
                        <div className="absolute w-10 h-10 border border-purple-400/30 rounded-full animate-[spin_8s_linear_infinite_reverse]"></div>
                        {/* Center Core */}
                        <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white] animate-pulse"></div>
                    </div>
                 </div>
                 
                 <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                     Transforme ideias em software. <br/>
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Instantaneamente.</span>
                 </h2>
                 
                 <p className="text-zinc-400 leading-relaxed mb-8">
                     Junte-se a milhares de desenvolvedores que usam o Codegen Studio para criar aplicações full-stack na velocidade do pensamento.
                 </p>

                 <div className="space-y-3">
                     {[
                         "Geração de código com IA avançada",
                         "Preview em tempo real no navegador",
                         "Deploy com um clique para produção"
                     ].map((feat, i) => (
                         <div key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                             <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 flex-shrink-0">
                                 <CheckCircleIcon className="w-3 h-3" />
                             </div>
                             {feat}
                         </div>
                     ))}
                 </div>
             </div>
             
             {/* Floating Elements decoration */}
             <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>
             <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
         </div>
      </div>

    </div>
  );
};
