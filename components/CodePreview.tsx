
import React, { useState } from 'react';
import { ProjectFile, Theme, ChatMode } from '../types';
import { AppLogo, NetlifyIcon, LoaderIcon, GlobeIcon, EditIcon } from './Icons';

interface CodePreviewProps {
  files: ProjectFile[]; // Mantido para compatibilidade, mas não usado para renderização local
  onError: (errorMessage: string) => void;
  theme: Theme;
  envVars: Record<string, string>;
  deployedUrl?: string | null;
  onDeploy?: () => void;
  chatMode?: ChatMode; // New prop
}

export const CodePreview: React.FC<CodePreviewProps> = ({ deployedUrl, onDeploy, theme, chatMode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInspecting, setIsInspecting] = useState(false);
  const [lastClickPosition, setLastClickPosition] = useState<{ x: number, y: number } | null>(null);

  // Handle Inspection Click
  const handleOverlayClick = (e: React.MouseEvent) => {
      if (!isInspecting) return;
      
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setLastClickPosition({ x, y });
      
      // Visual feedback only since we can't inspect cross-origin iframes easily
      // In a real scenario with postMessage, we'd send these coords to the iframe
      // setTimeout(() => setIsInspecting(false), 2000); // Auto disable or keep enabled
  };

  // Se não houver URL de deploy, mostra o estado vazio pedindo deploy
  if (!deployedUrl) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-[#09090b] flex flex-col items-center justify-center gap-6 animate-fadeIn transition-colors duration-300 p-8 text-center">
         <div className="relative group">
             <div className="absolute inset-0 bg-[#00C7B7] blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity duration-1000"></div>
             <div className="w-20 h-20 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-2xl flex items-center justify-center shadow-2xl relative z-10">
                <NetlifyIcon className="w-10 h-10 text-[#00C7B7]" />
             </div>
         </div>
         
         <div className="max-w-md space-y-2">
             <h3 className="text-xl font-bold text-gray-900 dark:text-white">Preview Offline</h3>
             <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Para visualizar sua aplicação funcionando, é necessário publicá-la no Netlify primeiro.
             </p>
         </div>

         {onDeploy && (
             <button 
                onClick={onDeploy}
                className="flex items-center gap-2 px-6 py-3 bg-[#00C7B7] hover:bg-[#00b3a6] text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-[#00C7B7]/20"
             >
                <NetlifyIcon className="w-5 h-5" />
                Fazer Deploy Agora
             </button>
         )}
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white relative group overflow-hidden">
      <iframe
        key={deployedUrl} // Força recarregar se a URL mudar
        title="Live Preview"
        src={deployedUrl}
        className="w-full h-full border-none bg-white block"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation allow-downloads"
        onLoad={() => setIsLoading(false)}
      />

      {/* Design Inspector Layer */}
      {chatMode === 'design' && (
          <>
            <button
                onClick={() => { setIsInspecting(!isInspecting); setLastClickPosition(null); }}
                className={`absolute top-4 right-4 z-50 p-2 rounded-lg shadow-lg transition-all border ${
                    isInspecting 
                    ? 'bg-blue-600 text-white border-blue-700 animate-pulse' 
                    : 'bg-white dark:bg-[#18181b] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#27272a] hover:bg-gray-100'
                }`}
                title="Selecionar Elemento para Design"
            >
                <EditIcon className="w-5 h-5" />
            </button>

            {isInspecting && (
                <div 
                    className="absolute inset-0 z-40 cursor-crosshair bg-blue-500/5 hover:bg-blue-500/10 transition-colors"
                    onClick={handleOverlayClick}
                >
                    {/* Fake Selection Box Feedback */}
                    {lastClickPosition && (
                        <div 
                            className="absolute border-2 border-blue-500 bg-blue-500/20 w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none animate-ping"
                            style={{ top: lastClickPosition.y, left: lastClickPosition.x }}
                        />
                    )}
                    {lastClickPosition && (
                        <div 
                            className="absolute bg-black text-white text-xs px-3 py-1 rounded shadow-lg -translate-x-1/2 -translate-y-full mt-[-10px] whitespace-nowrap pointer-events-none"
                            style={{ top: lastClickPosition.y, left: lastClickPosition.x }}
                        >
                            Elemento Selecionado
                        </div>
                    )}
                </div>
            )}
          </>
      )}

      {/* Overlay de carregamento do Iframe */}
      {isLoading && (
          <div className="absolute inset-0 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md flex items-center justify-center z-10">
               <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                      <div className="absolute inset-0 bg-[#00C7B7] blur-xl opacity-20 animate-pulse"></div>
                      <LoaderIcon className="w-8 h-8 text-[#00C7B7] animate-spin relative z-10" />
                  </div>
                  <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Carregando Site...</span>
               </div>
          </div>
      )}
      
      {/* Indicador de Status (Canto inferior) */}
      {!isInspecting && (
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-black/80 backdrop-blur text-white text-[10px] rounded-full font-medium border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <GlobeIcon className="w-3 h-3 text-green-400" />
              Live via Netlify
          </div>
      )}
    </div>
  );
};
