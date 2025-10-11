import React, { useState, useEffect } from 'react';
import { CloseIcon, SupabaseIcon } from './Icons';
import { UserSettings } from '../types';

interface SupabaseAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: Partial<Omit<UserSettings, 'id' | 'updated_at'>>) => void;
}

export const SupabaseAdminModal: React.FC<SupabaseAdminModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [projectUrl, setProjectUrl] = useState(settings.supabase_project_url || '');
  const [anonKey, setAnonKey] = useState(settings.supabase_anon_key || '');
  const [serviceKey, setServiceKey] = useState(settings.supabase_service_key || '');

  useEffect(() => {
    if (isOpen) {
        setProjectUrl(settings.supabase_project_url || '');
        setAnonKey(settings.supabase_anon_key || '');
        setServiceKey(settings.supabase_service_key || '');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      supabase_project_url: projectUrl,
      supabase_anon_key: anonKey,
      supabase_service_key: serviceKey,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-var-bg-subtle rounded-lg shadow-xl w-full max-w-lg p-6 border border-var-border-default animate-slideInUp"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-var-fg-default flex items-center gap-2">
            <SupabaseIcon /> Gerenciar Integração Supabase
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-var-fg-muted hover:bg-var-bg-interactive">
            <CloseIcon />
          </button>
        </div>
        
        <p className="text-var-fg-muted text-sm mb-4">
          Forneça as credenciais do seu projeto Supabase para permitir que a IA interaja com seu banco de dados. Você pode encontrá-las em seu Painel Supabase em Configurações do Projeto &gt; API.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-var-fg-default mb-1">URL do Projeto</label>
            <input
              type="text"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://seu-projeto-ref.supabase.co"
              className="w-full p-2 bg-var-bg-interactive border border-var-border-default rounded-md text-var-fg-default placeholder-var-fg-subtle focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-var-fg-default mb-1">Chave Anon (Pública)</label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="Sua chave pública anon"
              className="w-full p-2 bg-var-bg-interactive border border-var-border-default rounded-md text-var-fg-default placeholder-var-fg-subtle focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>
           <div className="p-3 bg-red-900/50 border border-red-700/50 rounded-lg">
            <label className="block text-sm font-medium text-red-200 mb-1">Chave Service Role (Secreta)</label>
             <p className="text-xs text-red-300/80 mb-2">
                Esta chave concede acesso de administrador total ao seu banco de dados. Manuseie com cuidado. Ela será armazenada com segurança no seu perfil.
            </p>
            <input
              type="password"
              value={serviceKey}
              onChange={(e) => setServiceKey(e.target.value)}
              placeholder="Sua chave secreta service_role"
              className="w-full p-2 bg-var-bg-subtle border border-var-border-default rounded-md text-var-fg-default placeholder-var-fg-subtle focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none flex items-center gap-2"
          >
            Salvar Credenciais
          </button>
        </div>
      </div>
    </div>
  );
};