import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AIProvider, AIModel } from '../types';
import { AI_MODELS } from '../constants';
import { SparklesIcon, CloseIcon } from './Icons';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string, provider: AIProvider, model: string) => void;
  onClose?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, onClose }) => {
  const [input, setInput] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AIProvider.Gemini);
  const [selectedModel, setSelectedModel] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const providerModels = AI_MODELS.filter(m => m.provider === selectedProvider);

  useEffect(() => {
    // Set the default model when the provider changes or on initial load
    if (providerModels.length > 0 && !providerModels.some(m => m.id === selectedModel)) {
        setSelectedModel(providerModels[0].id);
    }
  }, [selectedProvider, providerModels]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedModel) return;
    onSendMessage(input, selectedProvider, selectedModel);
    setInput('');
  };
  
  return (
    <div className="bg-[#16171D] w-full max-w-sm lg:max-w-md flex flex-col h-full border-l border-gray-800">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Chat</h2>
        {onClose && (
            <button onClick={onClose} className="p-1 rounded-md text-gray-300 hover:bg-white/10">
                <CloseIcon />
            </button>
        )}
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${msg.role === 'user' ? 'bg-blue-800 text-white' : 'bg-[#2A2B30] text-gray-200'}`}>
                {msg.isThinking ? 
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm italic">{msg.content}</span>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                 : <span className="whitespace-pre-wrap">{msg.content}</span>}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-gray-800">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center space-x-2 mb-2">
            <select
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value as AIProvider)}
              className="bg-[#2A2B30] border border-gray-700/50 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {Object.values(AIProvider).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select 
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="bg-[#2A2B30] border border-gray-700/50 rounded-md px-2 py-1 text-xs w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {providerModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                }
            }}
            placeholder="Describe what you want to build or change..."
            className="w-full p-2 bg-[#2A2B30] border border-gray-700/50 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            rows={4}
          />
          <button type="submit" className="w-full mt-2 bg-blue-800 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center space-x-2">
            <SparklesIcon />
            <span>Generate</span>
          </button>
        </form>
      </div>
    </div>
  );
};
