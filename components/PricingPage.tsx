
import React, { useState } from 'react';
import { AppLogo, SparklesIcon } from './Icons';

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
    <div className={`flex flex-col p-8 rounded-3xl border transition-all duration-300 hover:scale-[1.02] ${
        isFeatured 
        ? 'bg-white dark:bg-[#18181b] border-purple-200 dark:border-white/20 shadow-xl shadow-purple-500/10 dark:shadow-purple-900/20' 
        : 'bg-white dark:bg-[#121214] border-gray-200 dark:border-[#27272a] shadow-lg dark:shadow-none'
    }`}>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
        <div className="mt-6 flex items-baseline gap-1">
            <span className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">{price}</span>
            {price !== "Grátis" && price !== "Custom" && <span className="text-gray-500 dark:text-gray-500 font-medium">/mês</span>}
        </div>
        <ul className="mt-8 space-y-4 text-gray-600 dark:text-gray-300 flex-grow">
            {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                    <svg className={`w-5 h-5 flex-shrink-0 ${isFeatured ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        <button 
            onClick={onClick}
            disabled={isLoading}
            className={`w-full mt-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-wait active:scale-95 ${
                isFeatured 
                ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' 
                : 'bg-gray-100 dark:bg-[#27272a] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#3f3f46]'
            }`}>
            {isLoading ? 'Processando...' : buttonText}
        </button>
    </div>
);


export const PricingPage: React.FC<PricingPageProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const onContactClick = (planName: string) => {
    setIsLoading(planName);
    const subject = encodeURIComponent(`Interesse no plano ${planName} - Codegen Studio`);
    const body = encodeURIComponent(`Olá equipe da Codegen Studio,\n\nGostaria de saber mais sobre como posso atualizar minha conta para o plano ${planName}.\n\nObrigado!`);
    window.location.href = `mailto:sales@codegen.studio?subject=${subject}&body=${body}`;
    setTimeout(() => setIsLoading(null), 1000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-[#09090b] text-gray-900 dark:text-white overflow-x-hidden overflow-y-auto relative font-sans transition-colors duration-300">
       
       {/* Background Gradient Mesh */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[120px] opacity-40 animate-pulse" style={{ animationDuration: '8s' }}></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] opacity-40 animate-pulse" style={{ animationDuration: '10s' }}></div>
         <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] bg-pink-600/5 dark:bg-pink-600/10 rounded-full blur-[100px] opacity-30 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

       <main className="flex-1 flex flex-col items-center relative z-10 px-4 pt-10 pb-20 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 animate-slideInUp">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold mb-6">
                <SparklesIcon className="w-3 h-3" />
                PREÇOS TRANSPARENTES
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold text-gray-900 dark:text-white tracking-tight mb-6">Escolha o plano ideal para você</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Comece de graça e expanda conforme você cresce. Todos os planos incluem acesso aos nossos poderosos recursos de geração de código por IA.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl animate-slideInUp" style={{ animationDelay: '100ms' }}>
            <PricingCard
                title="Hobby"
                price="Grátis"
                description="Perfeito para testar e para pequenos projetos pessoais."
                features={[
                    "Acesso aos modelos Gemini (requer sua chave de API)",
                    "Gerações ilimitadas com sua chave",
                    "Acesso ao Editor e Preview",
                    "Baixar projetos como ZIP",
                    "300 créditos diários grátis",
                ]}
                onClick={onBack}
                isLoading={isLoading === 'Hobby'}
                buttonText="Continuar com Grátis"
            />
             <PricingCard
                title="Pro"
                price="$20"
                description="Para desenvolvedores que buscam produtividade total."
                features={[
                    "Tudo do Hobby, e mais:",
                    "Acesso a todos os modelos (GPT-4o, Claude, DeepSeek)",
                    "500 créditos diários para uso sem chaves",
                    "Sincronização com GitHub Ilimitada",
                    "Integração com Supabase Admin",
                    "Suporte prioritário 24/7",
                ]}
                isFeatured
                onClick={() => onContactClick('Pro')} 
                isLoading={isLoading === 'Pro'}
                buttonText="Falar com a Equipe"
            />
        </div>

        <div className="mt-20 text-center animate-fadeIn" style={{ animationDelay: '200ms' }}>
            <p className="text-gray-500 dark:text-gray-500 text-sm">
                Precisa de um plano personalizado? <button onClick={() => window.location.href = 'mailto:support@codegen.studio'} className="text-gray-900 dark:text-white hover:underline font-medium">Fale conosco</button>
            </p>
        </div>

       </main>
    </div>
  )
}
