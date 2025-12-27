
import React, { useState, useEffect } from 'react';
import { CloseIcon, KeyIcon, GithubIcon } from './Icons';
import { UserSettings } from '../types';
import { GoogleGenAI } from '@google/genai';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: Partial<Omit<UserSettings, 'id' | 'updated_at'>>) => void;
}

const testApiKey = async (key: string): Promise<{ success: boolean; message: string }> => {
    if (!key) return { success: false, message: 'A chave não pode estar em branco.' };
    try {
        const ai = new GoogleGenAI({ apiKey: key });
        /* Using gemini-3-flash-preview for the connectivity test as it's the standard basic model */
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'diga "ok"' });
        // FIX: Safely check for response.text
        const text = response.text || "";
        if (text.trim().toLowerCase().includes('ok')) {
            return { success: true, message: 'Conexão bem-sucedida!' };
        }
        return { success: false, message: 'A chave é válida, mas a resposta foi inesperada.' };
    } catch (e: any) {
        console.error("API Key test failed", e);
        return { success: false, message: `Falha na conexão: ${e.message}` };
    }
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [geminiKey, setGeminiKey] = useState(settings.gemini_api_key || '');
  const [githubToken, setGithubToken] = useState(settings.github_access_token || '');
  const [geminiTestStatus, setGeminiTestStatus] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });
  
  useEffect(() => {
    if (isOpen) {
        setGeminiKey(settings.gemini_api_key || '');
        setGithubToken(settings.github_access_token || '');
        setGeminiTestStatus({ status: 'idle', message: '' });
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleGeminiTest = async () => {
    setGeminiTestStatus({ status: 'testing', message: 'Testando...' });
    const result = await testApiKey(geminiKey);
    if (result.success) {
      setGeminiTestStatus({ status: 'success', message: result.message });
    } else {
      setGeminiTestStatus({ status: 'error', message: result.message });
    }
  };
  
  const handleSave = () => {
    onSave({ 
      gemini_api_key: geminiKey,
      github_access_token: githubToken,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#18181b] rounded-lg shadow-xl w-full max-w-md p-6 border border-[#27272a] animate-slideInUp"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Configurações</h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:bg-[#27272a] hover:text-white">
            <CloseIcon />
          </button>
        </div>
        
        <div className="space-y-4 text-white">
            <div className="p-4 bg-[#27272a] rounded-lg border border-[#3f3f46]">
                <div className="flex items-center gap-3 mb-2">
                    <KeyIcon />
                    <h3 className="font-semibold text-white">Chave de API do Gemini</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                    Sua chave de API do Google Gemini é necessária. Ela é armazenada com segurança no seu perfil.
                </p>
                <div className="flex items-center gap-2">
                    <input
                        type="password"
                        value={geminiKey}
                        onChange={(e) => {
                            setGeminiKey(e.target.value);
                            setGeminiTestStatus({ status: 'idle', message: '' });
                        }}
                        placeholder="Cole sua chave de API aqui"
                        className="w-full p-2 bg-[#18181b] border border-[#3f3f46] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                     <button
                        onClick={handleGeminiTest}
                        disabled={geminiTestStatus.status === 'testing' || !geminiKey}
                        className="px-3 py-2 text-xs font-medium text-white bg-[#18181b] border border-[#3f3f46] rounded-md hover:bg-[#3f3f46] disabled:opacity-50 disabled:cursor-wait"
                     >
                         {geminiTestStatus.status === 'testing' ? '...' : 'Testar'}
                    </button>
                </div>
                 {geminiTestStatus.message && (
                    <p className={`text-xs mt-2 ${geminiTestStatus.status === 'success' ? 'text-green-400' : geminiTestStatus.status === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                        {geminiTestStatus.message}
                    </p>
                )}
            </div>

            <div className="p-4 bg-[#27272a] rounded-lg border border-[#3f3f46]">
                <div className="flex items-center gap-3 mb-2">
                    <GithubIcon />
                    <h3 className="font-semibold text-white">Token de Acesso do GitHub</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                    Forneça um token para importar repositórios privados e aumentar os limites da API.
                </p>
                <div className="flex items-center gap-2">
                    <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="Cole seu token aqui (ex: ghp_...)"
                        className="w-full p-2 bg-[#18181b] border border-[#3f3f46] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>
                 <p className="text-xs text-gray-400 mt-2">
                   O token precisa ter escopo de <code className="bg-[#18181b] px-1 py-0.5 rounded-sm text-xs font-mono">repo</code>.
                </p>
            </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md text-sm font-medium text-black bg-white hover:bg-gray-200 transition-colors focus:outline-none"
          >
            Salvar e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
