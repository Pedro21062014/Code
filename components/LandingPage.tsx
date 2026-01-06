
import React, { useRef, useState, useEffect } from 'react';
import { AppLogo, SparklesIcon, TerminalIcon, GithubIcon, CheckCircleIcon, DatabaseIcon, SupabaseIcon, ChevronDownIcon, GlobeIcon, DownloadIcon, SunIcon, MoonIcon } from './Icons';
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
      // Pequeno delay para não aparecer instantaneamente e ser intrusivo
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
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-white/90 dark:bg-[#121214]/90 backdrop-blur-xl border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
             <span className="text-xl">🍪</span>
             <h3 className="text-sm font-bold text-gray-900 dark:text-white">Este site usa cookies</h3>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Utilizamos cookies essenciais para garantir que você tenha a melhor experiência em nossa plataforma, lembrando suas preferências e configurações. Ao continuar, você concorda com nossa <button onClick={onShowPrivacy} className="underline text-black dark:text-white hover:opacity-80 transition-opacity">Política de Privacidade</button>.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0 w-full md:w-auto">
          <button 
            onClick={() => setIsVisible(false)}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            Agora não
          </button>
          <button 
            onClick={handleAccept}
            className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wide hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Aceitar Cookies
          </button>
        </div>
      </div>
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onShowPricing, onShowPrivacy, onShowTerms, theme, onThemeChange }) => {
  const featuresRef = useRef<HTMLElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleTheme = () => {
    onThemeChange(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="h-screen w-full bg-white dark:bg-[#050505] text-gray-900 dark:text-white overflow-y-auto overflow-x-hidden font-sans selection:bg-blue-500/30 custom-scrollbar scroll-smooth transition-colors duration-300">
      
      <CookieBanner onShowPrivacy={onShowPrivacy} />

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2 group cursor-pointer">
          <AppLogo className="w-8 h-8 text-gray-900 dark:text-white group-hover:scale-110 transition-transform duration-300" />
          <span className="font-bold text-lg tracking-tight">codegen<span className="font-light opacity-50">studio</span></span>
        </div>
        <div className="flex items-center gap-6">
            <button onClick={onShowPricing} className="text-sm font-medium text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors hidden sm:block">
                Preços
            </button>
            <button onClick={toggleTheme} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button onClick={onLogin} className="text-sm font-medium text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">
                Login
            </button>
            <button 
                onClick={onGetStarted}
                className="px-5 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all hover:scale-105"
            >
                Começar
            </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-20 pb-20 px-6 flex flex-col items-center text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-white/5 border border-blue-100 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-8">
            <SparklesIcon className="w-3 h-3" />
            Nova Geração de IA
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter leading-[0.95] mb-8 max-w-5xl mx-auto text-gray-900 dark:text-white">
          Construa software na <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-gray-900 dark:from-blue-400 dark:via-purple-400 dark:to-white animate-shine">velocidade do pensamento.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Codegen Studio é seu engenheiro de IA pessoal. Descreva sua ideia, veja o código ser gerado em tempo real e faça o deploy em segundos.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
                onClick={onGetStarted}
                className="px-8 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all transform hover:-translate-y-1 shadow-lg"
            >
                Criar Projeto Grátis
            </button>
            <button 
                onClick={onLogin}
                className="px-8 py-4 rounded-full bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] text-black dark:text-white font-bold text-sm uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-[#18181b] transition-all"
            >
                Acessar Conta
            </button>
        </div>

        {/* Interface Mockup */}
        <div className="mt-24 w-full max-w-6xl mx-auto relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-purple-500/20 rounded-xl blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
            <div className="relative bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#27272a] rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                {/* Mockup Header */}
                <div className="h-10 bg-gray-50 dark:bg-[#121214] border-b border-gray-200 dark:border-[#27272a] flex items-center px-4 justify-between">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#050505] rounded-md border border-gray-200 dark:border-[#27272a]">
                        <TerminalIcon className="w-3 h-3 text-gray-500" />
                        <span className="text-[10px] text-gray-600 dark:text-gray-400 font-mono">codegen-agent — active</span>
                    </div>
                    <div className="w-16"></div>
                </div>
                {/* Mockup Body */}
                <div className="grid grid-cols-1 md:grid-cols-2 h-[400px] md:h-[500px]">
                    <div className="border-r border-gray-200 dark:border-[#27272a] p-6 md:p-8 flex flex-col justify-end bg-gray-50 dark:bg-[#050505]">
                        <div className="space-y-4">
                            <div className="self-start bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 p-3 rounded-2xl rounded-tl-none border border-gray-200 dark:border-[#27272a] max-w-[80%] text-sm shadow-sm">
                                Olá! O que vamos construir hoje?
                            </div>
                            <div className="self-end bg-blue-50 dark:bg-blue-600/10 text-blue-700 dark:text-blue-200 p-3 rounded-2xl rounded-tr-none border border-blue-100 dark:border-blue-500/20 max-w-[80%] text-sm text-right">
                                Um dashboard de finanças com gráficos em tempo real.
                            </div>
                            <div className="self-start bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 p-3 rounded-2xl rounded-tl-none border border-gray-200 dark:border-[#27272a] max-w-[80%] text-sm flex items-center gap-2 shadow-sm">
                                <SparklesIcon className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-pulse" />
                                <span>Criando estrutura do projeto...</span>
                            </div>
                        </div>
                        <div className="mt-8 relative">
                            <div className="absolute inset-0 bg-blue-500/5 blur-xl"></div>
                            <div className="relative bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] rounded-xl p-3 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg"><SparklesIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
                                <div className="h-1.5 w-2/3 bg-gray-100 dark:bg-[#27272a] rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[60%] animate-[width_2s_ease-in-out_infinite]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block bg-white dark:bg-[#0a0a0a] p-8 relative overflow-hidden">
                        {/* Code snippet decoration */}
                        <div className="font-mono text-xs leading-relaxed opacity-80 dark:opacity-60">
                            <div className="flex"><span className="text-purple-600 dark:text-purple-400">import</span><span className="text-gray-900 dark:text-white ml-2">React</span><span className="text-purple-600 dark:text-purple-400 ml-2">from</span><span className="text-green-600 dark:text-green-400 ml-2">'react'</span>;</div>
                            <div className="flex mt-2"><span className="text-purple-600 dark:text-purple-400">export const</span><span className="text-yellow-600 dark:text-yellow-200 ml-2">Dashboard</span><span className="text-gray-900 dark:text-white ml-2">=</span><span className="text-gray-900 dark:text-white ml-2">()</span><span className="text-purple-600 dark:text-purple-400 ml-2">=&gt;</span><span className="text-gray-900 dark:text-white ml-2">{`{`}</span></div>
                            <div className="flex ml-4"><span className="text-purple-600 dark:text-purple-400">return</span><span className="text-gray-900 dark:text-white ml-2">(</span></div>
                            <div className="flex ml-8"><span className="text-gray-500">&lt;</span><span className="text-blue-600 dark:text-blue-300">div</span><span className="text-gray-600 dark:text-gray-300 ml-2">className</span>=<span className="text-green-600 dark:text-green-400">"p-6 bg-zinc-900"</span><span className="text-gray-500">&gt;</span></div>
                            <div className="flex ml-12"><span className="text-gray-500">&lt;</span><span className="text-blue-600 dark:text-blue-300">h1</span><span className="text-gray-500">&gt;</span><span className="text-gray-900 dark:text-white">Finance Overview</span><span className="text-gray-500">&lt;/</span><span className="text-blue-600 dark:text-blue-300">h1</span><span className="text-gray-500">&gt;</span></div>
                            <div className="flex ml-12"><span className="text-gray-500">&lt;</span><span className="text-yellow-600 dark:text-yellow-200">StatsCard</span><span className="text-gray-600 dark:text-gray-300 ml-2">value</span>=<span className="text-green-600 dark:text-green-400">"$42,000"</span><span className="text-gray-500">/&gt;</span></div>
                            <div className="flex ml-12"><span className="text-gray-500">&lt;</span><span className="text-yellow-600 dark:text-yellow-200">Chart</span><span className="text-gray-600 dark:text-gray-300 ml-2">data</span>=<span className="text-gray-900 dark:text-white">{`{data}`}</span><span className="text-gray-500">/&gt;</span></div>
                            <div className="flex ml-8"><span className="text-gray-500">&lt;/</span><span className="text-blue-600 dark:text-blue-300">div</span><span className="text-gray-500">&gt;</span></div>
                            <div className="flex ml-4"><span className="text-gray-900 dark:text-white">)</span></div>
                            <div className="flex"><span className="text-gray-900 dark:text-white">{`}`}</span></div>
                        </div>
                        {/* Overlay Card */}
                        <div className="absolute bottom-8 right-8 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] p-4 rounded-xl shadow-2xl flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                                <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">App Deployed</div>
                                <div className="text-[10px] text-gray-500">https://finance-dash.netlify.app</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Scroll Indicator */}
        <button 
            onClick={scrollToFeatures}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer p-2 hover:text-black dark:hover:text-white transition-colors"
        >
            <ChevronDownIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </button>

      </main>

      {/* Features Detail Section */}
      <section ref={featuresRef} className="py-32 px-6 relative z-10 border-t border-gray-200 dark:border-[#1f1f22] bg-gray-50 dark:bg-[#080808]">
          <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-semibold mb-16 text-center text-gray-900 dark:text-white">Tudo o que você precisa <br/> <span className="text-gray-500">para ir do zero ao deploy.</span></h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Feature 1 */}
                  <div className="p-8 rounded-3xl bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-[#1f1f22] hover:border-blue-500/30 transition-all group shadow-sm dark:shadow-none">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500 dark:text-blue-400">
                          <SparklesIcon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Modelos de IA Avançados</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          Acesse Gemini, GPT-4o e DeepSeek para gerar código complexo, corrigir bugs e refatorar em segundos.
                      </p>
                  </div>

                  {/* Feature 2 */}
                  <div className="p-8 rounded-3xl bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-[#1f1f22] hover:border-purple-500/30 transition-all group shadow-sm dark:shadow-none">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-500 dark:text-purple-400">
                          <TerminalIcon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Ambiente de Execução</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          Preview instantâneo com WebContainers. É como ter um VS Code rodando direto no seu navegador.
                      </p>
                  </div>

                  {/* Feature 3 */}
                  <div className="p-8 rounded-3xl bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-[#1f1f22] hover:border-gray-300 dark:hover:border-white/30 transition-all group shadow-sm dark:shadow-none">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-6 text-gray-700 dark:text-white">
                          <GithubIcon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Sincronização GitHub</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          Importe repositórios existentes ou faça push de novos projetos com um clique. Controle de versão simplificado.
                      </p>
                  </div>

                  {/* Feature 4 */}
                  <div className="p-8 rounded-3xl bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-[#1f1f22] hover:border-green-500/30 transition-all group shadow-sm dark:shadow-none">
                      <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-6 text-green-500 dark:text-green-400">
                          <SupabaseIcon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Backend Integrado</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          Conecte-se ao Supabase para banco de dados Postgres, autenticação e APIs em tempo real sem configurar servidores.
                      </p>
                  </div>

                  {/* Feature 5 */}
                  <div className="p-8 rounded-3xl bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-[#1f1f22] hover:border-pink-500/30 transition-all group shadow-sm dark:shadow-none">
                      <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center mb-6 text-pink-500 dark:text-pink-400">
                          <DownloadIcon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Exportação Flexível</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          Seus dados são seus. Baixe o código fonte completo como ZIP ou publique diretamente na web com um clique.
                      </p>
                  </div>

                   {/* Feature 6 */}
                   <div className="p-8 rounded-3xl bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-[#1f1f22] hover:border-yellow-500/30 transition-all group shadow-sm dark:shadow-none">
                      <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-6 text-yellow-500 dark:text-yellow-400">
                          <GlobeIcon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Deploy em 1-Clique</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          Do localhost para o mundo. Hospede seus projetos estáticos ou aplicações React instantaneamente.
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Tech Stack Banner */}
      <section className="py-10 border-t border-b border-gray-200 dark:border-[#1f1f22] bg-white dark:bg-[#050505] overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {['React', 'Vite', 'Tailwind', 'Supabase', 'Firebase', 'Stripe', 'OpenAI'].map((tech) => (
                  <span key={tech} className="text-xl font-bold font-mono text-gray-900 dark:text-white">{tech}</span>
              ))}
          </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-32 px-6 bg-gray-50 dark:bg-[#080808]">
          <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-semibold mb-6 text-gray-900 dark:text-white">Planos que escalam com você</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
                  Comece gratuitamente e faça upgrade quando precisar de mais poder de computação e recursos de equipe.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 text-left">
                  <div className="p-8 rounded-3xl border border-gray-200 dark:border-[#1f1f22] bg-white dark:bg-[#0c0c0e] shadow-sm dark:shadow-none">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Hobby</h3>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mt-4 mb-2">Grátis</div>
                      <p className="text-sm text-gray-500 mb-6">Para projetos pessoais e testes.</p>
                      <ul className="space-y-3 mb-8">
                          <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><CheckCircleIcon className="w-4 h-4 text-green-500"/> 300 créditos diários</li>
                          <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><CheckCircleIcon className="w-4 h-4 text-green-500"/> Acesso ao Editor</li>
                          <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><CheckCircleIcon className="w-4 h-4 text-green-500"/> Download ZIP</li>
                      </ul>
                  </div>
                  <div className="p-8 rounded-3xl border border-blue-500/20 bg-white dark:bg-[#0c0c0e] relative overflow-hidden shadow-lg dark:shadow-none">
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pro</h3>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mt-4 mb-2">$20<span className="text-sm text-gray-500 font-normal">/mês</span></div>
                      <p className="text-sm text-gray-500 mb-6">Para desenvolvedores sérios.</p>
                      <ul className="space-y-3 mb-8">
                          <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><CheckCircleIcon className="w-4 h-4 text-blue-500"/> Todos os modelos de IA</li>
                          <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><CheckCircleIcon className="w-4 h-4 text-blue-500"/> Sync GitHub Ilimitado</li>
                          <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><CheckCircleIcon className="w-4 h-4 text-blue-500"/> Suporte Prioritário</li>
                      </ul>
                  </div>
              </div>

              <button 
                  onClick={onShowPricing}
                  className="px-8 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all hover:scale-105"
              >
                  Ver Tabela Completa
              </button>
          </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-[#1f1f22] bg-white dark:bg-[#050505] py-12 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2 opacity-50">
                    <AppLogo className="w-6 h-6 text-black dark:text-white" />
                    <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-white">codegen studio</span>
                </div>
                <div className="flex gap-8 text-sm text-gray-500">
                    <button onClick={onShowTerms} className="hover:text-black dark:hover:text-white transition-colors">Termos</button>
                    <button onClick={onShowPrivacy} className="hover:text-black dark:hover:text-white transition-colors">Privacidade</button>
                    <a href="mailto:support@codegen.studio" className="hover:text-black dark:hover:text-white transition-colors">Contato</a>
                </div>
                <p className="text-gray-500 text-xs">© {new Date().getFullYear()} All rights reserved.</p>
            </div>
      </footer>
    </div>
  );
};
