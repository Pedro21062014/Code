import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { AppLogo, GoogleIcon, GithubIcon, SunIcon, MoonIcon, CheckCircleIcon, LoaderIcon, UserIcon, KeyIcon } from './Icons';
import { Theme } from '../types';

interface AuthPageProps {
  onBack: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack, theme, onThemeChange }) => {
  const [viewState, setViewState] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [termsAccepted, setTermsAccepted] = useState(false);

  const toggleTheme = () => {
    onThemeChange(theme === 'dark' ? 'light' : 'dark');
  };

  const resetState = () => {
      setError(null);
      setSuccessMessage(null);
      setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    if (viewState === 'register' && !termsAccepted) {
        setError("Você precisa aceitar os Termos de Uso e a Política de Privacidade para criar uma conta.");
        return;
    }

    setLoading(true);
    
    try {
      if (viewState === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (viewState === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else if (viewState === 'forgot_password') {
        if (!email) {
            throw new Error("Por favor, insira seu email.");
        }
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage("Email de redefinição enviado! Verifique sua caixa de entrada.");
        setLoading(false);
        return;
      }
    } catch (err: any) {
      let errorMessage = err.message;
      if (err.code === 'auth/email-already-in-use') errorMessage = 'Este e-mail já está em uso.';
      if (err.code === 'auth/wrong-password') errorMessage = 'Senha incorreta.';
      if (err.code === 'auth/user-not-found') errorMessage = 'Usuário não encontrado.';
      if (err.code === 'auth/weak-password') errorMessage = 'A senha é muito fraca.';
      if (err.code === 'auth/invalid-credential') errorMessage = 'Credenciais inválidas.';
      if (err.code === 'auth/too-many-requests') errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
      setError(errorMessage);
    } finally {
      if (viewState !== 'forgot_password') setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    if (viewState === 'register' && !termsAccepted) {
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
    if (viewState === 'register' && !termsAccepted) {
        setError("Você precisa aceitar os Termos de Uso para continuar.");
        return;
    }

    setLoading(true);
    setError(null);
    try {
        const provider = new GithubAuthProvider();
        provider.addScope('repo');
        
        const result = await signInWithPopup(auth, provider);
        const credential = GithubAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;

        if (token && result.user) {
            await setDoc(doc(db, "users", result.user.uid), {
                github_access_token: token,
                email: result.user.email
            }, { merge: true });
        }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-[#09090b] text-gray-900 dark:text-gray-100 transition-colors duration-500 overflow-hidden">
      
      {/* Left Column - Auth Form */}
      <div className="w-full lg:w-[45%] flex flex-col relative z-20 bg-white dark:bg-[#09090b] shadow-2xl lg:shadow-none transition-colors duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 lg:p-10 animate-fade-in">
            <div className="flex items-center gap-2.5 cursor-pointer group" onClick={onBack}>
                <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black transition-transform group-hover:rotate-12 shadow-lg">
                    <AppLogo className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight font-heading">codegen</span>
            </div>
             <button 
                onClick={toggleTheme} 
                className="p-2.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1f1f22] transition-colors"
            >
                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 pb-10 max-w-lg mx-auto w-full animate-slide-up" style={{ animationDelay: '0.1s' }}>
            
            {/* Titles */}
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3 font-heading">
                    {viewState === 'login' && 'Bem-vindo de volta'}
                    {viewState === 'register' && 'Criar conta'}
                    {viewState === 'forgot_password' && 'Recuperar senha'}
                </h1>
                <p className="text-base text-gray-500 dark:text-gray-400">
                    {viewState === 'login' && 'Entre para continuar criando.'}
                    {viewState === 'register' && 'Comece a gerar código com IA em segundos.'}
                    {viewState === 'forgot_password' && 'Enviaremos um link para o seu email.'}
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-5">
                
                {/* Email Input */}
                <div className="group relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <UserIcon className="w-5 h-5" />
                    </div>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium"
                        placeholder="seu@email.com"
                    />
                </div>

                {/* Password Input */}
                {viewState !== 'forgot_password' && (
                    <div className="space-y-2">
                        <div className="group relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                <KeyIcon className="w-5 h-5" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                        {viewState === 'login' && (
                            <div className="flex justify-end">
                                <button 
                                    type="button" 
                                    onClick={() => { setViewState('forgot_password'); resetState(); }} 
                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Esqueceu a senha?
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Terms Checkbox */}
                {viewState === 'register' && (
                    <div className="flex items-start gap-3 py-1">
                        <input
                            id="terms"
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-[#3f3f46] bg-gray-100 dark:bg-[#18181b] text-blue-600 focus:ring-offset-0 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="terms" className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed cursor-pointer select-none">
                            Concordo com os <a href="#" className="underline hover:text-black dark:hover:text-white font-medium">Termos</a> e <a href="#" className="underline hover:text-black dark:hover:text-white font-medium">Privacidade</a>.
                        </label>
                    </div>
                )}

                {/* Feedback Messages */}
                {error && (
                    <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-3 animate-shake">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="p-3.5 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 text-sm flex items-center gap-3 animate-fadeIn">
                        <CheckCircleIcon className="w-5 h-5" />
                        {successMessage}
                    </div>
                )}

                {/* Submit Button */}
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full h-12 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-black/5 dark:shadow-white/5"
                >
                    {loading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : (
                        viewState === 'login' ? 'Entrar' : 
                        viewState === 'register' ? 'Criar Conta' : 
                        'Enviar Email de Recuperação'
                    )}
                </button>
            </form>

            {viewState !== 'forgot_password' && (
                <>
                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200 dark:border-[#27272a]"></span></div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold"><span className="bg-white dark:bg-[#09090b] px-3 text-gray-400">Ou</span></div>
                    </div>

                    {/* Social Auth */}
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleGoogleLogin} className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] hover:bg-gray-50 dark:hover:bg-[#1f1f22] hover:border-gray-300 dark:hover:border-[#3f3f46] transition-all text-sm font-semibold text-gray-700 dark:text-gray-200 group">
                            <GoogleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" /> Google
                        </button>
                        <button onClick={handleGithubLogin} className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] hover:bg-gray-50 dark:hover:bg-[#1f1f22] hover:border-gray-300 dark:hover:border-[#3f3f46] transition-all text-sm font-semibold text-gray-700 dark:text-gray-200 group">
                            <GithubIcon className="w-5 h-5 text-black dark:text-white group-hover:scale-110 transition-transform" /> GitHub
                        </button>
                    </div>
                </>
            )}

            {/* Switch Mode */}
            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {viewState === 'login' ? (
                    <>
                        Não tem uma conta?{' '}
                        <button onClick={() => { setViewState('register'); resetState(); }} className="font-bold text-black dark:text-white hover:underline">
                            Registre-se
                        </button>
                    </>
                ) : viewState === 'register' ? (
                    <>
                        Já tem uma conta?{' '}
                        <button onClick={() => { setViewState('login'); resetState(); }} className="font-bold text-black dark:text-white hover:underline">
                            Faça Login
                        </button>
                    </>
                ) : (
                    <button onClick={() => { setViewState('login'); resetState(); }} className="font-bold text-black dark:text-white hover:underline flex items-center justify-center gap-2 w-full">
                        &larr; Voltar para Login
                    </button>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-[10px] text-gray-400 font-mono">
            &copy; {new Date().getFullYear()} Codegen Studio.
        </div>
      </div>

      {/* Right Column - Visual */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-[#050505] items-center justify-center">
         {/* Aurora Background */}
         <div className="absolute inset-0">
             <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{animationDuration:'8s'}}></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{animationDuration:'12s', animationDelay:'1s'}}></div>
             <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] bg-pink-600/10 rounded-full blur-[100px] animate-pulse" style={{animationDuration:'15s', animationDelay:'2s'}}></div>
             
             {/* Grid overlay */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
             <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
         </div>

         {/* Content Card */}
         <div className="relative z-10 max-w-lg p-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
             <div className="bg-[#0c0c0e]/60 backdrop-blur-2xl border border-white/10 rounded-[32px] p-10 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-colors duration-500">
                 
                 {/* Decorative elements inside card */}
                 <div className="absolute top-0 right-0 p-8 opacity-20">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                 </div>

                 <div className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    IA Generativa v2.5
                 </div>
                 
                 <h2 className="text-4xl font-bold text-white mb-6 leading-[1.1] font-heading">
                     Acelere seu <br/>
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Desenvolvimento.</span>
                 </h2>
                 
                 <p className="text-gray-400 leading-relaxed mb-10 text-lg font-light">
                     Acesso instantâneo a ferramentas de nível empresarial para criar, iterar e publicar aplicações web modernas.
                 </p>

                 <div className="grid grid-cols-1 gap-4">
                     {[
                         { title: "Smart Chat", desc: "Contexto completo do projeto" },
                         { title: "Live Preview", desc: "Renderização em tempo real" },
                         { title: "1-Click Deploy", desc: "Netlify & GitHub Sync" }
                     ].map((feat, i) => (
                         <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-default">
                             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-white shadow-lg">
                                 <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                             </div>
                             <div>
                                 <div className="text-white font-bold text-sm">{feat.title}</div>
                                 <div className="text-gray-500 text-xs">{feat.desc}</div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         </div>
      </div>

    </div>
  );
};