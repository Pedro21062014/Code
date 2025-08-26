import React, { useState } from 'react';
import { CloseIcon, KeyIcon } from './Icons';
import { GoogleGenAI } from '@google/genai';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
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
        return { success: false, message: `Falha na conexão. Verifique sua chave e tente novamente.` };
    }
};

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<{ state: 'idle' | 'testing' | 'success' | 'error'; message: string }>({ state: 'idle', message: '' });

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    setStatus({ state: 'testing', message: 'Testando conexão...' });
    const result = await testApiKey(apiKey);
    if (result.success) {
      setStatus({ state: 'success', message: result.message });
      setTimeout(() => onSave(apiKey), 1000); // Wait a moment so user can see success message
    } else {
      setStatus({ state: 'error', message: result.message });
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-[#1C1C1F] rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-700/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2"><KeyIcon /> Chave de API do Gemini</h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:bg-white/10">
            <CloseIcon />
          </button>
        </div>
        
        <div className="space-y-4 text-gray-300">
            <p className="text-sm">
                Para começar a gerar código com o Gemini, por favor, insira sua chave de API do Google AI Studio. Sua chave será salva com segurança em seu navegador.
            </p>
             <div>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                        setApiKey(e.target.value);
                        setStatus({ state: 'idle', message: '' });
                    }}
                    placeholder="Cole sua chave de API aqui"
                    className="w-full p-2 bg-[#2A2B30] border border-gray-700/50 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    disabled={status.state === 'testing'}
                />
            </div>
            {status.message && (
                <p className={`text-sm ${status.state === 'success' ? 'text-green-400' : status.state === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                    {status.message}
                </p>
            )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleTestAndSave}
            disabled={status.state === 'testing' || !apiKey}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {status.state === 'testing' ? 'Testando...' : 'Testar e Salvar Chave'}
          </button>
        </div>
      </div>
    </div>
  );
};
