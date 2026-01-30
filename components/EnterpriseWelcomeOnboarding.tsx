
import React, { useState, useEffect } from 'react';

interface EnterpriseWelcomeOnboardingProps {
  onComplete: () => void;
}

export const EnterpriseWelcomeOnboarding: React.FC<EnterpriseWelcomeOnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Sequência mais lenta e contemplativa (Total ~22s)
    const timers = [
      setTimeout(() => setStep(1), 1000),   // "O Padrão Ouro"
      setTimeout(() => setStep(2), 5000),   // "Bem-vindo à Elite"
      setTimeout(() => setStep(3), 9000),   // "Arquitetura Enterprise"
      setTimeout(() => setStep(4), 14000),  // "Potencial Ilimitado"
      setTimeout(() => setStep(5), 18000),  // "O que vamos construir?"
      setTimeout(() => setStep(6), 23000),  // Finaliza
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (step === 6) onComplete();
  }, [step, onComplete]);

  return (
    <div className="fixed inset-0 bg-[#050505] z-[9999] flex items-center justify-center overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=Inter:wght@100;300;600&display=swap');

        .font-enterprise-serif { font-family: 'Playfair Display', serif; }
        .font-enterprise-sans { font-family: 'Inter', sans-serif; }

        @keyframes subtleZoom {
          from { transform: scale(1.05); opacity: 0; filter: blur(10px); }
          to { transform: scale(1); opacity: 1; filter: blur(0px); }
        }

        @keyframes lineExpand {
          from { width: 0; opacity: 0; }
          to { width: 100px; opacity: 0.3; }
        }

        @keyframes letterSpacingMove {
          from { letter-spacing: 0.5em; opacity: 0; }
          to { letter-spacing: 1.2em; opacity: 1; }
        }

        @keyframes grainEffect {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-1%, -1%); }
          30% { transform: translate(1%, 1%); }
          50% { transform: translate(-0.5%, 0.5%); }
          70% { transform: translate(0.5%, -0.5%); }
        }

        .grain {
          position: absolute;
          inset: -200%;
          background-image: url('https://grainy-gradients.vercel.app/noise.svg');
          opacity: 0.05;
          pointer-events: none;
          animation: grainEffect 1s steps(2) infinite;
        }

        .cinematic-bar {
          position: absolute;
          left: 0;
          right: 0;
          height: 12vh;
          background: black;
          z-index: 10;
          transition: all 2s cubic-bezier(0.19, 1, 0.22, 1);
        }

        .step-enter {
          animation: subtleZoom 3s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }
      `}</style>

      <div className="grain"></div>
      
      {/* Cinematic Frame */}
      <div className={`cinematic-bar top-0 ${step > 0 ? 'translate-y-0' : '-translate-y-full'}`}></div>
      <div className={`cinematic-bar bottom-0 ${step > 0 ? 'translate-y-0' : 'translate-y-full'}`}></div>

      <div className="relative z-20 text-center w-full max-w-5xl px-8">
        
        {/* Step 1: O Início */}
        {step === 1 && (
          <div className="step-enter">
            <h2 className="font-enterprise-serif italic text-white/40 text-2xl md:text-3xl font-light tracking-widest">
              A excelência não é um ato, mas um hábito.
            </h2>
          </div>
        )}

        {/* Step 2: Reconhecimento de Status */}
        {step === 2 && (
          <div className="step-enter space-y-6">
            <div className="h-px w-24 bg-white/20 mx-auto animate-[lineExpand_2s_forwards]"></div>
            <h1 className="font-enterprise-sans text-white text-xs tracking-[1em] uppercase opacity-60">
              Acesso de Nível Corporativo
            </h1>
            <h2 className="font-enterprise-serif text-white text-5xl md:text-7xl">
              Bem-vindo à <span className="italic">Elite</span>.
            </h2>
          </div>
        )}

        {/* Step 3: O Reveal Principal */}
        {step === 3 && (
          <div className="step-enter flex flex-col items-center">
             <div className="font-enterprise-sans text-white/20 text-[10px] tracking-[1.5em] uppercase mb-12">Codegem Studio</div>
             <h1 className="font-enterprise-sans text-white text-5xl md:text-8xl font-thin tracking-tighter leading-none">
                ENTERPRISE
             </h1>
             <div className="mt-12 font-enterprise-serif italic text-white/40 text-lg">
                Sua infraestrutura de criação definitiva está online.
             </div>
          </div>
        )}

        {/* Step 4: Mensagem de Poder */}
        {step === 4 && (
          <div className="step-enter">
            <h2 className="font-enterprise-serif text-white text-4xl md:text-6xl leading-tight font-light">
              "Para quem constrói o <span className="italic">futuro</span>, <br/>
              sem concessões."
            </h2>
            <div className="mt-8 flex justify-center gap-12 opacity-30">
               <div className="font-enterprise-sans text-[10px] tracking-[0.3em] uppercase">Segurança</div>
               <div className="font-enterprise-sans text-[10px] tracking-[0.3em] uppercase">Escala</div>
               <div className="font-enterprise-sans text-[10px] tracking-[0.3em] uppercase">Privacidade</div>
            </div>
          </div>
        )}

        {/* Step 5: A Pergunta Final */}
        {step === 5 && (
          <div className="step-enter space-y-12">
             <div className="w-12 h-12 border border-white/20 rotate-45 mx-auto flex items-center justify-center animate-pulse">
                <div className="w-6 h-6 border border-white/40 flex items-center justify-center">
                   <div className="w-2 h-2 bg-white"></div>
                </div>
             </div>
             <div className="space-y-4">
                <h2 className="font-enterprise-serif text-white text-5xl md:text-7xl font-light">
                   O que vamos <span className="italic text-white/60">idealizar</span> hoje?
                </h2>
                <p className="font-enterprise-sans text-gray-500 tracking-[0.5em] text-xs uppercase mt-6">Arquitetura de Alto Desempenho Ativada</p>
             </div>
          </div>
        )}

      </div>

      {/* Subtle Light Scan Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] h-[200%] -translate-y-full animate-[scan_10s_linear_infinite]"></div>
      
      <style>{`
        @keyframes scan {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};
