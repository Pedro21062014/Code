import React, { useState } from 'react';
import { CloseIcon, KeyIcon, GithubIcon } from './Icons';
import { UserSettings } from '../types';
import { GoogleGenAI } from '@google/genai';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<UserSettings>>;
}

const testApiKey = async (key: string): Promise<{ success: boolean; message: string }> => {
    if (!key) return { success: false, message: 'A chave não pode estar em branco.' };
    try {
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'diga "ok"' });
        if (response.text.trim().toLowerCase() === 'ok') {
            return { success: true, message: 'Conexão bem-sucedida!' };
        }
        return { success: false, message: 'A chave é válida, mas a resposta foi inesperada.' };
    } catch (e: any) {
        console.error("API Key test failed", e);
        return { success: false, message: `Falha na conexão: ${e.message}` };
    }
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [githubToken, setGithubToken] = useState(settings.githubAccessToken || '');
  const [testStatus, setTestStatus] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });
  
  React.useEffect(() => {
    if (isOpen) {
        setGeminiKey(settings.geminiApiKey || '');
        setGithubToken(settings.githubAccessToken || '');
        setTestStatus({ status: 'idle', message: '' });
    }
  }, [isOpen, settings.geminiApiKey, settings.githubAccessToken]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTestStatus({ status: 'testing', message: 'Testando...' });
    const result = await testApiKey(geminiKey);
    if (result.success) {
      setTestStatus({ status: 'success', message: result.message });
    } else {
      setTestStatus({ status: 'error', message: result.message });
    }
  };
  
  const handleSave = () => {
    onSettingsChange(prev => ({ 
      ...prev, 
      geminiApiKey: geminiKey,
      githubAccessToken: githubToken
    }));
    onClose();
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Configurações</h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:bg-white/10">
            <CloseIcon />
          </button>
        </div>
        
        <div className="space-y-4 text-gray-300">
            <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                    <KeyIcon />
                    <h3 className="font-semibold text-white">Chave de API do Gemini</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                    Sua chave de API do Google Gemini é necessária para usar os modelos Gemini. Ela é armazenada com segurança no seu navegador.
                </p>
                <div className="flex items-center gap-2">
                    <input
                        type="password"
                        value={geminiKey}
                        onChange={(e) => {
                            setGeminiKey(e.target.value);
                            setTestStatus({ status: 'idle', message: '' });
                        }}
                        placeholder="Cole sua chave de API aqui"
                        className="w-full p-2 bg-[#2A2B30] border border-gray-700/50 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                     <button
                        onClick={handleTest}
                        disabled={testStatus.status === 'testing' || !geminiKey}
                        className="px-3 py-2 text-xs font-medium text-white bg-gray-600 rounded-md hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-wait"
                     >
                         {testStatus.status === 'testing' ? '...' : 'Testar'}
                    </button>
                </div>
                 {testStatus.message && (
                    <p className={`text-xs mt-2 ${testStatus.status === 'success' ? 'text-green-400' : testStatus.status === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                        {testStatus.message}
                    </p>
                )}
            </div>

            <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                    <GithubIcon />
                    <h3 className="font-semibold text-white">Token de Acesso do GitHub</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                    Forneça um token de acesso pessoal para importar repositórios privados. Para repositórios públicos, isso aumenta os limites de taxa da API.
                </p>
                <div className="flex items-center gap-2">
                    <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="Cole seu token aqui (ex: ghp_...)"
                        className="w-full p-2 bg-[#2A2B30] border border-gray-700/50 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>
                 <p className="text-xs text-gray-400 mt-2">
                   O token precisa ter escopo de <code className="bg-gray-700 px-1 py-0.5 rounded-sm text-xs font-mono">repo</code>.
                </p>
            </div>
            
            <div className="p-4 bg-gray-800/50 rounded-lg">
                 <h3 className="font-semibold text-white">Outros Provedores de IA (Plano Pro)</h3>
                 <p className="text-xs text-gray-400 mt-2">
                    O acesso aos modelos da OpenAI, DeepSeek e outros é gerenciado por meio do plano Pro. Nenhuma chave de API adicional é necessária de sua parte.
                </p>
            </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
          >
            Salvar e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};