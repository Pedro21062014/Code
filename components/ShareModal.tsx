
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
    
    if (!targetEmail) return;

    setIsChecking(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", targetEmail), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Usuário não encontrado.");
        setIsChecking(false);
        return;
      }

      const targetUserDoc = querySnapshot.docs[0];
      await onShare(targetUserDoc.id, targetEmail);
      setSuccess("Convite enviado.");
      setEmail('');
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message || "Erro ao compartilhar.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-[#09090b] border border-[#27272a] rounded-2xl w-full max-w-sm overflow-hidden animate-slideInUp shadow-2xl" onClick={e => e.stopPropagation()}>
        
        <div className="px-6 py-5 border-b border-[#27272a] flex justify-between items-center bg-[#0c0c0e]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Colaboração</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><CloseIcon className="w-4 h-4"/></button>
        </div>

        <form onSubmit={handleShare} className="p-6 space-y-6">
            <div className="space-y-1">
                <p className="text-xs text-gray-500 font-mono">PROJETO</p>
                <p className="text-white font-medium text-sm truncate">{projectName}</p>
            </div>

            <div className="space-y-2">
                <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                    autoFocus
                    className="w-full bg-[#121214] border border-[#27272a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-white/20 transition-all placeholder-gray-600 font-mono"
                />
            </div>

            {error && <p className="text-[10px] text-red-400 text-center">{error}</p>}
            {success && <div className="flex items-center justify-center gap-2 text-green-400 text-[10px]"><CheckCircleIcon className="w-3 h-3"/> {success}</div>}

            <button 
                disabled={isChecking || !email.trim()}
                className="w-full bg-white text-black h-10 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isChecking && <LoaderIcon className="w-3 h-3 animate-spin" />}
                {isChecking ? 'Verificando...' : 'Convidar'}
            </button>
        </form>
      </div>
    </div>
  );
};
