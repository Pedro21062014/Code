
import React, { useEffect, useRef, useState } from 'react';
import { ProjectFile, Theme } from '../types';
import { createPlayground, LiveCodes } from 'livecodes';

interface CodePreviewProps {
  files: ProjectFile[];
  onError: (errorMessage: string) => void;
  theme: Theme;
  envVars: Record<string, string>;
  onUrlChange?: (url: string) => void;
}

export const CodePreview: React.FC<CodePreviewProps> = ({ files, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playgroundRef = useRef<LiveCodes | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Efeito de Inicialização
  useEffect(() => {
    if (!containerRef.current || playgroundRef.current) return;

    const initPlayground = async () => {
        try {
            const playground = await createPlayground(containerRef.current!, {
                params: {
                    loading: 'eager',
                    view: 'result', // Mostra apenas o resultado por padrão
                    mode: 'result', // Modo focado no preview
                },
            });
            playgroundRef.current = playground;
            setIsReady(true);
        } catch (err) {
            console.error("Falha ao carregar LiveCodes:", err);
        }
    };

    initPlayground();

    return () => {
        if (playgroundRef.current) {
            playgroundRef.current.destroy();
            playgroundRef.current = null;
        }
    };
  }, []);

  // Efeito de Atualização de Arquivos e Tema
  useEffect(() => {
    if (!playgroundRef.current || !isReady || files.length === 0) return;

    const updatePlayground = async () => {
        const formattedFiles: Record<string, { content: string }> = {};
        
        // Mapeia os arquivos para o formato do LiveCodes
        files.forEach(file => {
            // Remove a barra inicial se existir (LiveCodes prefere caminhos relativos na raiz)
            const path = file.name.startsWith('/') ? file.name.slice(1) : file.name;
            formattedFiles[path] = { content: file.content };
        });

        // Configuração para suportar projetos React/Vite gerados pela IA
        await playgroundRef.current?.setConfig({
            mode: "result",
            template: "react", // Usa o template React como base
            theme: theme,
            files: formattedFiles,
            settings: {
                fontFamily: 'Inter',
                ...((Object.keys(formattedFiles).length > 0) ? {} : {
                    // Configurações básicas se não houver arquivos
                })
            }
        });
    };

    updatePlayground();
  }, [files, theme, isReady]);

  if (files.length === 0) {
    return (
      <div className="w-full h-full bg-[#09090b] flex flex-col items-center justify-center text-gray-500 gap-4 animate-fadeIn">
        <div className="w-12 h-12 border-2 border-dashed border-gray-800 rounded-full animate-spin"></div>
        <p className="text-sm font-medium italic">Aguardando a IA gerar os arquivos...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#09090b] overflow-hidden relative group">
        <div id="livecodes-container" ref={containerRef} className="w-full h-full border-none" />
        
        {/* Loading Overlay discreto enquanto o LiveCodes processa */}
        {!isReady && (
            <div className="absolute inset-0 bg-[#09090b] flex items-center justify-center z-10">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )}
    </div>
  );
};
