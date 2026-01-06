
import React, { useState, useEffect } from 'react';
import { CloseIcon, OpenAIIcon } from './Icons';
import { UserSettings } from '../types';

interface OpenAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: Partial<Omit<UserSettings, 'id' | 'updated_at'>>) => void;
}

export const OpenAIModal: React.FC<OpenAIModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setApiKey(settings.openai_api_key || '');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      openai_api_key: apiKey,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#18181b] rounded-lg shadow-xl w-full max-w-lg p-6 border border-gray-200 dark:border-[#27272a] animate-slideInUp transition-colors"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <OpenAIIcon /> Configurar OpenAI
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-[#27272a] hover:text-black dark:hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Adicione sua chave de API da OpenAI para acessar modelos como GPT-4o e GPT-3.5 Turbo. Sua chave é armazenada com segurança.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Chave de API (sk-...)</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-proj-..."
              className="w-full p-2 bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-[#27272a] rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-black dark:bg-white dark:text-black hover:opacity-80 focus:outline-none flex items-center gap-2 shadow-lg"
          >
            Salvar Chave
          </button>
        </div>
      </div>
    </div>
  );
};
