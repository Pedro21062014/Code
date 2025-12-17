
import React, { useState, useEffect, useRef } from 'react';
import { ProjectFile, Theme } from '../types';
import { WebContainer } from '@webcontainer/api';

interface CodePreviewProps {
  files: ProjectFile[];
  onError: (errorMessage: string) => void;
  theme: Theme;
  envVars: Record<string, string>;
  onUrlChange?: (url: string) => void;
}

// Cache global da promessa de boot para garantir instância única
let webcontainerPromise: Promise<WebContainer> | null = null;

/**
 * Converte a lista plana de arquivos em uma estrutura de árvore para o WebContainer.
 */
function mapFilesToTree(files: ProjectFile[]): any {
  const tree: any = {};
  files.forEach((file) => {
    const parts = file.name.split('/');
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = {
          file: {
            contents: file.content,
          },
        };
      } else {
        if (!current[part]) {
          current[part] = {
            directory: {},
          };
        }
        current = current[part].directory;
      }
    }
  });
  return tree;
}

export const CodePreview: React.FC<CodePreviewProps> = ({ files, onError, theme, envVars, onUrlChange }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'booting' | 'installing' | 'starting' | 'ready' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const webcontainerInstance = useRef<WebContainer | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const addLog = (msg: string) => setLogs((prev) => [...prev.slice(-100), msg]);

  useEffect(() => {
    let mounted = true;

    async function initWebContainer() {
      try {
        setStatus('booting');
        addLog('Iniciando WebContainer...');
        
        // Singleton pattern: boot() apenas se não houver promessa ativa
        if (!webcontainerPromise) {
          webcontainerPromise = WebContainer.boot();
        }
        
        const instance = await webcontainerPromise;
        webcontainerInstance.current = instance;

        if (!mounted) return;

        addLog('Montando arquivos...');
        const tree = mapFilesToTree(files);
        await instance.mount(tree);

        addLog('Executando npm install...');
        setStatus('installing');
        const installProcess = await instance.spawn('npm', ['install']);
        
        installProcess.output.pipeTo(new WritableStream({
          write(data) { addLog(data); }
        }));

        const installCode = await installProcess.exit;
        if (installCode !== 0) throw new Error('Falha no npm install');

        addLog('Iniciando servidor de desenvolvimento...');
        setStatus('starting');
        
        const devProcess = await instance.spawn('npm', ['run', 'dev', '--', '--host']);
        devProcess.output.pipeTo(new WritableStream({
          write(data) { addLog(data); }
        }));

        instance.on('server-ready', (port: number, serverUrl: string) => {
          if (mounted) {
            setUrl(serverUrl);
            setStatus('ready');
            onUrlChange?.(serverUrl);
            addLog(`Servidor pronto em ${serverUrl}`);
          }
        });

      } catch (err: any) {
        if (mounted) {
          setStatus('error');
          addLog(`Erro: ${err.message}`);
          onError(err.message);
        }
      }
    }

    initWebContainer();

    return () => {
      mounted = false;
    };
  }, []);

  // Sincronizar mudanças de arquivos após o boot inicial
  useEffect(() => {
    if (status === 'ready' && webcontainerInstance.current) {
      const tree = mapFilesToTree(files);
      webcontainerInstance.current.mount(tree).catch((e: Error) => console.error("Erro ao remontar arquivos:", e));
    }
  }, [files, status]);

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#09090b] text-red-400 p-8 text-center">
        <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-bold mb-2">Falha no Preview</h3>
        <p className="text-sm opacity-70 mb-4 max-w-md">O WebContainer encontrou um erro ao iniciar seu projeto.</p>
        <div className="w-full max-w-xl bg-black/40 rounded p-4 text-left font-mono text-[10px] overflow-auto max-h-48 whitespace-pre-wrap border border-red-900/30">
          {logs.join('\n')}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#09090b]">
      {status !== 'ready' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#09090b] text-gray-400">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-medium animate-pulse">
            {status === 'booting' && 'Iniciando WebContainer...'}
            {status === 'installing' && 'Instalando dependências...'}
            {status === 'starting' && 'Iniciando Vite...'}
          </p>
          <div className="mt-8 w-full max-w-2xl px-8">
             <div className="bg-black/40 rounded-lg border border-[#27272a] p-4 font-mono text-[10px] overflow-hidden">
                <div className="flex items-center gap-2 mb-2 text-gray-500 border-b border-[#27272a] pb-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                    <span className="ml-2 uppercase text-[8px] tracking-widest">Build Terminal</span>
                </div>
                <div className="max-h-32 overflow-y-auto">
                    {logs.map((log, i) => <div key={i} className="mb-0.5">{log}</div>)}
                </div>
             </div>
          </div>
        </div>
      )}

      {url && (
        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full border-0"
          title="WebContainer Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      )}
    </div>
  );
};
