
import React, { useState, useEffect, useRef } from 'react';
import { ProjectFile, Theme, ChatMode } from '../types';
import { AppLogo, NetlifyIcon, LoaderIcon, GlobeIcon, EditIcon, ConsoleIcon, ChevronUpIcon, ChevronDownIcon, EraserIcon } from './Icons';

interface CodePreviewProps {
  files: ProjectFile[]; 
  onError: (errorMessage: string) => void;
  theme: Theme;
  envVars: Record<string, string>;
  deployedUrl?: string | undefined;
  onDeploy?: () => void;
  chatMode?: ChatMode; 
}

interface LogEntry {
    type: 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
}

export const CodePreview: React.FC<CodePreviewProps> = ({ files, deployedUrl, onDeploy, theme, chatMode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInspecting, setIsInspecting] = useState(false);
  const [hoveredElementRect, setHoveredElementRect] = useState<{ top: number, left: number, width: number, height: number, tagName: string } | null>(null);
  
  // Console State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(true); // Se aberto, está expandido (grande) ou minimizado (barra)

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
          if (event.data && event.data.type === 'PREVIEW_CONSOLE') {
              const newLog: LogEntry = {
                  type: event.data.level,
                  message: event.data.payload.join(' '),
                  timestamp: new Date().toLocaleTimeString()
              };
              setLogs(prev => [...prev, newLog]);
          }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Construct srcDoc for local preview (allowing inspection)
  const srcDoc = React.useMemo(() => {
      // Find entry point
      const indexHtml = files.find(f => f.name === 'index.html' || f.name === 'public/index.html');
      if (!indexHtml) return `<html><body><h1>No index.html found</h1></body></html>`;

      let htmlContent = indexHtml.content;

      // Inject Images: Replace local paths with Data URIs
      files.forEach(file => {
          if (/\.(jpg|jpeg|png|gif|ico|svg|webp|bmp)$/i.test(file.name)) {
              const filename = file.name.split('/').pop();
              const possiblePaths = [
                  file.name,
                  `/${file.name}`,
                  `./${file.name}`,
                  filename,
                  `/${filename}`,
                  `./${filename}`
              ];

              if (file.name.startsWith('public/')) {
                  const nameWithoutPublic = file.name.replace('public/', '');
                  possiblePaths.push(nameWithoutPublic);
                  possiblePaths.push(`/${nameWithoutPublic}`);
                  possiblePaths.push(`./${nameWithoutPublic}`);
              }

              possiblePaths.forEach(path => {
                  if(!path) return;
                  const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const regex = new RegExp(`src=["']${escapedPath}["']`, 'g');
                  htmlContent = htmlContent.replace(regex, `src="${file.content}"`);
              });
          }
      });

      // Basic CSS injection for styling if needed
      const cssFiles = files.filter(f => f.name.endsWith('.css'));
      const styles = cssFiles.map(f => `<style>${f.content}</style>`).join('\n');
      htmlContent = htmlContent.replace('</head>', `${styles}</head>`);

      // Script injection
      const jsFiles = files.filter(f => f.name.endsWith('.js') && !f.name.includes('vite') && !f.name.includes('config'));
      const scripts = jsFiles.map(f => `<script>${f.content}</script>`).join('\n');
      htmlContent = htmlContent.replace('</body>', `${scripts}</body>`);

      // INJECT CONSOLE INTERCEPTOR
      const interceptorScript = `
        <script>
          (function() {
            const send = (level, args) => {
              try {
                window.parent.postMessage({
                  type: 'PREVIEW_CONSOLE',
                  level,
                  payload: args.map(a => {
                    try {
                        return typeof a === 'object' ? JSON.stringify(a) : String(a);
                    } catch(e) { return String(a); }
                  })
                }, '*');
              } catch(e) {}
            };
            const originalLog = console.log; console.log = (...args) => { originalLog(...args); send('info', args); };
            const originalWarn = console.warn; console.warn = (...args) => { originalWarn(...args); send('warn', args); };
            const originalError = console.error; console.error = (...args) => { originalError(...args); send('error', args); };
            window.onerror = (msg, url, line) => { send('error', [msg + ' (Line ' + line + ')']); };
          })();
        </script>
      `;
      
      // Inject before any other script in head if possible, or body
      if (htmlContent.includes('<head>')) {
          htmlContent = htmlContent.replace('<head>', `<head>${interceptorScript}`);
      } else {
          htmlContent = interceptorScript + htmlContent;
      }

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

  const activeSrc = deployedUrl ? deployedUrl : undefined;
  const activeSrcDoc = deployedUrl ? undefined : srcDoc;
  const versionKey = files.reduce((acc, f) => acc + f.content.length, 0);

  return (
    <div className="w-full h-full bg-white relative group overflow-hidden flex flex-col">
      <div className="flex-1 relative">
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

      {/* Console Floating Toggle Button */}
      {!isConsoleOpen && (
          <button 
            onClick={() => { setIsConsoleOpen(true); setIsConsoleExpanded(true); }}
            className="absolute bottom-4 left-4 z-30 p-2 bg-gray-900/90 hover:bg-black text-white rounded-full shadow-lg border border-white/10 transition-transform hover:scale-105"
            title="Abrir Console"
          >
              <ConsoleIcon className="w-4 h-4" />
          </button>
      )}

      {/* Console Panel */}
      {isConsoleOpen && (
          <div className={`border-t border-gray-200 dark:border-[#27272a] bg-gray-50 dark:bg-[#0c0c0e] flex flex-col transition-all duration-300 ${isConsoleExpanded ? 'h-48' : 'h-9'}`}>
              
              {/* Console Header */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-[#18181b] border-b border-gray-200 dark:border-[#27272a] select-none cursor-pointer" onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}>
                  <div className="flex items-center gap-2">
                      <ConsoleIcon className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Console</span>
                      {logs.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-[#27272a] text-[9px] text-gray-600 dark:text-gray-400 font-mono">{logs.length}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setLogs([]); }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-[#27272a] rounded text-gray-500 hover:text-red-500"
                        title="Limpar Console"
                      >
                          <EraserIcon className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsConsoleExpanded(!isConsoleExpanded); }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-[#27272a] rounded text-gray-500"
                      >
                          {isConsoleExpanded ? <ChevronDownIcon className="w-3.5 h-3.5" /> : <ChevronUpIcon className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsConsoleOpen(false); }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-[#27272a] rounded text-gray-500 hover:text-black dark:hover:text-white"
                      >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
              </div>

              {/* Console Body */}
              {isConsoleExpanded && (
                  <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1 bg-white dark:bg-[#0c0c0e]">
                      {logs.length === 0 ? (
                          <div className="text-gray-400 italic p-2">Nenhum log registrado.</div>
                      ) : (
                          logs.map((log, i) => (
                              <div key={i} className={`flex items-start gap-2 border-b border-gray-50 dark:border-[#1f1f22] pb-1 mb-1 last:border-0`}>
                                  <span className="text-gray-400 select-none flex-shrink-0">[{log.timestamp}]</span>
                                  <span className={`break-all ${
                                      log.type === 'error' ? 'text-red-600 dark:text-red-400' : 
                                      log.type === 'warn' ? 'text-yellow-600 dark:text-yellow-400' : 
                                      'text-gray-700 dark:text-gray-300'
                                  }`}>
                                      {log.message}
                                  </span>
                              </div>
                          ))
                      )}
                  </div>
              )}
          </div>
      )}
    </div>
  );
};
