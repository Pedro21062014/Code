
import React, { useState, useEffect } from 'react';
import { CloseIcon, DatabaseIcon } from './Icons';
import { UserSettings } from '../types';

interface NeonModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: Partial<Omit<UserSettings, 'id' | 'updated_at'>>) => void;
}

export const NeonModal: React.FC<NeonModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [connectionString, setConnectionString] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConnectionString(settings.neon_connection_string || '');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      neon_connection_string: connectionString,
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
            <DatabaseIcon /> Gerenciar Integração Neon
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-[#27272a] hover:text-black dark:hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Forneça a string de conexão do seu banco de dados Neon (Postgres) para permitir que a IA gere código de backend que interaja com ele. Você pode encontrá-la no painel do seu projeto Neon.
        </p>

        <div className="space-y-4">
           <div className="p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700/50 rounded-lg">
            <label className="block text-sm font-medium text-red-600 dark:text-red-200 mb-1">String de Conexão</label>
             <p className="text-xs text-red-500 dark:text-red-300/80 mb-2">
                Esta string contém suas credenciais de banco de dados. Manuseie com cuidado. Ela será armazenada com segurança em seu perfil.
            </p>
            <input
              type="password"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              placeholder="postgresql://user:password@host:port/dbname"
              className="w-full p-2 bg-white dark:bg-[#121214] border border-red-200 dark:border-[#27272a] rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono text-xs"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none flex items-center gap-2 shadow-lg"
          >
            Salvar String de Conexão
          </button>
        </div>
      </div>
    </div>
  );
};
