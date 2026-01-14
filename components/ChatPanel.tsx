import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AIProvider, AIModel } from '../types';
import { AI_MODELS } from '../constants';
import { SparklesIcon, PaperclipIcon, LoaderIcon, SupabaseIcon, GithubIcon, CheckCircleIcon, TerminalIcon, PlusIcon, ImageIcon, DownloadIcon, StopIcon, ChevronUpIcon, BotIcon } from './Icons';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string, provider: AIProvider, model: string, attachments: { data: string; mimeType: string }[]) => void;
  isProUser: boolean;
  onCloseMobile?: () => void;
  projectName?: string;
  generatingFile: string | null;
  isGenerating: boolean;
  onStopGeneration?: () => void;
  userGeminiKey?: string;
  onOpenSupabase?: () => void;
  onOpenGithub?: () => void;
  onOpenSettings?: () => void;
  availableModels?: AIModel[];
  credits?: number;
}

const ImageGeneratingPreview = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 99) return 99;
                return prev + 1;
            });
        }, 150); // Aumentado para 150ms (mais lento)
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full aspect-square max-w-[280px] rounded-xl overflow-hidden relative shadow-lg border border-gray-200 dark:border-[#27272a]">
            <style>{`
                @keyframes pastelFlow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .bg-pastel-animated {
                    /* Cores pastéis mais suaves e harmoniosas */
                    background: linear-gradient(270deg, #ffdde1, #ee9ca7, #e0c3fc, #d4fc79, #8ec5fc);
                    background-size: 400% 400%;
                    animation: pastelFlow 15s ease-in-out infinite; /* Animação mais lenta e fluida */
                }
            `}</style>
            <div className="absolute inset-0 bg-pastel-animated flex flex-col items-center justify-center text-white/90">
                <div className="bg-white/20 backdrop-blur-md rounded-full p-4 mb-3 border border-white/30">
                    <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <span className="font-mono text-2xl font-bold tracking-tight text-white drop-shadow-sm">{progress}%</span>
                <span className="text-xs font-medium uppercase tracking-widest mt-1 opacity-90 drop-shadow-sm">Gerando Arte</span>
            </div>
        </div>
    );
};

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
    messages, onSendMessage, generatingFile, isGenerating, onStopGeneration,
    onOpenSupabase, onOpenGithub, availableModels = AI_MODELS 
}) => {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(availableModels[0]?.id || AI_MODELS[0].id);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generatingFile, isGenerating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating && onStopGeneration) {
        onStopGeneration();
        return;
    }
    if (!input.trim() || isGenerating) return;
    onSendMessage(input, AIProvider.Gemini, selectedModel, []);
    setInput('');
  };

  const handleDownloadImage = (base64: string, index: number) => {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${base64}`;
      link.download = `generated-image-${index}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const currentModelName = availableModels.find(m => m.id === selectedModel)?.name || 'Modelo';

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
                                <BotIcon className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">AI Assistant</span>
                            </div>
                            
                            {/* Image Generation State */}
                            {msg.isImageGenerator ? (
                                <div className="mt-2">
                                    {msg.isThinking ? (
                                        <ImageGeneratingPreview />
                                    ) : msg.image ? (
                                        <div className="group relative w-full max-w-[280px]">
                                            <img 
                                                src={`data:image/png;base64,${msg.image}`} 
                                                alt="Generated" 
                                                className="w-full rounded-xl shadow-lg border border-gray-200 dark:border-[#27272a]" 
                                            />
                                            <button 
                                                onClick={() => msg.image && handleDownloadImage(msg.image, index)}
                                                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                                title="Baixar Imagem"
                                            >
                                                <DownloadIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/10 text-red-500 text-xs rounded-lg">
                                            {msg.content}
                                        </div>
                                    )}
                                    {!msg.isThinking && msg.image && <p className="mt-2 text-xs text-gray-500">{msg.content}</p>}
                                </div>
                            ) : (
                                /* Standard Text/Code Response */
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
                            )}
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
                    placeholder="Digite suas instruções (ex: 'Gerar imagem de um robô')"
                    className="w-full bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none resize-none min-h-[50px] max-h-[150px]"
                    rows={1}
                  />
                  
                  <div className="flex items-center justify-between px-2 pb-2 relative">
                      <div className="flex items-center gap-2">
                          <button type="button" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#27272a] transition-colors">
                              <PaperclipIcon className="w-4 h-4" />
                          </button>
                          
                          {/* Model Selector Dropdown */}
                          <div className="relative">
                              <button 
                                type="button"
                                onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                                className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 bg-gray-100 dark:bg-[#27272a] rounded-md transition-colors"
                              >
                                  {currentModelName.split(' ')[0]} <ChevronUpIcon className="w-3 h-3" />
                              </button>
                              
                              {isModelSelectorOpen && (
                                  <>
                                    <div className="fixed inset-0 z-30" onClick={() => setIsModelSelectorOpen(false)}></div>
                                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-lg shadow-xl z-40 overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar">
                                        {availableModels.map(model => (
                                            <button
                                                key={model.id}
                                                type="button"
                                                onClick={() => { setSelectedModel(model.id); setIsModelSelectorOpen(false); }}
                                                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-[#27272a] ${selectedModel === model.id ? 'text-blue-500 font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                                            >
                                                {model.name}
                                            </button>
                                        ))}
                                    </div>
                                  </>
                              )}
                          </div>
                      </div>
                      
                      <button 
                        type={isGenerating ? "button" : "submit"}
                        onClick={isGenerating && onStopGeneration ? onStopGeneration : undefined}
                        disabled={(!input.trim() && !isGenerating)}
                        className={`p-2 rounded-lg transition-all text-white shadow-md
                            ${isGenerating 
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-black dark:bg-white dark:text-black hover:opacity-80 disabled:opacity-30 disabled:bg-gray-300 dark:disabled:bg-[#3f3f46]'
                            }
                        `}
                        title={isGenerating ? "Parar geração" : "Enviar mensagem"}
                      >
                          {isGenerating ? (
                              <StopIcon className="w-4 h-4" />
                          ) : (
                              <PlusIcon className="w-4 h-4 rotate-90" />
                          )}
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