import React from 'react';
import { CloseIcon, ClockIcon, CheckCircleIcon } from './Icons';
import { ProjectVersion } from '../types';

interface VersioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: ProjectVersion[];
  onRestore: (version: ProjectVersion) => void;
}

export const VersioningModal: React.FC<VersioningModalProps> = ({ isOpen, onClose, versions, onRestore }) => {
  if (!isOpen) return null;

  // Ordenar versões da mais recente para a mais antiga
  const sortedVersions = [...versions].sort((a, b) => b.timestamp - a.timestamp);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#09090b] w-full max-w-md border border-gray-200 dark:border-[#27272a] shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[80vh] animate-slideInUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#27272a] flex justify-between items-center bg-gray-50 dark:bg-[#0c0c0e]">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                <ClockIcon className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Histórico de Versões</h2>
                <p className="text-[10px] text-gray-500">Restaurar versões anteriores</p>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white transition-colors">
             <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {sortedVersions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-sm">
                    <ClockIcon className="w-8 h-8 mb-2 opacity-20" />
                    Nenhuma versão salva ainda.
                </div>
            ) : (
                <div className="space-y-1">
                    {sortedVersions.map((version, index) => (
                        <div key={version.id} className="group flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-[#18181b] rounded-xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-[#27272a]">
                            <div className="flex flex-col gap-1 min-w-0">
                                <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {index === 0 && <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[9px] rounded uppercase tracking-wider">Atual</span>}
                                    {formatTime(version.timestamp)}
                                </span>
                                <span className="text-xs text-gray-500 truncate max-w-[200px]">{version.message || `Alteração #${versions.length - index}`}</span>
                                <span className="text-[10px] text-gray-400 font-mono">{version.files.length} arquivos</span>
                            </div>
                            
                            <button 
                                onClick={() => {
                                    if(window.confirm("Restaurar esta versão substituirá os arquivos atuais. Continuar?")) {
                                        onRestore(version);
                                        onClose();
                                    }
                                }}
                                className="px-3 py-1.5 bg-white dark:bg-[#27272a] border border-gray-200 dark:border-[#3f3f46] text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:text-white dark:hover:border-blue-600 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                            >
                                Restaurar
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-[#27272a] bg-gray-50 dark:bg-[#0c0c0e] text-[10px] text-gray-500 text-center">
            As versões são salvas localmente no cache do seu navegador.
        </div>
      </div>
    </div>
  );
};