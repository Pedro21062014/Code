
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AIProvider, AIModel, ChatMode } from '../types';
import { AI_MODELS } from '../constants';
import { SparklesIcon, PaperclipIcon, LoaderIcon, SupabaseIcon, GithubIcon, CheckCircleIcon, TerminalIcon, PlusIcon, ImageIcon, DownloadIcon, StopIcon, ChevronUpIcon, BotIcon, PaletteIcon, CloudSimpleIcon, WrenchIcon, RocketIcon, MagicIcon, GoogleIcon, PlanIcon, LightbulbIcon, FileIcon } from './Icons';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string, provider: AIProvider, model: string, attachments: { data: string; mimeType: string }[], mode: ChatMode) => void;
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
  activeMode?: ChatMode; // Now a prop
  onModeChange?: (mode: ChatMode) => void; // Callback prop
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

const Typewriter: React.FC<{ words: string[] }> = ({ words }) => {
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [blink, setBlink] = useState(true);
    const [reverse, setReverse] = useState(false);

    // Blinking cursor
    useEffect(() => {
        const timeout2 = setTimeout(() => {
            setBlink((prev) => !prev);
        }, 500);
        return () => clearTimeout(timeout2);
    }, [blink]);

    useEffect(() => {
        if (subIndex === words[index].length + 1 && !reverse) {
            setReverse(true);
            return;
        }

        if (subIndex === 0 && reverse) {
            setReverse(false);
            setIndex((prev) => (prev + 1) % words.length);
            return;
        }

        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (reverse ? -1 : 1));
        }, Math.max(reverse ? 75 : subIndex === words[index].length ? 1000 : 150, Math.random() * 50));

        return () => clearTimeout(timeout);
    }, [subIndex, index, reverse, words]);

    return (
        <span className="text-gray-500 font-mono text-xs">
            {`${words[index].substring(0, subIndex)}${blink ? "|" : " "}`}
        </span>
    );
};

const EmptyState: React.FC<{ mode: ChatMode }> = ({ mode }) => {
    const config = {
        general: {
            title: "O que vamos criar?",
            titleClass: "text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 animate-shine tracking-tight",
            font: "font-sans",
            suggestions: [
                "Crie um formulário de contato simples.",
                "Explique como usar o useEffect.",
                "Gere um componente de card responsivo.",
                "Refatore este código para ser mais limpo."
            ]
        },
        design: {
            title: "Design Studio",
            // Removed animate-pulse, using a static gradient
            titleClass: "text-4xl font-light italic text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 tracking-wide font-serif",
            font: "font-serif",
            suggestions: [
                "Crie uma paleta de cores pastéis.",
                "Gere um layout moderno com grid.",
                "Adicione animações suaves aos botões.",
                "Melhore a tipografia deste cabeçalho."
            ]
        },
        backend: {
            title: "System.Initialize()",
            titleClass: "text-2xl font-mono font-bold text-green-500 dark:text-green-400 tracking-tighter",
            font: "font-mono",
            suggestions: [
                "Configure a conexão com Supabase.",
                "Crie uma API REST para usuários.",
                "Otimize esta query SQL.",
                "Implemente autenticação JWT."
            ]
        }
    };

    const currentConfig = config[mode];

    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 pointer-events-none select-none opacity-80">
            <h1 className={`${currentConfig.titleClass} mb-4`}>
                {currentConfig.title}
            </h1>
            <div className="h-6">
                <Typewriter words={currentConfig.suggestions} />
            </div>
        </div>
    );
};

// Component for rendering Google Search Grounding Metadata
const GroundingMetadata: React.FC<{ metadata: NonNullable<ChatMessage['groundingMetadata']> }> = ({ metadata }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    if (!metadata || !metadata.groundingChunks || metadata.groundingChunks.length === 0) return null;

    const sources = metadata.groundingChunks.filter(c => c.web).map(c => c.web!);
    if (sources.length === 0) return null;

    return (
        <div className="mt-2 mb-1">
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-[#1a1a1c] border border-gray-200 dark:border-[#27272a] rounded-full hover:bg-gray-100 dark:hover:bg-[#202023] transition-colors group"
                >
                    <GoogleIcon className="w-4 h-4" />
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">
                        {sources.length} fonte{sources.length !== 1 ? 's' : ''} encontrada{sources.length !== 1 ? 's' : ''}
                    </span>
                    <ChevronUpIcon className={`w-3 h-3 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {isExpanded && (
                <div className="mt-2 pl-2 space-y-1 animate-fadeIn">
                    {sources.map((source, idx) => (
                        <a 
                            key={idx} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1c] transition-colors group"
                        >
                            <span className="text-[10px] font-mono text-gray-400 mt-0.5">{idx + 1}.</span>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate group-hover:underline">
                                    {source.title}
                                </span>
                                <span className="text-[10px] text-gray-400 truncate">
                                    {source.uri}
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
    messages, onSendMessage, generatingFile, isGenerating, onStopGeneration,
    onOpenSupabase, onOpenGithub, availableModels = AI_MODELS, activeMode = 'general', onModeChange 
}) => {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(availableModels[0]?.id || AI_MODELS[0].id);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isPlanMode, setIsPlanMode] = useState(false);
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
    if (!input.trim() && !isGenerating) return;
    
    // Append plan tag if plan mode is active
    const finalPrompt = isPlanMode ? `<tools/plan> ${input}` : input;
    
    onSendMessage(finalPrompt, AIProvider.Gemini, selectedModel, [], activeMode);
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

  const modes = [
      { id: 'general', icon: <SparklesIcon className="w-4 h-4" />, label: 'Geral', tooltip: 'Geração de Código Padrão' },
      { id: 'design', icon: <PaletteIcon className="w-4 h-4" />, label: 'Design', tooltip: 'Especialista em UI/UX e Estilização' },
      { id: 'backend', icon: <CloudSimpleIcon className="w-4 h-4" />, label: 'Cloud', tooltip: 'Especialista em Backend e Dados' },
  ];

  // Determine if we should show the empty state
  const showEmptyState = messages.length === 0 || (messages.length === 1 && messages[0].role === 'assistant');

  return (
    <div className="flex flex-col h-full bg-[#fbfbfb] dark:bg-[#0c0c0e] relative transition-colors duration-300 w-full font-sans">
      
      {/* Header with Mode Selector */}
      <div className="flex items-center justify-center p-3 border-b border-gray-200 dark:border-[#27272a] bg-[#fbfbfb] dark:bg-[#0c0c0e] z-10">
          <div className="flex bg-gray-200 dark:bg-[#18181b] p-1 rounded-lg">
              {modes.map((mode) => {
                  const isActive = activeMode === mode.id;
                  return (
                      <button
                          key={mode.id}
                          onClick={() => onModeChange && onModeChange(mode.id as ChatMode)}
                          className={`flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ease-in-out ${
                              isActive
                                  ? 'bg-white dark:bg-[#27272a] text-black dark:text-white shadow-sm px-3'
                                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2'
                          }`}
                          title={mode.tooltip}
                      >
                          {mode.icon}
                          {isActive && <span className="animate-fadeIn">{mode.label}</span>}
                      </button>
                  );
              })}
          </div>
      </div>

      {/* Stream / Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar relative">
          {showEmptyState ? (
              <EmptyState mode={activeMode} />
          ) : (
              <>
                {messages.map((msg, index) => {
                    if (index === 0 && msg.role === 'assistant' && msg.content.includes("Olá! Sou seu assistente")) return null;
                    if (msg.role === 'system') return null;
                    
                    return (
                        <div key={index} className={`flex flex-col gap-2 animate-fadeIn ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            
                            {msg.role === 'user' ? (
                                <div className="max-w-[90%] bg-gray-100 dark:bg-[#1f1f22] text-gray-900 dark:text-gray-200 px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm border border-gray-200 dark:border-[#27272a] whitespace-pre-wrap">
                                    {msg.content.replace('<tools/plan> ', '')}
                                </div>
                            ) : (
                                <div className="w-full text-sm text-gray-700 dark:text-gray-300 pl-2 border-l-2 border-gray-200 dark:border-[#27272a] ml-1">
                                    <div className="flex items-center gap-2 mb-1 opacity-50">
                                        <LightbulbIcon className="w-4 h-4 text-blue-500" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">AI Architect</span>
                                    </div>
                                    
                                    {/* Grounding Metadata (Google Search Results) */}
                                    {msg.groundingMetadata && <GroundingMetadata metadata={msg.groundingMetadata} />}

                                    {/* Image Generation State */}
                                    {msg.isImageGenerator ? (
                                        <div className="mt-2">
                                            {msg.isThinking ? (
                                                <div className="flex items-center gap-3 p-2">
                                                    <div className="relative flex h-3 w-3">
                                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                                                    </div>
                                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 font-bold animate-shine text-sm">
                                                        Gerando Arte...
                                                    </span>
                                                </div>
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
                                                <div className="flex items-center gap-3 p-2">
                                                    <div className="relative flex h-3 w-3">
                                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                                    </div>
                                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 font-bold animate-shine text-sm">
                                                        Pensando...
                                                    </span>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                    
                                                    {/* File Changes List */}
                                                    {msg.filesModified && msg.filesModified.length > 0 && (
                                                        <div className="mt-4 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-xl overflow-hidden shadow-sm max-w-xs">
                                                            <div className="bg-gray-50 dark:bg-[#202023] px-3 py-2 border-b border-gray-100 dark:border-[#27272a] flex items-center gap-2">
                                                                <TerminalIcon className="w-3.5 h-3.5 text-gray-500" />
                                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Arquivos Alterados</span>
                                                            </div>
                                                            <div className="p-1 max-h-40 overflow-y-auto custom-scrollbar">
                                                                {msg.filesModified.map((file, i) => (
                                                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#27272a] rounded-sm transition-colors cursor-default">
                                                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                                                            file.endsWith('css') ? 'bg-blue-400' : 
                                                                            file.endsWith('json') ? 'bg-yellow-400' : 
                                                                            file.endsWith('html') ? 'bg-orange-400' :
                                                                            'bg-purple-400'
                                                                        }`}></div>
                                                                        <span className="truncate">{file}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
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
              </>
          )}
      </div>

      {/* Input Area (Fixed Bottom) */}
      <div className="p-4 bg-[#fbfbfb] dark:bg-[#0c0c0e] border-t border-gray-200 dark:border-[#27272a] z-10">
          <form onSubmit={handleSubmit} className="relative group">
              
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition duration-500 blur-sm"></div>
              <div className="relative bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-blue-500/50 transition-all flex flex-col">
                  <textarea 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                    placeholder={
                        activeMode === 'design' ? "Descreva o visual e estilo..." :
                        activeMode === 'backend' ? "Descreva a lógica e dados..." :
                        "Digite instruções..."
                    }
                    className="w-full bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none resize-none min-h-[50px] max-h-[150px] font-sans"
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
                      
                      <div className="flex items-center gap-2">
                          <button 
                            type="button" 
                            onClick={() => setIsPlanMode(!isPlanMode)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm
                                ${isPlanMode 
                                    ? 'bg-blue-600 text-white shadow-blue-500/30' 
                                    : 'bg-white text-gray-500 hover:bg-gray-100 dark:bg-[#18181b] dark:text-gray-400 dark:hover:bg-[#27272a] border border-gray-200 dark:border-[#27272a]'
                                }
                            `}
                            title="Modo Planejamento"
                          >
                              <LightbulbIcon className={`w-3.5 h-3.5 ${isPlanMode ? 'text-white' : 'text-blue-500'}`} />
                              Plan
                          </button>

                          <button 
                            type={isGenerating ? "button" : "submit"}
                            onClick={isGenerating && onStopGeneration ? onStopGeneration : undefined}
                            disabled={(!input.trim() && !isGenerating)}
                            className={`p-2 rounded-lg transition-all text-white shadow-md
                                ${isGenerating 
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-black dark:bg-white dark:text-black hover:opacity-80 disabled:opacity-30 disabled:disabled:bg-gray-300 dark:disabled:bg-[#3f3f46]'
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
              </div>
          </form>
          <div className="text-center mt-2">
             <p className="text-[10px] text-gray-400 dark:text-gray-600">AI pode gerar código incorreto.</p>
          </div>
      </div>
    </div>
  );
};
