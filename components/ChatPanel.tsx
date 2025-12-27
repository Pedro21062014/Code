
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AIProvider, AIModel } from '../types';
import { AI_MODELS } from '../constants';
import { SparklesIcon, PaperclipIcon, ChevronDownIcon, LoaderIcon, SupabaseIcon, GithubIcon, CheckCircleIcon, FileIcon } from './Icons';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string, provider: AIProvider, model: string, attachments: { data: string; mimeType: string }[]) => void;
  isProUser: boolean;
  onCloseMobile?: () => void;
  projectName?: string;
  credits: number;
  generatingFile: string | null;
  isGenerating: boolean;
  userGeminiKey?: string;
  onOpenSupabase?: () => void;
  onOpenGithub?: () => void;
  onOpenSettings?: () => void;
  availableModels?: AIModel[]; // Corrigido: Prop adicionada
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
            {/* Thinking Header */}
            <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur animate-pulse"></div>
                    <SparklesIcon className="w-4 h-4 text-blue-400 relative z-10" />
                </div>
                <span className="text-sm font-medium bg-gradient-to-r from-gray-400 via-white to-gray-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-shine">
                    Pensando...
                </span>
            </div>

            {/* File Generation List */}
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
    messages, onSendMessage, projectName, credits, generatingFile, isGenerating, 
    userGeminiKey, onCloseMobile, onOpenSupabase, onOpenGithub, onOpenSettings, availableModels = AI_MODELS 
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

  const detectActions = (text: string) => {
      const actions = [];
      const lower = text.toLowerCase();
      if (lower.includes('supabase') || lower.includes('banco de dados')) 
          actions.push(
            <button key="sb" onClick={onOpenSupabase} className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs font-bold hover:bg-green-500/20 transition-all">
                <SupabaseIcon className="w-4 h-4" /> Integrate Supabase
            </button>
          );
      if (lower.includes('github') || lower.includes('deploy')) 
          actions.push(
            <button key="gh" onClick={onOpenGithub} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
                <GithubIcon className="w-4 h-4" /> Link Repository
            </button>
          );
      return actions;
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] border-r border-white/5 relative">
      {/* Minimal Header */}
      <div className="px-6 py-4 flex items-center justify-end border-b border-white/5 bg-[#0d0d0d]">
          <div className="text-[10px] font-bold text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20 flex items-center gap-1.5">
              <SparklesIcon className="w-3 h-3" />
              {credits} CR
          </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {messages.map((msg, index) => (
            msg.role !== 'system' && (
                <div key={index} className={`flex flex-col gap-3 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}>
                    <div className="flex items-center gap-2 opacity-40">
                        <span className="text-[10px] font-black uppercase tracking-tighter">{msg.role === 'user' ? 'You' : 'AI'}</span>
                    </div>
                    
                    {msg.isThinking ? (
                        <ThinkingIndicator generatingFile={generatingFile} />
                    ) : (
                        <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-[#1a1a1a] text-white border border-white/5' 
                            : 'text-gray-300 w-full'
                        }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    )}

                    {msg.role === 'assistant' && !msg.isThinking && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {detectActions(msg.content)}
                        </div>
                    )}
                </div>
            )
          ))}
          <div ref={chatEndRef} />
      </div>

      {/* Modern Agent Input */}
      <div className="p-6">
          <form onSubmit={handleSubmit} className="relative bg-[#141414] border border-white/10 rounded-2xl shadow-2xl focus-within:border-blue-500/50 transition-all p-2">
              <textarea 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                placeholder="Como posso ajudar você hoje?"
                className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none resize-none min-h-[60px]"
                rows={1}
              />
              <div className="flex items-center justify-between px-2 pb-2">
                  <div className="flex items-center gap-1">
                      <button type="button" className="p-2 text-gray-500 hover:text-white transition-colors">
                          <PaperclipIcon className="w-4 h-4" />
                      </button>
                      <select 
                        value={selectedModel}
                        onChange={e => setSelectedModel(e.target.value)}
                        className="bg-transparent text-[10px] font-bold text-gray-600 uppercase tracking-widest focus:outline-none cursor-pointer max-w-[120px] truncate"
                      >
                          {availableModels.map(m => <option key={m.id} value={m.id} className="bg-[#141414]">{m.name}</option>)}
                      </select>
                  </div>
                  <button 
                    disabled={!input.trim() || isGenerating}
                    className={`p-2 rounded-xl transition-all ${input.trim() ? 'bg-white text-black hover:scale-105' : 'bg-white/5 text-gray-700 cursor-not-allowed'}`}
                  >
                      {isGenerating ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>}
                  </button>
              </div>
          </form>
      </div>
    </div>
  );
};
