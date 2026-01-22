
import React, { useState, useEffect } from 'react';
import { ProjectFile, Theme, ChatMode } from '../types';
import { 
    SandpackProvider, 
    SandpackLayout, 
    SandpackPreview, 
    SandpackConsole,
    useSandpack
} from "@codesandbox/sandpack-react";
import { LoaderIcon, GlobeIcon, ConsoleIcon, ChevronUpIcon, ChevronDownIcon, EraserIcon } from './Icons';

interface CodePreviewProps {
  files: ProjectFile[]; 
  onError: (errorMessage: string) => void;
  theme: Theme;
  envVars: Record<string, string>;
  deployedUrl?: string | undefined;
  onDeploy?: () => void;
  chatMode?: ChatMode; 
}

// Componente auxiliar para injetar arquivos dinamicamente
const FileSynchronizer = ({ files }: { files: ProjectFile[] }) => {
    const { sandpack } = useSandpack();
    
    useEffect(() => {
        const sandpackFiles = files.reduce((acc, file) => {
            // Remove leading slash if present
            const fileName = file.name.startsWith('/') ? file.name.slice(1) : file.name;
            acc[fileName] = { code: file.content, active: false };
            return acc;
        }, {} as Record<string, any>);
        
        sandpack.updateFile(sandpackFiles);
    }, [files, sandpack]);

    return null;
};

export const CodePreview: React.FC<CodePreviewProps> = ({ files, deployedUrl, theme, chatMode }) => {
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(true);

  // Prepara arquivos iniciais para o Sandpack
  const initialFiles = React.useMemo(() => {
      const fileMap: Record<string, any> = {};
      files.forEach(file => {
          const fileName = file.name.startsWith('/') ? file.name.slice(1) : file.name;
          fileMap[fileName] = { code: file.content };
      });
      return fileMap;
  }, []); // Apenas na montagem inicial, FileSynchronizer cuida das atualizações

  // Configuração de dependências padrão caso não existam no package.json
  const customSetup = {
      dependencies: {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "lucide-react": "latest",
          "clsx": "latest",
          "tailwind-merge": "latest",
          "@radix-ui/react-slot": "latest",
          "class-variance-authority": "latest"
      },
  };

  if (deployedUrl) {
      return (
        <div className="w-full h-full bg-white relative group">
            <iframe
                title="Live Preview"
                src={deployedUrl}
                className="w-full h-full border-none bg-white block"
            />
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-black/80 backdrop-blur text-white text-[10px] rounded-full font-medium border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <GlobeIcon className="w-3 h-3 text-green-400" />
                Live via Netlify
            </div>
        </div>
      );
  }

  return (
    <div className="w-full h-full bg-[#1e1e1e] relative flex flex-col overflow-hidden">
      <SandpackProvider 
        template="vite-react-ts"
        theme={theme === 'dark' ? 'dark' : 'light'}
        files={initialFiles}
        options={{
            externalResources: ["https://cdn.tailwindcss.com"],
            classes: {
                "sp-layout": "h-full !border-none",
                "sp-preview": "h-full !border-none bg-white",
                "sp-preview-iframe": "h-full",
            }
        }}
        customSetup={customSetup}
      >
        <FileSynchronizer files={files} />
        
        <SandpackLayout style={{ height: '100%', border: 'none', borderRadius: 0 }}>
            <SandpackPreview 
                showOpenInCodeSandbox={false} 
                showRefreshButton={true}
                showRestartButton={true}
                style={{ height: '100%' }}
            />
            
            {/* Console Integrado do Sandpack (Real Node/Browser Output) */}
            {isConsoleOpen && (
                <div 
                    className={`absolute bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#151515] border-t border-gray-200 dark:border-[#27272a] transition-all duration-300 flex flex-col ${isConsoleExpanded ? 'h-48' : 'h-9'}`}
                >
                    <div 
                        className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-[#18181b] border-b border-gray-200 dark:border-[#27272a] cursor-pointer select-none"
                        onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
                    >
                        <div className="flex items-center gap-2">
                            <ConsoleIcon className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">DevTools Console</span>
                        </div>
                        <div className="flex items-center gap-1">
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
                                <GlobeIcon className="w-3.5 h-3.5 rotate-45" /> {/* Close Icon fallback */}
                            </button>
                        </div>
                    </div>
                    {isConsoleExpanded && (
                        <div className="flex-1 overflow-auto bg-white dark:bg-[#0c0c0e]">
                            <SandpackConsole resetOnPreviewRestart />
                        </div>
                    )}
                </div>
            )}
        </SandpackLayout>
      </SandpackProvider>

      {/* Floating Toggle for Console */}
      {!isConsoleOpen && (
          <button 
            onClick={() => { setIsConsoleOpen(true); setIsConsoleExpanded(true); }}
            className="absolute bottom-4 left-4 z-30 p-2 bg-black/80 hover:bg-black text-white rounded-full shadow-lg border border-white/10 transition-transform hover:scale-105"
            title="Abrir Console de Desenvolvimento"
          >
              <ConsoleIcon className="w-4 h-4" />
          </button>
      )}
    </div>
  );
};
