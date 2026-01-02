
import React from 'react';
import { CheckCircleIcon } from './Icons';

interface SaveSuccessAnimationProps {
  isVisible: boolean;
}

export const SaveSuccessAnimation: React.FC<SaveSuccessAnimationProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div className="bg-black/40 backdrop-blur-md px-8 py-6 rounded-3xl flex flex-col items-center gap-4 animate-slideInUp shadow-2xl border border-white/10">
        <div className="relative">
            <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 animate-pulse"></div>
            <CheckCircleIcon className="w-16 h-16 text-green-400 relative z-10" />
        </div>
        <h2 className="text-white text-xl font-bold tracking-tight">Projeto Salvo</h2>
        <p className="text-gray-400 text-sm">Suas alterações estão seguras.</p>
      </div>
    </div>
  );
};
