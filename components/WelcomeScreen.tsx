import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, AppLogo, GithubIcon, LinkedInIcon, FolderIcon, LogOutIcon } from './Icons';
import type { Session } from '@supabase/supabase-js';
import { ProjectFile } from '../types';

interface WelcomeScreenProps {
  onPromptSubmit: (prompt: string) => void;
  onShowPricing: () => void;
  onShowProjects: () => void;
  onOpenGithubImport: () => void;
  onFolderImport: (files: ProjectFile[]) => void;
  session: Session | null;
  onLoginClick: () => void;
  onNewProject: () => void;
  onLogout: () => void;
}

const getFileLanguage = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'js': return 'javascript';
        case 'ts': return 'typescript';
        case 'tsx': return 'typescript';
        case 'html': return 'html';
        case 'css': return 'css';
        case 'json': return 'json';
        case 'md': return 'markdown';
        case 'py': return 'python';
        case 'rb': return 'ruby';
        case 'go': return 'go';
        case 'rs': return 'rust';
        case 'java': return 'java';
        case 'cs': return 'csharp';
        case 'php': return 'php';
        case 'sh': return 'shell';
        case 'yml':
        case 'yaml': return 'yaml';
        case 'dockerfile': return 'dockerfile';
        case 'sql': return 'sql';
        case 'graphql': return 'graphql';
        case 'vue': return 'vue';
        case 'svelte': return 'svelte';
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
        case 'webp':
            return 'image';
        default: return 'plaintext';
    }
}

// FIX: Updated component to accept all standard anchor tag props except `className`, allowing `target` to be used.
const NavLink: React.FC<Omit<React.ComponentProps<'a'>, 'className'>> = ({ children, ...props }) => (
  <a {...props} className="text-sm font-medium text-var-fg-muted hover:text-var-fg-default transition-colors cursor-pointer">
    {children}
  </a>
);

const examplePrompts = [
    "um clone do Trello com autenticação Supabase...",
    "um site de portfólio para um fotógrafo...",
    "um app de lista de tarefas com React e Tailwind CSS...",
    "uma landing page para um app de delivery...",
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPromptSubmit, onShowPricing, onShowProjects, onOpenGithubImport, onFolderImport, session, onLoginClick, onNewProject, onLogout }) => {
  const [prompt, setPrompt] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  
  const promptIndex = useRef(0);
  const charIndex = useRef(0);
  const isDeleting = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const type = () => {
      const currentPrompt = examplePrompts[promptIndex.current];
      let newPlaceholder = '';
      let nextTimeout = 120; // Default typing speed

      if (isDeleting.current) {
        // Deleting
        newPlaceholder = currentPrompt.substring(0, charIndex.current - 1);
        charIndex.current--;
        nextTimeout = 75; // Faster deleting speed

        if (charIndex.current === 0) {
          isDeleting.current = false;
          promptIndex.current = (promptIndex.current + 1) % examplePrompts.length;
          nextTimeout = 500; // Pause before typing next prompt
        }
      } else {
        // Typing
        newPlaceholder = currentPrompt.substring(0, charIndex.current + 1);
        charIndex.current++;

        if (charIndex.current === currentPrompt.length) {
          isDeleting.current = true;
          nextTimeout = 2000; // Pause after typing is complete
        }
      }
      
      setPlaceholder(newPlaceholder);
      timeoutRef.current = window.setTimeout(type, nextTimeout);
    };

    timeoutRef.current = window.setTimeout(type, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim()) {
        onPromptSubmit(prompt.trim());
      }
    }
  };

    const handleFolderSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (!selectedFiles || selectedFiles.length === 0) {
            return;
        }

        // FIX: Explicitly type `file` as `File` to resolve errors where its properties were being accessed on an `unknown` type.
        const filePromises = Array.from(selectedFiles).map((file: File) => {
            return new Promise<ProjectFile | null>((resolve, reject) => {
                const reader = new FileReader();
                const isImage = file.type.startsWith('image/');
                
                if (file.size > 2 * 1024 * 1024) { // 2MB limit per file
                    console.warn(`Skipping file ${file.name} as it is too large.`);
                    resolve(null);
                    return;
                }

                reader.onload = () => {
                    try {
                        let content: string;
                        if (isImage) {
                            const dataUrl = reader.result as string;
                            content = dataUrl.substring(dataUrl.indexOf(',') + 1);
                        } else {
                            content = reader.result as string;
                        }

                        resolve({
                            // FIX: Cast `file` to `any` to access the non-standard `webkitRelativePath` property.
                            name: (file as any).webkitRelativePath,
                            language: getFileLanguage(file.name),
                            content: content,
                        });
                    } catch (e) {
                        reject(e);
                    }
                };

                reader.onerror = reject;

                if (isImage) {
                    reader.readAsDataURL(file);
                } else {
                    reader.readAsText(file);
                }
            });
        });

        try {
            const results = await Promise.all(filePromises);
            const projectFiles = results.filter((f): f is ProjectFile => f !== null);
            if (projectFiles.length > 0) {
                onFolderImport(projectFiles);
            } else {
                alert("Nenhum arquivo válido foi encontrado na pasta selecionada ou os arquivos eram muito grandes.");
            }
        } catch (error) {
            console.error("Failed to import folder:", error);
            alert("Ocorreu um erro ao importar a pasta. Verifique o console para mais detalhes.");
        } finally {
            if (folderInputRef.current) {
                folderInputRef.current.value = "";
            }
        }
    };

  return (
    <div className="flex flex-col h-screen w-screen bg-var-bg-default text-var-fg-default overflow-hidden font-sans">
      <header className="fixed top-0 left-0 right-0 z-10 p-4 bg-var-bg-default/80 backdrop-blur-sm border-b border-var-border-subtle">
        <div className="container mx-auto flex justify-between items-center">
          <button onClick={onNewProject} className="flex items-center gap-2">
            <AppLogo className="w-6 h-6 text-var-accent" />
            <span className="text-var-fg-default font-semibold text-lg">codegen<span className="font-light">studio</span></span>
          </button>
          <nav className="hidden md:flex items-center gap-6">
            <NavLink onClick={(e) => { e.preventDefault(); onShowProjects(); }}>Projetos</NavLink>
            <NavLink onClick={(e) => { e.preventDefault(); onShowPricing(); }}>Preços</NavLink>
            <NavLink href="https://www.linkedin.com/in/pedro-berbis-freire-3b71bb37a/" target="_blank">LinkedIn</NavLink>
            {session ? (
                 <button onClick={onLogout} className="px-3 py-1.5 text-sm bg-var-bg-interactive text-var-fg-muted rounded-md hover:bg-var-bg-default transition-colors font-medium">
                    Sair
                </button>
            ) : (
                 <button onClick={onLoginClick} className="px-3 py-1.5 text-sm bg-var-accent text-var-accent-fg rounded-md hover:opacity-90 transition-opacity font-semibold">
                    Login
                </button>
            )}
          </nav>
           <div className="flex items-center gap-4 md:hidden">
             {!session ? (
                 <button onClick={onLoginClick} className="px-3 py-1.5 text-sm bg-var-accent text-var-accent-fg rounded-md hover:opacity-90 transition-opacity font-semibold">
                    Login
                </button>
             ) : (
                <>
                    <a href="https://www.linkedin.com/in/pedro-berbis-freire-3b71bb37a/" target="_blank" rel="noopener noreferrer" className="text-var-fg-muted hover:text-var-fg-default transition-colors">
                        <LinkedInIcon />
                    </a>
                    <button onClick={onLogout} className="p-1 rounded-md text-var-fg-muted hover:text-var-fg-default transition-colors">
                        <LogOutIcon />
                    </button>
                </>
             )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-0 animate-fadeIn">
        <div className="absolute inset-0 z-[-1] overflow-hidden">
            <div className="absolute top-1/2 left-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] -translate-x-1/2 -translate-y-1/2 bg-var-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        </div>
        
        <div className="max-w-3xl w-full animate-slideInUp" style={{ animationDelay: '100ms' }}>
            <h1 className="text-4xl md:text-6xl font-bold text-var-fg-default tracking-tight">
                Bem vindo
            </h1>
            <p className="mt-4 text-lg text-var-fg-muted">
                Crie seu novo projeto agora mesmo!
            </p>

            <div className="relative mt-8 group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-var-accent to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="relative w-full h-28 p-4 bg-var-bg-subtle border border-var-border-default rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-var-accent/50 text-var-fg-default placeholder-var-fg-subtle"
                />
                 <button 
                    onClick={() => onPromptSubmit(prompt.trim())}
                    disabled={!prompt.trim()}
                    className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-var-accent text-var-accent-fg rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                    <SparklesIcon />
                    <span>Gerar</span>
                </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
                <span className="text-var-fg-muted">ou importe de</span>
                <button onClick={onOpenGithubImport} className="flex items-center gap-2 px-3 py-1.5 bg-var-bg-interactive border border-var-border-default rounded-full hover:bg-opacity-80 transition-all text-var-fg-muted hover:text-var-fg-default">
                    <GithubIcon />
                    <span>GitHub</span>
                </button>
                 <input type="file" ref={folderInputRef} onChange={handleFolderSelect} multiple style={{ display: 'none' }} {...{ webkitdirectory: "true", directory: "true" }} />
                <button onClick={() => folderInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 bg-var-bg-interactive border border-var-border-default rounded-full hover:bg-opacity-80 transition-all text-var-fg-muted hover:text-var-fg-default">
                    <FolderIcon />
                    <span>Pasta Local</span>
                </button>
            </div>
        </div>
      </main>
    </div>
  );
};