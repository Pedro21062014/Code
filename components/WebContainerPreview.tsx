import React, { useEffect, useState, useRef } from 'react';
import { ProjectFile, Theme } from '../types';
import { getWebContainer } from '../lib/webcontainer';
import { TerminalPane } from './TerminalPane';
import { LoaderIcon, RefreshIcon, TerminalIcon } from './Icons';

interface WebContainerPreviewProps {
  files: ProjectFile[];
  theme: Theme;
  envVars: Record<string, string>;
  onServerReady?: (url: string) => void;
}

export const WebContainerPreview: React.FC<WebContainerPreviewProps> = ({ files, theme, envVars, onServerReady }) => {
  const [booting, setBooting] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const webcontainerRef = useRef<any>(null);

  const writeFilesToWebContainer = async (wc: any) => {
    // Convert flat files array to tree object for mount()
    const tree: any = {};
    for (const f of files) {
      if (f.name.startsWith('/')) f.name = f.name.slice(1);
      const parts = f.name.split('/');
      let current = tree;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = { directory: {} };
        current = current[parts[i]].directory;
      }
      current[parts[parts.length - 1]] = { file: { contents: f.content } };
    }
    
    // Add .env if we have vars
    const envContent = Object.entries(envVars).map(([k, v]) => k + '=' + v).join('\n');
    if (envContent) {
        tree['.env'] = { file: { contents: envContent } };
    }

    await wc.mount(tree);
  };

  const boot = async () => {
    try {
      setBooting(true);
      setError(null);

      // WebContainers require Cross-Origin Isolation (COOP/COEP headers)
      if (typeof crossOriginIsolated !== 'undefined' && !crossOriginIsolated) {
        if (window.self !== window.top) {
          setError('WebContainers require Cross-Origin Isolation. This iframe cannot be isolated. Please open the app in a new tab (click the "↗️" arrow button at the top right of the code editor!) to use the terminal/editor.');
        } else {
          setError('Cross-Origin Isolation is not enabled. Required HTTP headers might be missing.');
        }
        setBooting(false);
        return;
      }

      const wc = await getWebContainer();
      webcontainerRef.current = wc;
      
      await writeFilesToWebContainer(wc);
      
      wc.on('server-ready', (port: number, url: string) => {
        setUrl(url);
        if (onServerReady) onServerReady(url);
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error booting WebContainer. Check Cross-Origin Isolation headers.');
    } finally {
      setBooting(false);
    }
  };

  // Sync files when they change heavily? 
  // It's better to just mount them manually via a button or on first load.
  useEffect(() => {
    // Only auto-boot if we have package.json
    const hasPackageJson = files.some(f => f.name === 'package.json' || f.name === '/package.json');
    if (hasPackageJson && !webcontainerRef.current) {
        boot();
    }
  }, [files]);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#0a0a0a]">
      {/* Top Preview Iframe */}
      <div className="flex-1 min-h-0 relative border-b border-gray-200 dark:border-[#27272a]">
        {url ? (
           <iframe src={url} className="w-full h-full border-none bg-white" title="WebContainer Preview" />
        ) : (
           <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
             {booting ? (
                <div className="flex flex-col items-center gap-4">
                  <LoaderIcon className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-sm">Iniciando WebContainer...</p>
                </div>
             ) : error ? (
                <div className="flex flex-col items-center gap-4 text-red-500 p-4 text-center">
                  <p className="font-bold">Erro ao iniciar WebContainer</p>
                  <p className="text-xs max-w-md">{error}</p>
                  <button onClick={boot} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Tentar Novamente</button>
                </div>
             ) : (
                <div className="flex flex-col items-center gap-4">
                  <svg className="w-12 h-12 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                  <p className="text-sm">O ambiente está pronto para iniciar.</p>
                  <button onClick={boot} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                     <TerminalIcon className="w-4 h-4" /> Boot WebContainer
                  </button>
                </div>
             )}
           </div>
        )}
      </div>
      
      {/* Bottom Terminal */}
      <div className="h-64 flex-shrink-0 bg-[#1e1e1e] flex flex-col pt-1">
        <div className="px-4 py-1 flex items-center justify-between text-xs text-gray-400 font-mono tracking-wider border-b border-[#333]">
           TERMINAL
        </div>
        <div className="flex-1 relative overflow-hidden">
          {webcontainerRef.current ? (
             <TerminalPane env={envVars} />
          ) : (
             <div className="h-full flex items-center justify-center text-gray-600 text-xs font-mono">Terminal Offline</div>
          )}
        </div>
      </div>
    </div>
  );
};
