
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
  
  // 1. Normaliza arquivos e detecta o ponto de entrada correto
  const { sandpackFiles, entryFile } = useMemo(() => {
    const fileMap: Record<string, string> = {};
    let detectedEntry = "";

    // Normaliza caminhos (adiciona / no início se faltar)
    files.forEach(file => {
      const path = file.name.startsWith('/') ? file.name : `/${file.name}`;
      fileMap[path] = file.content;
    });

    // Lista de possíveis pontos de entrada em ordem de prioridade
    const entryCandidates = [
      '/src/main.tsx', 
      '/src/main.jsx', 
      '/src/index.tsx', 
      '/src/index.jsx',
      '/main.tsx',     // Caso a IA coloque na raiz incorretamente
      '/index.tsx'
    ];

    detectedEntry = entryCandidates.find(entry => fileMap[entry]) || "/src/main.tsx";

    // 2. Garante que existe um index.html apontando para o entry point correto
    if (!fileMap['/index.html']) {
      // Se não existir, cria um padrão
      fileMap['/index.html'] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${detectedEntry}"></script>
  </body>
</html>`;
    } else {
      // Se existir, verifica se precisamos injetar o script correto (caso a IA tenha esquecido ou errado)
      let htmlContent = fileMap['/index.html'];
      if (!htmlContent.includes(detectedEntry)) {
         // Tentativa simples de correção: se não tiver script module, injeta no final do body
         if (!htmlContent.includes('<script type="module"')) {
            htmlContent = htmlContent.replace('</body>', `<script type="module" src="${detectedEntry}"></script></body>`);
            fileMap['/index.html'] = htmlContent;
         }
      }
    }

    // 3. Fallback de segurança para package.json
    if (!fileMap['/package.json']) {
      fileMap['/package.json'] = JSON.stringify({
        name: "project",
        main: detectedEntry,
        dependencies: {
          "react": "^18.3.1",
          "react-dom": "^18.3.1",
          "lucide-react": "^0.344.0",
          "clsx": "^2.1.0",
          "tailwind-merge": "^2.2.1"
        }
      }, null, 2);
    }

    return { sandpackFiles: fileMap, entryFile: detectedEntry };
  }, [files]);

  // Detecta se é um projeto Vite/React ou Estático (para escolher o template base correto)
  const projectType = useMemo(() => {
    const hasTSX = files.some(f => f.name.endsWith('.tsx'));
    const hasJSX = files.some(f => f.name.endsWith('.jsx'));
    return (hasTSX || hasJSX) ? 'vite-react-ts' : 'static';
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
          recompileDelay: 300,
          // Define explicitamente os arquivos visíveis e ativos para forçar o contexto
          activeFile: entryFile,
          visibleFiles: files.map(f => f.name.startsWith('/') ? f.name : `/${f.name}`),
          initMode: "immediate",
          externalResources: ["https://cdn.tailwindcss.com"]
        }}
        customSetup={{
          entry: entryFile, // Força o ponto de entrada detectado
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
