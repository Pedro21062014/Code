import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, AppLogo, GithubIcon, LinkedInIcon } from './Icons';

interface WelcomeScreenProps {
  onPromptSubmit: (prompt: string) => void;
  onShowPricing: () => void;
  onImportFromGithub: () => void;
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

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPromptSubmit, onShowPricing, onImportFromGithub }) => {
  const [prompt, setPrompt] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  
  const promptIndex = useRef(0);
  const charIndex = useRef(0);
  const isDeleting = useRef(false);
  const timeoutRef = useRef<number | null>(null);

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

  return (
    <div className="flex flex-col h-screen w-screen bg-var-bg-default text-var-fg-default overflow-hidden font-sans">
      <header className="fixed top-0 left-0 right-0 z-10 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AppLogo className="w-6 h-6 text-var-accent" />
            <span className="text-var-fg-default font-semibold text-lg">codegen<span className="font-light">studio</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <NavLink onClick={(e) => { e.preventDefault(); onShowPricing(); }}>Preços</NavLink>
            <NavLink href="https://www.linkedin.com/in/pedro-berbis-freire-3b71bb37a/" target="_blank">LinkedIn</NavLink>
          </nav>
           <div className="flex items-center gap-4 md:hidden">
             <a href="https://www.linkedin.com/in/pedro-berbis-freire-3b71bb37a/" target="_blank" rel="noopener noreferrer" className="text-var-fg-muted hover:text-var-fg-default transition-colors">
                <LinkedInIcon />
             </a>
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
                    className="relative w-full h-28 p-4 bg-var-bg-subtle/80 backdrop-blur-sm border border-var-border-default rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-var-accent/50 text-var-fg-default placeholder-var-fg-subtle"
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
                <button onClick={onImportFromGithub} className="flex items-center gap-2 px-3 py-1.5 bg-var-bg-interactive border border-var-border-default rounded-full hover:bg-opacity-80 transition-all text-var-fg-muted hover:text-var-fg-default">
                    <GithubIcon />
                    <span>GitHub</span>
                </button>
            </div>
        </div>
      </main>
    </div>
  );
};