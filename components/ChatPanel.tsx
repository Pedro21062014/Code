
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AIProvider, AIModel, ProjectFile } from '../types';
import { AI_MODELS, INITIAL_CHAT_MESSAGE } from '../constants';
import { generateCodeWithGemini } from '../services/geminiService';
import { generateCodeWithMockAPI } from '../services/mockAIService';
import { SparklesIcon } from './Icons';

interface ChatPanelProps {
  files: ProjectFile[];
  onCodeUpdate: (newFiles: ProjectFile[], message: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ files, onCodeUpdate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: INITIAL_CHAT_MESSAGE }]);
  const [input, setInput] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AIProvider.Gemini);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '', isThinking: true }]);
    setInput('');

    try {
      let result;
      switch (selectedProvider) {
        case AIProvider.Gemini:
          result = await generateCodeWithGemini(input, files);
          break;
        case AIProvider.OpenAI:
        case AIProvider.DeepSeek:
          result = await generateCodeWithMockAPI(selectedProvider, files);
          break;
        default:
          throw new Error('Unsupported AI provider');
      }
      onCodeUpdate(result.files, result.message);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: `Error: ${errorMessage}` }]);
    }
  };
  
  const providerModels = AI_MODELS.filter(m => m.provider === selectedProvider);
  
  return (
    <div className="bg-[#252526] w-full max-w-sm lg:max-w-md flex flex-col h-full border-l border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Chat</h2>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#3e3e42] text-gray-200'}`}>
                {msg.isThinking ? 
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                  </div>
                 : msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center space-x-2 mb-2">
            <select
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value as AIProvider)}
              className="bg-[#3c3c3c] border border-gray-600 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(AIProvider).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="bg-[#3c3c3c] border border-gray-600 rounded-md px-2 py-1 text-xs w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
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
            className="w-full p-2 bg-[#3c3c3c] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
          />
          <button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center space-x-2">
            <SparklesIcon />
            <span>Generate</span>
          </button>
        </form>
      </div>
    </div>
  );
};
