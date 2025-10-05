import React, { useState } from 'react';
import { FileIcon, CubeIcon, SettingsIcon, DownloadIcon, CloseIcon, GithubIcon, SupabaseIcon, LogInIcon, LogOutIcon, PlusIcon, SaveIcon, ProjectsIcon, ImageIcon, ShieldIcon, TrashIcon } from './Icons';
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
    activeFile, 
    onClose,
    session,
    onLogin,
    onLogout
}) => {
  const [activeTab, setActiveTab] = React.useState('files');
  
  return (
    <div className="bg-var-bg-subtle flex h-full">
        {/* Main Icon Bar */}
        <div className="w-16 bg-var-bg-muted p-2 flex flex-col items-center justify-between border-r border-var-border-default">
            <div>
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
                    <Tooltip text="Novo Projeto">
                        <button onClick={onNewProject} className="p-2 rounded-lg text-var-fg-muted hover:bg-var-bg-interactive hover:text-var-fg-default transition-colors">
                            <PlusIcon />
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
                        className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 transition-colors ${
                            activeFile === file.name ? 'bg-var-accent/20 text-var-accent' : 'text-var-fg-muted hover:bg-var-bg-interactive hover:text-var-fg-default'
                        }`}
                        >
                        {file.name}
                        </button>
                    </li>
                    ))}
                </ul>
            )}
             {activeTab === 'environment' && (
                <EnvironmentPanel vars={envVars} onSave={onEnvVarChange} />
            )}
            {activeTab === 'integrations' && (
                <div className="p-2 space-y-4 mt-2">
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
                </div>
            )}
        </div>
    </div>
  );
};
