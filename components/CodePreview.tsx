
import React from 'react';
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
  // O Sandpack exige que os caminhos dos arquivos comecem com '/'
  const sandpackFiles = files.reduce((acc, file) => {
    const path = file.name.startsWith('/') ? file.name : `/${file.name}`;
    acc[path] = file.content;
    return acc;
  }, {} as Record<string, string>);

  // Verifica se temos os arquivos essenciais para um projeto Vite
  const hasPackageJson = files.some(f => f.name === 'package.json');
  
  // Se não houver arquivos, mostramos um estado vazio amigável
  if (files.length === 0) {
    return (
      <div className="w-full h-full bg-[#09090b] flex items-center justify-center text-gray-500 text-sm italic">
        Aguardando geração de código para o preview...
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#09090b] overflow-hidden">
      <SandpackProvider
        // Usamos 'node' como ambiente para rodar o Vite real gerado pela IA
        template="vite-react-ts"
        files={sandpackFiles}
        theme={theme === 'dark' ? 'dark' : 'light'}
        options={{
          recompileMode: "immediate",
          recompileDelay: 300,
          // Garante que o Tailwind via CDN funcione se a IA não configurar o PostCSS completo
          externalResources: ["https://cdn.tailwindcss.com"],
          initMode: "immediate",
        }}
        customSetup={{
          environment: "node",
          // Definimos o ponto de entrada explicitamente conforme o system prompt do Gemini
          entry: "/src/main.tsx",
        }}
      >
        <SandpackLayout style={{ height: '100%', borderRadius: 0, border: 'none' }}>
          <SandpackPreview 
            style={{ height: '100%' }} 
            showNavigator={false} 
            showRefreshButton={true}
            showOpenInCodeSandbox={false}
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
};
