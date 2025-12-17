
import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, GithubIcon, FolderIcon, PlusIcon, ChevronDownIcon, ChatIcon, GeminiIcon, OpenAIIcon, DeepSeekIcon, ClockIcon, CloseIcon } from './Icons';
import { ProjectFile, SavedProject } from '../types';
import { AI_MODELS } from '../constants';
import { UserMenu } from './UserMenu';

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
}

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
    onLogout,
    onOpenSettings = () => {},
    recentProjects = [],
    onLoadProject = (_: number) => {},
    credits,
    userGeminiKey
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
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
    if (modelId.includes('gemini')) return <GeminiIcon className="w-3.5 h-3.5" />;
    if (modelId.includes('gpt')) return <OpenAIIcon className="w-3.5 h-3.5" />;
    if (modelId.includes('deepseek')) return <DeepSeekIcon className="w-3.5 h-3.5" />;
    return <SparklesIcon className="w-3.5 h-3.5" />;
  };

  const userName = session?.user?.email?.split('@')[0] || 'dev';
  const selectedModelObj = AI_MODELS.find(m => m.id === selectedModel);
  const isSelectedGemini = selectedModel.includes('gemini');
  const actualCreditCost = (isSelectedGemini && userGeminiKey) ? 0 : (selectedModelObj?.creditCost || 0);

  return (
    <div className="flex flex-col h-screen w-full bg-[#09090b] text-white overflow-hidden relative font-sans">
      
      {/* Background Gradient Mesh */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] opacity-40 animate-pulse" style={{ animationDuration: '8s' }}></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[120px] opacity-40 animate-pulse" style={{ animationDuration: '10s' }}></div>
         <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] bg-pink-600/10 rounded-full blur-[100px] opacity-30 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/30 text-blue-400 text-xs font-bold border border-blue-800/50 shadow-lg shadow-blue-900/20">
              <SparklesIcon className="w-3 h-3" />
              <span>{credits} créditos restantes</span>
          </div>
          <UserMenu 
              user={session?.user || null} 
              onLogin={onLoginClick} 
              onLogout={onLogout} 
              onOpenSettings={onOpenSettings}
          />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 w-full max-w-5xl mx-auto">
        
        {/* Hero Text */}
        <div className="mb-12 text-center animate-slideInUp">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-2">
                Hora de lançar, {userName}
            </h1>
        </div>

        {/* Main Input Area */}
        <div className="w-full max-w-3xl animate-slideInUp" style={{ animationDelay: '100ms' }}>
            <div className="relative group rounded-3xl bg-[#18181b] border border-[#27272a] shadow-2xl transition-all focus-within:ring-1 focus-within:ring-white/20 focus-within:border-white/20">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Peça a Codegen para criar um blog sobre..."
                    className="w-full h-[140px] p-6 bg-transparent text-lg text-white placeholder-gray-500 resize-none focus:outline-none rounded-t-3xl"
                    autoFocus
                />

                {/* Attachments UI inside input area */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-6 mb-2">
                    {attachedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-[#27272a] rounded-lg border border-[#3f3f46] text-[10px] text-gray-300">
                        <span className="truncate max-w-[120px]">{file.name}</span>
                        <button onClick={() => removeFile(file)} className="hover:text-white transition-colors">
                          <CloseIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Input Footer */}
                <div className="flex items-center justify-between px-4 pb-4">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#27272a] hover:bg-[#3f3f46] text-xs font-medium text-gray-300 transition-colors border border-transparent hover:border-gray-600"
                        >
                             <PlusIcon className="w-4 h-4" />
                             <span className="hidden sm:inline">Anexar</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept="image/*,text/*" />

                        <button 
                            onClick={onOpenGithubImport}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#27272a] hover:bg-[#3f3f46] text-xs font-medium text-gray-300 transition-colors border border-transparent hover:border-gray-600"
                        >
                            <GithubIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Anexar Repo</span>
                        </button>
                         <button 
                            onClick={() => folderInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#27272a] hover:bg-[#3f3f46] text-xs font-medium text-gray-300 transition-colors border border-transparent hover:border-gray-600"
                        >
                            <FolderIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Pasta</span>
                        </button>
                        <input type="file" ref={folderInputRef} onChange={handleFolderSelect} multiple style={{ display: 'none' }} {...{ webkitdirectory: "true", directory: "true" }} />
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Model Selector Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                             <button 
                                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#27272a] hover:bg-[#3f3f46] text-xs font-medium text-gray-300 transition-colors border border-[#27272a] hover:border-gray-600"
                            >
                                {getModelIcon(selectedModel)}
                                <span className="truncate max-w-[100px]">{selectedModelObj?.name}</span>
                                <span className={`text-[10px] font-bold px-1 rounded bg-black/20 ${actualCreditCost === 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                    -{actualCreditCost}
                                </span>
                                <ChevronDownIcon className="w-3 h-3 text-gray-500" />
                            </button>

                            {isModelDropdownOpen && (
                                <div className="absolute bottom-full mb-2 right-0 w-64 bg-[#18181b] border border-[#27272a] rounded-xl shadow-xl overflow-hidden z-50 animate-fadeIn">
                                    <div className="p-1 max-h-80 overflow-y-auto custom-scrollbar">
                                        {AI_MODELS.map(model => {
                                            const isGeminiModel = model.id.includes('gemini');
                                            const modelCost = (isGeminiModel && userGeminiKey) ? 0 : model.creditCost;
                                            return (
                                                <button
                                                    key={model.id}
                                                    onClick={() => {
                                                        setSelectedModel(model.id);
                                                        setIsModelDropdownOpen(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                                        selectedModel === model.id 
                                                            ? 'bg-[#27272a] text-white' 
                                                            : 'text-gray-400 hover:bg-[#27272a] hover:text-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {getModelIcon(model.id)}
                                                        {model.name}
                                                    </div>
                                                    <span className={`text-[10px] px-1.5 rounded ${modelCost === 0 ? 'bg-green-500/10 text-green-400' : 'bg-black/40 text-gray-500'}`}>
                                                        {modelCost}c
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#27272a] text-xs font-medium text-gray-400 border border-[#27272a]">
                            <ChatIcon />
                            <span>Chat</span>
                        </div>
                         <button 
                            onClick={handlePromptSubmitInternal}
                            disabled={!prompt.trim() && attachedFiles.length === 0}
                            className={`p-2 rounded-full transition-all duration-300 ${prompt.trim() || attachedFiles.length > 0 ? 'bg-white text-black hover:opacity-90' : 'bg-[#3f3f46] text-gray-500 cursor-not-allowed'}`}
                        >
                             <div className="w-5 h-5 flex items-center justify-center">
                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                             </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Cards / Recents */}
        <div className="w-full max-w-5xl mt-16 animate-slideInUp" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-4">
                    <button className="px-4 py-1.5 rounded-full bg-[#18181b] border border-[#27272a] text-sm text-white font-medium">
                        {displayProjects.length > 0 ? "Vistos Recentemente" : "Começar Agora"}
                    </button>
                    <button onClick={onShowProjects} className="px-4 py-1.5 rounded-full hover:bg-[#18181b] text-sm text-gray-400 hover:text-white transition-colors">Meus Projetos</button>
                </div>
                {displayProjects.length > 0 && (
                    <button onClick={onShowProjects} className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                        Ver todos <span className="text-lg">→</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayProjects.length > 0 ? (
                    displayProjects.map((project, index) => (
                        <div 
                            key={project.id}
                            onClick={() => onLoadProject(project.id)}
                            className="group relative h-40 rounded-xl bg-[#121214] border border-[#27272a] overflow-hidden hover:border-gray-600 transition-all cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-50 group-hover:opacity-80 transition-opacity"></div>
                            <div className="absolute top-4 left-4">
                                <div className={`w-8 h-8 rounded bg-[#27272a] flex items-center justify-center ${index % 2 === 0 ? 'text-blue-400' : 'text-purple-400'}`}>
                                    {index % 2 === 0 ? <SparklesIcon className="w-5 h-5" /> : <FolderIcon className="w-5 h-5" />}
                                </div>
                            </div>
                            <div className="absolute bottom-4 left-4 right-4">
                                <h3 className="text-white font-medium truncate">{project.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <ClockIcon className="w-3 h-3 text-gray-500" />
                                    <p className="text-xs text-gray-500">{getTimeAgo(project.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <>
                        <div className="group relative h-40 rounded-xl bg-[#121214] border border-[#27272a] border-dashed flex flex-col items-center justify-center gap-3 text-gray-500 hover:border-gray-500 hover:text-gray-300 transition-colors cursor-pointer" onClick={() => folderInputRef.current?.click()}>
                            <FolderIcon className="w-8 h-8 opacity-50" />
                            <span className="text-sm">Abrir pasta local</span>
                        </div>
                        <div className="group relative h-40 rounded-xl bg-[#121214] border border-[#27272a] border-dashed flex flex-col items-center justify-center gap-3 text-gray-500 hover:border-gray-500 hover:text-gray-300 transition-colors cursor-pointer" onClick={onOpenGithubImport}>
                            <GithubIcon className="w-8 h-8 opacity-50" />
                            <span className="text-sm">Clonar do GitHub</span>
                        </div>
                    </>
                )}
            </div>
        </div>

      </main>
    </div>
  );
};
