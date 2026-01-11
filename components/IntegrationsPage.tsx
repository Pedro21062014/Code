
import React from 'react';
import { GithubIcon, SupabaseIcon, StripeIcon, DatabaseIcon, MapIcon, SparklesIcon, GeminiIcon, OpenAIIcon, DriveIcon, NetlifyIcon } from './Icons';

interface IntegrationsPageProps {
  onOpenGithubImport: () => void;
  onOpenSupabaseAdmin: () => void;
  onOpenStripeModal: () => void;
  onOpenNeonModal: () => void;
  onOpenOSMModal: () => void;
  onOpenGeminiModal: () => void;
  onOpenOpenAIModal: () => void;
  onOpenDriveAuth: () => void;
  onOpenNetlifyModal: () => void; // New prop
}

export const IntegrationsPage: React.FC<IntegrationsPageProps> = ({
  onOpenGithubImport,
  onOpenSupabaseAdmin,
  onOpenStripeModal,
  onOpenNeonModal,
  onOpenOSMModal,
  onOpenGeminiModal,
  onOpenOpenAIModal,
  onOpenDriveAuth,
  onOpenNetlifyModal
}) => {
  const integrations = [
    {
      id: 'gemini',
      title: "Google Gemini",
      description: "Modelo de IA padrão.",
      icon: <GeminiIcon className="w-6 h-6" />,
      onClick: onOpenGeminiModal,
      hoverClass: "group-hover:border-blue-500/30",
      iconClass: "text-blue-500"
    },
    {
      id: 'openai',
      title: "OpenAI",
      description: "GPT-4o e modelos avançados.",
      icon: <OpenAIIcon className="w-6 h-6" />,
      onClick: onOpenOpenAIModal,
      hoverClass: "group-hover:border-green-500/30",
      iconClass: "text-green-500"
    },
    {
      id: 'drive',
      title: "Google Drive",
      description: "Sincronização na nuvem.",
      icon: <DriveIcon className="w-6 h-6" />,
      onClick: onOpenDriveAuth,
      hoverClass: "group-hover:border-yellow-500/30",
      iconClass: "text-yellow-500"
    },
    { 
        id: 'github',
        title: "GitHub", 
        description: "Controle de versão e deploy.", 
        icon: <GithubIcon className="w-6 h-6" />,
        onClick: onOpenGithubImport,
        hoverClass: "group-hover:border-white/30",
        iconClass: "text-white"
    },
    { 
        id: 'netlify',
        title: "Netlify", 
        description: "Hospedagem e Deploy.", 
        icon: <NetlifyIcon className="w-6 h-6" />,
        onClick: onOpenNetlifyModal,
        hoverClass: "group-hover:border-[#00C7B7]/30",
        iconClass: "text-[#00C7B7]"
    },
    { 
        id: 'supabase',
        title: "Supabase", 
        description: "Postgres & Auth.", 
        icon: <SupabaseIcon className="w-6 h-6" />, 
        onClick: onOpenSupabaseAdmin,
        hoverClass: "group-hover:border-emerald-500/30",
        iconClass: "text-emerald-500"
    },
    { 
        id: 'stripe',
        title: "Stripe", 
        description: "Pagamentos globais.", 
        icon: <StripeIcon className="w-6 h-6" />, 
        onClick: onOpenStripeModal,
        hoverClass: "group-hover:border-indigo-500/30",
        iconClass: "text-indigo-500"
    },
    { 
        id: 'neon',
        title: "Neon", 
        description: "Serverless Postgres.", 
        icon: <DatabaseIcon className="w-6 h-6" />, 
        onClick: onOpenNeonModal,
        hoverClass: "group-hover:border-green-400/30",
        iconClass: "text-green-400"
    },
    { 
        id: 'osm',
        title: "OpenStreetMap", 
        description: "Mapas open-source.", 
        icon: <MapIcon className="w-6 h-6" />, 
        onClick: onOpenOSMModal,
        hoverClass: "group-hover:border-blue-400/30",
        iconClass: "text-blue-400"
    },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#09090b] text-gray-900 dark:text-white overflow-hidden relative font-sans transition-colors duration-300">
      <main className="flex-1 flex flex-col items-center px-4 pt-10 pb-12 relative z-10 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-5xl">
            <div className="mb-12">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 font-heading">
                    Integrações
                </h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-2xl text-sm">
                    Conecte serviços externos para expandir as capacidades do seu projeto.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations.map((item) => (
                    <div 
                        key={item.id}
                        onClick={item.onClick}
                        className={`group relative p-5 rounded-xl bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${item.hoverClass}`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2 rounded-lg bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-[#3f3f46] ${item.iconClass}`}>
                                {item.icon}
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <SparklesIcon className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 font-heading">{item.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-sans">
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </main>
    </div>
  );
};
