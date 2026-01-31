
import React, { useEffect, useRef, useState } from 'react';
import { ProjectFile, Theme, ChatMode } from '../types';
import { createPlayground, type Playground } from 'livecodes';
import { GlobeIcon, ConsoleIcon, CloseIcon } from './Icons';

interface CodePreviewProps {
  files: ProjectFile[]; 
  onError: (errorMessage: string) => void;
  theme: Theme;
  envVars: Record<string, string>;
  deployedUrl?: string | undefined;
  onDeploy?: () => void;
  chatMode?: ChatMode; 
}

export const CodePreview: React.FC<CodePreviewProps> = ({ files, deployedUrl, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [playground, setPlayground] = useState<Playground | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent double initialization
    if (playground) return;

    createPlayground(containerRef.current, {
      params: {
        mode: 'result', // Show result (preview) by default
        theme: theme === 'dark' ? 'dark' : 'light',
        loading: 'eager',
        console: 'open',
      },
    }).then((pg) => {
        setPlayground(pg);
    });

    return () => {
        if (playground) {
            playground.destroy();
        }
    };
  }, []);

  // Update configuration when files change
  useEffect(() => {
    if (!playground || !files) return;

    const isReact = files.some(f => f.name.endsWith('.tsx') || f.name.endsWith('.jsx'));
    
    // Mapeamento dos arquivos para o formato do LiveCodes
    let markup = { language: 'html', content: '' };
    let style = { language: 'css', content: '' };
    let script = { language: 'javascript', content: '' };
    
    // Estratégia de prioridade para encontrar os arquivos principais
    const indexHtml = files.find(f => f.name === 'index.html' || f.name === '/index.html');
    const styleCss = files.find(f => f.name === 'style.css' || f.name === '/style.css' || f.name === 'styles.css');
    const scriptJs = files.find(f => f.name === 'script.js' || f.name === '/script.js' || f.name === 'main.js');

    if (indexHtml) markup.content = indexHtml.content;
    if (styleCss) style.content = styleCss.content;
    if (scriptJs) script.content = scriptJs.content;

    const config: any = {
        title: 'Preview',
        mode: 'result',
        theme: theme === 'dark' ? 'dark' : 'light',
        activeEditor: 'markup',
        markup,
        style,
        script
    };

    // Lógica Específica para React
    if (isReact) {
        config.template = 'react';
        
        // Tenta encontrar o ponto de entrada do React
        const entry = files.find(f => f.name === 'App.tsx' || f.name === 'App.jsx' || f.name === 'index.tsx');
        if (entry) {
            config.script = {
                language: 'typescript',
                content: entry.content
            };
        }
    } else {
        // Lógica para HTML/CSS/JS Puro (Estático)
        config.template = 'javascript'; 
        
        // Remove links de script/style do HTML para evitar carregamento duplicado ou 404
        // O LiveCodes injeta o conteúdo de 'style' e 'script' automaticamente
        if (markup.content) {
            // Backup do conteúdo original
            let cleanHtml = markup.content;
            
            // Se temos o conteúdo do CSS, removemos o link para ele no HTML para evitar erro 404
            if (style.content) {
                cleanHtml = cleanHtml.replace(/<link[^>]*href=["'](style\.css|styles\.css|\/style\.css)["'][^>]*>/gi, '');
            }
            
            // Se temos o conteúdo do JS, removemos a tag script para ele no HTML
            if (script.content) {
                cleanHtml = cleanHtml.replace(/<script[^>]*src=["'](script\.js|main\.js|\/script\.js)["'][^>]*><\/script>/gi, '');
            }
            
            config.markup.content = cleanHtml;
        }
    }

    playground.setConfig(config);

  }, [files, playground, theme]);

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

  return (
    <div className="w-full h-full relative bg-white dark:bg-[#1e1e1e] flex flex-col overflow-hidden">
        {/* Container for LiveCodes */}
        <div ref={containerRef} className="w-full h-full border-none block" />
    </div>
  );
};
