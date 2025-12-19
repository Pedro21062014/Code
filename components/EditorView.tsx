
import React, { useState, useMemo } from 'react';
import { ProjectFile, Theme } from '../types';
import { CodePreview } from './CodePreview';
import { 
    CloseIcon, SunIcon, MoonIcon, SparklesIcon, TerminalIcon, GithubIcon, ChatIcon, 
    FileIcon, FolderIcon, ChevronDownIcon, DownloadIcon, SaveIcon, ProjectsIcon, 
    ImageIcon, LogOutIcon, SettingsIcon, LoaderIcon, CheckCircleIcon
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
  onOpenImageStudio: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  session: any | null;
  isGenerating: boolean;
  generatingFile: string | null;
  generatedFileNames: Set<string>;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

const CodeDisplay: React.FC<{ code: string }> = ({ code }) => (
    <pre className="p-4 text-xs md:text-sm whitespace-pre-wrap break-words text-gray-300 font-mono leading-relaxed overflow-x-auto">
      <code>{code}</code>
    </pre>
);

const PreviewNavbar: React.FC<{ url: string }> = ({ url }) => (
  <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-[#18181b] border-b border-[#27272a] flex-shrink-0 overflow-hidden">
    <div className="hidden sm:flex gap-1">
      <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
    </div>
    <div className="flex-1 flex items-center bg-[#09090b] rounded-md px-2 md:px-3 py-1 border border-[#27272a] sm:ml-2 overflow-hidden">
      <span className="hidden xs:inline text-[9px] text-gray-500 mr-1.5 uppercase font-bold tracking-tight">preview</span>
      <span className="text-[10px] md:text-[11px] text-gray-300 font-mono truncate">{url || '/'}</span>
    </div>
  </div>
);

const Toast: React.FC<{ message: string; onFix: () => void; onClose: () => void }> = ({ message, onFix, onClose }) => {
    return (
        <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 z-50 w-auto md:w-full md:max-w-sm animate-slideInUp">
            <div className="bg-[#18181b] rounded-lg shadow-2xl border border-red-500/50 overflow-hidden">
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 text-red-500">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-200 text-sm">Preview Error</p>
                            <p className="text-xs text-gray-400 mt-1 break-words leading-relaxed">{message}</p>
                            <div className="mt-3 flex gap-2">
                                <button
                                onClick={onFix}
                                className="px-3 py-1.5 text-xs font-semibold text-black bg-white rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                                >
                                <SparklesIcon className="w-3.5 h-3.5" /> Auto Fix
                                </button>
                                <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const EditorView: React.FC<EditorViewProps> = ({ 
    files, activeFile, projectName, theme, onThemeChange, onFileSelect, onFileDelete, 
    onRunLocally, onSyncGithub, codeError, onFixCode, onClearError, onError, envVars, 
    onOpenChatMobile, onDownload, onSave, onOpenProjects, onNewProject, onOpenImageStudio, 
    onLogout, onOpenSettings, session, isGenerating, generatingFile, generatedFileNames
}) => {
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
  const [previewUrl, setPreviewUrl] = useState('/');
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['src', 'components', 'styles']));
  const [showExplorer, setShowExplorer] = useState(true);

  const selectedFile = files.find(f => f.name === activeFile);

  const fileTree = useMemo(() => {
    const root: FileNode[] = [];
    const allFilePaths = [...files.map(f => f.name)];
    
    allFilePaths.forEach(filePath => {
      const parts = filePath.split('/');
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
      const isBeingGenerated = isGenerating && node.path === generatingFile;
      const isCompleted = isGenerating && generatedFileNames.has(node.path) && !isBeingGenerated;

      if (node.type === 'folder') {
        return (
          <div key={node.path} className="flex flex-col">
            <button
              onClick={() => toggleFolder(node.path)}
              className="flex items-center gap-2 px-2 py-1 text-[11px] md:text-xs text-gray-500 hover:text-gray-200 hover:bg-[#18181b] rounded-md transition-colors group"
              style={{ paddingLeft: `${(level * 8) + 4}px` }}
            >
              <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
              <FolderIcon className="w-3.5 h-3.5 opacity-60" />
              <span className="truncate">{node.name}</span>
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
          className={`flex items-center gap-2 px-2 py-1 text-[11px] md:text-xs rounded-md transition-all border border-transparent ${
            isSelected ? 'bg-[#27272a] text-white' : 'text-gray-500 hover:bg-[#18181b] hover:text-gray-200'
          }`}
          style={{ paddingLeft: `${(level * 8) + 16}px` }}
        >
          <FileIcon className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
          <span className="truncate flex-1 text-left">{node.name}</span>
          {isBeingGenerated && <LoaderIcon className="w-3 h-3 animate-spin text-blue-400" />}
          {isCompleted && <CheckCircleIcon className="w-3 h-3 text-green-500" />}
        </button>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] overflow-hidden">
      {/* Improved Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a] bg-[#121214] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
            <button 
                onClick={onOpenChatMobile}
                className="lg:hidden p-1.5 rounded-md text-gray-400 hover:bg-[#27272a] hover:text-white"
            >
                <ChatIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg" onClick={onNewProject}>
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7L12 12L22 7L12 2Z" /><path d="M2 17L12 22L22 17" /><path d="M2 12L12 17L22 12" /></svg>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-none mb-1">Codegen Studio</span>
                    <span className="text-sm text-gray-200 font-medium truncate max-w-[150px] leading-none">{projectName}</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-[#09090b] border border-[#27272a] rounded-lg p-0.5">
                <button 
                    onClick={() => setViewMode('code')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'code' ? 'bg-[#27272a] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Editor
                </button>
                <button 
                    onClick={() => setViewMode('preview')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'preview' ? 'bg-[#27272a] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Preview
                </button>
            </div>

            <div className="h-6 w-px bg-[#27272a] mx-2 hidden md:block"></div>

            <div className="flex items-center gap-1">
                <button onClick={onSave} className="p-2 rounded-lg text-gray-500 hover:bg-[#27272a] hover:text-white transition-colors" title="Save Project"><SaveIcon className="w-5 h-5" /></button>
                <button onClick={onOpenProjects} className="p-2 rounded-lg text-gray-500 hover:bg-[#27272a] hover:text-white transition-colors" title="My Projects"><ProjectsIcon className="w-5 h-5" /></button>
                <button onClick={onDownload} className="p-2 rounded-lg text-gray-500 hover:bg-[#27272a] hover:text-white transition-colors" title="Download ZIP"><DownloadIcon className="w-5 h-5" /></button>
                <div className="h-6 w-px bg-[#27272a] mx-1"></div>
                <UserMenu user={session} onLogin={() => {}} onLogout={onLogout} onOpenSettings={onOpenSettings} />
            </div>
        </div>
      </div>
      
      <div className="flex-grow flex overflow-hidden">
        {/* Integrated File Explorer */}
        {viewMode === 'code' && showExplorer && (
            <div className="w-56 border-r border-[#27272a] bg-[#09090b] flex flex-col flex-shrink-0 animate-fadeIn">
                <div className="px-4 py-3 flex justify-between items-center border-b border-[#27272a]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Explorer</span>
                    <button onClick={() => onNewProject()} className="p-1 text-gray-600 hover:text-white"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg></button>
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                    {renderTree(fileTree)}
                </div>
            </div>
        )}

        <div className="flex-grow flex flex-col overflow-hidden bg-[#121214] relative">
            {viewMode === 'code' ? (
            <>
                <div className="flex items-center h-10 border-b border-[#27272a] bg-[#09090b] overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => setShowExplorer(!showExplorer)}
                        className={`px-3 h-full border-r border-[#27272a] flex items-center transition-colors ${showExplorer ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                        <TerminalIcon className="w-4 h-4" />
                    </button>
                    {files.slice(0, 8).map(file => (
                        <button
                            key={file.name}
                            onClick={() => onFileSelect(file.name)}
                            className={`flex items-center px-4 h-full text-[11px] border-r border-[#27272a] transition-all ${activeFile === file.name ? 'bg-[#121214] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[#121214]/50'}`}
                        >
                            <span className="truncate max-w-[120px]">{file.name}</span>
                        </button>
                    ))}
                </div>
                <div className="flex-grow overflow-auto custom-scrollbar">
                    {selectedFile ? <CodeDisplay code={selectedFile.content} /> : <div className="flex items-center justify-center h-full text-gray-600 text-xs italic">Selecione um arquivo para ver o código</div>}
                </div>
            </>
            ) : (
            <>
                <PreviewNavbar url={previewUrl} />
                <div className="flex-grow bg-[#09090b]">
                <CodePreview files={files} onError={onError} theme={theme} envVars={envVars} onUrlChange={setPreviewUrl} />
                </div>
            </>
            )}
            {codeError && <Toast message={codeError} onFix={onFixCode} onClose={onClearError} />}
        </div>
      </div>
    </div>
  );
};
