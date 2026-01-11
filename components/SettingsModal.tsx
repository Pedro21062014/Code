
import React, { useState, useEffect } from 'react';
import { CloseIcon, KeyIcon, GithubIcon, NetlifyIcon } from './Icons';
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
  const [netlifyToken, setNetlifyToken] = useState(settings.netlify_access_token || '');
  const [geminiTestStatus, setGeminiTestStatus] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });
  
  useEffect(() => {
    if (isOpen) {
        setGeminiKey(settings.gemini_api_key || '');
        setGithubToken(settings.github_access_token || '');
        setNetlifyToken(settings.netlify_access_token || '');
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
      netlify_access_token: netlifyToken,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-[#27272a] animate-slideInUp transition-colors max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Configurações</h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-[#27272a] hover:text-black dark:hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </div>
        
        <div className="space-y-4">
            {/* Gemini Section */}
            <div className="p-4 bg-gray-50 dark:bg-[#27272a] rounded-xl border border-gray-200 dark:border-[#3f3f46]">
                <div className="flex items-center gap-3 mb-2 text-gray-900 dark:text-white">
                    <KeyIcon className="w-5 h-5" />
                    <h3 className="font-semibold">Chave de API do Gemini</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                    Sua chave de API do Google Gemini é necessária para gerar código.
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
                        className="w-full p-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#3f3f46] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                    />
                     <button
                        onClick={handleGeminiTest}
                        disabled={geminiTestStatus.status === 'testing' || !geminiKey}
                        className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-white bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#3f3f46] rounded-lg hover:bg-gray-50 dark:hover:bg-[#3f3f46] disabled:opacity-50 disabled:cursor-wait transition-colors"
                     >
                         {geminiTestStatus.status === 'testing' ? '...' : 'Testar'}
                    </button>
                </div>
                 {geminiTestStatus.message && (
                    <p className={`text-xs mt-2 ${geminiTestStatus.status === 'success' ? 'text-green-600 dark:text-green-400' : geminiTestStatus.status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
                        {geminiTestStatus.message}
                    </p>
                )}
            </div>

            {/* GitHub Section */}
            <div className="p-4 bg-gray-50 dark:bg-[#27272a] rounded-xl border border-gray-200 dark:border-[#3f3f46]">
                <div className="flex items-center gap-3 mb-2 text-gray-900 dark:text-white">
                    <GithubIcon className="w-5 h-5" />
                    <h3 className="font-semibold">GitHub Token</h3>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_..."
                        className="w-full p-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#3f3f46] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                    />
                </div>
            </div>

            {/* Netlify Section */}
            <div className="p-4 bg-gray-50 dark:bg-[#27272a] rounded-xl border border-gray-200 dark:border-[#3f3f46]">
                <div className="flex items-center gap-3 mb-2 text-gray-900 dark:text-white">
                    <NetlifyIcon className="w-5 h-5 text-[#00C7B7]" />
                    <h3 className="font-semibold">Netlify Token</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                    Token de acesso pessoal para publicar seus projetos.
                </p>
                <div className="flex items-center gap-2">
                    <input
                        type="password"
                        value={netlifyToken}
                        onChange={(e) => setNetlifyToken(e.target.value)}
                        placeholder="nfp_..."
                        className="w-full p-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#3f3f46] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C7B7]/50 transition-all text-sm"
                    />
                </div>
            </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-black dark:bg-white dark:text-black hover:opacity-90 transition-opacity focus:outline-none shadow-lg"
          >
            Salvar e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
