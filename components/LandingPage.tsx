
import React, { useRef, useState, useEffect } from 'react';
import { AppLogo, SparklesIcon, TerminalIcon, GithubIcon, CheckCircleIcon, DatabaseIcon, SupabaseIcon, ChevronDownIcon, GlobeIcon, DownloadIcon, SunIcon, MoonIcon, LightningIcon } from './Icons';
import { Theme } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onShowPricing: () => void;
  onShowPrivacy: () => void;
  onShowTerms: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const CookieBanner = ({ onShowPrivacy }: { onShowPrivacy: () => void }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-center md:text-left">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-sans">
            Utilizamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossa <button onClick={onShowPrivacy} className="underline text-black dark:text-white hover:opacity-80 transition-opacity">Política de Privacidade</button>.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button 
            onClick={handleAccept}
            className="px-6 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wide hover:scale-105 transition-transform shadow-lg"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente de Marquee Infinito
const TechMarquee = () => {
    const techs = ['React', 'Vite', 'Tailwind', 'Supabase', 'Firebase', 'Stripe', 'OpenAI', 'Gemini', 'DeepSeek', 'Netlify', 'TypeScript', 'Postgres'];
    return (
        <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)] border-t border-b border-gray-100 dark:border-white/5 py-8 bg-gray-50/50 dark:bg-[#080808]/50 backdrop-blur-sm">
            <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll">
                {[...techs, ...techs].map((tech, idx) => (
                    <li key={idx} className="text-xl font-bold font-heading text-gray-400 dark:text-gray-600 uppercase tracking-widest whitespace-nowrap">
                        {tech}
                    </li>
                ))}
            </ul>
            <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll" aria-hidden="true">
                {[...techs, ...techs].map((tech, idx) => (
                    <li key={idx} className="text-xl font-bold font-heading text-gray-400 dark:text-gray-600 uppercase tracking-widest whitespace-nowrap">
                        {tech}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onShowPricing, onShowPrivacy, onShowTerms, theme, onThemeChange }) => {
  const featuresRef = useRef<HTMLElement>(null);

  const toggleTheme = () => {
    onThemeChange(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="h-screen w-full bg-white dark:bg-[#050505] text-gray-900 dark:text-white font-sans selection:bg-blue-500/30 overflow-y-auto overflow-x-hidden transition-colors duration-500 scroll-smooth custom-scrollbar">
      <style>{`
        @keyframes infinite-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-infinite-scroll {
          animation: infinite-scroll 25s linear infinite;
        }
        .aurora-bg {
            background: radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15), transparent 50%),
                        radial-gradient(circle at 0% 0%, rgba(168, 85, 247, 0.15), transparent 50%),
                        radial-gradient(circle at 100% 100%, rgba(236, 72, 153, 0.15), transparent 50%);
            filter: blur(60px);
        }
      `}</style>
      
      <CookieBanner onShowPrivacy={onShowPrivacy} />

      {/* Navbar Fixa com Blur */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-gray-100/50 dark:border-white/5 bg-white/70 dark:bg-[#050505]/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer group">
                <div className="bg-black dark:bg-white p-1.5 rounded-lg transition-transform group-hover:rotate-12">
                    <AppLogo className="w-5 h-5 text-white dark:text-black" />
                </div>
                <span className="font-bold text-lg tracking-tight font-heading">codegem</span>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500">
                    {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                </button>
                <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <button onClick={onShowPricing} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">Preços</button>
                    <button onClick={onLogin} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">Login</button>
                </div>
                <button 
                    onClick={onGetStarted}
                    className="px-5 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-blue-500/20"
                >
                    Começar
                </button>
            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Aurora Background */}
        <div className="absolute inset-0 aurora-bg animate-pulse pointer-events-none" style={{ animationDuration: '8s' }}></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-8 animate-fade-in shadow-sm">
                <SparklesIcon className="w-3 h-3" />
                Arquitetado para Velocidade
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 text-gray-900 dark:text-white font-heading animate-slide-up">
                Ideias em Software.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-shine bg-[length:200%_auto]">Instantaneamente.</span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                O Codegem Studio une IA generativa avançada com um ambiente de desenvolvimento completo no navegador. Sem setup. Apenas código.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <button 
                    onClick={onGetStarted}
                    className="h-12 px-8 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:scale-105 transition-transform shadow-xl shadow-blue-500/10 flex items-center gap-2 group"
                >
                    Criar Projeto Grátis
                    <ChevronDownIcon className="w-4 h-4 rotate-[-90deg] group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                    onClick={onLogin}
                    className="h-12 px-8 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors backdrop-blur-sm"
                >
                    Entrar na Conta
                </button>
            </div>
        </div>

        {/* Floating Mockup */}
        <div className="mt-20 max-w-6xl mx-auto relative group animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-1000"></div>
            <div className="relative bg-gray-50 dark:bg-[#0c0c0e] rounded-xl border border-gray-200 dark:border-[#27272a] shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                
                {/* Fake Browser Header */}
                <div className="h-10 bg-white dark:bg-[#121214] border-b border-gray-200 dark:border-[#27272a] flex items-center px-4 justify-between">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
                    </div>
                    <div className="px-3 py-1 bg-gray-100 dark:bg-[#09090b] rounded text-[10px] font-mono text-gray-400 flex items-center gap-2 border border-gray-200 dark:border-[#27272a]">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        codegem.studio/preview
                    </div>
                    <div className="w-10"></div>
                </div>

                {/* Mockup Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 h-[450px]">
                    {/* Code Side */}
                    <div className="hidden md:block bg-[#09090b] p-6 font-mono text-xs overflow-hidden border-r border-[#27272a]">
                        <div className="text-gray-500 mb-2">// Gerando Dashboard Financeiro...</div>
                        <div className="space-y-1">
                            <div className="flex"><span className="text-purple-400">import</span><span className="text-white ml-2">React</span><span className="text-purple-400 ml-2">from</span><span className="text-green-400 ml-2">'react'</span>;</div>
                            <div className="flex"><span className="text-purple-400">import</span><span className="text-white ml-2">{`{ Card, Chart }`}</span><span className="text-purple-400 ml-2">from</span><span className="text-green-400 ml-2">'@/components'</span>;</div>
                            <br/>
                            <div className="flex"><span className="text-blue-400">export default function</span><span className="text-yellow-300 ml-2">Dashboard</span>() {`{`}</div>
                            <div className="pl-4 flex"><span className="text-purple-400">return</span> (</div>
                            <div className="pl-8 flex"><span className="text-gray-500">&lt;</span><span className="text-red-400">div</span> <span className="text-blue-300">className</span>=<span className="text-green-400">"p-8 bg-zinc-950 min-h-screen"</span><span className="text-gray-500">&gt;</span></div>
                            <div className="pl-12 flex"><span className="text-gray-500">&lt;</span><span className="text-red-400">h1</span><span className="text-gray-500">&gt;</span><span className="text-white">Finance Overview</span><span className="text-gray-500">&lt;/</span><span className="text-red-400">h1</span><span className="text-gray-500">&gt;</span></div>
                            <div className="pl-12 flex"><span className="text-gray-500">&lt;</span><span className="text-yellow-300">Grid</span> <span className="text-blue-300">cols</span>=<span className="text-blue-400">{3}</span><span className="text-gray-500">&gt;</span></div>
                            <div className="pl-16 flex"><span className="text-gray-500">&lt;</span><span className="text-yellow-300">Card</span> <span className="text-blue-300">title</span>=<span className="text-green-400">"Receita"</span> <span className="text-blue-300">value</span>=<span className="text-green-400">"R$ 45k"</span> <span className="text-gray-500">/&gt;</span></div>
                            <div className="pl-16 flex relative">
                                <div className="absolute -left-4 top-0 w-full h-full bg-blue-500/20 blur-sm animate-pulse"></div>
                                <span className="text-gray-500">&lt;</span><span className="text-yellow-300">Card</span> <span className="text-blue-300">title</span>=<span className="text-green-400">"Gastos"</span> <span className="text-blue-300">value</span>=<span className="text-green-400">"R$ 12k"</span> <span className="text-gray-500">/&gt;</span>
                            </div>
                        </div>
                    </div>

                    {/* Preview Side */}
                    <div className="bg-gray-50 dark:bg-white/5 p-8 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <div className="w-full max-w-sm bg-white dark:bg-[#18181b] rounded-xl shadow-xl border border-gray-200 dark:border-[#27272a] p-5 space-y-4 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900 dark:text-white">Dashboard</h3>
                                <div className="w-8 h-8 bg-gray-100 dark:bg-white/10 rounded-full"></div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                    <div className="text-[10px] text-blue-500 uppercase font-bold">Total</div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">R$ 45k</div>
                                </div>
                                <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-900/30">
                                    <div className="text-[10px] text-purple-500 uppercase font-bold">Vendas</div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">+24%</div>
                                </div>
                            </div>
                            <div className="h-32 bg-gray-100 dark:bg-white/5 rounded-lg w-full relative overflow-hidden flex items-end justify-between px-2 pb-2 gap-1">
                                {[40, 70, 50, 90, 60, 80].map((h, i) => (
                                    <div key={i} className="w-full bg-gray-300 dark:bg-gray-600 rounded-sm hover:bg-blue-500 transition-colors" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>

      <TechMarquee />

      {/* Bento Grid Features */}
      <section ref={featuresRef} className="py-24 px-6 max-w-7xl mx-auto">
          <div className="mb-16 text-center">
              <h2 className="text-3xl md:text-5xl font-bold font-heading text-gray-900 dark:text-white mb-4">Poder de Estúdio.<br/><span className="text-gray-500">Simplicidade de Chat.</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
              
              {/* Card 1: AI Chat (Large) */}
              <div className="md:col-span-2 bg-gray-50 dark:bg-[#0c0c0e] rounded-3xl border border-gray-200 dark:border-[#27272a] p-8 relative overflow-hidden group hover:border-gray-300 dark:hover:border-white/20 transition-all">
                  <div className="relative z-10 max-w-md">
                      <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-blue-500/30">
                          <SparklesIcon className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Modelos de Elite</h3>
                      <p className="text-gray-500 dark:text-gray-400">Acesse GPT-4o, Claude 3.5 Sonnet, Gemini Pro e DeepSeek em uma única interface. Alternância inteligente para melhor código.</p>
                  </div>
                  <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-white dark:from-[#0c0c0e] to-transparent z-10"></div>
                  <div className="absolute right-[-50px] top-[50px] opacity-50 group-hover:opacity-80 transition-opacity duration-500">
                      <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] p-4 rounded-xl shadow-2xl rotate-[-6deg] w-[300px] space-y-3">
                          <div className="flex gap-2 items-center">
                              <div className="w-6 h-6 rounded-full bg-green-500/20"></div>
                              <div className="h-2 w-20 bg-gray-200 dark:bg-white/10 rounded"></div>
                          </div>
                          <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded"></div>
                          <div className="h-2 w-3/4 bg-gray-100 dark:bg-white/5 rounded"></div>
                      </div>
                      <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] p-4 rounded-xl shadow-2xl rotate-[3deg] w-[300px] space-y-3 mt-4 translate-x-10">
                          <div className="flex gap-2 items-center">
                              <div className="w-6 h-6 rounded-full bg-purple-500/20"></div>
                              <div className="h-2 w-20 bg-gray-200 dark:bg-white/10 rounded"></div>
                          </div>
                          <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded"></div>
                      </div>
                  </div>
              </div>

              {/* Card 2: Deploy */}
              <div className="bg-gray-50 dark:bg-[#0c0c0e] rounded-3xl border border-gray-200 dark:border-[#27272a] p-8 relative overflow-hidden group hover:border-gray-300 dark:hover:border-white/20 transition-all flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                  <div className="w-12 h-12 bg-black dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-black shadow-lg">
                      <GlobeIcon className="w-6 h-6" />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">1-Click Deploy</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Do localhost para uma URL global em segundos via Netlify.</p>
                  </div>
              </div>

              {/* Card 3: GitHub */}
              <div className="bg-gray-50 dark:bg-[#0c0c0e] rounded-3xl border border-gray-200 dark:border-[#27272a] p-8 relative overflow-hidden group hover:border-gray-300 dark:hover:border-white/20 transition-all flex flex-col justify-between">
                  <div className="w-12 h-12 bg-[#24292e] rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <GithubIcon className="w-6 h-6" />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sync Real</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Cada mudança é um commit. Mantenha seu histórico limpo e profissional.</p>
                  </div>
              </div>

              {/* Card 4: Preview (Large) */}
              <div className="md:col-span-2 bg-gray-50 dark:bg-[#0c0c0e] rounded-3xl border border-gray-200 dark:border-[#27272a] p-8 relative overflow-hidden group hover:border-gray-300 dark:hover:border-white/20 transition-all">
                  <div className="relative z-10 max-w-md">
                      <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-green-500/30">
                          <LightningIcon className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Preview ao Vivo</h3>
                      <p className="text-gray-500 dark:text-gray-400">WebContainers executam Node.js direto no seu navegador. É rápido, seguro e funciona offline.</p>
                  </div>
                  {/* Decorative Terminal */}
                  <div className="absolute right-8 top-8 bottom-8 w-[200px] md:w-[300px] bg-[#1e1e1e] rounded-lg border border-white/10 p-4 font-mono text-[10px] text-green-400 opacity-80 shadow-2xl hidden sm:block">
                      <div className="flex gap-1.5 mb-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                      </div>
                      <div>$ npm install</div>
                      <div className="text-white/50">added 142 packages in 2s</div>
                      <br/>
                      <div>$ npm run dev</div>
                      <div className="text-white/50">ready in 245ms</div>
                      <div className="text-white">➜  Local:   http://localhost:5173/</div>
                      <br/>
                      <div className="animate-pulse">_</div>
                  </div>
              </div>

          </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="border-t border-gray-100 dark:border-[#1f1f22] bg-white dark:bg-[#050505] py-12 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
                    <AppLogo className="w-6 h-6 text-black dark:text-white" />
                    <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-white font-heading">codegem studio</span>
                </div>
                <div className="flex gap-8 text-xs font-medium text-gray-500 uppercase tracking-widest">
                    <button onClick={onShowTerms} className="hover:text-black dark:hover:text-white transition-colors">Termos</button>
                    <button onClick={onShowPrivacy} className="hover:text-black dark:hover:text-white transition-colors">Privacidade</button>
                    <a href="mailto:support@codegen.studio" className="hover:text-black dark:hover:text-white transition-colors">Suporte</a>
                </div>
                <p className="text-gray-400 text-xs font-mono">© {new Date().getFullYear()} Inc.</p>
            </div>
      </footer>
    </div>
  );
};
