import React, { useState } from 'react';
import { AppLogo } from './Icons';
import { handleCheckout } from '../services/stripeService';

interface PricingPageProps {
  onBack: () => void;
  onNewProject: () => void;
}

const PricingCard: React.FC<{ 
    title: string; 
    price: string; 
    description: string; 
    features: string[]; 
    isFeatured?: boolean;
    onClick: () => void;
    isLoading: boolean;
    buttonText?: string;
}> = ({ title, price, description, features, isFeatured, onClick, isLoading, buttonText = "Começar" }) => (
    <div className={`flex flex-col p-8 rounded-2xl border ${isFeatured ? 'bg-var-bg-interactive border-var-accent' : 'bg-var-bg-subtle border-var-border-default'}`}>
        <h3 className="text-xl font-semibold text-var-fg-default">{title}</h3>
        <p className="mt-2 text-var-fg-muted">{description}</p>
        <div className="mt-6">
            <span className="text-5xl font-bold text-var-fg-default">{price}</span>
            <span className="text-var-fg-muted">{price !== "Grátis" && " / mês"}</span>
        </div>
        <ul className="mt-8 space-y-4 text-var-fg-default flex-grow">
            {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-var-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        <button 
            onClick={onClick}
            disabled={isLoading}
            className={`w-full mt-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-wait ${isFeatured ? 'bg-var-accent text-var-accent-fg hover:opacity-90' : 'bg-var-bg-interactive text-var-fg-default hover:bg-var-bg-default'}`}>
            {isLoading ? 'Processando...' : buttonText}
        </button>
    </div>
);


export const PricingPage: React.FC<PricingPageProps> = ({ onBack, onNewProject }) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const onCheckoutClick = async (priceId: string, planName: string) => {
    setIsLoading(planName);
    try {
      await handleCheckout(priceId);
    } catch (error) {
      console.error("Stripe checkout error:", error);
      // If redirection fails, stop loading
      setIsLoading(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-screen bg-var-bg-default text-var-fg-default overflow-y-auto font-sans">
       <header className="fixed top-0 left-0 right-0 z-10 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <button onClick={onNewProject} className="flex items-center gap-2">
            <AppLogo className="w-6 h-6 text-var-fg-default" />
            <span className="text-var-fg-default font-bold">codegen<span className="font-light">studio</span></span>
          </button>
          <button onClick={onBack} className="text-sm text-var-fg-muted hover:text-var-fg-default transition-colors">
            &larr; Voltar
          </button>
        </div>
      </header>
       <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-24 pb-12">
        <h1 className="text-5xl md:text-6xl font-bold text-var-fg-default tracking-tight">Encontre o plano certo para você</h1>
        <p className="mt-4 text-lg text-var-fg-muted max-w-2xl">Comece de graça e expanda conforme você cresce. Todos os planos incluem acesso aos nossos poderosos recursos de geração de código por IA.</p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full text-left">
            <PricingCard
                title="Hobby"
                price="Grátis"
                description="Para projetos pessoais e exploração."
                features={[
                    "Acesso aos modelos Gemini (requer sua chave de API)",
                    "Gerações ilimitadas com sua chave",
                    "Suporte da comunidade",
                    "Baixar projetos como ZIP",
                ]}
                onClick={onBack}
                isLoading={isLoading === 'Hobby'}
                buttonText="Continuar com Grátis"
            />
             <PricingCard
                title="Pro"
                price="$20"
                description="Para profissionais e equipes pequenas."
                features={[
                    "Tudo do Hobby, e mais:",
                    "Acesso a todos os modelos de IA (OpenAI, DeepSeek)",
                    "Nossas chaves de API gerenciadas para você",
                    "Suporte prioritário",
                    "Integração com GitHub",
                ]}
                isFeatured
                onClick={() => onCheckoutClick('price_1OuP5A2eZvKYlo2Ce2C20s2k', 'Pro')} // NOTE: This is a sample Price ID. Replace with your actual ID from Stripe.
                isLoading={isLoading === 'Pro'}
                buttonText="Atualizar para Pro"
            />
             <PricingCard
                title="Enterprise"
                price="Custom"
                description="Para grandes organizações com necessidades específicas."
                features={[
                    "Tudo do Pro, e mais:",
                    "Opções de implantação local (On-premise)",
                    "Ajuste fino de modelos personalizados",
                    "Gerente de contas dedicado",
                    "SSO SAML",
                ]}
                onClick={() => window.location.href = 'mailto:sales@codegen.studio'}
                isLoading={isLoading === 'Enterprise'}
                buttonText="Contatar Vendas"
            />
        </div>

       </main>
    </div>
  )
}