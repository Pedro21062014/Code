
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ProjectFile, Theme } from '../types';
import { CodePreview } from './CodePreview';
import { 
    CloseIcon, SunIcon, MoonIcon, SparklesIcon, TerminalIcon, GithubIcon, ChatIcon, 
    FileIcon, FolderIcon, ChevronDownIcon, DownloadIcon, SaveIcon, ProjectsIcon, 
    LogOutIcon, SettingsIcon, LoaderIcon, CheckCircleIcon, AppLogo,
    PlusIcon, EditIcon, UsersIcon, HomeIcon
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
  onOpenProjectSettings: () => void; // CHANGED: New Prop
  onRenameProject: (newName: string) => void; // Keep for legacy or internal use if needed
  onNavigateHome: () => void;
  session: any | null;
  isGenerating: boolean;
  generatingFile: string | null;
  generatedFileNames: Set<string>;
  aiSuggestions: string[];
  deployedUrl?: string;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

const CodeDisplay: React.FC<{ code: string }> = ({ code }) => (
    <pre className="p-4 md:p-6 text-[13px] text-gray-800 dark:text-gray-300 font-mono leading-relaxed overflow-x-auto selection:bg-blue-500/30 h-full">
      <code>{code}</code>
    </pre>
);

export const EditorView: React.FC<EditorViewProps> = ({ 
    files, activeFile, projectName, theme, onThemeChange, onFileSelect, onFileDelete, 
    onRunLocally, onSyncGithub, onShare, codeError, onFixCode, onClearError, onError, envVars, 
    onOpenChatMobile, onDownload, onSave, onOpenProjects, onNewProject, 
    onLogout, onOpenSettings, onOpenProjectSettings, onRenameProject, onNavigateHome, session, isGenerating, generatingFile, generatedFileNames, aiSuggestions,
    deployedUrl
}) => {
  const [viewMode, setViewMode] = useState<'code' | 'preview' | 'both'>('preview');
  const [showExplorer, setShowExplorer] = useState(true);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['src', 'components', 'lib', 'app']));
  
  const selectedFile = files.find(f => f.name === activeFile);

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
              className="flex items-center gap-1.5 px-3 py-1 text-[12px] text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors group select-none"
              style={{ paddingLeft: `${(level * 12) + 12}px` }}
            >
              <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'} opacity-70`} />
              <FolderIcon className="w-3.5 h-3.5 text-blue-500/80 dark:text-blue-400/80" />
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
          className={`flex items-center gap-2 px-3 py-1 text-[12px] transition-all border-l-2 ${
            isSelected 
            ? 'bg-gray-100 dark:bg-[#1a1a1c] text-black dark:text-white border-blue-500' 
            : 'text-gray-500 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#121214] hover:text-gray-900 dark:hover:text-gray-300 border-transparent'
          }`}
          style={{ paddingLeft: `${(level * 12) + 26}px` }}
        >
          <FileIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-blue-500' : 'opacity-50'}`} />
          <span className="truncate flex-1 text-left">{node.name}</span>
        </button>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#09090b] overflow-hidden text-gray-900 dark:text-white transition-colors duration-300">
      
      {/* Header PRO (Minimalist) */}
      <header className="h-12 border-b border-gray-200 dark:border-[#27272a] flex items-center justify-between px-4 bg-white dark:bg-[#09090b] z-50 transition-colors">
        
        {/* Left: Project Info */}
        <div className="flex items-center gap-3">
            {/* Mobile Toggle */}
            <button onClick={onOpenProjects} className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#1f1f22]">
                <ProjectsIcon className="w-4 h-4" />
            </button>

            {/* Home Icon */}
            <button 
                onClick={onNavigateHome} 
                className="p-1.5 text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1f1f22] rounded-md transition-colors"
                title="Voltar para o Início"
            >
                <HomeIcon className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-gray-200 dark:bg-[#27272a]"></div>

            <div className="flex items-center gap-2 group">
                <div 
                    className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#1f1f22] transition-colors cursor-pointer" 
                    onClick={onOpenProjectSettings}
                    title="Configurações do Projeto"
                >
                    <span className="text-xs font-semibold tracking-tight text-gray-900 dark:text-white">{projectName}</span>
                    <SettingsIcon className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                </div>
            </div>
            
            <div className="h-4 w-px bg-gray-200 dark:bg-[#27272a]"></div>
            
            <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${deployedUrl ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                <span className="text-[10px] text-gray-500 font-mono">{deployedUrl ? 'Live' : 'Draft'}</span>
            </div>
        </div>

        {/* Center: View Toggle (Pill) */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex bg-gray-100 dark:bg-[#18181b] p-0.5 rounded-lg border border-gray-200 dark:border-[#27272a]">
            <button 
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                    viewMode === 'code' 
                    ? 'bg-white dark:bg-[#27272a] text-black dark:text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                }`}
            >
                <TerminalIcon className="w-3 h-3" />
                Code
            </button>
            <button 
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                    viewMode === 'preview' 
                    ? 'bg-white dark:bg-[#27272a] text-black dark:text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                }`}
            >
                <SparklesIcon className="w-3 h-3" />
                Preview
            </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
            <button 
                onClick={onSave}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-md text-xs font-bold hover:opacity-80 transition-opacity"
            >
                <SaveIcon className="w-3 h-3" /> Save
            </button>
            
            <button
                onClick={onShare}
                className="p-2 text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1f1f22] rounded-md transition-colors"
                title="Compartilhar"
            >
                <UsersIcon className="w-4 h-4" />
            </button>

            <button 
                onClick={onDownload}
                className="p-2 text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1f1f22] rounded-md transition-colors"
                title="Download"
            >
                <DownloadIcon className="w-4 h-4" />
            </button>
            
            <button 
                onClick={onRunLocally}
                className={`px-3 py-1.5 rounded-md text-xs font-bold hover:opacity-90 transition-colors shadow-lg ${deployedUrl ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-900/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20'}`}
            >
                {deployedUrl ? 'Re-Deploy' : 'Deploy'}
            </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Explorer Sidebar - Styled */}
        {viewMode === 'code' && (
            <aside className={`border-r border-gray-200 dark:border-[#27272a] bg-gray-50 dark:bg-[#0c0c0e] transition-all duration-300 overflow-hidden flex flex-col ${showExplorer ? 'w-60' : 'w-0'}`}>
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-[#27272a]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Explorer</span>
                    <button className="p-1 text-gray-400 hover:text-black dark:hover:text-white"><PlusIcon className="w-3 h-3" /></button>
                </div>
                <div className="flex-1 overflow-y-auto pt-2 custom-scrollbar">
                    {renderTree(fileTree)}
                </div>
            </aside>
        )}

        <main className="flex-1 relative bg-white dark:bg-[#0a0a0a] flex flex-col h-full overflow-hidden">
            {viewMode === 'code' ? (
                <div className="h-full flex flex-col">
                    {/* Code Tab Bar */}
                    <div className="h-9 border-b border-gray-200 dark:border-[#27272a] flex items-center px-0 bg-white dark:bg-[#0a0a0a] overflow-x-auto no-scrollbar">
                        <button onClick={() => setShowExplorer(!showExplorer)} className="px-3 h-full flex items-center border-r border-gray-200 dark:border-[#27272a] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#121214]">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        {activeFile && (
                            <div className="px-4 h-full flex items-center gap-2 border-r border-gray-200 dark:border-[#27272a] bg-gray-50 dark:bg-[#121214] text-xs font-mono text-gray-700 dark:text-gray-300 border-t-2 border-t-blue-500 min-w-fit">
                                <FileIcon className="w-3 h-3 opacity-70" />
                                {activeFile}
                                <button className="ml-2 hover:text-red-500"><CloseIcon className="w-3 h-3" /></button>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-[#0a0a0a]">
                        {selectedFile ? <CodeDisplay code={selectedFile.content} /> : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-[#27272a] gap-2 select-none">
                                <AppLogo className="w-16 h-16 opacity-20" />
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="h-full w-full bg-[#f3f4f6] dark:bg-[#050505] relative flex flex-col">
                    {/* Fake Browser Chrome */}
                    <div className="h-10 bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#27272a] flex items-center px-4 gap-4 flex-shrink-0">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                        </div>
                        <div className="flex-1 flex justify-center">
                            <div className="bg-gray-100 dark:bg-[#18181b] rounded-md px-3 py-1 text-[10px] text-gray-500 font-mono w-full max-w-sm text-center truncate border border-transparent dark:border-[#27272a]">
                                {deployedUrl || 'localhost:3000 (Offline)'}
                            </div>
                        </div>
                        <div className="w-10"></div>
                    </div>

                    <div className="flex-1 relative bg-white">
                        <CodePreview 
                            files={files} 
                            onError={onError} 
                            theme={theme} 
                            envVars={envVars}
                            deployedUrl={deployedUrl}
                            onDeploy={onRunLocally}
                        />
                    </div>
                    
                    {/* Generation Overlay */}
                    {isGenerating && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-end justify-center z-20 pb-12">
                             <div className="bg-black dark:bg-[#18181b] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10 animate-slide-up">
                                <LoaderIcon className="w-4 h-4 animate-spin text-blue-400" />
                                <span className="text-xs font-medium">Gerando {generatingFile || 'código'}...</span>
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
