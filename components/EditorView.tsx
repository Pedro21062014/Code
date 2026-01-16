
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ProjectFile, Theme, ChatMode, ProjectVersion } from '../types';
import { CodePreview } from './CodePreview';
import { 
    CloseIcon, SunIcon, MoonIcon, SparklesIcon, TerminalIcon, GithubIcon, ChatIcon, 
    FileIcon, FolderIcon, ChevronDownIcon, DownloadIcon, SaveIcon, ProjectsIcon, 
    LogOutIcon, SettingsIcon, LoaderIcon, CheckCircleIcon, AppLogo,
    PlusIcon, EditIcon, UsersIcon, HomeIcon, ClockIcon, ImageIcon, UploadIcon, TrashIcon
} from './Icons';
import { UserMenu } from './UserMenu';
import { VersioningModal } from './VersioningModal';

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
  onOpenProjectSettings: () => void; 
  onRenameProject: (newName: string) => void;
  onNavigateHome: () => void;
  session: any | null;
  isGenerating: boolean;
  generatingFile: string | null;
  generatedFileNames: Set<string>;
  aiSuggestions: string[];
  deployedUrl?: string | undefined;
  chatMode?: ChatMode;
  // History Props
  projectHistory?: ProjectVersion[];
  onRestoreVersion?: (version: ProjectVersion) => void;
  // New Props for File Management
  onFileUpload?: (files: ProjectFile[]) => void;
  onRenameFile?: (oldName: string, newName: string) => void;
  onMoveFile?: (oldPath: string, newPath: string) => void;
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

const ImageDisplay: React.FC<{ content: string; name: string }> = ({ content, name }) => (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#f0f0f0] dark:bg-[#121214] p-8 overflow-hidden relative">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}></div>
        <div className="relative z-10 shadow-xl rounded overflow-hidden bg-transparent max-w-full max-h-full flex items-center justify-center">
            <img 
                src={content} 
                alt={name} 
                className="max-w-full max-h-[70vh] object-contain block"
            />
        </div>
        <div className="mt-6 px-3 py-1.5 bg-black/10 dark:bg-white/10 rounded-full backdrop-blur-md z-10">
            <p className="text-xs font-mono text-gray-600 dark:text-gray-300">{name}</p>
        </div>
    </div>
);

const isImageFile = (filename: string) => {
    return /\.(jpg|jpeg|png|gif|ico|svg|webp|bmp)$/i.test(filename);
};

export const EditorView: React.FC<EditorViewProps> = ({ 
    files, activeFile, projectName, theme, onThemeChange, onFileSelect, onFileDelete, 
    onRunLocally, onSyncGithub, onShare, codeError, onFixCode, onClearError, onError, envVars, 
    onOpenChatMobile, onDownload, onSave, onOpenProjects, onNewProject, 
    onLogout, onOpenSettings, onOpenProjectSettings, onRenameProject, onNavigateHome, session, isGenerating, generatingFile, generatedFileNames, aiSuggestions,
    deployedUrl, chatMode = 'general', projectHistory = [], onRestoreVersion,
    onFileUpload, onRenameFile, onMoveFile
}) => {
  const [viewMode, setViewMode] = useState<'code' | 'preview' | 'both'>('preview');
  const [showExplorer, setShowExplorer] = useState(true);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['src', 'components', 'lib', 'app']));
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, path: string, type: 'file' | 'folder' } | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const selectedFile = files.find(f => f.name === activeFile);

  // Close context menu on click outside
  useEffect(() => {
      const handleClick = (e: MouseEvent) => {
          if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
              setContextMenu(null);
          }
      };
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
  }, []);

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

  const handleFileUploadInternal = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0 && onFileUpload) {
          const filesArray = Array.from(e.target.files);
          const filePromises = filesArray.map(item => new Promise<ProjectFile>((resolve) => {
              const file = item as File;
              const reader = new FileReader();
              const isImage = isImageFile(file.name);
              reader.onload = () => {
                  resolve({
                      name: file.name, // Files uploaded via this button go to root
                      content: reader.result as string,
                      language: isImage ? 'image' : 'plaintext'
                  });
              };
              if (isImage) reader.readAsDataURL(file);
              else reader.readAsText(file);
          }));

          Promise.all(filePromises).then(newFiles => {
              onFileUpload(newFiles);
              if (fileInputRef.current) fileInputRef.current.value = '';
          });
      }
  };

  const handleRightClick = (e: React.MouseEvent, path: string, type: 'file' | 'folder') => {
      e.preventDefault();
      e.stopPropagation(); // Crucial to prevent other click handlers
      const x = Math.min(e.clientX, window.innerWidth - 170); // Prevent overflow right
      const y = Math.min(e.clientY, window.innerHeight - 100); // Prevent overflow bottom
      setContextMenu({ x, y, path, type });
  };

  const handleRename = () => {
      if (!contextMenu || !onRenameFile) return;
      const oldName = contextMenu.path;
      const fileName = oldName.split('/').pop() || '';
      const newName = prompt("Novo nome:", fileName);
      if (newName && newName !== fileName) {
          const pathParts = oldName.split('/');
          pathParts.pop();
          const newPath = pathParts.length > 0 ? `${pathParts.join('/')}/${newName}` : newName;
          onRenameFile(oldName, newPath);
      }
      setContextMenu(null);
  };

  const handleDelete = () => {
      if (!contextMenu) return;
      if (window.confirm(`Tem certeza que deseja excluir ${contextMenu.path}?`)) {
          onFileDelete(contextMenu.path); 
      }
      setContextMenu(null);
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, path: string) => {
      e.dataTransfer.setData('text/plain', path);
      setDraggedItem(path);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, targetPath: string, isFolder: boolean) => {
      e.preventDefault();
      e.stopPropagation();
      const sourcePath = e.dataTransfer.getData('text/plain');
      
      if (!sourcePath || sourcePath === targetPath || !onMoveFile) return;

      // Calculate destination
      // If dropped on a folder, move INTO that folder
      // If dropped on a file, move into the SAME FOLDER as that file
      let destinationFolder = '';
      if (isFolder) {
          destinationFolder = targetPath;
      } else {
          const parts = targetPath.split('/');
          parts.pop();
          destinationFolder = parts.join('/');
      }

      const fileName = sourcePath.split('/').pop() || '';
      const newPath = destinationFolder ? `${destinationFolder}/${fileName}` : fileName;

      if (sourcePath !== newPath) {
          onMoveFile(sourcePath, newPath);
      }
      setDraggedItem(null);
  };

  const renderTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => {
      const isOpen = openFolders.has(node.path);
      const isSelected = activeFile === node.path;
      const isImage = isImageFile(node.name);
      
      if (node.type === 'folder') {
        return (
          <div 
            key={node.path} 
            className="flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, node.path, true)}
          >
            <button
              onClick={() => toggleFolder(node.path)}
              onContextMenu={(e) => handleRightClick(e, node.path, 'folder')}
              className="flex items-center gap-1.5 px-3 py-1 text-[12px] text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors group select-none hover:bg-gray-100 dark:hover:bg-[#1f1f22] rounded-sm mx-1"
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
          onContextMenu={(e) => handleRightClick(e, node.path, 'file')}
          draggable
          onDragStart={(e) => handleDragStart(e, node.path)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, node.path, false)}
          className={`flex items-center gap-2 px-3 py-1 text-[12px] transition-all border-l-2 mx-1 rounded-r-sm ${
            isSelected 
            ? 'bg-gray-100 dark:bg-[#1a1a1c] text-black dark:text-white border-blue-500' 
            : 'text-gray-500 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#121214] hover:text-gray-900 dark:hover:text-gray-300 border-transparent'
          }`}
          style={{ paddingLeft: `${(level * 12) + 26}px` }}
        >
          {isImage ? (
              <ImageIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-purple-500' : 'opacity-50'}`} />
          ) : (
              <FileIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-blue-500' : 'opacity-50'}`} />
          )}
          <span className="truncate flex-1 text-left">{node.name}</span>
        </button>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#09090b] overflow-hidden text-gray-900 dark:text-white transition-colors duration-300 relative">
      
      {/* Versioning Modal */}
      {onRestoreVersion && (
          <VersioningModal 
            isOpen={isHistoryModalOpen} 
            onClose={() => setIsHistoryModalOpen(false)}
            versions={projectHistory}
            onRestore={onRestoreVersion}
          />
      )}

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
                onClick={onSyncGithub}
                className="p-2 text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1f1f22] rounded-md transition-colors"
                title="Sincronizar com GitHub"
            >
                <GithubIcon className="w-4 h-4" />
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
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="p-1 text-gray-400 hover:text-black dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-[#27272a] transition-colors"
                            title="Upload de Arquivo"
                        >
                            <UploadIcon className="w-3.5 h-3.5" />
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUploadInternal} 
                            multiple 
                            className="hidden" 
                        />
                        {/* Placeholder for New File Logic - currently automated via AI */}
                    </div>
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
                                {isImageFile(activeFile) ? <ImageIcon className="w-3 h-3 opacity-70" /> : <FileIcon className="w-3 h-3 opacity-70" />}
                                {activeFile}
                                <button className="ml-2 hover:text-red-500"><CloseIcon className="w-3 h-3" /></button>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-[#0a0a0a]">
                        {selectedFile ? (
                            isImageFile(selectedFile.name) ? (
                                <ImageDisplay content={selectedFile.content} name={selectedFile.name} />
                            ) : (
                                <CodeDisplay code={selectedFile.content} />
                            )
                        ) : (
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
                        <div className="flex-1 flex justify-center items-center gap-2">
                            <div className="bg-gray-100 dark:bg-[#18181b] rounded-md px-3 py-1 text-[10px] text-gray-500 font-mono w-full max-w-sm text-center truncate border border-transparent dark:border-[#27272a] flex justify-between items-center group">
                                <span className="flex-1 text-center">{deployedUrl || 'localhost:3000 (Simulated)'}</span>
                                {/* Clock Icon for Versioning */}
                                <button 
                                    onClick={() => setIsHistoryModalOpen(true)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-[#27272a] rounded transition-colors text-gray-400 hover:text-black dark:hover:text-white"
                                    title="Histórico de Versões"
                                >
                                    <ClockIcon className="w-3 h-3" />
                                </button>
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
                            chatMode={chatMode} 
                        />
                    </div>
                    
                    {/* Generation Overlay REMOVED as requested */}
                </div>
            )}
        </main>
      </div>

      {/* Context Menu - Fixed Z-Index */}
      {contextMenu && (
          <>
            <div className="fixed inset-0 z-[190]" onClick={() => setContextMenu(null)} />
            <div 
                ref={contextMenuRef}
                className="fixed bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] shadow-xl rounded-lg py-1 z-[200] w-40 animate-fadeIn"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-3 py-1.5 text-[10px] text-gray-400 border-b border-gray-100 dark:border-[#27272a] mb-1 font-mono truncate">
                    {contextMenu.path.split('/').pop()}
                </div>
                <button 
                    onClick={handleRename}
                    className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#27272a] flex items-center gap-2"
                >
                    <EditIcon className="w-3 h-3" /> Renomear
                </button>
                <button 
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                >
                    <TrashIcon className="w-3 h-3" /> Excluir
                </button>
            </div>
          </>
      )}
    </div>
  );
};
