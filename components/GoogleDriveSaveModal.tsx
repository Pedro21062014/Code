
import React, { useEffect, useRef } from 'react';
import { CloseIcon, GoogleDriveIcon, CloudSimpleIcon, CheckCircleIcon, LogInIcon } from './Icons';

interface GoogleDriveSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: 'limit' | 'size';
  currentCount?: number;
  currentSizeKB?: number;
  isConnected: boolean;
  onConnect: () => void;
  onConfirmSave: () => Promise<void>;
}

export const GoogleDriveSaveModal: React.FC<GoogleDriveSaveModalProps> = ({ 
    isOpen, onClose, reason, currentCount, currentSizeKB, isConnected, onConnect, onConfirmSave 
}) => {
  const [status, setStatus] = React.useState<'idle' | 'connecting' | 'uploading' | 'success'>('idle');
  const isMounted = useRef(false);

  useEffect(() => {
      isMounted.current = true;
      if (isOpen) setStatus('idle');
      return () => { isMounted.current = false; };
  }, [isOpen]);

  // Reset status to idle if we successfully connected but haven't saved yet
  useEffect(() => {
      if (isConnected && status === 'connecting' && isMounted.current) {
          setStatus('idle');
      }
  }, [isConnected, status]);

  if (!isOpen) return null;

  const handleAction = async () => {
      if (!isConnected) {
          // Flow: Connect first
          if (isMounted.current) setStatus('connecting');
          onConnect(); 
      } else {
          // Flow: Save
          if (isMounted.current) setStatus('uploading');
          try {
              await onConfirmSave();
              if (isMounted.current) setStatus('success');
          } catch (error: any) {
              console.error("Failed to save to Drive", error);
              if (isMounted.current) {
                  setStatus('idle');
                  // Mostra a mensagem real do erro (ex: API not enabled) para facilitar o debug
                  const errorMessage = error instanceof Error ? error.message : "Verifique se deu permissão e tente novamente.";
                  alert(`Erro ao salvar no Google Drive: ${errorMessage}`);
              }
          }
      }
  };

  const isProcessing = status === 'connecting' || status === 'uploading';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={isProcessing ? undefined : onClose}>
      <div 
        className="bg-white dark:bg-[#09090b] w-full max-w-md border border-gray-200 dark:border-[#27272a] shadow-2xl rounded-2xl overflow-hidden animate-slideInUp flex flex-col relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
            onClick={onClose} 
            disabled={isProcessing}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-[#1a1a1c] transition-colors disabled:opacity-50"
        >
            <CloseIcon className="w-4 h-4" />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
            
            {status === 'success' ? (
                <div className="animate-scaleIn flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Salvo no Drive!</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Seu projeto foi salvo diretamente na sua conta do Google Drive (formato .ai). 
                    </p>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl text-sm hover:opacity-90 transition-all"
                    >
                        Continuar Editando
                    </button>
                </div>
            ) : (
                <>
                    <div className="w-20 h-20 bg-blue-50 dark:bg-[#121214] rounded-full flex items-center justify-center mb-6 relative">
                        <CloudSimpleIcon className="w-8 h-8 text-gray-400" />
                        <div className={`absolute -bottom-1 -right-1 bg-white dark:bg-[#09090b] p-1.5 rounded-full border border-gray-100 dark:border-[#27272a] ${isConnected ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                            <GoogleDriveIcon className="w-6 h-6" />
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {reason === 'limit' ? "Limite de Projetos Atingido" : "Arquivo Muito Grande"}
                    </h2>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                        {reason === 'limit' 
                            ? `Você atingiu o limite de ${currentCount} projetos na nuvem.` 
                            : `Este projeto (${currentSizeKB?.toFixed(1)}KB) excede o limite de 500KB.`
                        }
                        <br/>
                        {!isConnected 
                            ? "Use sua conta Google para salvar projetos ilimitados no Drive."
                            : "Salve diretamente no seu Google Drive para continuar."
                        }
                    </p>

                    <button 
                        onClick={handleAction}
                        disabled={isProcessing}
                        className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 font-semibold rounded-xl transition-all group shadow-sm 
                            ${!isConnected 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] hover:bg-gray-50 dark:hover:bg-[#202023] text-gray-900 dark:text-white'
                            }`}
                    >
                        {isProcessing ? (
                            <span className="flex items-center gap-2 text-sm">
                                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {status === 'connecting' ? 'Conectando...' : 'Enviando ao Drive...'}
                            </span>
                        ) : (
                            <>
                                {isConnected ? (
                                    <>
                                        <GoogleDriveIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm">Salvar no Google Drive</span>
                                    </>
                                ) : (
                                    <>
                                        <LogInIcon className="w-5 h-5" />
                                        <span className="text-sm">Conectar Google Drive</span>
                                    </>
                                )}
                            </>
                        )}
                    </button>
                    
                    <p className="text-[10px] text-gray-400 mt-4">
                        O arquivo será salvo na pasta raiz do seu Google Drive.
                    </p>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
