import React, { useState } from 'react';
import { SparklesIcon, AppLogo, ChevronDownIcon, LinkedInIcon, XIcon, RedditIcon, PaperclipIcon, GithubIcon } from './Icons';

interface WelcomeScreenProps {
  onPromptSubmit: (prompt: string) => void;
  onShowPricing: () => void;
  onImportFromGithub: () => void;
}

const NavLink: React.FC<{ href?: string; onClick?: React.MouseEventHandler<HTMLAnchorElement>; children: React.ReactNode, hasDropdown?: boolean }> = ({ href, onClick, children, hasDropdown }) => (
  <a href={href} onClick={onClick} className="flex items-center text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">
    {children}
    {hasDropdown && <ChevronDownIcon />}
  </a>
);

const SocialIcon: React.FC<{ href: string, children: React.ReactNode }> = ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">{children}</a>
);

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPromptSubmit, onShowPricing, onImportFromGithub }) => {
  const [prompt, setPrompt] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim()) {
        onPromptSubmit(prompt.trim());
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0C10] text-gray-300 overflow-hidden font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AppLogo className="w-6 h-6 text-white" />
            <span className="text-white font-bold">codegen<span className="font-light">studio</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="#">Community</NavLink>
            <NavLink href="#">Enterprise</NavLink>
            <NavLink href="#" hasDropdown>Resources</NavLink>
            <NavLink href="#">Careers</NavLink>
            <NavLink onClick={(e) => { e.preventDefault(); onShowPricing(); }}>Pricing</NavLink>
          </nav>
          <div className="flex items-center gap-4">
             <SocialIcon href="https://www.linkedin.com/in/pedro-berbis-freire-3b71bb37a/"><LinkedInIcon /></SocialIcon>
             <SocialIcon href="#"><XIcon /></SocialIcon>
             <SocialIcon href="#"><RedditIcon /></SocialIcon>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-0">
        <div className="max-w-2xl w-full">
            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">What should we build today?</h1>
            <p className="mt-4 text-lg text-gray-400">Create stunning apps & websites by chatting with AI.</p>

            <div className="relative mt-8">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your idea and we'll build it together."
                    className="w-full h-36 p-4 pl-14 bg-[#1C1C1F] border border-gray-700/50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-200 placeholder-gray-500"
                />
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                    <button className="text-gray-400 hover:text-white"><PaperclipIcon /></button>
                    <button className="text-gray-400 hover:text-white"><SparklesIcon /></button>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
                <span className="text-gray-500">or import from</span>
                <button onClick={onImportFromGithub} className="flex items-center gap-2 px-3 py-1.5 bg-[#1C1C1F] border border-gray-700/50 rounded-full hover:bg-gray-800 transition-colors text-gray-300">
                    <GithubIcon />
                    <span>Github</span>
                </button>
            </div>
        </div>

        {/* Glowing Arc */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[300px] z-[-1] pointer-events-none">
             <div className="w-full h-full rounded-t-[100%] bg-transparent"
                  style={{
                    boxShadow: '0px -20px 100px 60px rgba(28, 78, 157, 0.3), 0px -5px 20px 0px rgba(135, 192, 255, 0.4) inset'
                  }}
             >
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/80 to-transparent absolute top-0"></div>
             </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full p-8 bg-black">
         <div className="container mx-auto flex flex-col md:flex-row justify-between items-start text-sm gap-8 md:gap-4">
            <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-2">
                    <AppLogo className="w-6 h-6 text-white" />
                    <span className="text-white font-bold">codegenstudio</span>
                </div>
                <div className="w-8 h-8 border-2 border-gray-600 rounded flex items-center justify-center">
                    <div className="w-4 h-4 border border-gray-600 rounded-sm"></div>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-8 sm:gap-16">
                <div>
                    <h3 className="font-semibold text-white mb-4">Resources</h3>
                    <ul className="space-y-2">
                        <li><a href="#" className="text-gray-400 hover:text-white flex items-center gap-1">Support <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M7 17L17 7M17 7H7M17 7V17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-white mb-4">Company</h3>
                     <ul className="space-y-2">
                        <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                        <li><a href="#" onClick={(e) => { e.preventDefault(); onShowPricing(); }} className="text-gray-400 hover:text-white">Pricing</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-white mb-4">Social</h3>
                     <ul className="space-y-2">
                        <li><a href="https://www.linkedin.com/in/pedro-berbis-freire-3b71bb37a/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white flex items-center gap-2"><LinkedInIcon /> LinkedIn</a></li>
                    </ul>
                </div>
            </div>
         </div>
      </footer>
    </div>
  );
};