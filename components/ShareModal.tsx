
import React, { useState, useEffect } from 'react';
import { CloseIcon, LoaderIcon, CheckCircleIcon, GalleryIcon, UsersIcon } from './Icons';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (targetUserUid: string, email: string) => Promise<void>;
  onToggleGallery: (isPublic: boolean) => Promise<void>;
  projectName: string;
  projectId: number | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onShare, onToggleGallery, projectName, projectId }) => {
  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPublicInGallery, setIsPublicInGallery] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
        // Fetch current status
        const fetchStatus = async () => {
            try {
                const docRef = doc(db, "projects", projectId.toString());
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setIsPublicInGallery(docSnap.data().is_public_in_gallery === true);
                }
            } catch (e) {
                console.error("Error fetching project status", e);
            }
        };
        fetchStatus();
    }
  }, [isOpen, projectId]);

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
    } catch (err: any) {
      setError(err.message || "Erro ao compartilhar.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleGalleryToggle = async () => {
      setGalleryLoading(true);
      try {
          const newState = !isPublicInGallery;
          await onToggleGallery(newState);
          setIsPublicInGallery(newState);
      } catch (e: any) {
          setError("Erro ao atualizar status da galeria.");
      } finally {
          setGalleryLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-[#27272a] rounded-2xl w-full max-w-sm overflow-hidden animate-slideInUp shadow-2xl transition-colors" onClick={e => e.stopPropagation()}>
        
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#27272a] flex justify-between items-center bg-gray-50 dark:bg-[#0c0c0e]">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-widest">Compartilhar</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white transition-colors"><CloseIcon className="w-4 h-4"/></button>
        </div>

        <div className="p-6 space-y-8">
            <div className="space-y-1">
                <p className="text-xs text-gray-500 font-mono">PROJETO</p>
                <p className="text-gray-900 dark:text-white font-medium text-sm truncate">{projectName}</p>
            </div>

            {/* Gallery Toggle Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                    <GalleryIcon className="w-4 h-4" />
                    <span>Galeria Pública</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 dark:bg-[#121214] p-3 rounded-lg border border-gray-200 dark:border-[#27272a]">
                    <span className="text-xs text-gray-500">
                        {isPublicInGallery 
                            ? "Visível para todos na Galeria." 
                            : "Apenas você e colaboradores podem ver."}
                    </span>
                    <button 
                        onClick={handleGalleryToggle}
                        disabled={galleryLoading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isPublicInGallery ? 'bg-blue-600' : 'bg-gray-200 dark:bg-[#27272a]'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublicInGallery ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-[#27272a]"></div>

            {/* Invite Form */}
            <form onSubmit={handleShare} className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                    <UsersIcon className="w-4 h-4" />
                    <span>Convidar Colaborador</span>
                </div>
                <div className="space-y-2">
                    <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="w-full bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500/50 dark:focus:border-white/20 transition-all placeholder-gray-400 dark:placeholder-gray-600 font-mono"
                    />
                </div>

                {error && <p className="text-[10px] text-red-500 dark:text-red-400 text-center">{error}</p>}
                {success && <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 text-[10px]"><CheckCircleIcon className="w-3 h-3"/> {success}</div>}

                <button 
                    disabled={isChecking || !email.trim()}
                    className="w-full bg-black dark:bg-white text-white dark:text-black h-10 rounded-lg font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isChecking && <LoaderIcon className="w-3 h-3 animate-spin" />}
                    {isChecking ? 'Verificando...' : 'Enviar Convite'}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};
