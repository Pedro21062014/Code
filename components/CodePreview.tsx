
import React from 'react';
import { ProjectFile, Theme, ChatMode } from '../types';
import { 
    SandpackProvider, 
    SandpackLayout, 
    SandpackPreview,
    SandpackConsole,
    useSandpack
} from "@codesandbox/sandpack-react";
import { GlobeIcon, ConsoleIcon, ChevronUpIcon, ChevronDownIcon } from './Icons';

interface CodePreviewProps {
  files: ProjectFile[]; 
  onError: (errorMessage: string) => void;
  theme: Theme;
  envVars: Record<string, string>;
  deployedUrl?: string | undefined;
  onDeploy?: () => void;
  chatMode?: ChatMode;
  standalone?: boolean; // New prop to decide if it needs a Provider
}

// Componente interno que renderiza o Preview
const PreviewContent: React.FC<{ deployedUrl?: string, theme: Theme }> = ({ deployedUrl, theme }) => {
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
        <SandpackLayout style={{ height: '100%', border: 'none', borderRadius: 0 }}>
            <SandpackPreview 
                showOpenInCodeSandbox={false} 
                showRefreshButton={true}
                showRestartButton={true}
                style={{ height: '100%' }}
            />
        </SandpackLayout>
    );
};

export const CodePreview: React.FC<CodePreviewProps> = ({ files, deployedUrl, theme, standalone = false }) => {
  
  // Setup de dependências padrão
  const customSetup = {
      dependencies: {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "lucide-react": "latest",
          "clsx": "latest",
          "tailwind-merge": "latest",
          "@radix-ui/react-slot": "latest",
          "class-variance-authority": "latest",
          "react-router-dom": "latest"
      },
  };

  // Prepara arquivos iniciais
  const initialFiles = React.useMemo(() => {
      const fileMap: Record<string, any> = {};
      files.forEach(file => {
          const fileName = file.name.startsWith('/') ? file.name.slice(1) : file.name;
          fileMap[fileName] = { code: file.content };
      });
      return fileMap;
  }, [files]);

  if (standalone) {
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
                }
            }}
            customSetup={customSetup}
          >
            <PreviewContent deployedUrl={deployedUrl} theme={theme} />
          </SandpackProvider>
        </div>
      );
  }

  // Se não for standalone, assume que já está dentro de um Provider (gerenciado pelo EditorView)
  return <PreviewContent deployedUrl={deployedUrl} theme={theme} />;
};
