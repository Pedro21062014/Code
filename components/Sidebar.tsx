
import React, { useState, useEffect, useMemo } from 'react';
import { AppLogo, FileIcon, FolderIcon, CubeIcon, SettingsIcon, DownloadIcon, CloseIcon, GithubIcon, SupabaseIcon, LogInIcon, LogOutIcon, SaveIcon, ProjectsIcon, ShieldIcon, TrashIcon, EditIcon, StripeIcon, DatabaseIcon, LoaderIcon, CheckCircleIcon, ChevronDownIcon, MapIcon } from './Icons';
import { ProjectFile } from '../types';

interface SidebarProps {
  files: ProjectFile[];
  envVars: Record<string, string>;
  onEnvVarChange: (newVars: Record<string, string>) => void;
  onFileSelect: (fileName: string) => void;
  onDownload: () => void;
  onOpenSettings: () => void;
  onOpenGithubImport: () => void;
  onOpenSupabaseAdmin: () => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onOpenProjects: () => void;
  onRenameFile: (oldName: string, newName: string) => void;
  onDeleteFile: (fileName: string) => void;
  onOpenStripeModal: () => void;
  onOpenNeonModal: () => void;
  onOpenOSMModal: () => void;
  activeFile: string | null;
  onClose?: () => void;
  session: any | null;
  onLogin: () => void;
  onLogout: () => void;
  isOfflineMode?: boolean;
  generatingFile: string | null;
  isGenerating: boolean;
  generatedFileNames: Set<string>;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
    return (
      <div className="group relative flex justify-center w-full">
        {children}
        <span className="absolute left-14 p-2 text-xs w-max max-w-xs bg-black text-white rounded-md scale-0 transition-all group-hover:scale-100 origin-left z-50 shadow-lg border border-gray-800 font-medium pointer-events-none font-sans">
          {text}
        </span>
      </div>
    );
};

const ContextMenu: React.FC<{
    x: number;
    y: number;
    actions: { label: string; icon: React.ReactNode; onClick: () => void; isDestructive?: boolean }[];
    onClose: () => void;
}> = ({ x, y, actions, onClose }) => {
    return (
        <div className="fixed inset-0 z-50" onClick={onClose}>
            <div
                style={{ top: y, left: x }}
                className="absolute bg-[#18181b] border border-[#27272a] rounded-lg shadow-xl w-48 py-1.5 text-xs font-sans"
                onClick={(e) => e.stopPropagation()}
            >
                {actions.map((action, index) => (
                    <button
                        key={index}
                        onClick={() => { action.onClick(); onClose(); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                            action.isDestructive ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-300 hover:bg-[#27272a] hover:text-white'
                        }`}
                    >
                        <span className="opacity-70">{action.icon}</span>
                        <span>{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ 
    files, envVars, onEnvVarChange, onFileSelect, onDownload, onOpenSettings, onOpenGithubImport, onOpenSupabaseAdmin, onNewProject, onSaveProject, onOpenProjects, onRenameFile, onDeleteFile, onOpenStripeModal, onOpenNeonModal, onOpenOSMModal, activeFile, onClose, session, onLogin, onLogout, isOfflineMode, generatingFile, isGenerating, generatedFileNames
}) => {
  const [activeTab, setActiveTab] = React.useState('files');
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['src', 'components', 'styles']));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string; isFolder: boolean } | null>(null);
  
  // Transform flat files into a tree
  const fileTree = useMemo(() => {
    const root: FileNode[] = [];
    const allFilePaths = [...files.map(f => f.name)];
    if (isGenerating) {
        generatedFileNames.forEach(name => {
            if (!allFilePaths.includes(name)) allFilePaths.push(name);
        });
    }

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
  }, [files, isGenerating, generatedFileNames]);

  const toggleFolder = (path: string) => {
    const next = new Set(openFolders);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setOpenFolders(next);
  };

  const handleContextMenu = (e: React.MouseEvent, path: string, isFolder: boolean) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, path, isFolder });
  };

  const NavButton = ({ onClick, active, icon, label }: { onClick: () => void, active?: boolean, icon: React.ReactNode, label: string }) => (
      <Tooltip text={label}>
        <button onClick={onClick} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group relative ${active ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}>
            <div className="w-5 h-5">{icon}</div>
        </button>
      </Tooltip>
  );

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
              onContextMenu={(e) => handleContextMenu(e, node.path, true)}
              className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-gray-400 hover:text-gray-200 hover:bg-[#18181b] rounded-md transition-colors group font-sans"
              style={{ paddingLeft: `${(level * 12) + 8}px` }}
            >
              <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
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
          onClick={() => !isGenerating && onFileSelect(node.path)}
          onContextMenu={(e) => handleContextMenu(e, node.path, false)}
          className={`flex items-center gap-2.5 px-2 py-1.5 text-[11px] rounded-md transition-all border border-transparent font-sans ${
            isSelected 
            ? 'bg-[#27272a] text-white border-[#3f3f46]' 
            : 'text-gray-400 hover:bg-[#18181b] hover:text-gray-200'
          }`}
          style={{ paddingLeft: `${(level * 12) + 24}px` }}
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
    <div className="bg-[#09090b] flex h-full border-r border-[#27272a] select-none w-full font-sans">
        {/* Activity Bar (Icons Left) */}
        <div className="w-[60px] flex flex-col items-center py-4 gap-6 border-r border-[#27272a] bg-[#09090b] flex-shrink-0 z-10">
            <div className="mb-2 relative">
                <button onClick={onNewProject} className="w-10 h-10 flex items-center justify-center rounded-xl bg-transparent hover:bg-white/5 text-white transition-colors">
                    <AppLogo className="w-8 h-8" />
                </button>
                {isOfflineMode && <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-[#09090b] shadow-sm" title="Modo Offline"></div>}
            </div>
            
            <div className="flex flex-col gap-3 w-full items-center">
                <NavButton onClick={() => setActiveTab('files')} active={activeTab === 'files'} icon={<FileIcon />} label="Explorer" />
                <NavButton onClick={() => setActiveTab('integrations')} active={activeTab === 'integrations'} icon={<CubeIcon />} label="Integrations" />
                <NavButton onClick={() => setActiveTab('environment')} active={activeTab === 'environment'} icon={<ShieldIcon />} label="Environment" />
            </div>

            <div className="mt-auto flex flex-col gap-3 w-full items-center">
                 <NavButton onClick={onOpenProjects} icon={<ProjectsIcon />} label="My Projects" />
                 <div className="h-px w-8 bg-[#27272a] my-1"></div>
                 {session ? <NavButton onClick={onLogout} icon={<LogOutIcon />} label="Logout" /> : <NavButton onClick={onLogin} icon={<LogInIcon />} label="Login" />}
                 <NavButton onClick={onOpenSettings} icon={<SettingsIcon />} label="Settings" />
            </div>
        </div>

        {/* Sidebar Content (Expandable) */}
        <div className="flex-1 bg-[#121214] flex flex-col h-full overflow-hidden">
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#27272a] flex-shrink-0 bg-[#121214]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {activeTab === 'files' ? 'Explorer' : activeTab === 'environment' ? 'Environment' : 'Integrations'}
                </span>
                {onClose && <button onClick={onClose} className="p-1 rounded text-gray-500 hover:text-white"><CloseIcon /></button>}
            </div>

            {isOfflineMode && <div className="bg-amber-900/20 text-amber-500 text-[10px] px-4 py-1.5 text-center font-medium border-b border-amber-900/30">Modo Offline Ativo</div>}

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                
                {/* FILES TAB */}
                {activeTab === 'files' && (
                    <div className="py-2 px-2 space-y-0.5">
                        <div className="text-[10px] font-bold text-gray-500 mb-2 px-2 uppercase tracking-widest opacity-50">Filesystem</div>
                        {renderTree(fileTree)}
                        {files.length === 0 && !isGenerating && <div className="text-xs text-gray-600 px-4 py-8 text-center italic">No files yet.</div>}
                    </div>
                )}

                {/* INTEGRATIONS TAB - REDESIGNED */}
                {activeTab === 'integrations' && (
                    <div className="p-2 space-y-1">
                        <div className="text-[10px] font-bold text-gray-500 mb-2 px-2 uppercase tracking-widest opacity-50 pt-2">Conectores</div>
                        {[
                            { icon: <GithubIcon className="w-4 h-4"/>, title: "GitHub", desc: "Sync & Deploy", onClick: onOpenGithubImport },
                            { icon: <SupabaseIcon className="w-4 h-4 text-emerald-500"/>, title: "Supabase", desc: "Database", onClick: onOpenSupabaseAdmin },
                            { icon: <StripeIcon className="w-4 h-4 text-indigo-500"/>, title: "Stripe", desc: "Payments", onClick: onOpenStripeModal },
                            { icon: <DatabaseIcon className="w-4 h-4 text-green-400"/>, title: "Neon", desc: "Postgres", onClick: onOpenNeonModal },
                            { icon: <MapIcon className="w-4 h-4 text-blue-400"/>, title: "Maps", desc: "OpenStreetMap", onClick: onOpenOSMModal },
                        ].map((item, idx) => (
                            <div 
                                key={idx} 
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1a1a1c] cursor-pointer transition-colors group border border-transparent hover:border-[#27272a]" 
                                onClick={item.onClick}
                            >
                                <div className="flex-shrink-0 text-gray-400 group-hover:text-white transition-colors">
                                    {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xs font-medium text-gray-300 group-hover:text-white truncate">{item.title}</h3>
                                    <p className="text-[10px] text-gray-500 truncate">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ENVIRONMENT TAB */}
                {activeTab === 'environment' && (
                    <EnvironmentPanel vars={envVars} onSave={onEnvVarChange} />
                )}
            </div>

            {/* Bottom Action Area (Always visible for context) */}
            <div className="p-3 border-t border-[#27272a] bg-[#121214]">
                <button onClick={onDownload} className="w-full flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#27272a] text-gray-300 hover:text-white text-xs py-2.5 rounded border border-[#27272a] transition-colors font-medium">
                    <DownloadIcon className="w-4 h-4" /> Download ZIP
                </button>
            </div>
        </div>

        {contextMenu && (
            <ContextMenu 
                x={contextMenu.x} y={contextMenu.y} 
                actions={[
                    { label: 'Renomear', icon: <EditIcon className="w-4 h-4" />, onClick: () => {} },
                    { label: 'Excluir', icon: <TrashIcon className="w-4 h-4" />, isDestructive: true, onClick: () => {
                        if (!contextMenu.isFolder && window.confirm(`Delete ${contextMenu.path}?`)) onDeleteFile(contextMenu.path);
                    }}
                ]} 
                onClose={() => setContextMenu(null)} 
            />
        )}
    </div>
  );
};

const EnvironmentPanel: React.FC<{ vars: Record<string, string>, onSave: (vars: Record<string, string>) => void }> = ({ vars, onSave }) => {
    const [localVars, setLocalVars] = useState(Object.entries(vars));
    const [hasChanges, setHasChanges] = useState(false);
  
    useEffect(() => {
        setLocalVars(Object.entries(vars));
    }, [vars]);

    const handleAdd = () => { setLocalVars([...localVars, ['', '']]); setHasChanges(true); };
    const handleRemove = (index: number) => { setLocalVars(localVars.filter((_, i) => i !== index)); setHasChanges(true); };
    const handleChange = (index: number, type: 'key' | 'value', value: string) => {
      const newVars = [...localVars];
      newVars[index][type === 'key' ? 0 : 1] = value;
      setLocalVars(newVars);
      setHasChanges(true);
    };
  
    return (
      <div className="p-3 space-y-3 flex flex-col h-full">
        <div className="text-[10px] font-bold text-gray-500 mb-2 px-2 uppercase tracking-widest opacity-50">Variables</div>
        <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {localVars.map(([key, value], index) => (
            <div key={index} className="flex items-center gap-2 group">
                <input type="text" placeholder="KEY" value={key} onChange={(e) => handleChange(index, 'key', e.target.value)} className="w-1/3 p-2 bg-[#18181b] border border-[#27272a] rounded text-gray-300 text-[10px] font-mono focus:outline-none focus:border-blue-500/50" />
                <input type="password" placeholder="VALUE" value={value} onChange={(e) => handleChange(index, 'value', e.target.value)} className="w-full p-2 bg-[#18181b] border border-[#27272a] rounded text-gray-300 text-[10px] font-mono focus:outline-none focus:border-blue-500/50" />
                <button onClick={() => handleRemove(index)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded transition-all"><TrashIcon className="w-3.5 h-3.5" /></button>
            </div>
            ))}
            {localVars.length === 0 && <div className="text-center text-gray-600 text-xs py-4">Nenhuma variável definida.</div>}
        </div>
        <div className="flex-shrink-0 pt-3 border-t border-[#27272a] space-y-2 mt-auto">
            <button onClick={handleAdd} className="w-full text-[10px] py-2 border border-dashed border-[#27272a] rounded text-gray-400 hover:text-white hover:border-gray-500 transition-colors">+ Add Variable</button>
            <button onClick={() => { onSave(localVars.reduce((acc, [k,v]) => (k ? (acc[k]=v,acc) : acc), {} as any)); setHasChanges(false); }} disabled={!hasChanges} className="w-full bg-white text-black text-[11px] font-bold py-2 rounded disabled:opacity-50 hover:bg-gray-200 transition-colors">Save Changes</button>
        </div>
      </div>
    );
};
