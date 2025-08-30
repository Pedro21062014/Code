import React from 'react';
import { FileIcon, CubeIcon, UserIcon, SettingsIcon, DownloadIcon, CloseIcon, GithubIcon, SupabaseIcon, LogInIcon, LogOutIcon, PlusIcon } from './Icons';
import { IntegrationProvider, ProjectFile } from '../types';
import type { Session } from '@supabase/supabase-js';

interface SidebarProps {
  files: ProjectFile[];
  onFileSelect: (fileName: string) => void;
  onDownload: () => void;
  onOpenSettings: () => void;
  onOpenGithubImport: () => void;
  onNewProject: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({ 
    files, 
    onFileSelect, 
    onDownload, 
    onOpenSettings, 
    onOpenGithubImport,
    onNewProject,
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
        <div className="w-64 bg-var-bg-subtle p-2">
            <div className="flex justify-between items-center p-2">
                <h2 className="text-sm font-bold uppercase text-var-fg-muted tracking-wider">
                    {activeTab === 'files' ? 'Explorador' : 'Integrações'}
                </h2>
                {onClose && (
                    <button onClick={onClose} className="p-1 rounded-md text-var-fg-muted hover:bg-var-bg-interactive lg:hidden">
                        <CloseIcon />
                    </button>
                )}
            </div>

            {activeTab === 'files' && (
                <ul className="mt-2 space-y-1">
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
                     <div className="bg-var-bg-interactive p-3 rounded-lg border border-var-border-default opacity-60">
                        <div className="flex items-center gap-3 mb-2">
                            <SupabaseIcon />
                            <h3 className="font-semibold text-var-fg-default">Supabase</h3>
                        </div>
                        <p className="text-xs text-var-fg-muted mb-3">Supabase foi integrado para autenticação.</p>
                        <button 
                            disabled
                            className="w-full bg-green-600/50 text-white text-sm font-medium py-1.5 rounded-md cursor-not-allowed"
                        >
                            Integrado
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
