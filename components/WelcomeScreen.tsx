
import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, GithubIcon, FolderIcon, PlusIcon, ChevronDownIcon, ClockIcon, CloseIcon, LogInIcon, SunIcon, MoonIcon, AppLogo, LightbulbIcon } from './Icons';
import { ProjectFile, SavedProject, AIModel, Theme, ChatMode, AIProvider } from '../types';
import { PromptInput } from '@/components/ui/ai-chat-input';

interface WelcomeScreenProps {
  onPromptSubmit: (prompt: string, model: string, provider: AIProvider, attachments: { data: string; mimeType: string }[], mode?: ChatMode) => void;
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
  // Set default to DeepSeek R1 (Free)
  const [selectedModel, setSelectedModel] = useState(() => availableModels[0]?.id || 'minimaxai/minimax-m3');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isPlanMode, setIsPlanMode] = useState(false);
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
        
        // Append plan tag if plan mode is active
        const finalPrompt = isPlanMode ? `<tools/plan> ${prompt.trim()}` : prompt.trim();
        
        const selModel = availableModels.find(m => m.id === selectedModel);
        const provider = selModel?.provider || AIProvider.Nvidia;
        onPromptSubmit(finalPrompt, selectedModel, provider, attachments, 'general');
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

  // Callback do PromptInput (AI chat input)
  const handleAiInputSubmit = async (message: string, meta: { model: string; effort: string; attachments: File[] }) => {
    if (!message.trim() && meta.attachments.length === 0) return;
    try {
      const filePromises = meta.attachments.map(file => {
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
      const finalPrompt = isPlanMode ? `<tools/plan> ${message.trim()}` : message.trim();
      const selModel = availableModels.find(m => m.id === selectedModel);
      const provider = selModel?.provider || AIProvider.Nvidia;
      onPromptSubmit(finalPrompt, selectedModel, provider, attachments, 'general');
    } catch (error) {
      console.error("Error processing AI input:", error);
    }
  };

  const handleFolderSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;

      const filePromises = Array.from(selectedFiles).map((file: File) => {
          return new Promise<ProjectFile | null>((resolve) => {
              // Ignore git folders and node_modules
              if (file.webkitRelativePath.includes('.git/') || file.webkitRelativePath.includes('node_modules/')) {
                  resolve(null);
                  return;
              }

              if (file.size > 2 * 1024 * 1024) { 
                  // Skip large files
                  resolve(null);
                  return;
              }

              const isImage = /\.(jpg|jpeg|png|gif|ico|svg|webp|bmp)$/i.test(file.name);
              
              const reader = new FileReader();
              reader.onload = () => {
                  resolve({
                      name: (file as any).webkitRelativePath || file.name,
                      language: isImage ? 'image' : 'plaintext',
                      content: reader.result as string,
                  });
              };
              
              if (isImage) {
                  reader.readAsDataURL(file);
              } else {
                  reader.readAsText(file);
              }
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
    <div className="flex flex-col h-full w-full bg-[#fafafa] dark:bg-[#09090b] text-gray-900 dark:text-white overflow-hidden relative font-sans transition-colors duration-300">
      
      {/* Background Dots */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]" style={{ backgroundImage: 'radial-gradient(#a1a1aa 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50 flex gap-2">
        <button 
            onClick={toggleTheme} 
            className="p-2.5 rounded-full text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-white/10 backdrop-blur-sm border border-gray-200 dark:border-white/10 transition-all shadow-sm"
        >
            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 w-full max-w-4xl mx-auto">
        
        {/* Main Title Area */}
        <div className="mb-12 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-sm shadow-sm mb-4">
                <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300 uppercase">AI Powered Builder</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white font-heading">
                O que vamos criar hoje?
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-light max-w-lg mx-auto">
                Transforme suas ideias em aplicações completas em segundos.
            </p>
        </div>

        {/* AI Chat Input */}
        <div className="w-full relative flex flex-col items-center z-20">
            <div className="w-full max-w-[640px] flex justify-center">
                <PromptInput
                    onSubmit={handleAiInputSubmit}
                    placeholder="Descreva seu app com detalhes..."
                    models={availableModels.map(m => ({ name: m.name, logo: m.logo }))}
                    className="w-full scale-[1.15]"
                />
            </div>
        </div>

        {/* Suggestions - Minimalist Pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-8 max-w-3xl">
            {SUGGESTIONS.map((sug, idx) => (
                <button 
                    key={idx}
                    onClick={() => setPrompt(sug)}
                    className="px-4 py-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-full text-xs text-gray-500 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-800 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                    {sug}
                </button>
            ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-16 flex flex-wrap justify-center gap-6 text-sm">
            <button onClick={() => folderInputRef.current?.click()} className="group flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                <div className="p-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-lg group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                    <FolderIcon className="w-4 h-4" />
                </div>
                <span className="font-medium">Importar Pasta</span>
            </button>
            <input type="file" ref={folderInputRef} onChange={handleFolderSelect} multiple style={{ display: 'none' }} {...{ webkitdirectory: "true", directory: "true" }} />
            
            <button onClick={onOpenGithubImport} className="group flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                <div className="p-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-lg group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                    <GithubIcon className="w-4 h-4" />
                </div>
                <span className="font-medium">Clonar Repo</span>
            </button>
        </div>

        {/* Recent Projects (Minimal Floating Bar) */}
        {session?.user && recentProjects.length > 0 && (
            <div className="fixed bottom-8 z-30 animate-slideUp">
                <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 flex items-center gap-2">
                    <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recentes</div>
                    <div className="h-4 w-px bg-gray-200 dark:bg-white/10"></div>
                    {displayProjects.map(p => (
                        <div key={p.id} onClick={() => onLoadProject(p.id)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-[#1a1a1c] rounded-xl cursor-pointer transition-colors group max-w-[160px]">
                            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#202023] dark:to-[#18181b] flex items-center justify-center text-gray-500 border border-gray-200 dark:border-white/5">
                                <ClockIcon className="w-3 h-3" />
                            </div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate group-hover:text-black dark:group-hover:text-white">{p.name}</span>
                        </div>
                    ))}
                    <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>
                    <button onClick={onShowProjects} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-black dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1c] transition-colors">
                        Ver todos
                    </button>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};
