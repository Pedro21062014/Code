
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AIProvider, AIModel } from '../types';
import { AI_MODELS } from '../constants';
import { SparklesIcon, PaperclipIcon, LoaderIcon, SupabaseIcon, GithubIcon, CheckCircleIcon } from './Icons';

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
  credits?: number; // Compatibilidade, mas não usado
}

const ThinkingIndicator = ({ generatingFile }: { generatingFile: string | null }) => {
    const [fileLog, setFileLog] = useState<string[]>([]);
    const lastFileRef = useRef<string | null>(null);

    useEffect(() => {
        if (generatingFile && generatingFile !== lastFileRef.current) {
            setFileLog(prev => {
                if (prev.includes(generatingFile)) return prev;
                return [...prev, generatingFile];
            });
            lastFileRef.current = generatingFile;
        }
    }, [generatingFile]);

    return (
        <div className="flex flex-col gap-3 py-2 animate-fadeIn select-none">
            <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur animate-pulse"></div>
                    <SparklesIcon className="w-4 h-4 text-blue-400 relative z-10" />
                </div>
                <span className="text-sm font-medium bg-gradient-to-r from-gray-400 via-white to-gray-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-shine">
                    Pensando...
                </span>
            </div>

            {fileLog.length > 0 && (
                <div className="flex flex-col gap-2 pl-2 border-l border-white/10 ml-2 mt-1">
                    {fileLog.map((file, index) => {
                        const isCurrent = file === generatingFile;
                        return (
                            <div key={index} className={`flex items-center gap-2.5 text-xs font-mono transition-all duration-300 ${isCurrent ? 'opacity-100 translate-x-1' : 'opacity-50'}`}>
                                {isCurrent ? (
                                    <LoaderIcon className="w-3.5 h-3.5 animate-spin text-blue-400" />
                                ) : (
                                    <CheckCircleIcon className="w-3.5 h-3.5 text-green-500" />
                                )}
                                <span className={isCurrent ? "text-blue-200" : "text-gray-400"}>
                                    {file}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

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

  const ActionButtons = ({ text }: { text: string }) => {
      const lower = text.toLowerCase();
      // Melhora a detecção de intenção para mostrar os botões
      const showSupabase = lower.includes('supabase') || lower.includes('banco de dados') || lower.includes('database') || lower.includes('backend');
      const showGithub = lower.includes('github') || lower.includes('deploy') || lower.includes('repositório') || lower.includes('versionamento');

      if (!showSupabase && !showGithub) return null;

      return (
          <div className="flex flex-wrap gap-2 mt-3 animate-fadeIn">
              {showSupabase && (
                <button 
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Abrindo Supabase modal..."); // Debug
                        if (onOpenSupabase) onOpenSupabase();
                    }} 
                    className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/20 transition-all cursor-pointer z-10"
                >
                    <SupabaseIcon className="w-3.5 h-3.5" /> Configurar Supabase
                </button>
              )}
              {showGithub && (
                <button 
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Abrindo Github modal..."); // Debug
                        if (onOpenGithub) onOpenGithub();
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/10 transition-all cursor-pointer z-10"
                >
                    <GithubIcon className="w-3.5 h-3.5" /> Conectar GitHub
                </button>
              )}
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] border-r border-white/5 relative">
      {/* Minimal Header */}
      <div className="h-4 w-full bg-[#0d0d0d]"></div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 custom-scrollbar">
          {messages.map((msg, index) => (
            msg.role !== 'system' && (
                <div key={index} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}>
                    <div className="flex items-center gap-2 opacity-30 px-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest">{msg.role === 'user' ? 'Você' : 'Assistente'}</span>
                    </div>
                    
                    {msg.isThinking ? (
                        <ThinkingIndicator generatingFile={generatingFile} />
                    ) : (
                        <div className={`max-w-[95%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-[#1a1a1a] text-white border border-white/10' 
                            : 'text-gray-300 w-full'
                        }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            {/* Render Action Buttons specifically for this message */}
                            {msg.role === 'assistant' && <ActionButtons text={msg.content} />}
                        </div>
                    )}
                </div>
            )
          ))}
          <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0d0d0d]">
          <form onSubmit={handleSubmit} className="relative bg-[#141414] border border-white/10 rounded-xl shadow-lg focus-within:border-blue-500/50 transition-all p-1.5">
              <textarea 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                placeholder="Descreva a alteração ou nova funcionalidade..."
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none resize-none min-h-[44px] max-h-[120px]"
                rows={1}
                style={{ height: 'auto', minHeight: '44px' }}
              />
              <div className="flex items-center justify-between px-1 pt-1">
                  <div className="flex items-center gap-1">
                      <button type="button" className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                          <PaperclipIcon className="w-4 h-4" />
                      </button>
                      <select 
                        value={selectedModel}
                        onChange={e => setSelectedModel(e.target.value)}
                        className="bg-transparent text-[10px] font-bold text-gray-500 hover:text-gray-300 uppercase tracking-wider focus:outline-none cursor-pointer max-w-[100px] truncate"
                      >
                          {availableModels.map(m => <option key={m.id} value={m.id} className="bg-[#141414]">{m.name}</option>)}
                      </select>
                  </div>
                  <button 
                    type="submit"
                    disabled={!input.trim() || isGenerating}
                    className="p-1.5 rounded-lg bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:bg-[#27272a] disabled:text-gray-500"
                  >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                  </button>
              </div>
          </form>
      </div>
    </div>
  );
};
