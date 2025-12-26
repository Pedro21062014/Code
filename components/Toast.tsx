
import React, { useEffect } from 'react';
import { CloseIcon, ShieldIcon } from './Icons';

interface ToastProps {
  message: string | null;
  onClose: () => void;
  type?: 'error' | 'success' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, type = 'error' }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-slideInUp">
      <div className={`flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md max-w-sm ${
        type === 'error' 
          ? 'bg-red-950/80 border-red-500/30 text-red-200' 
          : 'bg-[#18181b]/90 border-[#27272a] text-white'
      }`}>
        <div className={`mt-0.5 p-1 rounded-full ${type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
             <ShieldIcon className="w-4 h-4" />
        </div>
        <div className="flex-1">
            <h4 className="text-sm font-bold mb-1">
                {type === 'error' ? 'Erro de Sistema' : 'Notificação'}
            </h4>
            <p className="text-xs opacity-90 leading-relaxed font-mono">
                {message}
            </p>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
