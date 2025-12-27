
import React, { useEffect, useState } from 'react';
import { CloseIcon, CheckCircleIcon } from './Icons';

export interface ToastProps {
  message: string | null;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, type = 'info', duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message && !isVisible) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md ${
        type === 'error' ? 'bg-red-950/80 border-red-500/30 text-red-200' :
        type === 'success' ? 'bg-green-950/80 border-green-500/30 text-green-200' :
        'bg-zinc-900/90 border-white/10 text-white'
      }`}>
        {type === 'error' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
        {type === 'success' && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
        {type === 'info' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
        
        <span className="text-sm font-medium pr-2">{message}</span>
        
        <button 
            onClick={() => setIsVisible(false)} 
            className="p-1 hover:bg-white/10 rounded-full transition-colors opacity-70 hover:opacity-100"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
