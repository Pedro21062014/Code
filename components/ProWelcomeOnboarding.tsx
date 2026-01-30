
import React, { useState, useEffect } from 'react';

interface ProWelcomeOnboardingProps {
  onComplete: () => void;
}

export const ProWelcomeOnboarding: React.FC<ProWelcomeOnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Cronograma de precisão (Total ~10s para ser rápido e impactante)
    const timers = [
      setTimeout(() => setStep(1), 500),   // Grid Init
      setTimeout(() => setStep(2), 2000),  // PRO Reveal
      setTimeout(() => setStep(3), 5000),  // Features
      setTimeout(() => setStep(4), 9000),  // Welcome
      setTimeout(() => setStep(5), 11500), // Finish
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (step === 5) onComplete();
  }, [step, onComplete]);

  return (
    <div className="fixed inset-0 bg-[#000000] z-[9999] flex items-center justify-center overflow-hidden font-sans cursor-wait">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;400;600;900&family=JetBrains+Mono:wght@300;500&display=swap');

        .font-pro { font-family: 'Inter', sans-serif; }
        .font-code { font-family: 'JetBrains Mono', monospace; }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes gridReveal {
          from { opacity: 0; transform: scale(1.1); }
          to { opacity: 1; transform: scale(1); }
        }

        .bg-grid {
          background-size: 50px 50px;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
        }

        .text-metal {
          background: linear-gradient(to bottom, #ffffff 0%, #a1a1aa 50%, #52525b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));
        }

        .animate-fade-up {
          animation: fadeUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .shine-border {
           position: relative;
        }
        .shine-border::after {
           content: '';
           position: absolute;
           top: 0; left: 0; right: 0; height: 1px;
           background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
           animation: shimmer 3s infinite linear;
        }
      `}</style>

      {/* Background Técnico */}
      <div className={`absolute inset-0 bg-grid transition-opacity duration-1000 ${step >= 1 ? 'opacity-100 animate-[gridReveal_3s_ease-out]' : 'opacity-0'}`}></div>
      
      {/* Vinheta */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_90%)] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center justify-center">

        {/* Passo 1: Inicialização do Sistema */}
        {step === 1 && (
          <div className="flex flex-col items-center gap-4 animate-fade-up">
            <div className="w-12 h-12 border border-white/20 rounded flex items-center justify-center relative overflow-hidden">
               <div className="w-full h-[1px] bg-white/50 absolute top-0 animate-[scanline_1.5s_linear_infinite]"></div>
               <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div className="font-code text-xs text-zinc-500 uppercase tracking-[0.3em]">
              Authenticating License...
            </div>
          </div>
        )}

        {/* Passo 2: A Revelação PRO */}
        {step === 2 && (
          <div className="flex flex-col items-center animate-fade-up">
            <div className="font-pro font-bold text-[10px] text-zinc-500 border border-zinc-800 bg-zinc-900/50 px-3 py-1 rounded-full uppercase tracking-widest mb-8 backdrop-blur-md">
              Enterprise Grade
            </div>
            
            <h1 className="font-pro text-9xl md:text-[11rem] font-black tracking-tighter leading-none text-metal select-none">
              PRO
            </h1>
            
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent mt-8"></div>
          </div>
        )}

        {/* Passo 3: Funcionalidades (Minimalista) */}
        {step === 3 && (
          <div className="w-full animate-fade-up">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0 border-t border-b border-white/5 py-12 bg-black/40 backdrop-blur-sm shine-border">
              {[
                { label: "UNLIMITED", sub: "Generations" },
                { label: "ZERO", sub: "Latency" },
                { label: "GITHUB", sub: "Sync Ready" }
              ].map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-default">
                  <span className="font-pro text-3xl md:text-4xl font-bold text-white tracking-tight group-hover:scale-105 transition-transform duration-500">
                    {item.label}
                  </span>
                  <span className="font-code text-[10px] text-zinc-500 uppercase tracking-[0.2em]">
                    {item.sub}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Passo 4: Boas-vindas Final */}
        {step === 4 && (
          <div className="flex flex-col items-center animate-fade-up space-y-8">
            <h2 className="font-pro text-4xl md:text-5xl font-medium text-white text-center tracking-tight leading-tight">
              O ambiente está <br />
              <span className="text-zinc-500">pronto para você.</span>
            </h2>
            
            <div className="flex items-center gap-3 px-6 py-3 border border-white/10 rounded-full bg-white/5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="font-code text-xs text-zinc-300">System Online</span>
            </div>
          </div>
        )}

      </div>

      {/* Footer Fixo Técnico */}
      <div className="absolute bottom-8 left-0 w-full text-center opacity-30">
        <p className="font-code text-[9px] text-zinc-500 uppercase tracking-widest">
          Codegem Studio Pro • v2.4.0 • Secure Connection
        </p>
      </div>
    </div>
  );
};
