import React from 'react';
import { FileIcon, ExtensionIcon, UserIcon, SettingsIcon, DownloadIcon, CloseIcon } from './Icons';
import { ProjectFile } from '../types';

interface SidebarProps {
  files: ProjectFile[];
  onFileSelect: (fileName: string) => void;
  onDownload: () => void;
  onOpenSettings: () => void;
  activeFile: string | null;
  onClose?: () => void;
}

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
    return (
      <div className="group relative flex justify-center">
        {children}
        <span className="absolute left-14 p-2 text-xs w-28 text-center bg-gray-900 text-white rounded-md scale-0 transition-all group-hover:scale-100 origin-left z-30">
          {text}
        </span>
      </div>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ files, onFileSelect, onDownload, onOpenSettings, activeFile, onClose }) => {
  const [activeTab, setActiveTab] = React.useState('files');
  
  return (
    <div className="bg-[#16171D] flex h-full">
        {/* Main Icon Bar */}
        <div className="w-16 bg-[#0B0C10] p-2 flex flex-col items-center justify-between border-r border-gray-800">
            <div>
                <div className="space-y-4">
                    <Tooltip text="File Explorer">
                        <button onClick={() => setActiveTab('files')} className={`p-2 rounded-lg ${activeTab === 'files' ? 'text-white bg-white/10' : 'text-gray-400 hover:bg-white/10'}`}>
                            <FileIcon />
                        </button>
                    </Tooltip>
                    <Tooltip text="Extensions (coming soon)">
                        <button onClick={() => setActiveTab('extensions')} className={`p-2 rounded-lg ${activeTab === 'extensions' ? 'text-white bg-white/10' : 'text-gray-400 hover:bg-white/10'}`}>
                            <ExtensionIcon />
                        </button>
                    </Tooltip>
                </div>
            </div>
            <div className="space-y-4">
                 <Tooltip text="Download Project (ZIP)">
                    <button onClick={onDownload} className="p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white">
                        <DownloadIcon />
                    </button>
                </Tooltip>
                <Tooltip text="Account (coming soon)">
                    <button className="p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white">
                        <UserIcon />
                    </button>
                </Tooltip>
                <Tooltip text="Settings">
                    <button onClick={onOpenSettings} className="p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white">
                        <SettingsIcon />
                    </button>
                </Tooltip>
            </div>
        </div>

        {/* Content Panel */}
        <div className="w-64 bg-[#16171D] p-2">
            <div className="flex justify-between items-center p-2">
                <h2 className="text-sm font-bold uppercase text-gray-400 tracking-wider">
                    {activeTab === 'files' ? 'Explorer' : 'Coming Soon'}
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
                        className={`w-full text-left px-2 py-1 rounded text-sm ${
                            activeFile === file.name ? 'bg-blue-500/20 text-white' : 'text-gray-300 hover:bg-white/5'
                        }`}
                        >
                        {file.name}
                        </button>
                    </li>
                    ))}
                </ul>
            )}
            {activeTab !== 'files' && (
                <div className="p-2 text-gray-500 text-sm">
                    This feature is not yet implemented.
                </div>
            )}
        </div>
    </div>
  );
};
