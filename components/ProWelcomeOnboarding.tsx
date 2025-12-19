
import React, { useState, useEffect } from 'react';

interface ProWelcomeOnboardingProps {
  onComplete: () => void;
}

export const ProWelcomeOnboarding: React.FC<ProWelcomeOnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Sequência de animação estendida e cinematográfica
    // Iniciamos o Step 1 mais rápido para evitar tela preta por muito tempo
    const timers = [
      setTimeout(() => setStep(1), 300),    // "O futuro chegou..."
      setTimeout(() => setStep(2), 3500),   // "Bem-vindo à elite."
      setTimeout(() => setStep(3), 7000),   // "CODEGEN STUDIO PRO" (Reveal)
      setTimeout(() => setStep(4), 10500),  // "Seu potencial agora é ilimitado."
      setTimeout(() => setStep(5), 14000),  // "O que você vai revolucionar hoje?"
      setTimeout(() => setStep(6), 18000),  // Finaliza
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (step === 6) {
      onComplete();
    }
  }, [step, onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@100;400;900&display=swap');

        .font-serif-elegant { font-family: 'Playfair Display', serif; }
        .font-sans-ultra { font-family: 'Inter', sans-serif; }

        @keyframes revealBlur {
          0% { filter: blur(20px); opacity: 0; transform: scale(1.1); }
          100% { filter: blur(0px); opacity: 1; transform: scale(1); }
        }

        @keyframes trackingOut {
          0% { letter-spacing: -0.5em; opacity: 0; }
          100% { letter-spacing: 0.2em; opacity: 1; }
        }

        @keyframes glowPulse {
          0%, 100% { text-shadow: 0 0 20px rgba(168, 85, 247, 0.4); }
          50% { text-shadow: 0 0 50px rgba(168, 85, 247, 0.8), 0 0 100px rgba(59, 130, 246, 0.4); }
        }

        @keyframes floatUpVanish {
          0% { transform: translateY(0); opacity: 1; filter: blur(0px); }
          100% { transform: translateY(-100px); opacity: 0; filter: blur(20px); }
        }

        @keyframes particleBackground {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }

        .particle {
          position: absolute;
          background: white;
          border-radius: 50%;
          pointer-events: none;
          animation: particleBackground 10s linear infinite;
        }

        .step-transition {
          animation: revealBlur 2s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }

        .step-exit {
          animation: floatUpVanish 1.5s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }
      `}</style>

      {/* Partículas de fundo (Ambiente) */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="particle"
            style={{
              width: Math.random() * 3 + 'px',
              height: Math.random() * 3 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 10 + 's',
              animationDuration: Math.random() * 10 + 10 + 's'
            }}
          />
        ))}
      </div>

      <div className="relative text-center w-full max-w-4xl px-6">
        
        {/* Step 1: O Prelúdio */}
        {step === 1 && (
          <div className="step-transition">
            <h2 className="font-serif-elegant italic text-white/50 text-2xl md:text-3xl font-light">
              Prepare-se para o extraordinário...
            </h2>
          </div>
        )}

        {/* Step 2: A Boas Vindas */}
        {step === 2 && (
          <div className="step-transition flex flex-col items-center">
            <span className="font-sans-ultra text-blue-500 font-black tracking-[0.5em] text-xs uppercase mb-4">Acesso Exclusivo</span>
            <h1 className="font-sans-ultra text-white text-4xl md:text-6xl font-extralight tracking-tight leading-none">
              Bem-vindo ao <br/>
              <span className="font-black">Codegen Studio</span>
            </h1>
          </div>
        )}

        {/* Step 3: O Reveal do Status PRO */}
        {step === 3 && (
          <div className="step-transition flex flex-col items-center">
             <div className="animate-[glowPulse_3s_infinite] flex flex-col items-center">
                <div className="font-sans-ultra text-white/40 text-sm tracking-[1em] uppercase mb-8">Status da Conta</div>
                <h1 className="font-sans-ultra text-white text-6xl md:text-9xl font-black italic tracking-tighter">
                  VOCÊ É <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500">PRO</span>
                </h1>
                <div className="mt-8 h-px w-32 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
             </div>
          </div>
        )}

        {/* Step 4: O Poder */}
        {step === 4 && (
          <div className="step-transition">
            <h2 className="font-serif-elegant text-white text-3xl md:text-5xl leading-tight">
              "Seu limite não é mais o código, <br/>
              é a sua <span className="text-blue-400">imaginação</span>."
            </h2>
          </div>
        )}

        {/* Step 5: A Transição Final */}
        {step === 5 && (
          <div className="step-transition space-y-8">
             <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                <svg className="w-10 h-10 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
             </div>
             <div className="space-y-2">
                <h2 className="font-sans-ultra text-white text-4xl md:text-6xl font-black tracking-tighter">
                  O que você vai <br/>
                  <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">revolucionar</span> hoje?
                </h2>
                <p className="font-sans-ultra text-gray-500 tracking-[0.2em] text-sm uppercase">Modo de Alta Performance Ativado</p>
             </div>
          </div>
        )}

      </div>

      {/* Overlay de Vinheta para foco central */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
    </div>
  );
};
