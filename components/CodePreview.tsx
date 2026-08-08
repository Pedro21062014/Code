
import React, { useEffect, useState } from 'react';
import { ProjectFile, Theme, ChatMode } from '../types';
import { GlobeIcon } from './Icons';
import { SandpackProjectPreview } from './SandpackPreview';

interface CodePreviewProps {
  files: ProjectFile[]; 
  onError: (errorMessage: string) => void;
  theme: Theme;
  envVars: Record<string, string>;
  deployedUrl?: string | undefined;
  onDeploy?: () => void;
  chatMode?: ChatMode; 
  terminalCommands?: string[];
}

export const CodePreview: React.FC<CodePreviewProps> = ({ files, deployedUrl, theme }) => {
  const [srcDoc, setSrcDoc] = useState('');

  // Detecta se é um projeto React (usa Sandpack para preview correto)
  const isReactProject = React.useMemo(() => {
    if (!files) return false;
    return files.some(f =>
      (f.name && (f.name.endsWith('.tsx') || f.name.endsWith('.jsx'))) ||
      (f.name && (f.name.endsWith('.ts') || f.name.endsWith('.js')) && f.content && f.content.includes('React'))
    );
  }, [files]);

  // Detecta deploy "Codegen Studio" (URL da própria origem ?p=id) — 
  // abrir essa URL no iframe recriaria o editor inteiro dentro do preview.
  // Nesse caso, renderizamos o projeto via Sandpack em vez do iframe.
  const isCodegenEmbed = React.useMemo(() => {
    if (!deployedUrl) return false;
    try {
      const u = new URL(deployedUrl, window.location.origin);
      return u.origin === window.location.origin && u.searchParams.has('p');
    } catch (e) {
      return false;
    }
  }, [deployedUrl]);

  useEffect(() => {
    if (!files || files.length === 0) return;

    // 1. Find Entry Point (index.html)
    // Priority: Root index.html -> src/index.html -> Any html
    let indexHtml = files.find(f => f.name === 'index.html' || f.name === '/index.html');
    if (!indexHtml) indexHtml = files.find(f => f.name === 'src/index.html');
    if (!indexHtml) indexHtml = files.find(f => f.name.endsWith('.html'));
    
    if (!indexHtml) {
        setSrcDoc(`
            <html>
                <body style="color: #666; font-family: system-ui, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f9f9f9;">
                    <div style="font-weight: 500; font-size: 1.1rem; margin-bottom: 8px;">Nenhum arquivo index.html encontrado</div>
                    <div style="font-size: 0.9rem; color: #888;">Gere um projeto para ver o preview.</div>
                </body>
            </html>
        `);
        return;
    }

    let htmlContent = indexHtml.content;

    // 2. Inline CSS
    htmlContent = htmlContent.replace(/<link[^>]+href=["']([^"']+)["'][^>]*>/gi, (match, href) => {
        if (!match.toLowerCase().includes('stylesheet')) return match;
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
            return match;
        }

        const fileName = href.split('/').pop();
        const cssFile = files.find(f => f.name.endsWith(fileName as string));
        
        if (cssFile) {
            return `<style>\n${cssFile.content}\n</style>`;
        }
        return match;
    });

    // 3. Inline JS
    htmlContent = htmlContent.replace(/<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/gi, (match, src) => {
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
            return match;
        }

        const fileName = src.split('/').pop();
        const jsFile = files.find(f => f.name.endsWith(fileName as string));

        if (jsFile) {
            const isModule = match.includes('type="module"');
            return `<script${isModule ? ' type="module"' : ''}>\n${jsFile.content}\n</script>`;
        }
        return match;
    });

    setSrcDoc(htmlContent);

  }, [files]);

  // Deploy Codegen (self-embed) → renderiza via Sandpack para não criar
  // "editor dentro do editor".
  if (deployedUrl && isCodegenEmbed) {
      return <SandpackProjectPreview files={files} dark={theme === 'dark'} />;
  }

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

  // Projeto React (sem URL deployada) → renderiza via Sandpack, isolado
  if (isReactProject) {
      return <SandpackProjectPreview files={files} dark={theme === 'dark'} />;
  }

  return (
    <div className="w-full h-full relative bg-white dark:bg-[#09090b] flex flex-col overflow-hidden">
        <iframe
          srcDoc={srcDoc}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block', backgroundColor: '#ffffff' }}
          sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-downloads"
          title="Code Preview"
        />
    </div>
  );
};
