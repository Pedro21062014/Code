
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AIProvider, AIModel } from '../types';
import { AI_MODELS } from '../constants';
import { SparklesIcon, PaperclipIcon, ChevronDownIcon, LoaderIcon, SupabaseIcon, GithubIcon } from './Icons';

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
}

const ThinkingIndicator = ({ generatingFile }: { generatingFile: string | null }) => {
    return (
        <div className="w-full animate-fadeIn my-2">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 animate-pulse">
                <div className="relative flex items-center justify-center w-5 h-5">
                    <LoaderIcon className="w-4 h-4 animate-spin text-blue-400" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-mono text-gray-300">
                        {generatingFile ? (
                            <>Escrevendo <span className="text-blue-400">{generatingFile}</span>...</>
                        ) : (
                            "Processando solicitação..."
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
};

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
    messages, onSendMessage, projectName, credits, generatingFile, isGenerating, 
    userGeminiKey, onCloseMobile, onOpenSupabase, onOpenGithub, onOpenSettings 
}) => {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(AI_MODELS[0]?.id || '');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generatingFile]);

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
      {/* Small top label */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#0d0d0d]">
          <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-black text-white/50 uppercase tracking-widest">Codegen Agent</span>
          </div>
          <div className="text-[10px] font-bold text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">
              {credits} CR
          </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {messages.map((msg, index) => (
            msg.role !== 'system' && (
                <div key={index} className={`flex flex-col gap-3 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}>
                    <div className="flex items-center gap-2 opacity-40">
                        <span className="text-[10px] font-black uppercase tracking-tighter">{msg.role === 'user' ? 'You' : 'Codegen'}</span>
                    </div>
                    <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
                        msg.role === 'user' 
                        ? 'bg-[#1a1a1a] text-white border border-white/5' 
                        : 'text-gray-300 w-full'
                    }`}>
                        {msg.isThinking ? <ThinkingIndicator generatingFile={generatingFile} /> : <p className="whitespace-pre-wrap">{msg.content}</p>}
                    </div>
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
                placeholder="How can Codegen help you today?"
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
                        className="bg-transparent text-[10px] font-bold text-gray-600 uppercase tracking-widest focus:outline-none cursor-pointer"
                      >
                          {AI_MODELS.map(m => <option key={m.id} value={m.id} className="bg-[#141414]">{m.name}</option>)}
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
