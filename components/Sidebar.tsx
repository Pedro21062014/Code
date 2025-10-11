import React, { useState, useEffect, useRef } from 'react';
import { AppLogo, FileIcon, CubeIcon, SettingsIcon, DownloadIcon, CloseIcon, GithubIcon, SupabaseIcon, LogInIcon, LogOutIcon, SaveIcon, ProjectsIcon, ImageIcon, ShieldIcon, TrashIcon, EditIcon, StripeIcon, MapIcon, DatabaseIcon } from './Icons';
import { IntegrationProvider, ProjectFile } from '../types';
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
      <div className="group relative flex justify-center">
        {children}
        <span className="absolute left-14 p-2 text-xs w-max max-w-xs bg-var-bg-muted text-var-fg-default rounded-md scale-0 transition-all group-hover:scale-100 origin-left z-30 shadow-lg border border-var-border-default">
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
                className="absolute bg-var-bg-subtle border border-var-border-default rounded-md shadow-2xl w-40 py-1.5 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {actions.map((action, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            action.onClick();
                            onClose();
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                            action.isDestructive
                                ? 'text-red-400 hover:bg-red-500/10'
                                : 'text-var-fg-default hover:bg-var-bg-interactive'
                        }`}
                    >
                        {action.icon}
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
      <div className="p-2 space-y-2 mt-2 flex flex-col h-full">
        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
            {localVars.map(([key, value], index) => (
            <div key={index} className="flex items-center gap-1">
                <input
                type="text"
                placeholder="NOME"
                value={key}
                onChange={(e) => handleChange(index, 'key', e.target.value)}
                className="w-full p-1.5 bg-var-bg-interactive border border-var-border-default rounded-md text-var-fg-default placeholder-var-fg-subtle text-xs font-mono focus:outline-none focus:ring-1 focus:ring-var-accent/50"
                />
                <input
                type="password"
                placeholder="VALOR"
                value={value}
                onChange={(e) => handleChange(index, 'value', e.target.value)}
                className="w-full p-1.5 bg-var-bg-interactive border border-var-border-default rounded-md text-var-fg-default placeholder-var-fg-subtle text-xs font-mono focus:outline-none focus:ring-1 focus:ring-var-accent/50"
                />
                <button onClick={() => handleRemove(index)} className="p-1 text-var-fg-subtle hover:text-red-400">
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
            ))}
        </div>
        <div className="flex-shrink-0 mt-2 space-y-2">
            <button onClick={handleAdd} className="w-full text-sm py-1.5 border border-dashed border-var-border-default rounded-md text-var-fg-muted hover:bg-var-bg-interactive hover:text-var-fg-default transition-colors">
                Adicionar Variável
            </button>
            <button 
                onClick={handleSaveChanges} 
                disabled={!hasChanges}
                className="w-full bg-var-accent text-var-accent-fg text-sm font-medium py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Salvar Alterações
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
    { label: 'Editar', icon: <EditIcon />, onClick: () => setRenamingFile(contextMenu.file.name) },
    { label: 'Deletar', icon: <TrashIcon className="w-4 h-4" />, isDestructive: true, onClick: () => {
        if (window.confirm(`Tem certeza que deseja deletar o arquivo "${contextMenu.file.name}"?`)) {
            onDeleteFile(contextMenu.file.name);
        }
    }},
  ] : [];

  return (
    <div className="bg-var-bg-subtle flex h-full">
        {/* Main Icon Bar */}
        <div className="w-16 bg-var-bg-muted p-2 flex flex-col items-center justify-between border-r border-var-border-default">
            <div>
                 <Tooltip text="Página Inicial / Novo Projeto">
                    <button onClick={onNewProject} className="p-1 mb-2 rounded-lg hover:bg-var-bg-interactive flex items-center justify-center w-full">
                        <AppLogo className="w-8 h-8 text-var-accent" />
                    </button>
                </Tooltip>
                <div className="space-y-2">
                    <Tooltip text="Explorador de Arquivos">
                        <button onClick={() => setActiveTab('files')} className={`p-2 rounded-lg transition-colors ${activeTab === 'files' ? 'text-var-fg-default bg-var-bg-interactive' : 'text-var-fg-muted hover:bg-var-bg-interactive'}`}>
                            <FileIcon />
                        </button>
                    </Tooltip>
                     <Tooltip text="Variáveis de Ambiente">
                        <button onClick={() => setActiveTab('environment')} className={`p-2 rounded-lg transition-colors ${activeTab === 'environment' ? 'text-var-fg-default bg-var-bg-interactive' : 'text-var-fg-muted hover:bg-var-bg-interactive'}`}>
                            <ShieldIcon />
                        </button>
                    </Tooltip>
                    <Tooltip text="Integrações">
                        <button onClick={() => setActiveTab('integrations')} className={`p-2 rounded-lg transition-colors ${activeTab === 'integrations' ? 'text-var-fg-default bg-var-bg-interactive' : 'text-var-fg-muted hover:bg-var-bg-interactive'}`}>
                            <CubeIcon />
                        </button>
                    </Tooltip>
                    <Tooltip text="Salvar Projeto">
                        <button onClick={onSaveProject} className="p-2 rounded-lg text-var-fg-muted hover:bg-var-bg-interactive hover:text-var-fg-default transition-colors">
                            <SaveIcon />
                        </button>
                    </Tooltip>
                    <Tooltip text="Meus Projetos">
                        <button onClick={onOpenProjects} className="p-2 rounded-lg text-var-fg-muted hover:bg-var-bg-interactive hover:text-var-fg-default transition-colors">
                            <ProjectsIcon />
                        </button>
                    </Tooltip>
                    <Tooltip text="Gerador de Imagem">
                        <button onClick={onOpenImageStudio} className="p-2 rounded-lg text-var-fg-muted hover:bg-var-bg-interactive hover:text-var-fg-default transition-colors">
                            <ImageIcon />
                        </button>
                    </Tooltip>
                </div>
            </div>
            <div className="space-y-2">
                 <Tooltip text="Baixar Projeto (ZIP)">
                    <button onClick={onDownload} className="p-2 rounded-lg text-var-fg-muted hover:bg-var-bg-interactive hover:text-var-fg-default transition-colors">
                        <DownloadIcon />
                    </button>
                </Tooltip>
                {session ? (
                    <Tooltip text={`Sair (${session.user.email})`}>
                        <button onClick={onLogout} className="p-2 rounded-lg text-var-fg-muted hover:bg-var-bg-interactive hover:text-var-fg-default transition-colors">
                            <LogOutIcon />
                        </button>
                    </Tooltip>
                ) : (
                    <Tooltip text="Login / Registrar">
                        <button onClick={onLogin} className="p-2 rounded-lg text-var-fg-muted hover:bg-var-bg-interactive hover:text-var-fg-default transition-colors">
                            <LogInIcon />
                        </button>
                    </Tooltip>
                )}
                <Tooltip text="Configurações">
                    <button onClick={onOpenSettings} className="p-2 rounded-lg text-var-fg-muted hover:bg-var-bg-interactive hover:text-var-fg-default transition-colors">
                        <SettingsIcon />
                    </button>
                </Tooltip>
            </div>
        </div>

        {/* Content Panel */}
        <div className="w-64 bg-var-bg-subtle flex flex-col">
            <div className="flex justify-between items-center p-2 flex-shrink-0">
                <h2 className="text-sm font-bold uppercase text-var-fg-muted tracking-wider">
                    {activeTab === 'files' ? 'Explorador' : activeTab === 'environment' ? 'Ambiente' : 'Integrações'}
                </h2>
                {onClose && (
                    <button onClick={onClose} className="p-1 rounded-md text-var-fg-muted hover:bg-var-bg-interactive lg:hidden">
                        <CloseIcon />
                    </button>
                )}
            </div>

            {activeTab === 'files' && (
                <ul className="mt-2 space-y-1 p-2 overflow-y-auto">
                    {files.map(file => (
                    <li key={file.name}>
                        <button
                            onClick={() => onFileSelect(file.name)}
                            onContextMenu={(e) => handleContextMenu(e, file)}
                            className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 transition-colors ${
                                activeFile === file.name ? 'bg-var-accent/20 text-var-accent' : 'text-var-fg-muted hover:bg-var-bg-interactive hover:text-var-fg-default'
                            }`}
                        >
                        {renamingFile === file.name ? (
                            <input
                                ref={renameInputRef}
                                type="text"
                                defaultValue={file.name}
                                className="bg-var-bg-default w-full text-var-fg-default text-sm outline-none ring-1 ring-var-accent"
                                onBlur={(e) => handleRename(file.name, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRename(file.name, e.currentTarget.value);
                                    if (e.key === 'Escape') setRenamingFile(null);
                                }}
                            />
                        ) : (
                            <span>{file.name}</span>
                        )}
                        </button>
                    </li>
                    ))}
                </ul>
            )}
             {activeTab === 'environment' && (
                <EnvironmentPanel vars={envVars} onSave={onEnvVarChange} />
            )}
            {activeTab === 'integrations' && (
                <div className="p-2 space-y-2 mt-2 overflow-y-auto">
                    <div className="bg-var-bg-interactive p-3 rounded-lg border border-var-border-default">
                        <div className="flex items-center gap-3 mb-2">
                            <GithubIcon className="w-6 h-6"/>
                            <h3 className="font-semibold text-var-fg-default">GitHub</h3>
                        </div>
                        <p className="text-xs text-var-fg-muted mb-3">Importe repositórios para começar rapidamente.</p>
                        <button 
                            onClick={onOpenGithubImport}
                            className="w-full bg-var-bg-subtle hover:bg-var-bg-default border border-var-border-default text-var-fg-default text-sm font-medium py-1.5 rounded-md transition-colors"
                        >
                            Conectar
                        </button>
                    </div>
                     <div className="bg-var-bg-interactive p-3 rounded-lg border border-var-border-default">
                        <div className="flex items-center gap-3 mb-2">
                            <SupabaseIcon />
                            <h3 className="font-semibold text-var-fg-default">Supabase</h3>
                        </div>
                        <p className="text-xs text-var-fg-muted mb-3">Permita que a IA modifique seu banco de dados.</p>
                        <button 
                            onClick={onOpenSupabaseAdmin}
                            className="w-full bg-green-600/80 hover:bg-green-600 text-white text-sm font-medium py-1.5 rounded-md transition-colors"
                        >
                            Gerenciar
                        </button>
                    </div>
                    <div className="bg-var-bg-interactive p-3 rounded-lg border border-var-border-default">
                        <div className="flex items-center gap-3 mb-2">
                            <StripeIcon />
                            <h3 className="font-semibold text-var-fg-default">Stripe</h3>
                        </div>
                        <p className="text-xs text-var-fg-muted mb-3">Integre pagamentos em seu aplicativo.</p>
                        <button 
                            onClick={onOpenStripeModal}
                            className="w-full bg-[#635BFF]/80 hover:bg-[#635BFF] text-white text-sm font-medium py-1.5 rounded-md transition-colors"
                        >
                            Gerenciar
                        </button>
                    </div>
                     <div className="bg-var-bg-interactive p-3 rounded-lg border border-var-border-default">
                        <div className="flex items-center gap-3 mb-2">
                            <DatabaseIcon />
                            <h3 className="font-semibold text-var-fg-default">Neon</h3>
                        </div>
                        <p className="text-xs text-var-fg-muted mb-3">Conecte um banco de dados PostgreSQL serverless.</p>
                        <button 
                            onClick={onOpenNeonModal}
                            className="w-full bg-emerald-500/80 hover:bg-emerald-500 text-white text-sm font-medium py-1.5 rounded-md transition-colors"
                        >
                            Gerenciar
                        </button>
                    </div>
                     <div className="bg-var-bg-interactive p-3 rounded-lg border border-var-border-default">
                        <div className="flex items-center gap-3 mb-2">
                            <MapIcon />
                            <h3 className="font-semibold text-var-fg-default">OpenStreetMap</h3>
                        </div>
                        <p className="text-xs text-var-fg-muted mb-3">Adicione mapas interativos ao seu projeto.</p>
                        <button 
                            onClick={onOpenOSMModal}
                            className="w-full bg-blue-500/80 hover:bg-blue-500 text-white text-sm font-medium py-1.5 rounded-md transition-colors"
                        >
                            Informações
                        </button>
                    </div>
                </div>
            )}
        </div>
        {contextMenu && <ContextMenu {...contextMenu} actions={contextMenuActions} onClose={() => setContextMenu(null)} />}
    </div>
  );
};
