import React, { useState, useEffect } from 'react';
import { CloseIcon, StripeIcon } from './Icons';
import { UserSettings } from '../types';

interface StripeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: Partial<Omit<UserSettings, 'id' | 'updated_at'>>) => void;
}

export const StripeModal: React.FC<StripeModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [publicKey, setPublicKey] = useState('');
  const [secretKey, setSecretKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPublicKey(settings.stripe_public_key || '');
      setSecretKey(settings.stripe_secret_key || '');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      stripe_public_key: publicKey,
      stripe_secret_key: secretKey,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#18181b] rounded-lg shadow-xl w-full max-w-lg p-6 border border-[#27272a] animate-slideInUp"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <StripeIcon /> Gerenciar Integração Stripe
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:bg-[#27272a] hover:text-white">
            <CloseIcon />
          </button>
        </div>
        
        <p className="text-gray-400 text-sm mb-4">
          Forneça suas chaves de API do Stripe para permitir que a IA gere funcionalidades de pagamento. Você pode encontrá-las em seu Painel do Stripe para Desenvolvedores &gt; Chaves de API.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Chave Publicável</label>
            <input
              type="text"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="pk_test_..."
              className="w-full p-2 bg-[#27272a] border border-[#27272a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/50"
            />
          </div>
           <div className="p-3 bg-red-900/50 border border-red-700/50 rounded-lg">
            <label className="block text-sm font-medium text-red-200 mb-1">Chave Secreta</label>
             <p className="text-xs text-red-300/80 mb-2">
                Esta chave concede acesso total à sua conta Stripe. Manuseie com cuidado. Ela será armazenada com segurança em seu perfil.
            </p>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_test_..."
              className="w-full p-2 bg-[#121214] border border-[#27272a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[#635BFF] hover:opacity-90 focus:outline-none flex items-center gap-2"
          >
            Salvar Chaves do Stripe
          </button>
        </div>
      </div>
    </div>
  );
};