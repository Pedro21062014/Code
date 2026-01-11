
import React, { useState } from 'react';
import { CloseIcon, DownloadIcon, TerminalIcon, CheckCircleIcon, LoaderIcon, NetlifyIcon, CloudflareIcon, AppLogo } from './Icons';
import { createProjectZip } from '../services/projectService';
import { ProjectFile } from '../types';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  projectName: string;
  projectId: number | null;
  files?: ProjectFile[];
  onSaveRequired: () => Promise<void>;
  netlifyToken?: string; // Token vindo das settings
  existingSiteId?: string; // ID do site já deployado
  onSaveToken?: (token: string) => void; // Nova prop para salvar o token
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, onDownload, projectName, projectId, files = [], onSaveRequired, netlifyToken, existingSiteId, onSaveToken }) => {
  const [deployStatus, setDeployStatus] = useState<'idle' | 'compressing' | 'uploading' | 'success' | 'error'>('idle');
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTarget, setActiveTarget] = useState<'netlify' | 'cloudflare' | 'codegen' | null>(null);
  const [manualToken, setManualToken] = useState('');

  // Limpar estados ao abrir
  React.useEffect(() => {
      if(isOpen) {
          setDeployStatus('idle');
          setDeployUrl(null);
          setErrorMessage(null);
          setActiveTarget(null);
          setManualToken('');
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNetlifyDeploy = async () => {
    const tokenToUse = manualToken || netlifyToken;

    if (!tokenToUse) {
        setErrorMessage("Token do Netlify necessário.");
        return;
    }

    setErrorMessage(null);

    try {
        if (!projectId) await onSaveRequired();
        
        setDeployStatus('compressing');
        // Pequeno delay para a UI atualizar
        await new Promise(r => setTimeout(r, 100));

        const zipBlob = await createProjectZip(files);
        const arrayBuffer = await zipBlob.arrayBuffer();

        setDeployStatus('uploading');

        const headers: Record<string, string> = {
            'Content-Type': 'application/zip',
            'X-Netlify-Token': tokenToUse
        };

        if (existingSiteId) {
            headers['X-Netlify-Site-Id'] = existingSiteId;
        }

        const response = await fetch('/api/publish', {
            method: 'POST',
            headers: headers,
            body: arrayBuffer
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Falha no deploy');
        }

        setDeployUrl(data.url);
        setDeployStatus('success');

        // Se o deploy foi bem sucedido e usamos um token manual, salvamos ele no perfil do usuário
        if (manualToken && onSaveToken) {
            onSaveToken(manualToken);
        }

        // Atualizar o projeto no Firestore com a URL do deploy e o ID do Site para futuros updates
        if (projectId && data.url) {
            try {
                const projectRef = doc(db, "projects", projectId.toString());
                const updateData: any = {
                    deployedUrl: data.url,
                    updated_at: new Date().toISOString()
                };
                if (data.siteId) {
                    updateData.netlifySiteId = data.siteId;
                }
                await updateDoc(projectRef, updateData);
            } catch (dbError) {
                console.error("Erro ao salvar URL do deploy no banco:", dbError);
            }
        }

    } catch (err: any) {
        console.error("Deploy error:", err);
        setErrorMessage(err.message || "Erro desconhecido ao publicar.");
        setDeployStatus('error');
    }
  };

  const handleCloudflareClick = () => {
      onDownload();
      alert("Para publicar no Cloudflare Pages: \n1. O ZIP do projeto foi baixado.\n2. Vá para dash.cloudflare.com > Pages > Upload Assets.");
      onClose();
  };

  const isLoading = deployStatus === 'compressing' || deployStatus === 'uploading';

  return (
     <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-[#09090b] border border-[#27272a] rounded-2xl w-full max-w-2xl overflow-hidden animate-slideInUp shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        <div className="px-6 py-5 border-b border-[#27272a] bg-[#0c0c0e] flex justify-between items-center">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-purple-500" /> Publicar Aplicação
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><CloseIcon className="w-4 h-4"/></button>
        </div>
        
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
            
            {deployStatus === 'success' ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                        <CheckCircleIcon className="w-10 h-10 text-green-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Aplicação Online!</h3>
                        <p className="text-gray-400">Seu projeto foi publicado com sucesso no Netlify.</p>
                        <p className="text-xs text-gray-500 mt-2">Agora você pode publicá-lo na Galeria.</p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full max-w-md bg-[#121214] border border-[#27272a] p-3 rounded-xl">
                        <div className="flex-1 truncate text-left">
                            <a href={deployUrl!} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-mono text-sm truncate">
                                {deployUrl}
                            </a>
                        </div>
                        <button 
                            onClick={() => { navigator.clipboard.writeText(deployUrl!); }}
                            className="px-3 py-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-bold rounded-lg transition-colors"
                        >
                            Copiar
                        </button>
                    </div>

                    <button onClick={() => { setDeployStatus('idle'); onClose(); }} className="text-gray-500 hover:text-white text-sm">Fechar</button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Option 1: Netlify */}
                        <button 
                            onClick={() => !isLoading && setActiveTarget('netlify')}
                            disabled={isLoading}
                            className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all group gap-4 relative overflow-hidden ${activeTarget === 'netlify' ? 'bg-[#1a1a1c] border-[#00C7B7]' : 'bg-[#121214] border-[#27272a] hover:border-[#00C7B7]/50 hover:bg-[#1a1a1c]'} ${isLoading && activeTarget !== 'netlify' ? 'opacity-30' : ''}`}
                        >
                            <div className="w-14 h-14 bg-[#00C7B7]/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <NetlifyIcon className="w-8 h-8 text-[#00C7B7]" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-white mb-1">Netlify</h3>
                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{existingSiteId ? 'Atualizar Deploy' : 'Instant Deploy'}</p>
                            </div>
                        </button>

                        {/* Option 2: Cloudflare */}
                        <button 
                            onClick={handleCloudflareClick}
                            disabled={isLoading}
                            className={`flex flex-col items-center justify-center p-6 rounded-2xl bg-[#121214] border border-[#27272a] hover:border-[#F38020]/50 hover:bg-[#1a1a1c] transition-all group gap-4 ${isLoading ? 'opacity-30' : ''}`}
                        >
                            <div className="w-14 h-14 bg-[#F38020]/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <CloudflareIcon className="w-8 h-8 text-[#F38020]" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-white mb-1">Cloudflare Pages</h3>
                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Manual Upload</p>
                            </div>
                        </button>

                        {/* Option 3: Codegen Studio (Coming Soon) */}
                        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#121214]/50 border border-[#27272a] gap-4 relative opacity-60 cursor-not-allowed">
                            <div className="absolute top-3 right-3 bg-[#27272a] text-white text-[9px] font-bold px-2 py-1 rounded border border-white/5">EM BREVE</div>
                            <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center">
                                <AppLogo className="w-8 h-8 text-blue-500" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-gray-400 mb-1">Codegen Studio</h3>
                                <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">Managed Hosting</p>
                            </div>
                        </div>
                    </div>

                    {/* Netlify Config Section - Only shows if Netlify is selected */}
                    {activeTarget === 'netlify' && (
                        <div className="bg-[#121214] border border-[#27272a] rounded-xl p-4 animate-slideInUp">
                            {!netlifyToken && (
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-gray-400 mb-2">
                                        Token de Acesso Netlify (Não configurado)
                                    </label>
                                    <input 
                                        type="password" 
                                        value={manualToken}
                                        onChange={(e) => setManualToken(e.target.value)}
                                        placeholder="Cole seu token 'nfp_...' aqui"
                                        disabled={isLoading}
                                        className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00C7B7] disabled:opacity-50"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-2">
                                        Seu token será salvo automaticamente para futuros deploys.
                                    </p>
                                </div>
                            )}
                            
                            <button 
                                onClick={handleNetlifyDeploy}
                                disabled={isLoading || (!netlifyToken && !manualToken)}
                                className="w-full bg-[#00C7B7] hover:bg-[#00b3a6] text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <LoaderIcon className="w-4 h-4 animate-spin" /> 
                                        {deployStatus === 'compressing' ? 'Comprimindo...' : 'Enviando ao Netlify...'}
                                    </>
                                ) : existingSiteId ? 'Atualizar Aplicação Existente' : 'Confirmar Deploy'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {errorMessage && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                    {errorMessage}
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-[#27272a] flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-white font-medium text-sm">Exportar Código Fonte</span>
                    <span className="text-gray-500 text-xs">Baixe o .zip completo para rodar localmente.</span>
                </div>
                <button 
                    onClick={onDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-bold rounded-lg transition-colors border border-white/5"
                >
                    <DownloadIcon className="w-4 h-4" /> Download ZIP
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
