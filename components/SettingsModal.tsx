import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { KeyIcon, CloseIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialSettings, onSave }) => {
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
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
          <h2 className="text-xl font-semibold text-white">Configurações de Chave de API</h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:bg-white/10">
            <CloseIcon />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="geminiKey" className="block text-sm font-medium text-gray-300 mb-1">
              Chave de API do Gemini
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <KeyIcon />
              </span>
              <input
                type="password"
                id="geminiKey"
                name="geminiKey"
                value={settings.geminiKey}
                onChange={handleChange}
                placeholder="AIza..."
                className="w-full pl-10 p-2 bg-[#2A2B30] border border-gray-700/50 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
          <div>
            <label htmlFor="openAIKey" className="block text-sm font-medium text-gray-300 mb-1">
              Chave de API da OpenAI
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <KeyIcon />
              </span>
              <input
                type="password"
                id="openAIKey"
                name="openAIKey"
                value={settings.openAIKey}
                onChange={handleChange}
                placeholder="sk-..."
                className="w-full pl-10 p-2 bg-[#2A2B30] border border-gray-700/50 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
          <div>
            <label htmlFor="claudeKey" className="block text-sm font-medium text-gray-300 mb-1">
              Chave de API do Claude
            </label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <KeyIcon />
                </span>
                <input
                    type="password"
                    id="claudeKey"
                    name="claudeKey"
                    value={settings.claudeKey}
                    onChange={handleChange}
                    placeholder="sk-ant-..."
                    className="w-full pl-10 p-2 bg-[#2A2B30] border border-gray-700/50 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
            </div>
          </div>
          <div>
            <label htmlFor="deepSeekKey" className="block text-sm font-medium text-gray-300 mb-1">
              Chave de API da DeepSeek
            </label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <KeyIcon />
                </span>
                <input
                    type="password"
                    id="deepSeekKey"
                    name="deepSeekKey"
                    value={settings.deepSeekKey}
                    onChange={handleChange}
                    placeholder="sk-..."
                    className="w-full pl-10 p-2 bg-[#2A2B30] border border-gray-700/50 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
            </div>
          </div>
          <div>
            <label htmlFor="kimiKey" className="block text-sm font-medium text-gray-300 mb-1">
              Chave de API da Kimi
            </label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <KeyIcon />
                </span>
                <input
                    type="password"
                    id="kimiKey"
                    name="kimiKey"
                    value={settings.kimiKey}
                    onChange={handleChange}
                    placeholder="sk-..."
                    className="w-full pl-10 p-2 bg-[#2A2B30] border border-gray-700/50 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
            </div>
          </div>
           <div>
            <label htmlFor="qwenKey" className="block text-sm font-medium text-gray-300 mb-1">
              Chave de API da Qwen
            </label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <KeyIcon />
                </span>
                <input
                    type="password"
                    id="qwenKey"
                    name="qwenKey"
                    value={settings.qwenKey}
                    onChange={handleChange}
                    placeholder="sk-..."
                    className="w-full pl-10 p-2 bg-[#2A2B30] border border-gray-700/50 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-800 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};