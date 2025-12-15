import React, { useState, useEffect, useRef } from 'react';
import { AppLogo, FileIcon, CubeIcon, SettingsIcon, DownloadIcon, CloseIcon, GithubIcon, SupabaseIcon, LogInIcon, LogOutIcon, SaveIcon, ProjectsIcon, ImageIcon, ShieldIcon, TrashIcon, EditIcon, StripeIcon, MapIcon, DatabaseIcon } from './Icons';
import { ProjectFile } from '../types';
import type { Session } from '@supabase/supabase-js';

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
  onOpenImageStudio: () => void;
  onRenameFile: (oldName: string, newName: string) => void;
  onDeleteFile: (fileName: string) => void;
  onOpenStripeModal: () => void;
  onOpenNeonModal: () => void;
  onOpenOSMModal: () => void;
  activeFile: string | null;
  onClose?: () => void;
  session: Session | null;
  onLogin: () => void;
  onLogout: () => void;
}

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
    return (
      <div className="group relative flex justify-center w-full">
        {children}
        <span className="absolute left-14 p-2 text-xs w-max max-w-xs bg-black text-white rounded-md scale-0 transition-all group-hover:scale-100 origin-left z-50 shadow-lg border border-gray-800 font-medium">
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
        <div 
            className="fixed inset-0 z-50"
            onClick={onClose}
        >
            <div
                style={{ top: y, left: x }}
                className="absolute bg-[#18181b] border border-[#27272a] rounded-lg shadow-xl w-48 py-1.5 animate-fadeIn text-sm"
                onClick={(e) => e.stopPropagation()}
            >
                {actions.map((action, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            action.onClick();
                            onClose();
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                            action.isDestructive
                                ? 'text-red-400 hover:bg-red-500/10'
                                : 'text-gray-300 hover:bg-[#27272a] hover:text-white'
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

const EnvironmentPanel: React.FC<{ vars: Record<string, string>, onSave: (vars: Record<string, string>) => void }> = ({ vars, onSave }) => {
    const [localVars, setLocalVars] = useState(Object.entries(vars));
    const [hasChanges, setHasChanges] = useState(false);
  
    const handleAdd = () => {
      setLocalVars([...localVars, ['', '']]);
      setHasChanges(true);
    };
  
    const handleRemove = (index: number) => {
      setLocalVars(localVars.filter((_, i) => i !== index));
      setHasChanges(true);
    };
  
    const handleChange = (index: number, type: 'key' | 'value', value: string) => {
      const newVars = [...localVars];
      newVars[index][type === 'key' ? 0 : 1] = value;
      setLocalVars(newVars);
      setHasChanges(true);
    };
  
    const handleSaveChanges = () => {
      const newVarsObject = localVars.reduce((acc, [key, value]) => {
        if (key) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      onSave(newVarsObject);
      setHasChanges(false);
    };
  
    return (
      <div className="p-3 space-y-3 mt-2 flex flex-col h-full">
        <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {localVars.map(([key, value], index) => (
            <div key={index} className="flex items-center gap-2 group">
                <input
                type="text"
                placeholder="KEY"
                value={key}
                onChange={(e) => handleChange(index, 'key', e.target.value)}
                className="w-1/3 p-2 bg-[#18181b] border border-[#27272a] rounded text-gray-300 placeholder-gray-600 text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors"
                />
                <input
                type="password"
                placeholder="VALUE"
                value={value}
                onChange={(e) => handleChange(index, 'value', e.target.value)}
                className="w-full p-2 bg-[#18181b] border border-[#27272a] rounded text-gray-300 placeholder-gray-600 text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button onClick={() => handleRemove(index)} className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TrashIcon className="w-3.5 h-3.5" />
                </button>
            </div>
            ))}
        </div>
        <div className="flex-shrink-0 pt-3 border-t border-[#27272a] space-y-2">
            <button onClick={handleAdd} className="w-full text-xs py-2 border border-dashed border-[#27272a] rounded text-gray-400 hover:bg-[#18181b] hover:text-white transition-colors">
                + Add Variable
            </button>
            <button 
                onClick={handleSaveChanges} 
                disabled={!hasChanges}
                className="w-full bg-white text-black text-xs font-semibold py-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Save Changes
            </button>
        </div>
      </div>
    );
};
  

export const Sidebar: React.FC<SidebarProps> = ({ 
    files, 
    envVars,
    onEnvVarChange,
    onFileSelect, 
    onDownload, 
    onOpenSettings, 
    onOpenGithubImport,
    onOpenSupabaseAdmin,
    onNewProject,
    onSaveProject,
    onOpenProjects,
    onOpenImageStudio,
    onRenameFile,
    onDeleteFile,
    onOpenStripeModal,
    onOpenNeonModal,
    onOpenOSMModal,
    activeFile, 
    onClose,
    session,
    onLogin,
    onLogout
}) => {
  const [activeTab, setActiveTab] = React.useState('files');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: ProjectFile } | null>(null);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  
  const handleContextMenu = (e: React.MouseEvent, file: ProjectFile) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };
  
  useEffect(() => {
    if (renamingFile && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingFile]);

  const handleRename = (oldName: string, newName: string) => {
    if (newName && newName !== oldName) {
        onRenameFile(oldName, newName);
    }
    setRenamingFile(null);
  };

  const contextMenuActions = contextMenu ? [
    { label: 'Rename', icon: <EditIcon />, onClick: () => setRenamingFile(contextMenu.file.name) },
    { label: 'Delete', icon: <TrashIcon className="w-4 h-4" />, isDestructive: true, onClick: () => {
        if (window.confirm(`Are you sure you want to delete "${contextMenu.file.name}"?`)) {
            onDeleteFile(contextMenu.file.name);
        }
    }},
  ] : [];

  const NavButton = ({ onClick, active, icon, label }: { onClick: () => void, active?: boolean, icon: React.ReactNode, label: string }) => (
      <Tooltip text={label}>
        <button 
            onClick={onClick} 
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group relative ${active ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
        >
            <div className="w-5 h-5">{icon}</div>
        </button>
      </Tooltip>
  );

  return (
    <div className="bg-[#09090b] flex h-full border-r border-[#27272a] select-none w-full">
        {/* Narrow Sidebar (Icons) */}
        <div className="w-[60px] flex flex-col items-center py-4 gap-6 border-r border-[#27272a] bg-[#09090b] flex-shrink-0">
            <div className="mb-2">
                <button onClick={onNewProject} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg hover:opacity-90 transition-opacity">
                    <AppLogo className="w-6 h-6" />
                </button>
            </div>
            
            <div className="flex flex-col gap-3 w-full items-center">
                <NavButton onClick={() => setActiveTab('files')} active={activeTab === 'files'} icon={<FileIcon />} label="Explorer" />
                <NavButton onClick={() => setActiveTab('integrations')} active={activeTab === 'integrations'} icon={<CubeIcon />} label="Integrations" />
                <NavButton onClick={() => setActiveTab('environment')} active={activeTab === 'environment'} icon={<ShieldIcon />} label="Env Vars" />
            </div>

            <div className="mt-auto flex flex-col gap-3 w-full items-center">
                 <NavButton onClick={onOpenImageStudio} icon={<ImageIcon />} label="Image Studio" />
                 <NavButton onClick={onSaveProject} icon={<SaveIcon />} label="Save Project" />
                 <NavButton onClick={onOpenProjects} icon={<ProjectsIcon />} label="My Projects" />
                 <div className="h-px w-8 bg-[#27272a] my-1"></div>
                 {session ? (
                    <NavButton onClick={onLogout} icon={<LogOutIcon />} label="Logout" />
                 ) : (
                    <NavButton onClick={onLogin} icon={<LogInIcon />} label="Login" />
                 )}
                 <NavButton onClick={onOpenSettings} icon={<SettingsIcon />} label="Settings" />
            </div>
        </div>

        {/* Extended Sidebar (Content) */}
        <div className="flex-1 bg-[#121214] flex flex-col h-full overflow-hidden">
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#27272a] flex-shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {activeTab === 'files' ? 'Explorer' : activeTab === 'environment' ? 'Environment' : 'Integrations'}
                </span>
                {onClose && (
                    <button onClick={onClose} className="p-1 rounded text-gray-500 hover:text-white">
                        <CloseIcon />
                    </button>
                )}
            </div>

            {activeTab === 'files' && (
                <div className="flex-1 overflow-y-auto py-2">
                    <div className="px-2">
                         <div className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider mt-2">Project Files</div>
                        {files.map(file => (
                        <div key={file.name} className="relative group">
                            <button
                                onClick={() => onFileSelect(file.name)}
                                onContextMenu={(e) => handleContextMenu(e, file)}
                                className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center gap-2.5 transition-all duration-150 border border-transparent ${
                                    activeFile === file.name 
                                    ? 'bg-[#27272a] text-white border-[#3f3f46]' 
                                    : 'text-gray-400 hover:bg-[#18181b] hover:text-gray-200'
                                }`}
                            >
                                <span className="opacity-60"><FileIcon /></span>
                                {renamingFile === file.name ? (
                                    <input
                                        ref={renameInputRef}
                                        type="text"
                                        defaultValue={file.name}
                                        className="bg-[#09090b] w-full text-white text-sm outline-none ring-1 ring-blue-500 rounded px-1"
                                        onBlur={(e) => handleRename(file.name, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleRename(file.name, e.currentTarget.value);
                                            if (e.key === 'Escape') setRenamingFile(null);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span className="truncate">{file.name}</span>
                                )}
                            </button>
                        </div>
                        ))}
                         {files.length === 0 && (
                            <div className="text-xs text-gray-600 px-4 py-8 text-center italic">
                                No files generated yet.
                            </div>
                        )}
                    </div>
                </div>
            )}
             
             {activeTab === 'environment' && (
                <EnvironmentPanel vars={envVars} onSave={onEnvVarChange} />
            )}

            {activeTab === 'integrations' && (
                <div className="p-3 space-y-3 mt-2 overflow-y-auto custom-scrollbar">
                    {[
                        { icon: <GithubIcon />, title: "GitHub", desc: "Import/Export Repos", action: "Connect", onClick: onOpenGithubImport, color: "hover:border-gray-500" },
                        { icon: <SupabaseIcon />, title: "Supabase", desc: "Database & Auth", action: "Configure", onClick: onOpenSupabaseAdmin, color: "hover:border-green-500/50" },
                        { icon: <StripeIcon />, title: "Stripe", desc: "Payments", action: "Configure", onClick: onOpenStripeModal, color: "hover:border-indigo-500/50" },
                        { icon: <DatabaseIcon />, title: "Neon", desc: "Postgres DB", action: "Connect", onClick: onOpenNeonModal, color: "hover:border-emerald-500/50" },
                        { icon: <MapIcon />, title: "OpenStreetMap", desc: "Maps Integration", action: "Info", onClick: onOpenOSMModal, color: "hover:border-blue-500/50" },
                    ].map((item, idx) => (
                        <div key={idx} className={`bg-[#18181b] p-3 rounded-lg border border-[#27272a] transition-colors group ${item.color}`}>
                            <div className="flex items-center gap-2 mb-1 text-gray-200">
                                {item.icon}
                                <h3 className="font-medium text-sm">{item.title}</h3>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">{item.desc}</p>
                            <button 
                                onClick={item.onClick}
                                className="w-full bg-[#27272a] hover:bg-[#3f3f46] text-gray-300 hover:text-white text-xs font-medium py-1.5 rounded transition-colors"
                            >
                                {item.action}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="p-3 mt-auto border-t border-[#27272a]">
                <button 
                    onClick={onDownload} 
                    className="w-full flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#27272a] text-gray-300 hover:text-white text-xs py-2 rounded border border-[#27272a] transition-colors"
                >
                    <DownloadIcon /> Download ZIP
                </button>
            </div>
        </div>
        {contextMenu && <ContextMenu {...contextMenu} actions={contextMenuActions} onClose={() => setContextMenu(null)} />}
    </div>
  );
};