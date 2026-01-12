
import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, GithubIcon, FolderIcon, PlusIcon, ChevronDownIcon, ClockIcon, CloseIcon, LogInIcon, SunIcon, MoonIcon, AppLogo } from './Icons';
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
  credits: number;
  userGeminiKey?: string;
  currentPlan?: string;
  availableModels?: AIModel[];
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const SUGGESTIONS = [
    "Landing page SaaS moderna com gradientes",
    "Dashboard admin com gráficos e dark mode",
    "Clone do Trello com drag-and-drop",
    "E-commerce de tênis com carrinho"
];

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
    if (interval > 1) return `há ${Math.floor(interval)} h`;
    interval = seconds / 60;
    if (interval > 1) return `há ${Math.floor(interval)} min`;
    return "agora";
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
  // Set default to the OpenRouter Free Gemini model
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-exp:free');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter out models for display if needed
  const displayProjects = [...recentProjects]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsModelDropdownOpen(false);
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
                      language: 'plaintext', // Simplificado
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

  const toggleTheme = () => {
    onThemeChange(theme === 'dark' ? 'light' : 'dark');
  };

  const selectedModelObj = availableModels.find(m => m.id === selectedModel);

  return (
    <div className="flex flex-col h-full w-full bg-[#fbfbfb] dark:bg-[#09090b] text-gray-900 dark:text-white overflow-hidden relative font-sans transition-colors duration-300">
      
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50 flex gap-2">
        <button 
            onClick={toggleTheme} 
            className="p-2 rounded-lg text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
        >
            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 w-full max-w-4xl mx-auto">
        
        {/* Main Title Area */}
        <div className="mb-10 text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 dark:text-white">
                O que você quer criar?
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
                Prompts em apps completos. Sem configuração.
            </p>
        </div>

        {/* Input Box - Bolt Style */}
        <div className="w-full relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
            <div className="relative bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-[#27272a] shadow-2xl flex flex-col overflow-hidden">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Descreva seu app..."
                    className="w-full h-32 p-5 bg-transparent text-base md:text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none"
                    autoFocus
                />

                {/* Attachments Preview */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-5 pb-2">
                    {attachedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-[#27272a] rounded text-xs text-gray-600 dark:text-gray-300">
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button onClick={() => removeFile(file)}><CloseIcon className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-[#121214]/50 border-t border-gray-100 dark:border-[#27272a]">
                    <div className="flex items-center gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors" title="Anexar arquivo">
                            <PlusIcon className="w-4 h-4" />
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
                        
                        <div className="h-4 w-px bg-gray-300 dark:bg-[#3f3f46] mx-1"></div>

                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                            >
                                {selectedModelObj?.name || 'Modelo'}
                                <ChevronDownIcon className="w-3 h-3 opacity-50" />
                            </button>
                            
                            {isModelDropdownOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-xl shadow-xl overflow-hidden z-20 py-1">
                                    {availableModels.map(model => (
                                        <button
                                            key={model.id}
                                            onClick={() => { setSelectedModel(model.id); setIsModelDropdownOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-[#27272a] text-gray-700 dark:text-gray-200"
                                        >
                                            {model.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={handlePromptSubmitInternal}
                        disabled={!prompt.trim() && attachedFiles.length === 0}
                        className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Gerar
                    </button>
                </div>
            </div>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-2xl">
            {SUGGESTIONS.map((sug, idx) => (
                <button 
                    key={idx}
                    onClick={() => setPrompt(sug)}
                    className="px-3 py-1.5 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-full text-xs text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-black dark:hover:text-white transition-all shadow-sm"
                >
                    {sug}
                </button>
            ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-16 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <button onClick={() => folderInputRef.current?.click()} className="flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors">
                <FolderIcon className="w-4 h-4" /> Importar Pasta
            </button>
            <input type="file" ref={folderInputRef} onChange={handleFolderSelect} multiple style={{ display: 'none' }} {...{ webkitdirectory: "true", directory: "true" }} />
            
            <button onClick={onOpenGithubImport} className="flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors">
                <GithubIcon className="w-4 h-4" /> Clonar Repo
            </button>
        </div>

        {/* Recent Projects (Minimal) */}
        {session?.user && recentProjects.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center pointer-events-none">
                <div className="bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-md border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xl p-2 flex gap-4 pointer-events-auto max-w-3xl overflow-x-auto custom-scrollbar">
                    {displayProjects.map(p => (
                        <div key={p.id} onClick={() => onLoadProject(p.id)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#27272a] rounded-xl cursor-pointer min-w-[180px] transition-colors group">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#202023] flex items-center justify-center text-gray-500 group-hover:text-black dark:group-hover:text-white">
                                <ClockIcon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">{p.name}</span>
                                <span className="text-[10px] text-gray-500">{getTimeAgo(p.updated_at)}</span>
                            </div>
                        </div>
                    ))}
                    <button onClick={onShowProjects} className="px-4 text-xs font-medium text-gray-500 hover:text-black dark:hover:text-white whitespace-nowrap">
                        Ver todos &rarr;
                    </button>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};
