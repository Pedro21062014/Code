
import React, { useState, useEffect, useMemo } from 'react';
import { ProjectFile, Theme, ChatMode } from '../types';
import { 
    SandpackProvider, 
    SandpackLayout, 
    SandpackPreview, 
    SandpackConsole,
    useSandpack
} from "@codesandbox/sandpack-react";
import { GlobeIcon, ConsoleIcon, ChevronUpIcon, ChevronDownIcon, CloseIcon } from './Icons';

interface CodePreviewProps {
  files: ProjectFile[]; 
  onError: (errorMessage: string) => void;
  theme: Theme;
  envVars: Record<string, string>;
  deployedUrl?: string | undefined;
  onDeploy?: () => void;
  chatMode?: ChatMode; 
}

const FileSynchronizer = ({ files }: { files: Record<string, any> }) => {
    const { sandpack } = useSandpack();
    useEffect(() => {
        sandpack.updateFile(files);
    }, [files, sandpack]);
    return null;
};

export const CodePreview: React.FC<CodePreviewProps> = ({ files, deployedUrl, theme }) => {
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(true);

  // Detecção robusta se é um projeto React
  const isReactProject = useMemo(() => {
      return files.some(f => 
          f.name.endsWith('.tsx') || 
          f.name.endsWith('.jsx') || 
          (f.content.includes('import React') && !f.name.includes('modules'))
      );
  }, [files]);

  const sandpackFiles = useMemo(() => {
      const fileMap: Record<string, any> = {};
      
      files.forEach(file => {
          // Remove barra inicial se existir para o Sandpack (ex: /index.html -> index.html)
          const fileName = file.name.startsWith('/') ? file.name.slice(1) : file.name;
          fileMap[fileName] = { code: file.content };
      });

      // Lógica específica APENAS para projetos REACT
      if (isReactProject) {
          if (!fileMap['package.json']) {
              fileMap['package.json'] = {
                  code: JSON.stringify({
                      name: "react-project",
                      main: "/index.tsx",
                      dependencies: {
                          "react": "^18.2.0",
                          "react-dom": "^18.2.0",
                          "lucide-react": "latest",
                          "recharts": "latest",
                          "clsx": "latest",
                          "tailwind-merge": "latest",
                          "@supabase/supabase-js": "latest",
                          "framer-motion": "latest",
                          "date-fns": "latest",
                          "react-router-dom": "latest"
                      },
                      devDependencies: {
                          "@types/react": "^18.2.0",
                          "@types/react-dom": "^18.2.0",
                          "typescript": "^5.0.2",
                          "vite": "^4.4.5",
                          "@vitejs/plugin-react": "^4.0.3"
                      }
                  }, null, 2)
              };
          }

          if (!fileMap['index.html']) {
              fileMap['index.html'] = {
                  code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>`
              };
          }
          
          // Garante ponto de entrada React
          if (!fileMap['index.tsx'] && !fileMap['src/index.tsx'] && !fileMap['main.tsx']) {
              const rootFile = files.find(f => f.content.includes('createRoot') || f.content.includes('ReactDOM.render'));
              if (!rootFile) {
                  fileMap['index.tsx'] = {
                      code: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
                  };
              }
          }
      } 
      // Lógica para HTML/CSS/JS Puro (Estático)
      else {
          // Garante que existe um index.html, senão o Sandpack static falha
          if (!fileMap['index.html']) {
              fileMap['index.html'] = {
                  code: `<!DOCTYPE html><html><body><h1>Project Loaded</h1><p>Please create an index.html file.</p></body></html>`
              };
          }
      }

      return fileMap;
  }, [files, isReactProject]);

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
                Live
            </div>
        </div>
      );
  }

  // Se for React usa vite-react, se não usa static (que é perfeito para HTML/JS puro)
  const template = isReactProject ? "vite-react" : "static";

  return (
    <div className="w-full h-full bg-white relative flex flex-col overflow-hidden">
      <style>{`
          .sp-wrapper, .sp-layout, .sp-stack {
              height: 100% !important;
              width: 100% !important;
              display: flex !important;
              flex-direction: column !important;
          }
          .sp-preview {
              height: 100% !important;
              flex: 1 !important;
          }
          .sp-preview-container {
              height: 100% !important;
              display: flex !important;
              flex-direction: column !important;
              flex: 1 !important;
          }
          .sp-preview-iframe {
              height: 100% !important;
              flex-grow: 1 !important;
          }
          .sp-loading { display: none; }
      `}</style>
      
      <SandpackProvider 
        template={template}
        theme={theme === 'dark' ? 'dark' : 'light'}
        files={sandpackFiles}
        options={{
            externalResources: ["https://cdn.tailwindcss.com"],
            classes: {
                "sp-layout": "h-full w-full !border-none !rounded-none flex flex-col bg-white",
            },
            // Importante para projetos estáticos carregarem o index.html corretamente
            activeFile: "/index.html",
            visibleFiles: ["/index.html", "/style.css", "/script.js", "/App.tsx", "/App.css"]
        }}
      >
        <FileSynchronizer files={sandpackFiles} />
        
        <SandpackLayout style={{ height: '100%', width: '100%', border: 'none', borderRadius: 0, backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
            <SandpackPreview 
                showOpenInCodeSandbox={false} 
                showRefreshButton={true} 
                showRestartButton={true} 
                showNavigator={true}
                style={{ height: '100%', flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}
            />
            
            {isConsoleOpen && (
                <div className={`absolute bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#151515] border-t border-gray-200 dark:border-[#27272a] transition-all duration-300 flex flex-col ${isConsoleExpanded ? 'h-48' : 'h-9'}`}>
                    <div 
                        className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-[#18181b] border-b border-gray-200 dark:border-[#27272a] cursor-pointer select-none"
                        onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
                    >
                        <div className="flex items-center gap-2">
                            <ConsoleIcon className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Console</span>
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
                                className="p-1 hover:bg-gray-200 dark:hover:bg-[#27272a] rounded text-gray-500"
                            >
                                <CloseIcon className="w-3.5 h-3.5" />
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

      {!isConsoleOpen && (
          <button 
            onClick={() => { setIsConsoleOpen(true); setIsConsoleExpanded(true); }}
            className="absolute bottom-4 left-4 z-30 p-2 bg-black/80 hover:bg-black text-white rounded-full shadow-lg border border-white/10 transition-transform hover:scale-105"
            title="Abrir Console"
          >
              <ConsoleIcon className="w-4 h-4" />
          </button>
      )}
    </div>
  );
};
