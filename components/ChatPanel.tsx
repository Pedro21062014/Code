
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AIProvider, AIModel } from '../types';
import { AI_MODELS } from '../constants';
import { SparklesIcon, CloseIcon, PaperclipIcon, ChevronDownIcon, LoaderIcon, SupabaseIcon, GithubIcon, SettingsIcon } from './Icons';

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

const ThinkingIndicator = ({ generatingFile }: { generatingFile: string | null }) => (
    <div className="flex flex-col gap-4 py-4 px-2 w-full max-w-sm animate-fadeIn">
        <div className="flex items-center gap-3">
            <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full animate-pulse blur-[8px] opacity-40"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-white tracking-widest uppercase opacity-80">Codegen está processando</span>
                <span className="text-[10px] text-gray-500 font-medium">Arquitetando soluções...</span>
            </div>
        </div>
        
        {generatingFile && (
            <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/10 rounded-xl px-4 py-3 animate-slideInUp">
                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <LoaderIcon className="w-4 h-4 text-blue-400 animate-spin" />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-wide">Gerando Arquivo</span>
                    <span className="text-xs text-white font-mono truncate">{generatingFile}</span>
                </div>
            </div>
        )}
    </div>
);

const SmartAction = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="flex items-center gap-2 px-3 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white rounded-xl border border-[#3f3f46] transition-all text-xs font-medium shadow-lg hover:scale-[1.02] active:scale-95"
    >
        <span className="opacity-80">{icon}</span>
        {label}
    </button>
);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (fileToRemove: File) => {
    setAttachedFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || !selectedModel || isGenerating) return;

    const filePromises = attachedFiles.map(file => {
        return new Promise<{ data: string; mimeType: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Data = (event.target?.result as string).split(',')[1];
                resolve({ data: base64Data, mimeType: file.type });
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    });

    const attachments = await Promise.all(filePromises);
    onSendMessage(input, AIProvider.Gemini, selectedModel, attachments);
    setInput('');
    setAttachedFiles([]);
  };

  const currentCost = (selectedModel.includes('gemini') && userGeminiKey) ? 0 : (AI_MODELS.find(m => m.id === selectedModel)?.creditCost || 0);
  
  const detectActions = (text: string) => {
      const actions = [];
      if (text.toLowerCase().includes('supabase')) actions.push(<SmartAction icon={<SupabaseIcon className="w-3.5 h-3.5" />} label="Configurar Supabase" onClick={onOpenSupabase!} />);
      if (text.toLowerCase().includes('github') || text.toLowerCase().includes('sync')) actions.push(<SmartAction icon={<GithubIcon className="w-3.5 h-3.5" />} label="Sync GitHub" onClick={onOpenGithub!} />);
      if (text.toLowerCase().includes('api key') || text.toLowerCase().includes('configurações')) actions.push(<SmartAction icon={<SettingsIcon className="w-3.5 h-3.5" />} label="Ajustar Configs" onClick={onOpenSettings!} />);
      return actions;
  };

  return (
    <div className="bg-[#121214] w-full flex flex-col h-full text-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#27272a] flex justify-between items-center bg-[#121214] flex-shrink-0">
        <div className="flex flex-col min-w-0">
            <h2 className="text-white font-bold text-sm tracking-tight truncate">{projectName || 'Chat de Codificação'}</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">IA Conectada</span>
            </div>
        </div>
        <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
                <SparklesIcon className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] font-bold text-blue-400">{credits}</span>
            </div>
            {onCloseMobile && (
                <button onClick={onCloseMobile} className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#27272a]">
                    <CloseIcon className="w-5 h-5" />
                </button>
            )}
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-8 custom-scrollbar">
          {messages.map((msg, index) => (
            msg.role === 'system' ? (
                <div key={index} className="flex justify-center py-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border border-[#27272a] px-3 py-1 rounded-full bg-[#09090b]">{msg.content}</span>
                </div>
            ) : (
                <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fadeIn`}>
                    <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg ${msg.role === 'assistant' ? 'bg-gradient-to-br from-blue-600 to-purple-600 border border-white/20' : 'bg-[#27272a] border border-[#3f3f46]'}`}>
                        {msg.role === 'assistant' ? <SparklesIcon className="w-4 h-4 text-white" /> : <div className="text-[10px] font-bold text-gray-400 uppercase">You</div>}
                    </div>
                    
                    <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                         <div className={`px-4 py-3 rounded-2xl ${
                             msg.role === 'user' 
                             ? 'bg-[#27272a] text-white rounded-tr-sm' 
                             : 'bg-[#18181b] text-gray-300 rounded-tl-sm border border-[#27272a]'
                         }`}>
                             {msg.isThinking ? (
                                <ThinkingIndicator generatingFile={generatingFile} />
                            ) : (
                                <div className="prose prose-invert prose-sm max-w-none leading-relaxed overflow-x-auto">
                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                    {msg.summary && (
                                        <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/5 text-[11px] text-gray-400 italic">
                                            {msg.summary}
                                        </div>
                                    )}
                                </div>
                            )}
                         </div>
                         {!msg.isThinking && msg.role === 'assistant' && (
                             <div className="flex flex-wrap gap-2 mt-3">
                                 {detectActions(msg.content)}
                             </div>
                         )}
                    </div>
                </div>
            )
          ))}
          <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-[#27272a] bg-[#121214] flex-shrink-0">
        <form onSubmit={handleSubmit} className="relative bg-[#18181b] border border-[#27272a] rounded-2xl transition-all focus-within:border-gray-600 focus-within:ring-4 focus-within:ring-white/5">
           <div className="flex items-center justify-between px-3 py-2 border-b border-[#27272a] gap-2">
                <div className="relative flex-1">
                    <select 
                        value={selectedModel}
                        onChange={e => setSelectedModel(e.target.value)}
                        className="appearance-none bg-transparent text-[10px] font-bold text-gray-500 uppercase tracking-widest w-full cursor-pointer focus:outline-none"
                    >
                        {AI_MODELS.map(m => <option key={m.id} value={m.id} className="bg-[#18181b]">{m.name}</option>)}
                    </select>
                </div>
                <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${currentCost === 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-gray-500/10 border-gray-500/20 text-gray-500'}`}>
                    {currentCost === 0 ? 'FREE' : `${currentCost} CREDITS`}
                </div>
           </div>

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            placeholder={isGenerating ? "A IA está criando..." : "O que você quer construir?"}
            className="w-full px-4 py-3 bg-transparent text-gray-200 placeholder-gray-600 focus:outline-none resize-none text-sm min-h-[60px] max-h-[150px]"
            rows={1}
          />
          
          <div className="flex justify-between items-center px-3 pb-3">
             <div className="flex items-center gap-1">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept="image/*,text/*" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-white hover:bg-[#27272a] rounded-xl transition-all">
                    <PaperclipIcon className="w-4 h-4" />
                </button>
             </div>
            <button 
                type="submit" 
                disabled={isGenerating || !input.trim() || credits < currentCost}
                className={`p-2 rounded-xl transition-all shadow-lg ${input.trim() ? 'bg-white text-black hover:scale-105 active:scale-95' : 'bg-[#27272a] text-gray-600 opacity-50 cursor-not-allowed'}`}
            >
                {isGenerating ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
