
import React, { useState } from 'react';
import { TrashIcon, FolderIcon, PlusIcon, SparklesIcon, ClockIcon, CloseIcon, GlobeIcon, TerminalIcon, HeartIcon } from './Icons';
import { SavedProject } from '../types';

interface ProjectsPageProps {
  projects: SavedProject[];
  onLoadProject: (projectId: number) => void;
  onDeleteProject: (projectId: number) => void;
  onBack: () => void;
  onNewProject: () => void;
  title?: string;
}

const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return `Criado há ${Math.floor(interval)} anos`;
    interval = seconds / 2592000;
    if (interval > 1) return `Criado há ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `Criado há ${Math.floor(interval)} dias`;
    interval = seconds / 3600;
    if (interval > 1) return `Criado há ${Math.floor(interval)} h`;
    interval = seconds / 60;
    if (interval > 1) return `Criado há ${Math.floor(interval)} min`;
    return "Criado agora";
};

// Card estilo Comunidade/Lovable (Escuro, Imagem no topo, Texto embaixo)
const GalleryCard: React.FC<{ project: SavedProject; onClick: () => void }> = ({ project, onClick }) => {
    const gradients = [
        "from-blue-600/20 to-purple-600/20",
        "from-emerald-600/20 to-teal-600/20",
        "from-orange-600/20 to-red-600/20",
        "from-pink-600/20 to-rose-600/20",
        "from-indigo-600/20 to-violet-600/20",
        "from-cyan-600/20 to-blue-600/20"
    ];
    const gradient = gradients[project.id % gradients.length];
    const authorInitial = project.author ? project.author.charAt(0).toUpperCase() : "U";
    
    return (
        <div onClick={onClick} className="group flex flex-col gap-0 cursor-pointer">
            {/* Image Preview Container */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#121214] border border-[#27272a] group-hover:border-gray-600 transition-all shadow-sm">
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-70 transition-opacity`}></div>
                
                {/* Abstract Content Representation */}
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className="w-full h-full bg-[#000]/20 backdrop-blur-sm rounded-lg flex flex-col gap-2 p-3 border border-white/5">
                        <div className="h-2 w-1/3 bg-white/20 rounded-full"></div>
                        <div className="h-2 w-1/2 bg-white/20 rounded-full"></div>
                        <div className="flex-1"></div>
                        <div className="flex gap-2">
                            <div className="h-6 w-full bg-white/10 rounded-md"></div>
                            <div className="h-6 w-1/4 bg-white/10 rounded-md"></div>
                        </div>
                    </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <span className="px-4 py-2 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        {project.deployedUrl ? 'Visitar App' : 'Ver Código'}
                    </span>
                </div>
            </div>

            {/* Meta Info Below */}
            <div className="pt-3 px-1">
                <h3 className="font-semibold text-white text-sm leading-tight mb-1 truncate">
                    {project.name}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-1 mb-2">
                    {project.files.length > 5 ? 'A full-stack application built with React & Supabase.' : 'A simple tool for developers.'}
                </p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-[8px] font-bold text-white">
                            {authorInitial}
                        </div>
                        <span className="text-[10px] text-gray-500">{project.author || "Community"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <HeartIcon className="w-3 h-3 text-gray-600 group-hover:text-red-500 transition-colors" />
                        <span>{project.likes || Math.floor(Math.random() * 500) + 50}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Card de Destaque (Featured) - Maior
const FeaturedGalleryCard: React.FC<{ project: SavedProject; onClick: () => void }> = ({ project, onClick }) => {
    const gradients = ["from-purple-900/40 via-black to-black", "from-blue-900/40 via-black to-black"];
    const bgGradient = gradients[project.id % 2];

    return (
        <div onClick={onClick} className="group relative overflow-hidden rounded-2xl border border-[#27272a] hover:border-gray-500 transition-all cursor-pointer h-[280px] bg-[#121214]">
            <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient}`}></div>
            
            {/* Content Content - Simulação de UI */}
            <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center font-bold text-xs">
                            {project.name.charAt(0)}
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">{project.name}</h3>
                    </div>
                    <p className="text-gray-400 text-sm max-w-xs leading-relaxed line-clamp-3">
                       Uma aplicação em destaque criada com Codegen Studio. Explore o código fonte ou veja a demo ao vivo.
                    </p>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                    <span className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                        Visit Project
                    </span>
                </div>
            </div>

            {/* Right Side Visual Decoration */}
            <div className="absolute right-[-20px] top-[40px] w-[60%] h-[90%] bg-[#1a1a1c] rounded-tl-xl border-l border-t border-white/10 shadow-2xl transform rotate-[-2deg] transition-transform group-hover:rotate-0 group-hover:translate-x-2">
                <div className="p-4 space-y-3">
                    <div className="h-8 w-1/3 bg-white/10 rounded"></div>
                    <div className="h-32 w-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded border border-white/5"></div>
                    <div className="flex gap-2">
                        <div className="h-10 w-1/2 bg-white/5 rounded"></div>
                        <div className="h-10 w-1/2 bg-white/5 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Card Meus Projetos (Dashboard Style)
const DashboardProjectCard: React.FC<{ project: SavedProject; onClick: () => void; onDelete: (e: React.MouseEvent) => void }> = ({ project, onClick, onDelete }) => {
    const iconColors = [
        "bg-blue-600", "bg-purple-600", "bg-emerald-600", "bg-orange-600", "bg-pink-600", "bg-indigo-600"
    ];
    const iconColor = iconColors[project.id % iconColors.length];
    
    const description = project.files.length > 5 
        ? `Projeto completo com ${project.files.length} arquivos configurados.`
        : `Aplicação inicial contendo ${project.files.length} arquivos.`;

    const author = project.author || "Eu";

    return (
        <div 
            onClick={onClick}
            className="group bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] rounded-xl p-5 hover:shadow-lg dark:hover:shadow-black/40 hover:border-gray-300 dark:hover:border-[#3f3f46] transition-all cursor-pointer relative flex flex-col h-[200px]"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${iconColor} rounded-xl flex items-center justify-center text-white shadow-md`}>
                        {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                            {project.name}
                        </h3>
                    </div>
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {project.deployedUrl && (
                        <a 
                            href={project.deployedUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            onClick={e => e.stopPropagation()} 
                            className="p-2 text-gray-400 hover:text-green-500 bg-gray-50 dark:bg-[#18181b] rounded-lg"
                            title="Ver online"
                        >
                            <GlobeIcon className="w-4 h-4" />
                        </a>
                    )}
                    <button 
                        onClick={onDelete}
                        className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-[#18181b] rounded-lg"
                        title="Excluir"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6 line-clamp-2 flex-grow">
                {description}
            </p>

            <div className="flex items-center gap-3 text-xs text-gray-400 pt-4 border-t border-gray-100 dark:border-[#27272a] mt-auto">
                <span className="font-medium text-gray-600 dark:text-gray-300">By {author}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                <span>{getTimeAgo(project.updated_at)}</span>
            </div>
        </div>
    );
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ projects, onLoadProject, onDeleteProject, onBack, onNewProject, title = "Meus Projetos" }) => {
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const isGallery = title === "Galeria da Comunidade";

  const confirmDelete = () => {
    if (projectToDelete !== null) {
      onDeleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  const sortedProjects = [...projects].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  // Logica específica da Galeria (Visualização Rica Estilo Lovable)
  if (isGallery) {
      // Mock Categories and filtering for visual demo
      const featured = sortedProjects.slice(0, 2);
      const builders = sortedProjects.filter((_, i) => i % 3 === 0);
      const loved = sortedProjects.filter((_, i) => i % 3 === 1);
      const personal = sortedProjects.filter((_, i) => i % 3 === 2);

      return (
        <div className="flex flex-col h-full w-full bg-[#09090b] text-white overflow-hidden font-sans">
            <main className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                
                {/* Hero Section */}
                <div className="pt-12 pb-8 px-6 md:px-12">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-lg font-semibold text-white mb-1">Descobrir</h2>
                        <p className="text-gray-400 text-sm">
                            Explore aplicativos construídos por criadores talentosos com Codegen Studio
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-12">
                    
                    {/* Featured Apps Section */}
                    {featured.length > 0 && (
                        <section>
                            <h3 className="text-base font-semibold text-white mb-4">Apps em Destaque</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {featured.map(p => (
                                    <FeaturedGalleryCard key={p.id} project={p} onClick={() => { if(p.deployedUrl) window.open(p.deployedUrl, '_blank'); else onLoadProject(p.id); }} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Apps for builders */}
                    {builders.length > 0 && (
                        <section>
                            <h3 className="text-base font-semibold text-white mb-4">Ferramentas para Devs</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {builders.map(p => (
                                    <GalleryCard key={p.id} project={p} onClick={() => { if(p.deployedUrl) window.open(p.deployedUrl, '_blank'); else onLoadProject(p.id); }} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Apps loved by the community */}
                    {loved.length > 0 && (
                        <section>
                            <h3 className="text-base font-semibold text-white mb-4">Apps Amados pela Comunidade</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {loved.map(p => (
                                    <GalleryCard key={p.id} project={p} onClick={() => { if(p.deployedUrl) window.open(p.deployedUrl, '_blank'); else onLoadProject(p.id); }} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Personal apps */}
                    {personal.length > 0 && (
                        <section>
                            <h3 className="text-base font-semibold text-white mb-4">Pessoal & Entretenimento</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {personal.map(p => (
                                    <GalleryCard key={p.id} project={p} onClick={() => { if(p.deployedUrl) window.open(p.deployedUrl, '_blank'); else onLoadProject(p.id); }} />
                                ))}
                            </div>
                        </section>
                    )}

                    {projects.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-gray-500">A galeria está vazia no momento. Seja o primeiro a publicar!</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
      );
  }

  // Visualização Padrão (Meus Projetos / Compartilhados)
  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-[#09090b] text-gray-900 dark:text-white overflow-hidden relative font-sans transition-colors duration-300">
      
      {/* Background Gradient Mesh (Subtle) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-30">
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 dark:bg-blue-600/10 rounded-full blur-[120px]"></div>
      </div>

      <main className="flex-1 flex flex-col items-center px-4 pt-10 pb-12 relative z-10 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-7xl">
            
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                        {title}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
                        Gerencie todos os seus snippets de código e projetos em um lugar central.
                    </p>
                </div>
                <button 
                    onClick={onNewProject}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
                >
                    <PlusIcon className="w-4 h-4" />
                    Novo Projeto
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Projetos existentes usando o novo card estilo Dashboard */}
                {sortedProjects.map((project) => (
                    <DashboardProjectCard 
                        key={project.id} 
                        project={project} 
                        onClick={() => onLoadProject(project.id)}
                        onDelete={(e) => { e.stopPropagation(); setProjectToDelete(project.id); }}
                    />
                ))}

                {/* Create New Card (Placeholder no final da grid) */}
                <div 
                    onClick={onNewProject}
                    className="group border border-dashed border-gray-300 dark:border-[#27272a] rounded-xl p-5 flex flex-col items-center justify-center h-[200px] hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-[#121214] transition-all cursor-pointer gap-3 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white"
                >
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#18181b] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PlusIcon className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-sm">Criar novo projeto</span>
                </div>
            </div>

            {projects.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] flex items-center justify-center mb-4">
                        <FolderIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Nenhum projeto encontrado</h3>
                    <p className="text-gray-500 max-w-md">
                        Comece criando algo incrível hoje.
                    </p>
                </div>
            )}
        </div>

        {/* Delete Confirmation Modal */}
        {projectToDelete !== null && (
            <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setProjectToDelete(null)}>
                <div 
                    className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-500">
                                <TrashIcon className="w-5 h-5" />
                            </div>
                            <button onClick={() => setProjectToDelete(null)} className="text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Excluir Projeto?</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                            Você tem certeza que deseja excluir este projeto? Esta ação removerá permanentemente todos os arquivos e histórico de chat e <span className="text-red-600 dark:text-red-400 font-bold">não pode ser desfeita</span>.
                        </p>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setProjectToDelete(null)}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-[#27272a] hover:bg-gray-200 dark:hover:bg-[#3f3f46] text-gray-900 dark:text-white text-sm font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-lg shadow-red-900/20"
                            >
                                Sim, excluir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};
