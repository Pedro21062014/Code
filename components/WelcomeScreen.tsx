import React, { useState, useRef } from 'react';
import { SparklesIcon, GithubIcon, FolderIcon, PlusIcon, ChevronDownIcon, ChatIcon } from './Icons';
import { User } from 'firebase/auth';
import { ProjectFile } from '../types';
import { AI_MODELS } from '../constants';
import { UserMenu } from './UserMenu';

interface WelcomeScreenProps {
  onPromptSubmit: (prompt: string, model: string) => void;
  onShowPricing: () => void;
  onShowProjects: () => void;
  onOpenGithubImport: () => void;
  onFolderImport: (files: ProjectFile[]) => void;
  session: { user: User } | null;
  onLoginClick: () => void;
  onNewProject: () => void;
  onLogout: () => void;
  onOpenSettings?: () => void;
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

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
    onPromptSubmit, 
    onOpenGithubImport, 
    onFolderImport, 
    session, 
    onShowProjects,
    onLoginClick,
    onLogout,
    onOpenSettings = () => {}
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim()) {
        onPromptSubmit(prompt.trim(), selectedModel);
      }
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

  const userName = session?.user?.email?.split('@')[0] || 'dev';
  const selectedModelName = AI_MODELS.find(m => m.id === selectedModel)?.name || 'Model';

  return (
    <div className="flex flex-col h-screen w-full bg-[#09090b] text-white overflow-hidden relative font-sans">
      
      {/* Background Gradient Mesh */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] opacity-40 animate-pulse" style={{ animationDuration: '8s' }}></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[120px] opacity-40 animate-pulse" style={{ animationDuration: '10s' }}></div>
         <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] bg-pink-600/10 rounded-full blur-[100px] opacity-30 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="absolute top-6 right-6 z-50">
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
                    className="w-full h-[140px] p-6 bg-transparent text-lg text-white placeholder-gray-500 resize-none focus:outline-none rounded-3xl"
                    autoFocus
                />
                
                {/* Input Footer */}
                <div className="flex items-center justify-between px-4 pb-4">
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#27272a] hover:bg-[#3f3f46] text-xs font-medium text-gray-300 transition-colors border border-transparent hover:border-gray-600">
                             <PlusIcon />
                        </button>
                        <button 
                            onClick={onOpenGithubImport}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#27272a] hover:bg-[#3f3f46] text-xs font-medium text-gray-300 transition-colors border border-transparent hover:border-gray-600"
                        >
                            <GithubIcon className="w-4 h-4" />
                            <span>Anexar Repo</span>
                        </button>
                         <button 
                            onClick={() => folderInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#27272a] hover:bg-[#3f3f46] text-xs font-medium text-gray-300 transition-colors border border-transparent hover:border-gray-600"
                        >
                            <FolderIcon className="w-4 h-4" />
                            <span>Pasta</span>
                        </button>
                        <input type="file" ref={folderInputRef} onChange={handleFolderSelect} multiple style={{ display: 'none' }} {...{ webkitdirectory: "true", directory: "true" }} />
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Model Selector */}
                        <div className="relative flex items-center">
                             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#27272a] text-xs font-medium text-gray-400 border border-[#27272a] hover:border-gray-600 transition-colors pointer-events-none">
                                <SparklesIcon className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[100px]">{selectedModelName}</span>
                                <ChevronDownIcon className="w-3 h-3 text-gray-500" />
                            </div>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            >
                                {AI_MODELS.map(m => (
                                    <option key={m.id} value={m.id} className="text-black bg-white">
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#27272a] text-xs font-medium text-gray-400 border border-[#27272a]">
                            <ChatIcon />
                            <span>Chat</span>
                        </div>
                         <button 
                            onClick={() => prompt.trim() && onPromptSubmit(prompt.trim(), selectedModel)}
                            disabled={!prompt.trim()}
                            className={`p-2 rounded-full transition-all duration-300 ${prompt.trim() ? 'bg-white text-black hover:opacity-90' : 'bg-[#3f3f46] text-gray-500 cursor-not-allowed'}`}
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
                    <button className="px-4 py-1.5 rounded-full bg-[#18181b] border border-[#27272a] text-sm text-white font-medium">Recently viewed</button>
                    <button onClick={onShowProjects} className="px-4 py-1.5 rounded-full hover:bg-[#18181b] text-sm text-gray-400 hover:text-white transition-colors">My projects</button>
                    <button className="px-4 py-1.5 rounded-full hover:bg-[#18181b] text-sm text-gray-400 hover:text-white transition-colors">Templates</button>
                </div>
                <button onClick={onShowProjects} className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                    Browse all <span className="text-lg">→</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Example Card 1 */}
                <div className="group relative h-40 rounded-xl bg-[#121214] border border-[#27272a] overflow-hidden hover:border-gray-600 transition-all cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-50"></div>
                    <div className="absolute top-4 left-4">
                         <div className="w-8 h-8 rounded bg-blue-900/30 flex items-center justify-center text-blue-400">
                            <SparklesIcon />
                         </div>
                    </div>
                    <div className="absolute bottom-4 left-4">
                        <h3 className="text-white font-medium">Novo App React</h3>
                        <p className="text-xs text-gray-500">Editado há 2 horas</p>
                    </div>
                </div>

                 {/* Example Card 2 */}
                <div className="group relative h-40 rounded-xl bg-[#121214] border border-[#27272a] overflow-hidden hover:border-gray-600 transition-all cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-50"></div>
                     <div className="absolute top-4 left-4">
                         <div className="w-8 h-8 rounded bg-purple-900/30 flex items-center justify-center text-purple-400">
                            <FolderIcon />
                         </div>
                    </div>
                    <div className="absolute bottom-4 left-4">
                        <h3 className="text-white font-medium">Dashboard Financeiro</h3>
                        <p className="text-xs text-gray-500">Editado ontem</p>
                    </div>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};