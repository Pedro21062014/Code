
import React, { useState, useEffect } from 'react';
import { CloseIcon, NetlifyIcon, LogInIcon } from './Icons';
import { UserSettings } from '../types';
import { NETLIFY_CLIENT_ID } from '../constants';

interface NetlifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: Partial<Omit<UserSettings, 'id' | 'updated_at'>>) => void;
}

export const NetlifyModal: React.FC<NetlifyModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [token, setToken] = useState('');
  
  // Prioritize user setting only if it's a valid string, otherwise use default
  // Important: .trim() to remove accidental spaces from copy-paste
  const userClientId = settings.netlify_client_id?.trim();
  const effectiveClientId = userClientId && userClientId.length > 5 ? userClientId : NETLIFY_CLIENT_ID;

  useEffect(() => {
    if (isOpen) {
      setToken(settings.netlify_access_token || '');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      netlify_access_token: token,
    });
    onClose();
  };

  const handleConnect = () => {
      if (!effectiveClientId) {
          alert("Erro de configuração: Client ID do Netlify não encontrado.");
          return;
      }

      // Netlify requires EXACT match on Redirect URI.
      // If user is on localhost but registered https://codegem.pages.dev, this will fail on localhost.
      const origin = window.location.origin; // e.g., https://codegem.pages.dev or http://localhost:5173
      
      // Warn if on localhost but using production ID (likely to fail unless localhost is added to Netlify)
      if (origin.includes('localhost') && effectiveClientId === NETLIFY_CLIENT_ID) {
          const proceed = window.confirm("Aviso: O login com Netlify pode falhar no localhost se a URL de redirecionamento (http://localhost:5173) não estiver registrada no seu App OAuth do Netlify.\n\nDeseja continuar mesmo assim?");
          if (!proceed) return;
      }
      
      // Construct URL
      // We use 'response_type=token' (Implicit Grant)
      const url = `https://app.netlify.com/authorize?client_id=${effectiveClientId}&response_type=token&redirect_uri=${encodeURIComponent(origin)}`;
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      window.open(url, 'Netlify Auth', `width=${width},height=${height},top=${top},left=${left}`);
      
      // Listener is handled in App.tsx (checking window.opener or hash)
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
            <NetlifyIcon className="w-6 h-6 text-[#00C7B7]" /> Configurar Netlify
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-[#27272a] hover:text-black dark:hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          Conecte sua conta Netlify para fazer deploy dos seus projetos com um clique.
        </p>

        {effectiveClientId ? (
            <div className="mb-6">
                <button 
                    onClick={handleConnect}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00C7B7] hover:bg-[#00b3a6] text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-[#00C7B7]/20"
                >
                    <LogInIcon className="w-5 h-5" />
                    Conectar com Netlify
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-2 font-mono">
                    ID: {effectiveClientId.substring(0, 8)}... (Verifique nas Configurações se incorreto)
                </p>
                
                <div className="flex items-center gap-3 my-4">
                    <div className="h-px bg-gray-200 dark:bg-[#27272a] flex-1"></div>
                    <span className="text-xs text-gray-400 uppercase font-medium">OU MANUALMENTE</span>
                    <div className="h-px bg-gray-200 dark:bg-[#27272a] flex-1"></div>
                </div>
            </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Personal Access Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="nfp_..."
              className="w-full p-2 bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-[#27272a] rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C7B7]/50 transition-all"
            />
            <p className="text-[10px] text-gray-500 mt-2">
                Caso prefira, crie um token em: <a href="https://app.netlify.com/user/applications#personal-access-tokens" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Netlify User Settings</a>
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-black dark:bg-white dark:text-black hover:opacity-80 focus:outline-none flex items-center gap-2 shadow-lg"
          >
            Salvar Token
          </button>
        </div>
      </div>
    </div>
  );
};
