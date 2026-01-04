
import React, { useState, useMemo } from 'react';
import { ProjectFile, Theme } from '../types';
import { CodePreview } from './CodePreview';
import { 
    CloseIcon, SunIcon, MoonIcon, SparklesIcon, TerminalIcon, GithubIcon, ChatIcon, 
    FileIcon, FolderIcon, ChevronDownIcon, DownloadIcon, SaveIcon, ProjectsIcon, 
    LogOutIcon, SettingsIcon, LoaderIcon, CheckCircleIcon, AppLogo,
    PlusIcon
} from './Icons';
import { UserMenu } from './UserMenu';

interface EditorViewProps {
  files: ProjectFile[];
  activeFile: string | null;
  projectName: string;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onFileSelect: (fileName: string) => void;
  onFileDelete: (fileName: string) => void;
  onRunLocally: () => void;
  onSyncGithub: () => void;
  onShare: () => void;
  codeError: string | null;
  onFixCode: () => void;
  onClearError: () => void;
  onError: (errorMessage: string) => void;
  envVars: Record<string, string>;
  onOpenChatMobile?: () => void;
  onDownload: () => void;
  onSave: () => void;
  onOpenProjects: () => void;
  onNewProject: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  session: any | null;
  isGenerating: boolean;
  generatingFile: string | null;
  generatedFileNames: Set<string>;
  aiSuggestions: string[]; 
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

const CodeDisplay: React.FC<{ code: string }> = ({ code }) => (
    <pre className="p-6 text-[13px] text-gray-800 dark:text-gray-300 font-mono leading-relaxed overflow-x-auto selection:bg-blue-500/30 h-full">
      <code>{code}</code>
    </pre>
);

export const EditorView: React.FC<EditorViewProps> = ({ 
    files, activeFile, projectName, theme, onThemeChange, onFileSelect, onFileDelete, 
    onRunLocally, onSyncGithub, onShare, codeError, onFixCode, onClearError, onError, envVars, 
    onOpenChatMobile, onDownload, onSave, onOpenProjects, onNewProject, 
    onLogout, onOpenSettings, session, isGenerating, generatingFile, generatedFileNames, aiSuggestions
}) => {
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview');
  const [showExplorer, setShowExplorer] = useState(true);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['src', 'components', 'lib']));

  const selectedFile = files.find(f => f.name === activeFile);

  // Organiza os arquivos em uma árvore (Explorer Real)
  const fileTree = useMemo(() => {
    const root: FileNode[] = [];
    files.forEach(file => {
      const parts = file.name.split('/');
      let currentLevel = root;
      parts.forEach((part, index) => {
        const path = parts.slice(0, index + 1).join('/');
        const isLast = index === parts.length - 1;
        let existingNode = currentLevel.find(node => node.name === part);

        if (!existingNode) {
          existingNode = {
            name: part,
            path,
            type: isLast ? 'file' : 'folder',
            children: isLast ? undefined : []
          };
          currentLevel.push(existingNode);
          currentLevel.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
        }
        if (!isLast) currentLevel = existingNode.children!;
      });
    });
    return root;
  }, [files]);

  const toggleFolder = (path: string) => {
    const next = new Set(openFolders);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setOpenFolders(next);
  };

  const renderTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => {
      const isOpen = openFolders.has(node.path);
      const isSelected = activeFile === node.path;
      
      if (node.type === 'folder') {
        return (
          <div key={node.path} className="flex flex-col">
            <button
              onClick={() => toggleFolder(node.path)}
              className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 dark:text-gray-500 hover:text-black dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.03] transition-colors group"
              style={{ paddingLeft: `${(level * 12) + 12}px` }}
            >
              <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
              <FolderIcon className="w-3.5 h-3.5 opacity-50" />
              <span className="truncate font-medium">{node.name}</span>
            </button>
            {isOpen && node.children && (
              <div className="flex flex-col">
                {renderTree(node.children, level + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <button
          key={node.path}
          onClick={() => onFileSelect(node.path)}
          className={`flex items-center gap-2 px-3 py-1.5 text-[11px] rounded-md transition-all border border-transparent ${
            isSelected 
            ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.02] hover:text-black dark:hover:text-gray-200'
          }`}
          style={{ paddingLeft: `${(level * 12) + 26}px` }}
        >
          <FileIcon className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
          <span className="truncate flex-1 text-left">{node.name}</span>
        </button>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] overflow-hidden text-gray-900 dark:text-white transition-colors duration-300">
      {/* Bolt-style Main Header */}
      <header className="h-14 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-6 bg-white dark:bg-[#0a0a0a] z-50 transition-colors">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer group" onClick={onOpenProjects}>
                <AppLogo className="w-6 h-6 text-black dark:text-white group-hover:scale-105 transition-transform" />
                <div className="flex items-center gap-2">
                    <span className="text-sm font-black tracking-tight text-gray-900 dark:text-white/90">{projectName}</span>
                    <ChevronDownIcon className="w-3 h-3 text-gray-500 dark:text-gray-600" />
                </div>
            </div>
        </div>

        {/* Center Toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-[#111111] border border-gray-200 dark:border-white/5 rounded-2xl p-1 shadow-sm dark:shadow-2xl">
            <button 
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-2.5 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    viewMode === 'code' 
                    ? 'bg-white dark:bg-[#252525] text-black dark:text-white shadow-md dark:shadow-xl scale-[1.02]' 
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                }`}
            >
                <TerminalIcon className="w-3.5 h-3.5" />
                Code
            </button>
            <button 
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-2.5 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    viewMode === 'preview' 
                    ? 'bg-white dark:bg-[#252525] text-black dark:text-white shadow-md dark:shadow-xl scale-[1.02]' 
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                }`}
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Preview
            </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
            <button 
                onClick={onSave} 
                className="p-2.5 text-gray-500 hover:text-black dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl" 
                title="Salvar Projeto"
            >
                <SaveIcon className="w-5 h-5" />
            </button>
            <button onClick={onSyncGithub} className="p-2.5 text-gray-500 hover:text-black dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl" title="GitHub Sync">
                <GithubIcon className="w-5 h-5" />
            </button>
            <button 
                onClick={onShare} 
                className="px-5 py-2 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all"
            >
                Share
            </button>
            <button 
                onClick={onRunLocally}
                className="px-6 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-xl active:scale-95"
            >
                Publish
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-white/5 mx-1"></div>
            <UserMenu user={session} onLogin={() => {}} onLogout={onLogout} onOpenSettings={onOpenSettings} />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Explorer Sidebar - Estrutura Real */}
        {viewMode === 'code' && (
            <aside className={`border-r border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#0a0a0a] transition-all duration-300 overflow-hidden flex flex-col ${showExplorer ? 'w-64' : 'w-0'}`}>
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#0d0d0d]">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Workspace</span>
                    <button onClick={onNewProject} className="p-1.5 text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5 rounded-lg transition-all"><PlusIcon className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                    {renderTree(fileTree)}
                </div>
            </aside>
        )}

        <main className="flex-1 relative bg-white dark:bg-[#0a0a0a] transition-colors">
            {viewMode === 'code' ? (
                <div className="h-full flex flex-col">
                    <div className="h-10 border-b border-gray-200 dark:border-white/5 flex items-center px-4 bg-gray-50/80 dark:bg-[#0d0d0d]/80 backdrop-blur-md">
                        <button onClick={() => setShowExplorer(!showExplorer)} className="mr-4 text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <div className="flex items-center gap-2">
                             <FileIcon className="w-3 h-3 text-gray-500 dark:text-gray-600" />
                             <span className="text-[11px] font-mono text-gray-600 dark:text-gray-400 font-medium">{activeFile || 'No file selected'}</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-[#050505]">
                        {selectedFile ? <CodeDisplay code={selectedFile.content} /> : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-3 opacity-50 dark:opacity-30">
                                <TerminalIcon className="w-12 h-12" />
                                <span className="text-xs font-bold uppercase tracking-widest">Select a file to inspect code</span>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="h-full bg-white relative">
                    <CodePreview files={files} onError={onError} theme={theme} envVars={envVars} />
                    
                    {/* Overlay de Geração (Codegen Studio Brand) */}
                    {isGenerating && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-[4px] flex items-center justify-center z-20">
                             <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-[2rem] px-8 py-6 flex flex-col items-center gap-4 shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-slideInUp min-w-[300px]">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
                                    <AppLogo className="w-10 h-10 text-black dark:text-white relative z-10 animate-bounce" />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[0.2em] mb-1">Codegen Studio</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-900 dark:text-white font-medium">Construindo...</span>
                                        {generatingFile && <span className="text-xs text-gray-500 font-mono">({generatingFile})</span>}
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}

                    {/* Sugestões da IA sobre o Preview (quando não estiver gerando) */}
                    {!isGenerating && aiSuggestions.length > 0 && (
                        <div className="absolute bottom-6 right-6 z-10 max-w-sm w-full animate-fadeIn">
                            <div className="bg-white/90 dark:bg-[#141414]/90 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-2xl">
                                <div className="flex items-center gap-2 mb-3">
                                    <SparklesIcon className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Sugestões de IA</span>
                                </div>
                                <div className="space-y-2">
                                    {aiSuggestions.slice(0, 3).map((suggestion, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-2 rounded-lg border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-default">
                                            <span className="mt-0.5 opacity-50">•</span>
                                            <span>{suggestion}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </main>
      </div>
    </div>
  );
};
