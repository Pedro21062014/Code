import React, { useState } from 'react';
import { CloseIcon, SupabaseIcon } from './Icons';

interface SupabaseIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIntegrate: (url: string, key: string) => void;
}

export const SupabaseIntegrationModal: React.FC<SupabaseIntegrationModalProps> = ({ isOpen, onClose, onIntegrate }) => {
  const [projectUrl, setProjectUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!projectUrl || !anonKey) {
      alert("Por favor, forneça a URL do Projeto e a Chave Anon do Supabase.");
      return;
    }
    onIntegrate(projectUrl, anonKey);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-[#1C1C1F] rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-700/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <SupabaseIcon /> Integrar com Supabase
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:bg-white/10">
            <CloseIcon />
          </button>
        </div>
        
        <p className="text-gray-400 text-sm mb-4">
          Insira os detalhes do seu projeto Supabase abaixo. A IA adicionará o código do cliente necessário ao seu projeto. Você pode encontrar isso no seu Painel Supabase em Configurações do Projeto &gt; API.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="projectUrl" className="block text-sm font-medium text-gray-300 mb-1">
              URL do Projeto
            </label>
            <input
              type="text"
              id="projectUrl"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://seu-projeto-ref.supabase.co"
              className="w-full p-2 bg-[#2A2B30] border border-gray-700/50 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>
          <div>
            <label htmlFor="anonKey" className="block text-sm font-medium text-gray-300 mb-1">
              Chave Anon (Pública)
            </label>
            <input
              type="password"
              id="anonKey"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="ey..."
              className="w-full p-2 bg-[#2A2B30] border border-gray-700/50 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-700 focus:outline-none"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none flex items-center gap-2"
          >
            <SupabaseIcon className="w-4 h-4" />
            <span>Integrar</span>
          </button>
        </div>
      </div>
    </div>
  );
};