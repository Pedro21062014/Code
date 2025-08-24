import React from 'react';
import { FileIcon, CubeIcon, UserIcon, SettingsIcon, DownloadIcon, CloseIcon, GithubIcon, SupabaseIcon } from './Icons';
import { IntegrationProvider, ProjectFile } from '../types';

interface SidebarProps {
  files: ProjectFile[];
  onFileSelect: (fileName: string) => void;
  onDownload: () => void;
  onOpenSettings: () => void;
  onOpenGithubImport: () => void;
  onOpenSupabaseIntegration: () => void;
  activeFile: string | null;
  onClose?: () => void;
}

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
    return (
      <div className="group relative flex justify-center">
        {children}
        <span className="absolute left-14 p-2 text-xs w-max max-w-xs bg-gray-900 text-white rounded-md scale-0 transition-all group-hover:scale-100 origin-left z-30">
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
    onOpenSupabaseIntegration,
    activeFile, 
    onClose 
}) => {
  const [activeTab, setActiveTab] = React.useState('files');
  
  return (
    <div className="bg-[#111217] flex h-full">
        {/* Main Icon Bar */}
        <div className="w-16 bg-[#0B0C10] p-2 flex flex-col items-center justify-between border-r border-white/10">
            <div>
                <div className="space-y-4">
                    <Tooltip text="Explorador de Arquivos">
                        <button onClick={() => setActiveTab('files')} className={`p-2 rounded-lg ${activeTab === 'files' ? 'text-white bg-white/10' : 'text-gray-400 hover:bg-white/10'}`}>
                            <FileIcon />
                        </button>
                    </Tooltip>
                    <Tooltip text="Integrações">
                        <button onClick={() => setActiveTab('integrations')} className={`p-2 rounded-lg ${activeTab === 'integrations' ? 'text-white bg-white/10' : 'text-gray-400 hover:bg-white/10'}`}>
                            <CubeIcon />
                        </button>
                    </Tooltip>
                </div>
            </div>
            <div className="space-y-4">
                 <Tooltip text="Baixar Projeto (ZIP)">
                    <button onClick={onDownload} className="p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white">
                        <DownloadIcon />
                    </button>
                </Tooltip>
                <Tooltip text="Conta (em breve)">
                    <button className="p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white">
                        <UserIcon />
                    </button>
                </Tooltip>
                <Tooltip text="Configurações">
                    <button onClick={onOpenSettings} className="p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white">
                        <SettingsIcon />
                    </button>
                </Tooltip>
            </div>
        </div>

        {/* Content Panel */}
        <div className="w-64 bg-[#111217] p-2">
            <div className="flex justify-between items-center p-2">
                <h2 className="text-sm font-bold uppercase text-gray-400 tracking-wider">
                    {activeTab === 'files' ? 'Explorador' : 'Integrações'}
                </h2>
                {onClose && (
                    <button onClick={onClose} className="p-1 rounded-md text-gray-300 hover:bg-gray-700 lg:hidden">
                        <CloseIcon />
                    </button>
                )}
            </div>

            {activeTab === 'files' && (
                <ul>
                    {files.map(file => (
                    <li key={file.name}>
                        <button
                        onClick={() => onFileSelect(file.name)}
                        className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 ${
                            activeFile === file.name ? 'bg-blue-500/20 text-white' : 'text-gray-300 hover:bg-white/5'
                        }`}
                        >
                        {file.name}
                        </button>
                    </li>
                    ))}
                </ul>
            )}
            {activeTab === 'integrations' && (
                <div className="p-2 space-y-4">
                    <div className="bg-[#212329] p-3 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <GithubIcon className="w-6 h-6"/>
                            <h3 className="font-semibold text-white">GitHub</h3>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">Importe repositórios públicos para começar rapidamente.</p>
                        <button 
                            onClick={onOpenGithubImport}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-1.5 rounded-md transition-colors"
                        >
                            Conectar
                        </button>
                    </div>
                     <div className="bg-[#212329] p-3 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <SupabaseIcon />
                            <h3 className="font-semibold text-white">Supabase</h3>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">Adicione um backend Supabase ao seu projeto com um clique.</p>
                        <button 
                            onClick={onOpenSupabaseIntegration}
                            className="w-full bg-green-600/80 hover:bg-green-600 text-white text-sm font-medium py-1.5 rounded-md transition-colors"
                        >
                            Integrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};