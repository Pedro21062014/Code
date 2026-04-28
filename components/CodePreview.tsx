
import React, { useEffect, useState, useRef } from 'react';
import { ProjectFile, Theme, ChatMode } from '../types';
import { GlobeIcon, TerminalIcon, RocketIcon } from './Icons';
import { getWebContainer, filesToWebContainerTree } from '../src/lib/webcontainer';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface CodePreviewProps {
  files: ProjectFile[]; 
  onError: (errorMessage: string) => void;
  theme: Theme;
  envVars: Record<string, string>;
  deployedUrl?: string | undefined;
  onDeploy?: () => void;
  chatMode?: ChatMode; 
  terminalCommands?: string[]; // Commands passed from the last AI message
}

export const CodePreview: React.FC<CodePreviewProps> = ({ files, onError, theme, deployedUrl, terminalCommands }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Initialize terminal and WebContainer
  useEffect(() => {
    if (!window.crossOriginIsolated) {
      setBootError("Browser is not cross-origin isolated. WebContainers require COOP/COEP headers. Please open this app in a new tab if it's inside an iframe.");
      setIsBooting(false);
      return;
    }

    if (!terminalRef.current) return;

    if (!xtermRef.current) {
      xtermRef.current = new Terminal({
        theme: {
          background: theme === 'dark' ? '#09090b' : '#ffffff',
          foreground: theme === 'dark' ? '#f4f4f5' : '#18181b',
        },
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        cursorBlink: true,
      });
      fitAddonRef.current = new FitAddon();
      xtermRef.current.loadAddon(fitAddonRef.current);
      xtermRef.current.open(terminalRef.current);
      fitAddonRef.current.fit();
    }

    const init = async () => {
      try {
        xtermRef.current?.writeln('\x1b[1;36m[WebContainer]\x1b[0m Booting environment...');
        const wc = await getWebContainer();
        xtermRef.current?.writeln('\x1b[1;32m[WebContainer]\x1b[0m Environment ready!');
        
        wc.on('server-ready', (port, url) => {
          xtermRef.current?.writeln(`\x1b[1;32m[Server]\x1b[0m Application is listening on port ${port} at ${url}`);
          setUrl(url);
        });

        // Setup terminal shell
        const shell = await wc.spawn('jsh');
        
        shell.output.pipeTo(new WritableStream({
          write(data) {
            xtermRef.current?.write(data);
          }
        }));

        xtermRef.current?.onData((data) => {
           shell.input.getWriter().write(data);
        });

      } catch (err: any) {
        setBootError(err.message || 'Error booting WebContainer');
      } finally {
        setIsBooting(false);
      }
    };

    init();

    const handleResize = () => {
      fitAddonRef.current?.fit();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Run once

  // Update theme dynamically
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = {
          background: theme === 'dark' ? '#09090b' : '#ffffff',
          foreground: theme === 'dark' ? '#f4f4f5' : '#18181b',
      };
    }
  }, [theme]);

  // Mount files
  useEffect(() => {
    const mountFiles = async () => {
      try {
        const wc = await getWebContainer();
        const tree = filesToWebContainerTree(files);
        await wc.mount(tree);
      } catch (err) {
        console.error("Failed to mount files:", err);
      }
    };
    if (!isBooting && window.crossOriginIsolated) {
      mountFiles();
    }
  }, [files, isBooting]);

  // Execute terminalCommands when they change
  useEffect(() => {
    if (terminalCommands && terminalCommands.length > 0 && !isBooting && window.crossOriginIsolated) {
      const runCommands = async () => {
        const wc = await getWebContainer();
        for (const cmd of terminalCommands) {
            const process = await wc.spawn("jsh", ["-c", cmd]);
            process.output.pipeTo(new WritableStream({
              write(data) {
                xtermRef.current?.write(data);
              }
            }));
            await process.exit;
        }
      };
      runCommands();
    }
  }, [terminalCommands, isBooting]);

  if (deployedUrl) {
    return (
      <div className="w-full h-full bg-white relative group flex flex-col">
          <iframe
              title="Live Preview"
              src={deployedUrl}
              className="flex-1 w-full border-none bg-white block"
          />
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-black/80 backdrop-blur text-white text-[10px] rounded-full font-medium border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <GlobeIcon className="w-3 h-3 text-green-400" />
              Live
          </div>
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="w-full h-full bg-white dark:bg-[#09090b] flex flex-col items-center justify-center p-8 text-center">
         <GlobeIcon className="w-12 h-12 text-red-500 mb-4" />
         <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">WebContainer Failed</h2>
         <p className="text-sm text-gray-500 max-w-md">{bootError}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-white dark:bg-[#09090b] flex flex-col overflow-hidden">
        {/* Preview Iframe */}
        <div className="flex-1 min-h-0 bg-white relative">
            {url ? (
              <iframe
                src={url}
                className="w-full h-full border-none"
                title="WebContainer Preview"
                allow="cross-origin-isolated"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                {isBooting ? (
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mb-4"></div>
                ) : (
                   <RocketIcon className="w-12 h-12 mb-4 opacity-50" />
                )}
                <p className="text-sm">{isBooting ? 'Inicializando ambiente...' : 'Nenhum servidor rodando.'}</p>
                {!isBooting && <p className="text-xs mt-2">Dica: Peça para a IA incluir "[\\"npm run dev\\"]" nos comandos de terminal.</p>}
              </div>
            )}
        </div>

        {/* Terminal Header */}
        <div className="h-8 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#18181b] flex items-center px-4 shrink-0">
          <TerminalIcon className="w-4 h-4 text-gray-500 mr-2" />
          <span className="text-xs font-medium text-gray-500">Terminal</span>
        </div>

        {/* Terminal Container */}
        <div className="h-48 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#09090b] relative shrink-0">
            <div ref={terminalRef} className="absolute inset-0 p-2" />
        </div>
    </div>
  );
};
