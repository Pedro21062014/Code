
import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, GithubIcon, FolderIcon, PlusIcon, ChevronDownIcon, ClockIcon, CloseIcon, LogInIcon, SunIcon, MoonIcon } from './Icons';
import { ProjectFile, SavedProject, AIModel, Theme } from '../types';

interface WelcomeScreenProps {
  onPromptSubmit: (prompt: string, model: string, attachments: { data: string; mimeType: string }[]) => void;
  onShowPricing: () => void;
  onShowProjects: () => void;
  onOpenGithubImport: () => void;
  onFolderImport: (files: ProjectFile[]) => void;
  session: { user: any } | null;
  onLoginClick: () => void;
  onNewProject: () => void;
  onLogout: () => void;
  onOpenSettings?: () => void;
  recentProjects?: SavedProject[];
  onLoadProject?: (id: number) => void;
  credits: number; // Ignorado
  userGeminiKey?: string;
  currentPlan?: string;
  availableModels?: AIModel[];
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

// Ensure these IDs match available models or generic ones that route correctly
const FEATURED_MODEL_IDS = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'google/gemini-2.0-flash-exp:free', // OpenRouter style
  'openai/gpt-4o'
];

const getFileLanguage = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'js': return 'javascript';
        case 'ts': return 'typescript';
        case 'tsx': return 'typescript';
        case 'html': return 'html';
        case 'css': return 'css';
        case 'json': return 'json';
        default: return 'plaintext';
    }
}

const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return `há ${Math.floor(interval)} anos`;
    
    interval = seconds / 2592000;
    if (interval > 1) return `há ${Math.floor(interval)} meses`;
    
    interval = seconds / 86400;
    if (interval > 1) return `há ${Math.floor(interval)} dias`;
    
    interval = seconds / 3600;
    if (interval > 1) return `há ${Math.floor(interval)} horas`;
    
    interval = seconds / 60;
    if (interval > 1) return `há ${Math.floor(interval)} minutos`;
    
    return "agora mesmo";
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
    onPromptSubmit, 
    onOpenGithubImport, 
    onFolderImport, 
    session, 
    onShowProjects,
    onLoginClick,
    recentProjects = [],
    onLoadProject = (_: number) => {},
    availableModels = [],
    theme,
    onThemeChange
}) => {
  const [prompt, setPrompt] = useState('');
  // Use a Gemini model by default as we have a default key for it
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [showAllModels, setShowAllModels] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayProjects = [...recentProjects]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 2);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsModelDropdownOpen(false);
            // Reset filters when closing
            setTimeout(() => {
                setShowAllModels(false);
                setModelSearch('');
            }, 200);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (fileToRemove: File) => {
    setAttachedFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  const handlePromptSubmitInternal = async () => {
    if (!prompt.trim() && attachedFiles.length === 0) return;

    try {
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
        onPromptSubmit(prompt.trim(), selectedModel, attachments);
        setPrompt('');
        setAttachedFiles([]);
    } catch (error) {
        console.error("Error processing file attachments:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmitInternal();
    }
  };

  const handleFolderSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;

      const filePromises = Array.from(selectedFiles).map((file: File) => {
          return new Promise<ProjectFile | null>((resolve) => {
              if (file.size > 2 * 1024 * 1024) { 
                  resolve(null);
                  return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                  resolve({
                      name: (file as any).webkitRelativePath || file.name,
                      language: getFileLanguage(file.name),
                      content: reader.result as string,
                  });
              };
              reader.readAsText(file);
          });
      });

      const results = await Promise.all(filePromises);
      const projectFiles = results.filter((f): f is ProjectFile => f !== null);
      if (projectFiles.length > 0) onFolderImport(projectFiles);
      if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const getModelIcon = (modelId: string) => {
    let logoPath = '';
    if (modelId.includes('gemini') || modelId.includes('google')) {
        logoPath = '/logos/gemini.png';
    } else if (modelId.includes('glm') || modelId.includes('z-ai')) {
        logoPath = '/logos/glm.ai.png';
    } else if (modelId.includes('gpt') || modelId.includes('openai')) {
        logoPath = '/logos/openai.png';
    } else if (modelId.includes('kwaipilot') || modelId.includes('kat')) {
        logoPath = '/logos/kwaipilot.png';
    } else if (modelId.includes('deepseek')) {
        logoPath = '/logos/deepseek.png';
    } else {
        logoPath = '/logos/sparkles.png'; // Fallback
    }

    return (
        <img 
            src={logoPath} 
            alt={modelId} 
            className="w-4 h-4 object-contain" 
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
        />
    );
  };

  const getFallbackIcon = (modelId: string) => {
      return <SparklesIcon className="w-4 h-4 hidden" />;
  }

  const userName = session?.user?.email?.split('@')[0] || 'dev';
  const isLoggedIn = !!session?.user;
  const selectedModelObj = availableModels.find(m => m.id === selectedModel) || { name: selectedModel, id: selectedModel };

  // Prioritize Gemini models in the featured list to ensure good first experience
  const allFilteredModels = availableModels.filter(m => 
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) || 
      m.id.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const displayedModels = showAllModels ? allFilteredModels : availableModels.slice(0, 5);

  const toggleTheme = () => {
    onThemeChange(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-[#09090b] text-gray-900 dark:text-white overflow-x-hidden overflow-y-auto relative font-sans custom-scrollbar transition-colors duration-300">
      
      {/* Theme Toggle Absolute Position */}
      <div className="absolute top-6 right-6 z-50">
        <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-all shadow-sm"
            title="Alternar Tema"
        >
            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Background Gradient Mesh */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] opacity-40 animate-pulse" style={{ animationDuration: '8s' }}></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[120px] opacity-40 animate-pulse" style={{ animationDuration: '10s' }}></div>
         <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] bg-pink-600/10 rounded-full blur-[100px] opacity-30 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 pb-12 w-full max-w-5xl mx-auto h-full">
        
        {/* Hero Text */}
        <div className="mb-8 md:mb-12 text-center animate-slideInUp">
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900 dark:text-white mb-2 px-4">
                {isLoggedIn ? `Hora de lançar, ${userName}` : 'Faça login para continuar'}
            </h1>
            {!isLoggedIn && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Salve seu progresso e acesse recursos avançados.</p>
            )}
        </div>

        {/* Main Input Area */}
        <div className="w-full max-w-3xl animate-slideInUp" style={{ animationDelay: '100ms' }}>
            <div className="relative group rounded-2xl md:rounded-3xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] shadow-2xl transition-all focus-within:ring-1 focus-within:ring-blue-500/20 focus-within:border-blue-500/30">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isLoggedIn ? "Peça a Codegen para criar um blog sobre..." : "Descreva seu projeto..."}
                    className="w-full h-[120px] md:h-[140px] p-4 md:p-6 bg-transparent text-base md:text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none rounded-t-2xl md:rounded-t-3xl"
                    autoFocus
                />

                {/* Attachments UI */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-4 md:px-6 mb-2">
                    {attachedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-[#27272a] rounded-lg border border-gray-200 dark:border-[#3f3f46] text-[10px] text-gray-700 dark:text-gray-300">
                        <span className="truncate max-w-[120px]">{file.name}</span>
                        <button onClick={() => removeFile(file)} className="hover:text-black dark:hover:text-white transition-colors">
                          <CloseIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Input Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between px-4 pb-4 gap-4 relative z-20">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#27272a] hover:bg-gray-200 dark:hover:bg-[#3f3f46] text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                        >
                             <PlusIcon className="w-3.5 h-3.5 md:w-4 h-4" />
                             <span className="inline">Anexar</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept="image/*,text/*" />

                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenGithubImport(); }}
                            className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#27272a] hover:bg-gray-200 dark:hover:bg-[#3f3f46] text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600 relative z-30"
                        >
                            <GithubIcon className="w-3.5 h-3.5 md:w-4 h-4" />
                            <span className="inline">Github</span>
                        </button>
                         <button 
                            onClick={() => folderInputRef.current?.click()}
                            className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#27272a] hover:bg-gray-200 dark:hover:bg-[#3f3f46] text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                        >
                            <FolderIcon className="w-3.5 h-3.5 md:w-4 h-4" />
                            <span className="inline">Pasta</span>
                        </button>
                        <input type="file" ref={folderInputRef} onChange={handleFolderSelect} multiple style={{ display: 'none' }} {...{ webkitdirectory: "true", directory: "true" }} />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        {/* Model Selector */}
                        <div className="relative" ref={dropdownRef}>
                             <button 
                                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                                className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#27272a] hover:bg-gray-200 dark:hover:bg-[#3f3f46] text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors border border-gray-200 dark:border-[#27272a] hover:border-gray-400 dark:hover:border-gray-600"
                            >
                                {getModelIcon(selectedModel)}
                                {getFallbackIcon(selectedModel)}
                                <span className="truncate max-w-[80px] md:max-w-[120px]">{selectedModelObj?.name || selectedModel}</span>
                                <ChevronDownIcon className="w-3 h-3 text-gray-500" />
                            </button>

                            {isModelDropdownOpen && (
                                <div className="absolute bottom-full mb-2 right-0 w-64 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-xl shadow-xl overflow-hidden z-50 animate-fadeIn flex flex-col">
                                    
                                    {showAllModels && (
                                        <div className="p-2 border-b border-gray-200 dark:border-[#27272a]">
                                            <input 
                                                type="text" 
                                                placeholder="Buscar modelo..." 
                                                value={modelSearch}
                                                onChange={(e) => setModelSearch(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-[#121214] text-xs text-gray-900 dark:text-white px-2 py-1.5 rounded-md border border-gray-200 dark:border-[#27272a] focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 placeholder-gray-500"
                                                autoFocus
                                            />
                                        </div>
                                    )}

                                    <div className="p-1 max-h-60 overflow-y-auto custom-scrollbar">
                                        {displayedModels.map(model => {
                                            return (
                                                <button
                                                    key={model.id}
                                                    onClick={() => {
                                                        setSelectedModel(model.id);
                                                        setIsModelDropdownOpen(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                                        selectedModel === model.id 
                                                            ? 'bg-gray-100 dark:bg-[#27272a] text-black dark:text-white' 
                                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#27272a] hover:text-black dark:hover:text-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 truncate">
                                                        {getModelIcon(model.id)}
                                                        {getFallbackIcon(model.id)}
                                                        <span className="truncate">{model.name}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        {displayedModels.length === 0 && <div className="p-2 text-xs text-gray-500 text-center">Nenhum modelo encontrado.</div>}
                                    </div>

                                    {!showAllModels && (
                                        <div className="p-1 border-t border-gray-200 dark:border-[#27272a]">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setShowAllModels(true); }}
                                                className="w-full text-center py-1.5 text-[10px] text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#27272a] rounded-md transition-colors"
                                            >
                                                Ver todos os modelos
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                         <button 
                            onClick={handlePromptSubmitInternal}
                            disabled={!prompt.trim() && attachedFiles.length === 0}
                            className={`p-2 rounded-full transition-all duration-300 ${prompt.trim() || attachedFiles.length > 0 ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90' : 'bg-gray-200 dark:bg-[#3f3f46] text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
                        >
                             <div className="w-5 h-5 flex items-center justify-center">
                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                             </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Cards */}
        <div className="w-full max-w-3xl mt-12 md:mt-16 animate-slideInUp px-2" style={{ animationDelay: '200ms' }}>
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
                <div className="flex gap-2 md:gap-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                    {isLoggedIn && (
                        <>
                            <button className="flex-shrink-0 px-4 py-1.5 rounded-full bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] text-[11px] md:text-sm text-gray-900 dark:text-white font-medium whitespace-nowrap shadow-sm dark:shadow-none">
                                {displayProjects.length > 0 ? "Vistos Recentemente" : "Começar Agora"}
                            </button>
                            <button onClick={onShowProjects} className="flex-shrink-0 px-4 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#18181b] text-[11px] md:text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors whitespace-nowrap">Meus Projetos</button>
                        </>
                    )}
                </div>
                {isLoggedIn && displayProjects.length > 0 && (
                    <button onClick={onShowProjects} className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors self-end sm:self-auto">
                        Ver todos <span className="text-lg">→</span>
                    </button>
                )}
            </div>

            {isLoggedIn ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayProjects.length > 0 ? (
                        displayProjects.map((project, index) => (
                            <div 
                                key={project.id}
                                onClick={() => onLoadProject(project.id)}
                                className="group relative h-32 md:h-40 rounded-xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] overflow-hidden hover:border-gray-400 dark:hover:border-gray-500 transition-all cursor-pointer shadow-sm dark:shadow-none"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-50 group-hover:opacity-80 transition-opacity"></div>
                                <div className="absolute top-3 left-3 md:top-4 md:left-4">
                                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded bg-gray-100 dark:bg-[#27272a] flex items-center justify-center ${index % 2 === 0 ? 'text-blue-500 dark:text-blue-400' : 'text-purple-500 dark:text-purple-400'}`}>
                                        {index % 2 === 0 ? <SparklesIcon className="w-4 h-4 md:w-5 md:h-5" /> : <FolderIcon className="w-4 h-4 md:w-5 md:h-5" />}
                                    </div>
                                </div>
                                <div className="absolute bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-4">
                                    <h3 className="text-gray-900 dark:text-white text-sm md:text-base font-medium truncate">{project.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <ClockIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-400 dark:text-gray-500" />
                                        <p className="text-[10px] md:text-xs text-gray-500">{getTimeAgo(project.updated_at)}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="group relative h-32 md:h-40 rounded-xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] border-dashed flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer" onClick={() => folderInputRef.current?.click()}>
                                <FolderIcon className="w-6 h-6 md:w-8 md:h-8 opacity-50" />
                                <span className="text-xs md:text-sm">Abrir pasta local</span>
                            </div>
                            <div className="group relative h-32 md:h-40 rounded-xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] border-dashed flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer" onClick={onOpenGithubImport}>
                                <GithubIcon className="w-6 h-6 md:w-8 md:h-8 opacity-50" />
                                <span className="text-xs md:text-sm">Clonar do GitHub</span>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="w-full flex flex-col items-center justify-center py-12 border border-gray-200 dark:border-[#27272a] rounded-xl bg-white/50 dark:bg-[#121214]/50 border-dashed gap-4">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Você precisa estar logado para acessar seus projetos.</p>
                    <button 
                        onClick={onLoginClick}
                        className="flex items-center gap-2 px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-sm hover:opacity-80 transition-colors"
                    >
                        <LogInIcon className="w-4 h-4" /> Fazer Login
                    </button>
                </div>
            )}
        </div>

      </main>
    </div>
  );
};
