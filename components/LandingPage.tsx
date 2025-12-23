
import React from 'react';
import { AppLogo, SparklesIcon, TerminalIcon, GithubIcon, CheckCircleIcon } from './Icons';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans selection:bg-blue-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2 group cursor-pointer">
          <AppLogo className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
          <span className="font-bold text-lg tracking-tight">codegen<span className="font-light text-white/50">studio</span></span>
        </div>
        <div className="flex items-center gap-6">
            <button onClick={onLogin} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                Login
            </button>
            <button 
                onClick={onGetStarted}
                className="px-5 py-2 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all hover:scale-105"
            >
                Começar
            </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-20 pb-32 px-6 flex flex-col items-center text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-8 animate-fadeIn">
            <SparklesIcon className="w-3 h-3" />
            Nova Geração de IA
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter leading-[0.95] mb-8 max-w-5xl mx-auto animate-slideInUp">
          Construa software na <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-white animate-shine">velocidade do pensamento.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slideInUp" style={{ animationDelay: '100ms' }}>
          Codegen Studio é seu engenheiro de IA pessoal. Descreva sua ideia, veja o código ser gerado em tempo real e faça o deploy em segundos.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-slideInUp" style={{ animationDelay: '200ms' }}>
            <button 
                onClick={onGetStarted}
                className="px-8 py-4 rounded-full bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-blue-50 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all transform hover:-translate-y-1"
            >
                Criar Projeto Grátis
            </button>
            <button 
                onClick={onLogin}
                className="px-8 py-4 rounded-full bg-[#121214] border border-[#27272a] text-white font-bold text-sm uppercase tracking-widest hover:bg-[#18181b] hover:border-white/20 transition-all"
            >
                Acessar Conta
            </button>
        </div>

        {/* Interface Mockup */}
        <div className="mt-24 w-full max-w-6xl mx-auto relative group animate-slideInUp" style={{ animationDelay: '300ms' }}>
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-purple-500/20 rounded-xl blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
            <div className="relative bg-[#0a0a0a] border border-[#27272a] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                {/* Mockup Header */}
                <div className="h-10 bg-[#121214] border-b border-[#27272a] flex items-center px-4 justify-between">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#050505] rounded-md border border-[#27272a]">
                        <TerminalIcon className="w-3 h-3 text-gray-500" />
                        <span className="text-[10px] text-gray-400 font-mono">codegen-agent — active</span>
                    </div>
                    <div className="w-16"></div>
                </div>
                {/* Mockup Body */}
                <div className="grid grid-cols-1 md:grid-cols-2 h-[400px] md:h-[500px]">
                    <div className="border-r border-[#27272a] p-6 md:p-8 flex flex-col justify-end bg-[#050505]">
                        <div className="space-y-4">
                            <div className="self-start bg-[#1a1a1a] text-gray-300 p-3 rounded-2xl rounded-tl-none border border-[#27272a] max-w-[80%] text-sm">
                                Olá! O que vamos construir hoje?
                            </div>
                            <div className="self-end bg-blue-600/10 text-blue-200 p-3 rounded-2xl rounded-tr-none border border-blue-500/20 max-w-[80%] text-sm text-right">
                                Um dashboard de finanças com gráficos em tempo real.
                            </div>
                            <div className="self-start bg-[#1a1a1a] text-gray-300 p-3 rounded-2xl rounded-tl-none border border-[#27272a] max-w-[80%] text-sm flex items-center gap-2">
                                <SparklesIcon className="w-4 h-4 text-blue-400 animate-pulse" />
                                <span>Criando estrutura do projeto...</span>
                            </div>
                        </div>
                        <div className="mt-8 relative">
                            <div className="absolute inset-0 bg-blue-500/5 blur-xl"></div>
                            <div className="relative bg-[#121214] border border-[#27272a] rounded-xl p-3 flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg"><SparklesIcon className="w-4 h-4 text-blue-400" /></div>
                                <div className="h-1.5 w-2/3 bg-[#27272a] rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[60%] animate-[width_2s_ease-in-out_infinite]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block bg-[#0a0a0a] p-8 relative overflow-hidden">
                        {/* Code snippet decoration */}
                        <div className="font-mono text-xs leading-relaxed opacity-60">
                            <div className="flex"><span className="text-purple-400">import</span><span className="text-white ml-2">React</span><span className="text-purple-400 ml-2">from</span><span className="text-green-400 ml-2">'react'</span>;</div>
                            <div className="flex mt-2"><span className="text-purple-400">export const</span><span className="text-yellow-200 ml-2">Dashboard</span><span className="text-white ml-2">=</span><span className="text-white ml-2">()</span><span className="text-purple-400 ml-2">=&gt;</span><span className="text-white ml-2">{`{`}</span></div>
                            <div className="flex ml-4"><span className="text-purple-400">return</span><span className="text-white ml-2">(</span></div>
                            <div className="flex ml-8"><span className="text-gray-500">&lt;</span><span className="text-blue-300">div</span><span className="text-gray-300 ml-2">className</span>=<span className="text-green-400">"p-6 bg-zinc-900"</span><span className="text-gray-500">&gt;</span></div>
                            <div className="flex ml-12"><span className="text-gray-500">&lt;</span><span className="text-blue-300">h1</span><span className="text-gray-500">&gt;</span><span className="text-white">Finance Overview</span><span className="text-gray-500">&lt;/</span><span className="text-blue-300">h1</span><span className="text-gray-500">&gt;</span></div>
                            <div className="flex ml-12"><span className="text-gray-500">&lt;</span><span className="text-yellow-200">StatsCard</span><span className="text-gray-300 ml-2">value</span>=<span className="text-green-400">"$42,000"</span><span className="text-gray-500">/&gt;</span></div>
                            <div className="flex ml-12"><span className="text-gray-500">&lt;</span><span className="text-yellow-200">Chart</span><span className="text-gray-300 ml-2">data</span>=<span className="text-white">{`{data}`}</span><span className="text-gray-500">/&gt;</span></div>
                            <div className="flex ml-8"><span className="text-gray-500">&lt;/</span><span className="text-blue-300">div</span><span className="text-gray-500">&gt;</span></div>
                            <div className="flex ml-4"><span className="text-white">)</span></div>
                            <div className="flex"><span className="text-white">{`}`}</span></div>
                        </div>
                        {/* Overlay Card */}
                        <div className="absolute bottom-8 right-8 bg-[#18181b] border border-[#27272a] p-4 rounded-xl shadow-2xl flex items-center gap-4 animate-[slideInUp_1s_ease-out_0.5s_both]">
                            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white uppercase tracking-wider">App Deployed</div>
                                <div className="text-[10px] text-gray-500">https://finance-dash.netlify.app</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 max-w-6xl mx-auto w-full">
            {[
                { title: "Chat Inteligente", desc: "Converse naturalmente. A IA entende contexto, arquivos e intenções complexas.", icon: <SparklesIcon className="w-6 h-6 text-purple-400" /> },
                { title: "Editor Fullstack", desc: "Um ambiente VS Code completo no navegador. Edite, visualize e debuge instantaneamente.", icon: <TerminalIcon className="w-6 h-6 text-blue-400" /> },
                { title: "Deploy em 1-Click", desc: "Do conceito à produção em minutos. Hospedagem integrada e exportação para GitHub.", icon: <GithubIcon className="w-6 h-6 text-white" /> }
            ].map((f, i) => (
                <div key={i} className="p-8 rounded-2xl bg-[#0a0a0a] border border-[#1f1f22] hover:border-white/10 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-[#121214] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        {f.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
            ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#1f1f22] bg-[#050505] py-12 text-center mt-20">
            <p className="text-gray-600 text-sm">© {new Date().getFullYear()} Codegen Studio. All rights reserved.</p>
      </footer>
    </div>
  );
};
