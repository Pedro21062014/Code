
import React, { useState } from 'react';
import { CloseIcon, DownloadIcon, TerminalIcon, CheckCircleIcon, LoaderIcon } from './Icons';

interface LocalRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  projectName: string;
  projectId: number | null;
  onSaveRequired: () => Promise<void>;
}

export const PublishModal: React.FC<LocalRunModalProps> = ({ isOpen, onClose, onDownload, projectName, projectId, onSaveRequired }) => {
  const [copied, setCopied] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);

  if (!isOpen) return null;

  const publicLink = projectId ? `${window.location.origin}${window.location.pathname}?p=${projectId}` : null;

  const handleCopyLink = async () => {
    if (!projectId) {
        setIsPreparing(true);
        try { await onSaveRequired(); } finally { setIsPreparing(false); }
        return;
    }
    if (publicLink) {
        navigator.clipboard.writeText(publicLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
     <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-[#09090b] border border-[#27272a] rounded-2xl w-full max-w-lg overflow-hidden animate-slideInUp shadow-2xl" onClick={e => e.stopPropagation()}>
        
        <div className="px-6 py-5 border-b border-[#27272a] bg-[#0c0c0e] flex justify-between items-center">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-gray-400" /> Deployment
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><CloseIcon className="w-4 h-4"/></button>
        </div>
        
        <div className="p-6 space-y-8">
            {/* Public Link Section */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                     <span className="text-[10px] font-mono text-gray-500 uppercase">Status: {projectId ? 'Online' : 'Draft'}</span>
                     {projectId && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                </div>
                
                <div className="flex gap-2">
                    <div className="flex-1 bg-[#121214] border border-[#27272a] rounded-lg px-3 py-2 flex items-center">
                         <code className="text-xs text-gray-300 font-mono truncate flex-1">
                             {publicLink || "Aguardando sincronização..."}
                         </code>
                    </div>
                    <button 
                        onClick={handleCopyLink}
                        disabled={isPreparing}
                        className={`px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all border ${
                            copied 
                            ? 'bg-green-900/20 border-green-500/50 text-green-400' 
                            : 'bg-white text-black border-transparent hover:bg-gray-200'
                        }`}
                    >
                        {isPreparing ? <LoaderIcon className="w-3 h-3 animate-spin"/> : (copied ? "Copiado" : "Copy")}
                    </button>
                </div>
            </div>

            <div className="h-px bg-[#27272a]"></div>

            {/* Offline Section */}
            <div>
                 <h3 className="text-[10px] font-mono text-gray-500 uppercase mb-4">Export Options</h3>
                 <div className="grid grid-cols-2 gap-4">
                     <button onClick={onDownload} className="flex flex-col items-start p-4 rounded-xl border border-[#27272a] bg-[#121214] hover:bg-[#18181b] transition-all group text-left">
                        <DownloadIcon className="w-5 h-5 text-gray-400 mb-2 group-hover:text-white transition-colors" />
                        <span className="text-xs font-bold text-white">Source Code</span>
                        <span className="text-[10px] text-gray-500 mt-1">.zip archive</span>
                     </button>
                     <div className="flex flex-col items-start p-4 rounded-xl border border-[#27272a] bg-[#121214] text-left">
                        <span className="text-xs font-bold text-white mb-2">Local Server</span>
                        <code className="text-[10px] bg-black px-2 py-1 rounded text-green-400 font-mono border border-[#27272a] w-full">
                            npx serve
                        </code>
                     </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};
