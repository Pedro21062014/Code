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
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-var-bg-subtle rounded-lg shadow-xl w-full max-w-md p-6 border border-var-border-default"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-var-fg-default flex items-center gap-2"><KeyIcon /> Chave de API do Gemini</h2>
          <button onClick={onClose} className="p-1 rounded-md text-var-fg-muted hover:bg-var-bg-interactive">
            <CloseIcon />
          </button>
        </div>
        
        <div className="space-y-4 text-var-fg-muted">
            <p className="text-sm">
                Para começar a gerar código com o Gemini, por favor, insira sua chave de API do Google AI Studio. Sua chave será salva com segurança em seu perfil.
            </p>
             <div>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Cole sua chave de API aqui"
                    className="w-full p-2 bg-var-bg-interactive border border-var-border-default rounded-md text-var-fg-default placeholder-var-fg-subtle focus:outline-none focus:ring-2 focus:ring-var-accent/50"
                />
            </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="px-4 py-2 rounded-md text-sm font-medium text-var-accent-fg bg-var-accent hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-var-bg-subtle focus:ring-var-accent flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Salvar Chave
          </button>
        </div>
      </div>
    </div>
  );
};