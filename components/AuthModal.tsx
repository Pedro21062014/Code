
import React, { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { CloseIcon, AppLogo, GoogleIcon, GithubIcon } from './Icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Apenas checkbox de termos
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!isLoginView && !termsAccepted) {
        setError("Você precisa aceitar os termos.");
        setLoading(false);
        return;
    }
    
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setMessage('Conta criada com sucesso!');
        setTimeout(onClose, 1000);
      }
    } catch (err: any) {
      let errorMessage = err.message;
      if (err.code === 'auth/email-already-in-use') errorMessage = 'Este e-mail já está em uso.';
      if (err.code === 'auth/wrong-password') errorMessage = 'Senha incorreta.';
      if (err.code === 'auth/user-not-found') errorMessage = 'Usuário não encontrado.';
      if (err.code === 'auth/weak-password') errorMessage = 'A senha é muito fraca.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    if (!isLoginView && !termsAccepted) {
        setError("Você precisa aceitar os termos.");
        return;
    }

    setLoading(true);
    setError(null);
    try {
        const provider = new GoogleAuthProvider();
        // Add Google Drive scope
        provider.addScope('https://www.googleapis.com/auth/drive.file');
        await signInWithPopup(auth, provider);
        onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    if (!isLoginView && !termsAccepted) {
        setError("Você precisa aceitar os termos.");
        return;
    }

    setLoading(true);
    setError(null);
    try {
        const provider = new GithubAuthProvider();
        // Solicita acesso aos repositórios para que o sync funcione automaticamente
        provider.addScope('repo');
        
        const result = await signInWithPopup(auth, provider);
        
        // Captura o token de acesso do GitHub
        const credential = GithubAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;

        if (token && result.user) {
            // Salva o token no perfil do usuário para uso no GithubSyncModal e GithubImportModal
            await setDoc(doc(db, "users", result.user.uid), {
                github_access_token: token,
                email: result.user.email
            }, { merge: true });
        }

        onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
        setEmail('');
        setPassword('');
        setError(null);
        setMessage(null);
        setLoading(false);
        setIsLoginView(true);
        setTermsAccepted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fadeIn" onClick={onClose}>
      <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-xl w-full max-w-sm p-8 border border-gray-200 dark:border-[#27272a] animate-slideInUp relative transition-colors" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center flex-col items-center mb-6">
            <AppLogo className="w-10 h-10 text-black dark:text-white mb-2" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isLoginView ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {isLoginView ? 'Faça login para continuar.' : 'Comece a construir seus projetos.'}
            </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
            <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full p-2.5 bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-[#27272a] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                />
            </div>
            <div>
                 <label htmlFor="password"className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Senha</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full p-2.5 bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-[#27272a] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                />
            </div>

            {/* Checkbox Termos */}
            {!isLoginView && (
                <div className="flex items-start gap-2 py-1 animate-fadeIn">
                    <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 dark:border-[#3f3f46] bg-white dark:bg-[#18181b] cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                        Aceito os <a href="#" className="underline">Termos</a> e <a href="#" className="underline">Privacidade</a>.
                    </span>
                </div>
            )}
            
            {error && <p className="text-sm text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 dark:border-red-900/20">{error}</p>}
            {message && <p className="text-sm text-green-600 dark:text-green-400 text-center">{message}</p>}

            <button type="submit" disabled={loading} className="w-full py-2.5 px-4 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait">
                {loading ? 'Processando...' : (isLoginView ? 'Login' : 'Registrar')}
            </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200 dark:border-[#27272a]"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-[#18181b] px-2 text-gray-500">OU</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
            <button 
              type="button" 
              onClick={handleGoogleLogin} 
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-[#27272a] border border-gray-200 dark:border-[#27272a] text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-[#3f3f46] transition-colors disabled:opacity-50"
            >
              <GoogleIcon />
              <span className="text-sm">Continuar com Google</span>
            </button>

            <button 
              type="button" 
              onClick={handleGithubLogin} 
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#24292e] dark:bg-[#24292e] border border-transparent text-white font-semibold rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
            >
              <GithubIcon className="w-5 h-5 text-white" />
              <span className="text-sm">Continuar com GitHub</span>
            </button>
        </div>

         <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {isLoginView ? "Não tem uma conta?" : "Já tem uma conta?"}{' '}
                <button onClick={() => { 
                    setIsLoginView(!isLoginView); 
                    setError(null); 
                    setMessage(null); 
                }} className="font-semibold text-gray-900 dark:text-white hover:underline">
                     {isLoginView ? "Registre-se" : "Faça Login"}
                </button>
            </p>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-[#27272a] hover:text-black dark:hover:text-white transition-colors">
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};
