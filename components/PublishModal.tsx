
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
        try {
            await onSaveRequired();
            // Após salvar, o projectId deve estar disponível no próximo render ou via ref, 
            // mas aqui simplificamos pedindo para o usuário clicar novamente após salvar automaticamente.
        } finally {
            setIsPreparing(false);
        }
        return;
    }
    
    if (publicLink) {
        navigator.clipboard.writeText(publicLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
     <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-[#141414] border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-slideInUp" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-green-600 flex items-center justify-center shadow-[0_0_20px_rgba(22,163,74,0.4)]">
                <TerminalIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter">Publicar Projeto</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </div>
        
        <div className="p-8 space-y-8">
            {/* Seção de Link Público */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Link de Acesso Público</h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">FULLSCREEN PREVIEW</span>
                </div>
                
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl p-4 transition-all group-hover:border-white/20">
                        <input 
                            readOnly 
                            value={publicLink || "Salve o projeto para gerar o link..."}
                            className="flex-1 bg-transparent text-sm text-gray-300 font-mono outline-none truncate"
                        />
                        <button 
                            onClick={handleCopyLink}
                            disabled={isPreparing}
                            className={`px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${
                                copied ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-gray-200'
                            }`}
                        >
                            {isPreparing ? <LoaderIcon className="w-3 h-3 animate-spin" /> : (copied ? <CheckCircleIcon className="w-3 h-3" /> : null)}
                            {isPreparing ? 'Salvando...' : (copied ? 'Copiado!' : 'Copiar Link')}
                        </button>
                    </div>
                </div>
                <p className="text-[10px] text-gray-600 leading-relaxed font-medium">
                    Qualquer pessoa com este link poderá visualizar sua aplicação em tela cheia, sem precisar de conta ou login.
                </p>
            </div>

            <div className="h-px bg-white/5"></div>

            {/* Seção de Download Local */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Execução Offline</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-tight">
                            <DownloadIcon className="w-3.5 h-3.5" />
                            Código Fonte
                        </div>
                        <p className="text-[10px] text-gray-500">Baixe os arquivos brutos (HTML/JS/TS) para seu computador.</p>
                        <button 
                            onClick={onDownload}
                            className="w-full mt-2 py-2.5 bg-[#1a1a1a] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#222] transition-colors"
                        >
                            Baixar ZIP
                        </button>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-tight">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                            Servidor Local
                        </div>
                        <p className="text-[10px] text-gray-500">Para rodar o ZIP, use o comando abaixo dentro da pasta:</p>
                        <code className="block bg-black px-3 py-2 rounded-lg text-[10px] font-mono text-green-400 border border-green-500/20">
                            npx serve
                        </code>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-8 bg-white/[0.02] border-t border-white/5">
            <p className="text-[10px] text-center text-gray-600 font-bold uppercase tracking-[0.2em]">
                Codegen Engine v0.1 • Deployment Ready
            </p>
        </div>
      </div>
    </div>
  );
};
