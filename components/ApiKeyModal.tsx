
import React, { useState } from 'react';
import { CloseIcon, KeyIcon } from './Icons';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
      onClose();
    } else {
      alert("Por favor, insira uma chave de API.");
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-[#27272a] animate-slideInUp transition-colors"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2"><KeyIcon /> Chave de API do Gemini</h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-[#27272a] hover:text-black dark:hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </div>
        
        <div className="space-y-4 text-gray-600 dark:text-gray-400">
            <p className="text-sm">
                Para começar a gerar código com o Gemini, por favor, insira sua chave de API do Google AI Studio. Sua chave será salva com segurança em seu perfil.
            </p>
             <div>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Cole sua chave de API aqui"
                    className="w-full p-2 bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-[#27272a] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
                />
            </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-black dark:bg-white dark:text-black hover:opacity-90 focus:outline-none flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg"
          >
            Salvar Chave
          </button>
        </div>
      </div>
    </div>
  );
};
