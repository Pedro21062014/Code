
import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc } from '../services/localDatabase';
import { AppLogo, GoogleIcon, GithubIcon, SunIcon, MoonIcon, CheckCircleIcon, LoaderIcon, UserIcon, KeyIcon } from './Icons';
import { DotGridBackground } from './DotGridBackground';
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
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#000] text-[#fff] font-sans" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* WebGL Dot canvas */}
      <DotGridBackground />

      {/* Vignette */}
      <div className="absolute inset-0 z-[1]" style={{ background: 'radial-gradient(circle at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)', pointerEvents: 'none' }} />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 z-20 p-2.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        title="Alternar tema"
      >
        {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
      </button>

      {/* Modal card */}
      <div className="relative z-[2] w-full max-w-[400px] mx-4">
        {/* Brand / Logo */}
        <button onClick={onBack} className="mx-auto mb-4 flex items-center gap-2 group cursor-pointer" style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'inherit' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12" style={{ background: '#ededed', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            <AppLogo className="w-6 h-6 text-black" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">codegem</span>
        </button>

        <div className="relative z-[2] rounded-2xl p-8 flex flex-col items-center" style={{ background: '#121212', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', border: '1px solid #222' }}>
          {viewState === 'login' ? (
            <div className="w-full max-w-[320px] flex flex-col items-center text-center">
              <h1 className="text-[1.35rem] font-semibold mb-1" style={{ letterSpacing: '-0.025em' }}>Entrar na sua conta</h1>
              <p className="text-[0.85rem] text-[#888] mb-4" style={{ lineHeight: 1.5 }}>Bem-vindo de volta à Codegem Studio.</p>

              {error && <div className="w-full mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />{error}</div>}
              {successMessage && <div className="w-full mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 shrink-0" />{successMessage}</div>}

              <form onSubmit={handleAuth} className="w-full flex flex-col" style={{ gap: '0.65rem' }}>
                <input style={{ width:'100%', padding:'0.65rem 0.85rem', borderRadius:6, border:'1px solid #333', background:'#000', color:'#fff', fontSize:'0.875rem', outline:'none' }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
                <input style={{ width:'100%', padding:'0.65rem 0.85rem', borderRadius:6, border:'1px solid #333', background:'#000', color:'#fff', fontSize:'0.875rem', outline:'none' }} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                <div className="flex justify-end mt-1">
                  <button type="button" onClick={() => { setViewState('forgot_password'); resetState(); }} className="text-[0.75rem] font-semibold text-blue-400 hover:underline" style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'inherit' }}>Esqueceu a senha?</button>
                </div>
                <button type="submit" disabled={loading} style={{ width:'100%', padding:'0.65rem', borderRadius:6, border:'none', background:'#ededed', color:'#000', fontWeight:500, fontSize:'0.875rem', cursor:'pointer', fontFamily:'inherit' }}>
                  {loading ? <LoaderIcon className="w-4 h-4 animate-spin mx-auto" /> : 'Entrar com Email'}
                </button>
              </form>

              <div style={{ height:1, background:'#222', width:'100%', margin:'0.85rem 0' }} />
              <button onClick={handleGoogleLogin} style={{ width:'100%', padding:'0.65rem', borderRadius:6, border:'1px solid #333', background:'transparent', color:'#fff', fontWeight:500, fontSize:'0.875rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginBottom:'0.4rem' }}>
                <GoogleIcon className="w-4 h-4 flex-shrink-0" /> Continuar com Google
              </button>
              <button onClick={handleGithubLogin} style={{ width:'100%', padding:'0.65rem', borderRadius:6, border:'1px solid #333', background:'transparent', color:'#fff', fontWeight:500, fontSize:'0.875rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginBottom:'0.4rem' }}>
                <GithubIcon className="w-4 h-4 flex-shrink-0" /> Continuar com GitHub
              </button>

              <div className="mt-5 text-[0.875rem] text-[#888]">
                Não tem uma conta?{' '}
                <button onClick={() => { setViewState('register'); resetState(); }} style={{ color:'#fff', fontWeight:500, background:'none', border:'none', padding:0, cursor:'pointer', fontFamily:'inherit', fontSize:'inherit' }}>Criar conta</button>
              </div>
            </div>
          ) : viewState === 'register' ? (
            <div className="w-full max-w-[320px] flex flex-col items-center text-center">
              <h1 className="text-[1.35rem] font-semibold mb-1" style={{ letterSpacing: '-0.025em' }}>Criar conta</h1>
              <p className="text-[0.85rem] text-[#888] mb-4" style={{ lineHeight: 1.5 }}>Comece a gerar código com IA em segundos.</p>

              {error && <div className="w-full mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />{error}</div>}
              {successMessage && <div className="w-full mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 shrink-0" />{successMessage}</div>}

              <form onSubmit={handleAuth} className="w-full flex flex-col" style={{ gap: '0.65rem' }}>
                <input style={{ width:'100%', padding:'0.65rem 0.85rem', borderRadius:6, border:'1px solid #333', background:'#000', color:'#fff', fontSize:'0.875rem', outline:'none' }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
                <input style={{ width:'100%', padding:'0.65rem 0.85rem', borderRadius:6, border:'1px solid #333', background:'#000', color:'#fff', fontSize:'0.875rem', outline:'none' }} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Crie uma senha (mín. 6)" required minLength={6} />
                <label className="flex items-start gap-2 text-left mt-1 cursor-pointer select-none">
                  <input id="terms" type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 w-3.5 h-3.5 accent-blue-600 cursor-pointer" />
                  <span className="text-[0.7rem] text-[#888] leading-relaxed">Concordo com os <a href="#" className="underline hover:text-white font-medium">Termos</a> e <a href="#" className="underline hover:text-white font-medium">Privacidade</a>.</span>
                </label>
                <button type="submit" disabled={loading} style={{ width:'100%', padding:'0.65rem', borderRadius:6, border:'none', background:'#ededed', color:'#000', fontWeight:500, fontSize:'0.875rem', cursor:'pointer', fontFamily:'inherit' }}>
                  {loading ? <LoaderIcon className="w-4 h-4 animate-spin mx-auto" /> : 'Criar Conta'}
                </button>
              </form>

              <div style={{ height:1, background:'#222', width:'100%', margin:'0.85rem 0' }} />
              <button onClick={handleGoogleLogin} style={{ width:'100%', padding:'0.65rem', borderRadius:6, border:'1px solid #333', background:'transparent', color:'#fff', fontWeight:500, fontSize:'0.875rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginBottom:'0.4rem' }}>
                <GoogleIcon className="w-4 h-4 flex-shrink-0" /> Criar com Google
              </button>
              <button onClick={handleGithubLogin} style={{ width:'100%', padding:'0.65rem', borderRadius:6, border:'1px solid #333', background:'transparent', color:'#fff', fontWeight:500, fontSize:'0.875rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginBottom:'0.4rem' }}>
                <GithubIcon className="w-4 h-4 flex-shrink-0" /> Criar com GitHub
              </button>

              <div className="mt-5 text-[0.875rem] text-[#888]">
                Já tem uma conta?{' '}
                <button onClick={() => { setViewState('login'); resetState(); }} style={{ color:'#fff', fontWeight:500, background:'none', border:'none', padding:0, cursor:'pointer', fontFamily:'inherit', fontSize:'inherit' }}>Entrar</button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[320px] flex flex-col items-center text-center">
              <h1 className="text-[1.35rem] font-semibold mb-1" style={{ letterSpacing: '-0.025em' }}>Recuperar senha</h1>
              <p className="text-[0.85rem] text-[#888] mb-4" style={{ lineHeight: 1.5 }}>Enviaremos um link para o seu email.</p>

              {error && <div className="w-full mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />{error}</div>}
              {successMessage && <div className="w-full mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 shrink-0" />{successMessage}</div>}

              <form onSubmit={handleAuth} className="w-full flex flex-col" style={{ gap: '0.65rem' }}>
                <input style={{ width:'100%', padding:'0.65rem 0.85rem', borderRadius:6, border:'1px solid #333', background:'#000', color:'#fff', fontSize:'0.875rem', outline:'none' }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
                <button type="submit" disabled={loading} style={{ width:'100%', padding:'0.65rem', borderRadius:6, border:'none', background:'#ededed', color:'#000', fontWeight:500, fontSize:'0.875rem', cursor:'pointer', fontFamily:'inherit' }}>
                  {loading ? <LoaderIcon className="w-4 h-4 animate-spin mx-auto" /> : 'Enviar Email de Recuperação'}
                </button>
              </form>

              <button onClick={() => { setViewState('login'); resetState(); }} className="mt-5 w-full flex items-center justify-center gap-2 text-[0.875rem] text-[#888] hover:text-white transition-colors" style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                &larr; Voltar para Login
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 text-[0.75rem] text-[#666] text-center" style={{ lineHeight: 1.5 }}>
            Ao continuar, você concorda com nossos <a href="#" style={{ color:'#888' }}>Termos</a> e <a href="#" style={{ color:'#888' }}>Política de Privacidade</a>.
          </div>
        </div>

        <div className="mt-6 text-center text-[10px] text-white/40 font-mono">
          &copy; {new Date().getFullYear()} Codegem Studio.
        </div>
      </div>
    </div>
  );
};
