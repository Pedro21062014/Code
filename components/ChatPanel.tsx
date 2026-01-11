
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AIProvider, AIModel } from '../types';
import { AI_MODELS } from '../constants';
import { SparklesIcon, PaperclipIcon, LoaderIcon, SupabaseIcon, GithubIcon, CheckCircleIcon, TerminalIcon, PlusIcon } from './Icons';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string, provider: AIProvider, model: string, attachments: { data: string; mimeType: string }[]) => void;
  isProUser: boolean;
  onCloseMobile?: () => void;
  projectName?: string;
  generatingFile: string | null;
  isGenerating: boolean;
  userGeminiKey?: string;
  onOpenSupabase?: () => void;
  onOpenGithub?: () => void;
  onOpenSettings?: () => void;
  availableModels?: AIModel[];
  credits?: number;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
    messages, onSendMessage, generatingFile, isGenerating, 
    onOpenSupabase, onOpenGithub, availableModels = AI_MODELS 
}) => {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(availableModels[0]?.id || AI_MODELS[0].id);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generatingFile, isGenerating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    onSendMessage(input, AIProvider.Gemini, selectedModel, []);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#fbfbfb] dark:bg-[#0c0c0e] border-r border-gray-200 dark:border-[#27272a] relative transition-colors duration-300 w-full font-sans">
      
      {/* Stream / Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {messages.map((msg, index) => {
            if (msg.role === 'system') return null;
            
            return (
                <div key={index} className={`flex flex-col gap-2 animate-fadeIn ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    
                    {msg.role === 'user' ? (
                        <div className="max-w-[90%] bg-gray-100 dark:bg-[#1f1f22] text-gray-900 dark:text-gray-200 px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm border border-gray-200 dark:border-[#27272a]">
                            {msg.content}
                        </div>
                    ) : (
                        <div className="w-full text-sm text-gray-700 dark:text-gray-300 pl-2 border-l-2 border-gray-200 dark:border-[#27272a] ml-1">
                            <div className="flex items-center gap-2 mb-1 opacity-50">
                                <SparklesIcon className="w-3 h-3 text-blue-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">AI Assistant</span>
                            </div>
                            <div className="prose dark:prose-invert prose-sm max-w-none leading-relaxed opacity-90">
                                {msg.isThinking ? (
                                    <div className="flex items-center gap-2 text-gray-500 italic">
                                        <LoaderIcon className="w-3 h-3 animate-spin" />
                                        <span>Processando alterações...</span>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )
          })}
          
          {/* Active Generation Indicator */}
          {generatingFile && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg text-xs animate-pulse mx-4">
                  <TerminalIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-700 dark:text-blue-300 font-mono">Gerando {generatingFile}...</span>
              </div>
          )}
          
          <div ref={chatEndRef} className="h-4" />
      </div>

      {/* Input Area (Fixed Bottom) */}
      <div className="p-4 bg-[#fbfbfb] dark:bg-[#0c0c0e] border-t border-gray-200 dark:border-[#27272a]">
          <form onSubmit={handleSubmit} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition duration-500 blur-sm"></div>
              <div className="relative bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-blue-500/50 transition-all flex flex-col">
                  <textarea 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                    placeholder="Digite suas instruções..."
                    className="w-full bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none resize-none min-h-[50px] max-h-[150px]"
                    rows={1}
                  />
                  
                  <div className="flex items-center justify-between px-2 pb-2">
                      <div className="flex items-center gap-1">
                          <button type="button" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#27272a] transition-colors">
                              <PaperclipIcon className="w-4 h-4" />
                          </button>
                      </div>
                      
                      <button 
                        type="submit"
                        disabled={!input.trim() || isGenerating}
                        className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-all disabled:opacity-30 disabled:bg-gray-300 dark:disabled:bg-[#3f3f46]"
                      >
                          <PlusIcon className="w-4 h-4 rotate-90" /> {/* Arrow icon workaround */}
                      </button>
                  </div>
              </div>
          </form>
          <div className="text-center mt-2">
             <p className="text-[10px] text-gray-400 dark:text-gray-600">AI pode gerar código incorreto.</p>
          </div>
      </div>
    </div>
  );
};
