
import React, { useMemo } from 'react';
import { ProjectFile, Theme } from '../types';
import { SandpackProvider, SandpackLayout, SandpackPreview } from '@codesandbox/sandpack-react';

interface CodePreviewProps {
  files: ProjectFile[];
  onError: (errorMessage: string) => void;
  theme: Theme;
  envVars: Record<string, string>;
  onUrlChange?: (url: string) => void;
}

export const CodePreview: React.FC<CodePreviewProps> = ({ files, theme }) => {
  // Converte os arquivos para o formato do Sandpack, garantindo que os caminhos comecem com /
  const sandpackFiles = useMemo(() => {
    const fileMap: Record<string, string> = {};
    files.forEach(file => {
      const path = file.name.startsWith('/') ? file.name : `/${file.name}`;
      fileMap[path] = file.content;
    });
    return fileMap;
  }, [files]);

  // Detecta se é um projeto Vite/React ou Estático
  const projectType = useMemo(() => {
    const hasPackageJson = files.some(f => f.name.includes('package.json'));
    const hasTSX = files.some(f => f.name.endsWith('.tsx'));
    return (hasPackageJson || hasTSX) ? 'vite-react-ts' : 'static';
  }, [files]);

  if (files.length === 0) {
    return (
      <div className="w-full h-full bg-[#09090b] flex flex-col items-center justify-center text-gray-500 gap-4 animate-fadeIn">
        <div className="w-12 h-12 border-2 border-dashed border-gray-800 rounded-full animate-spin"></div>
        <p className="text-sm font-medium italic">Aguardando a IA gerar os arquivos...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#09090b] overflow-hidden">
      <SandpackProvider
        template={projectType}
        files={sandpackFiles}
        theme={theme === 'dark' ? 'dark' : 'light'}
        options={{
          recompileMode: "immediate",
          recompileDelay: 500,
          // Força o uso do index.html do usuário se existir no modo estático
          visibleFiles: files.map(f => f.name),
          initMode: "immediate",
          externalResources: ["https://cdn.tailwindcss.com"]
        }}
        customSetup={{
          // Se for Vite, garante que o entry point seja o gerado pela IA
          entry: projectType === 'vite-react-ts' ? "/src/main.tsx" : "/index.html",
        }}
      >
        <SandpackLayout style={{ height: '100%', borderRadius: 0, border: 'none', background: 'transparent' }}>
          <SandpackPreview 
            style={{ height: '100%', background: 'white' }} 
            showNavigator={false} 
            showRefreshButton={true}
            showOpenInCodeSandbox={false}
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
};
