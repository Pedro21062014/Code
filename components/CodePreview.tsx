import React, { useState, useEffect, useRef } from 'react';
import { ProjectFile, Theme, ChatMode } from '../types';
import { AppLogo, NetlifyIcon, LoaderIcon, GlobeIcon, EditIcon } from './Icons';

interface CodePreviewProps {
  files: ProjectFile[]; 
  onError: (errorMessage: string) => void;
  theme: Theme;
  envVars: Record<string, string>;
  deployedUrl?: string | undefined;
  onDeploy?: () => void;
  chatMode?: ChatMode; 
}

export const CodePreview: React.FC<CodePreviewProps> = ({ files, deployedUrl, onDeploy, theme, chatMode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInspecting, setIsInspecting] = useState(false);
  const [hoveredElementRect, setHoveredElementRect] = useState<{ top: number, left: number, width: number, height: number, tagName: string } | null>(null);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Construct srcDoc for local preview (allowing inspection)
  const srcDoc = React.useMemo(() => {
      // Find entry point
      const indexHtml = files.find(f => f.name === 'index.html' || f.name === 'public/index.html');
      if (!indexHtml) return `<html><body><h1>No index.html found</h1></body></html>`;

      let htmlContent = indexHtml.content;

      // Basic CSS injection for styling if needed
      const cssFiles = files.filter(f => f.name.endsWith('.css'));
      const styles = cssFiles.map(f => `<style>${f.content}</style>`).join('\n');
      htmlContent = htmlContent.replace('</head>', `${styles}</head>`);

      // Script injection (Naive approach for simple projects, WebContainer handles complex ones better)
      // This is a simulation for visual inspection purposes if not deployed
      // For a robust local preview without WebContainer, we rely on basic HTML/CSS/JS structure
      const jsFiles = files.filter(f => f.name.endsWith('.js') && !f.name.includes('vite') && !f.name.includes('config'));
      const scripts = jsFiles.map(f => `<script>${f.content}</script>`).join('\n');
      htmlContent = htmlContent.replace('</body>', `${scripts}</body>`);

      return htmlContent;
  }, [files]);

  // Effect to handle inspection events inside the iframe (only works with srcDoc or same-origin)
  useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe || !isInspecting || deployedUrl) return;

      const handleLoad = () => {
          const doc = iframe.contentDocument;
          if (!doc) return;

          const handleMouseOver = (e: MouseEvent) => {
              e.stopPropagation();
              const target = e.target as HTMLElement;
              // Ignore body/html to avoid selecting the whole page constantly
              if (target.tagName === 'BODY' || target.tagName === 'HTML') return;

              const rect = target.getBoundingClientRect();
              setHoveredElementRect({
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                  tagName: target.tagName.toLowerCase()
              });
          };

          const handleMouseOut = () => {
              setHoveredElementRect(null);
          };

          doc.body.addEventListener('mouseover', handleMouseOver);
          doc.body.addEventListener('mouseout', handleMouseOut);
          
          // Cleanup
          return () => {
              doc.body.removeEventListener('mouseover', handleMouseOver);
              doc.body.removeEventListener('mouseout', handleMouseOut);
          };
      };

      iframe.addEventListener('load', handleLoad);
      // Try attaching immediately if already loaded
      handleLoad();

      return () => {
          iframe.removeEventListener('load', handleLoad);
      };
  }, [isInspecting, srcDoc, deployedUrl]);

  // Toggle Inspect Mode
  const toggleInspect = () => {
      setIsInspecting(!isInspecting);
      setHoveredElementRect(null);
  };

  // Se houver URL de deploy, usamos ela (mas perdemos a capacidade de inspeção DOM profunda devido a CORS)
  // Se estivermos no modo Design, preferimos o srcDoc se não houver deploy, ou avisamos.
  const activeSrc = deployedUrl ? deployedUrl : undefined;
  const activeSrcDoc = deployedUrl ? undefined : srcDoc;

  // Use file length or hash to force re-render if updated
  const versionKey = files.reduce((acc, f) => acc + f.content.length, 0);

  return (
    <div className="w-full h-full bg-white relative group overflow-hidden">
      <iframe
        ref={iframeRef}
        key={deployedUrl ? deployedUrl : `local-${versionKey}`}
        title="Preview"
        src={activeSrc}
        srcDoc={activeSrcDoc}
        className="w-full h-full border-none bg-white block"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation allow-downloads"
        onLoad={() => setIsLoading(false)}
      />

      {/* Design Inspector Layer */}
      {chatMode === 'design' && !deployedUrl && (
          <>
            <button
                onClick={toggleInspect}
                className={`absolute top-4 right-4 z-50 p-2 rounded-lg shadow-lg transition-all border ${
                    isInspecting 
                    ? 'bg-blue-600 text-white border-blue-700 animate-pulse' 
                    : 'bg-white dark:bg-[#18181b] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#27272a] hover:bg-gray-100'
                }`}
                title="Selecionar Elemento (Design Mode)"
            >
                <EditIcon className="w-5 h-5" />
            </button>

            {/* Selection Overlay */}
            {isInspecting && hoveredElementRect && (
                <div 
                    className="absolute z-40 pointer-events-none transition-all duration-75 ease-out border-2 border-blue-500 bg-blue-500/10"
                    style={{
                        top: hoveredElementRect.top,
                        left: hoveredElementRect.left,
                        width: hoveredElementRect.width,
                        height: hoveredElementRect.height
                    }}
                >
                    <div className="absolute -top-6 left-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">
                        {hoveredElementRect.tagName}
                    </div>
                </div>
            )}
          </>
      )}

      {/* Warning if using deployed URL in Design Mode */}
      {chatMode === 'design' && deployedUrl && (
          <div className="absolute top-4 right-4 z-50 bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs px-3 py-2 rounded shadow-lg">
              Modo Design limitado em deploy live.
          </div>
      )}

      {/* Loading State */}
      {isLoading && (
          <div className="absolute inset-0 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md flex items-center justify-center z-10">
               <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                      <div className="absolute inset-0 bg-[#00C7B7] blur-xl opacity-20 animate-pulse"></div>
                      <LoaderIcon className="w-8 h-8 text-[#00C7B7] animate-spin relative z-10" />
                  </div>
                  <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Carregando...</span>
               </div>
          </div>
      )}
      
      {/* Live Indicator */}
      {deployedUrl && !isInspecting && (
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-black/80 backdrop-blur text-white text-[10px] rounded-full font-medium border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <GlobeIcon className="w-3 h-3 text-green-400" />
              Live via Netlify
          </div>
      )}
    </div>
  );
};