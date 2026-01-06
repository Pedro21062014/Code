
import React from 'react';
import { GithubIcon, SupabaseIcon, StripeIcon, DatabaseIcon, MapIcon, SparklesIcon, GeminiIcon, OpenAIIcon, DriveIcon } from './Icons';

interface IntegrationsPageProps {
  onOpenGithubImport: () => void;
  onOpenSupabaseAdmin: () => void;
  onOpenStripeModal: () => void;
  onOpenNeonModal: () => void;
  onOpenOSMModal: () => void;
  onOpenGeminiModal: () => void;
  onOpenOpenAIModal: () => void;
  onOpenDriveAuth: () => void;
}

export const IntegrationsPage: React.FC<IntegrationsPageProps> = ({
  onOpenGithubImport,
  onOpenSupabaseAdmin,
  onOpenStripeModal,
  onOpenNeonModal,
  onOpenOSMModal,
  onOpenGeminiModal,
  onOpenOpenAIModal,
  onOpenDriveAuth
}) => {
  const integrations = [
    {
      id: 'gemini',
      title: "Google Gemini",
      description: "Configure sua chave de API para o modelo padrão.",
      icon: <GeminiIcon className="w-8 h-8" />,
      onClick: onOpenGeminiModal,
    },
    {
      id: 'openai',
      title: "OpenAI",
      description: "Adicione chaves para GPT-4o e outros modelos.",
      icon: <OpenAIIcon className="w-8 h-8" />,
      onClick: onOpenOpenAIModal,
    },
    {
      id: 'drive',
      title: "Google Drive",
      description: "Sincronize projetos (Requer login com escopo do Drive).",
      icon: <DriveIcon className="w-8 h-8" />,
      onClick: onOpenDriveAuth,
    },
    { 
        id: 'github',
        title: "GitHub", 
        description: "Sincronize repositórios, faça commits e gerencie versões diretamente.", 
        icon: <GithubIcon className="w-8 h-8" />,
        onClick: onOpenGithubImport,
    },
    { 
        id: 'supabase',
        title: "Supabase", 
        description: "Adicione autenticação e banco de dados Postgres em tempo real.", 
        icon: <SupabaseIcon className="w-8 h-8 text-[#3ECF8E]" />, 
        onClick: onOpenSupabaseAdmin,
    },
    { 
        id: 'stripe',
        title: "Stripe", 
        description: "Integre pagamentos e assinaturas em sua aplicação.", 
        icon: <StripeIcon className="w-8 h-8 text-[#635BFF]" />, 
        onClick: onOpenStripeModal,
    },
    { 
        id: 'neon',
        title: "Neon", 
        description: "Banco de dados Postgres Serverless escalável.", 
        icon: <DatabaseIcon className="w-8 h-8 text-[#00E599]" />, 
        onClick: onOpenNeonModal,
    },
    { 
        id: 'osm',
        title: "OpenStreetMap", 
        description: "Mapas interativos e gratuitos sem chaves de API complexas.", 
        icon: <MapIcon className="w-8 h-8 text-blue-400" />, 
        onClick: onOpenOSMModal,
    },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-[#09090b] text-gray-900 dark:text-white overflow-hidden relative font-sans transition-colors duration-300">
      <main className="flex-1 flex flex-col items-center px-4 pt-10 pb-12 relative z-10 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-6xl">
            <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 dark:text-white mb-3">
                    Integrações
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
                    Supercharge seu projeto conectando serviços externos favoritos.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((item) => (
                    <div 
                        key={item.id}
                        onClick={item.onClick}
                        className="group relative p-6 rounded-2xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-all shadow-sm hover:shadow-md"
                    >
                        <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-[#202023] w-fit border border-gray-100 dark:border-[#2a2a2d]">
                            {item.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            {item.description}
                        </p>
                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <SparklesIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </main>
    </div>
  );
};
