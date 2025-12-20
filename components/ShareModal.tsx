
import React, { useState } from 'react';
import { CloseIcon, LoaderIcon, CheckCircleIcon } from './Icons';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, limit } from "firebase/firestore";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (targetUserUid: string, email: string) => Promise<void>;
  projectName: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onShare, projectName }) => {
  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    const targetEmail = email.trim().toLowerCase();
    
    if (!targetEmail) {
        setError("Por favor, insira um e-mail válido.");
        return;
    }

    setIsChecking(true);

    try {
      // Buscamos apenas 1 documento para economizar créditos e performance
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", targetEmail), limit(1));
      
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError(`Usuário "${targetEmail}" não encontrado. Peça para ele fazer login no Codegen Studio ao menos uma vez.`);
        setIsChecking(false);
        return;
      }

      const targetUserDoc = querySnapshot.docs[0];
      const targetUserUid = targetUserDoc.id;

      await onShare(targetUserUid, targetEmail);
      
      setSuccess(`Projeto compartilhado com sucesso!`);
      setEmail('');
      setTimeout(onClose, 2000);
    } catch (err: any) {
      console.error("Share error details:", err);
      
      if (err.code === 'permission-denied' || err.message?.includes('permission-denied')) {
          setError("Erro de permissão no Firebase. Certifique-se de que as 'Security Rules' permitem a leitura da coleção 'users' por usuários autenticados.");
      } else {
          setError(`Erro ao compartilhar: ${err.message || "Erro desconhecido"}`);
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-[#141414] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slideInUp" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Compartilhar</h2>
            </div>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                <CloseIcon />
            </button>
        </div>

        <form onSubmit={handleShare} className="p-8 space-y-6">
            <div className="text-center space-y-2">
                <p className="text-sm text-gray-400">
                    Convide alguém para colaborar no projeto <br/>
                    <span className="text-white font-bold">"{projectName}"</span>
                </p>
            </div>

            <div className="space-y-4">
                <div className="relative group">
                    <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="E-mail do colaborador"
                        required
                        autoFocus
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder-gray-600"
                    />
                </div>

                {error && (
                    <div className="animate-fadeIn bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                        <p className="text-[11px] text-red-400 leading-relaxed text-center font-medium">
                            {error}
                        </p>
                    </div>
                )}
                
                {success && (
                    <div className="animate-fadeIn bg-green-500/10 p-4 rounded-xl border border-green-500/20 flex items-center justify-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        <p className="text-xs text-green-400 font-bold">{success}</p>
                    </div>
                )}

                <button 
                    disabled={isChecking || !email.trim()}
                    className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {isChecking ? <LoaderIcon className="w-4 h-4 animate-spin" /> : null}
                    {isChecking ? 'Localizando usuário...' : 'Convidar Colaborador'}
                </button>
            </div>

            <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] text-center text-gray-500 leading-relaxed uppercase tracking-widest font-bold">
                    Dica: Verifique as Security Rules <br/> do seu projeto Firebase.
                </p>
            </div>
        </form>
      </div>
    </div>
  );
};
