
import React, { useState } from 'react';
import { TrashIcon, FolderIcon, PlusIcon, SparklesIcon, ClockIcon, CloseIcon } from './Icons';
import { SavedProject } from '../types';

interface ProjectsPageProps {
  projects: SavedProject[];
  onLoadProject: (projectId: number) => void;
  onDeleteProject: (projectId: number) => void;
  onBack: () => void;
  onNewProject: () => void;
  title?: string;
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
};

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ projects, onLoadProject, onDeleteProject, onBack, onNewProject, title = "Meus Projetos" }) => {
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);

  const confirmDelete = () => {
    if (projectToDelete !== null) {
      onDeleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  const sortedProjects = [...projects].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return (
    <div className="flex flex-col h-full w-full bg-[#09090b] text-white overflow-hidden relative font-sans">
      
      {/* Background Gradient Mesh */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] opacity-40 animate-pulse" style={{ animationDuration: '8s' }}></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[120px] opacity-40 animate-pulse" style={{ animationDuration: '10s' }}></div>
         <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] bg-pink-600/10 rounded-full blur-[100px] opacity-30 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <main className="flex-1 flex flex-col items-center px-4 pt-10 pb-12 relative z-10 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-6xl animate-slideInUp">
            
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-3">
                        {title}
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl">
                        Gerencie seus projetos, continue de onde parou ou comece algo novo.
                    </p>
                </div>
                <button 
                    onClick={onNewProject}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-medium hover:opacity-90 transition-opacity shadow-lg shadow-white/10"
                >
                    <PlusIcon className="w-5 h-5" />
                    Novo Projeto
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Create New Card (atalho na grid) */}
                <div 
                    onClick={onNewProject}
                    className="group relative h-48 rounded-2xl bg-[#121214] border border-[#27272a] border-dashed hover:border-gray-500 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 hover:bg-[#18181b]"
                >
                    <div className="w-12 h-12 rounded-full bg-[#27272a] group-hover:bg-[#3f3f46] flex items-center justify-center transition-colors">
                        <PlusIcon className="w-6 h-6 text-gray-400 group-hover:text-white" />
                    </div>
                    <span className="text-gray-400 font-medium group-hover:text-white">Criar novo projeto</span>
                </div>

                {sortedProjects.map((project, index) => (
                    <div 
                        key={project.id} 
                        onClick={() => onLoadProject(project.id)}
                        className="group relative h-48 rounded-2xl bg-[#18181b] border border-[#27272a] overflow-hidden hover:border-gray-500 hover:shadow-2xl hover:shadow-purple-900/10 transition-all cursor-pointer animate-fadeIn"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Gradient Overlay on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
                             {/* Icon based on content */}
                             <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-inner ${
                                 index % 3 === 0 ? 'bg-blue-900/30 text-blue-400' : 
                                 index % 3 === 1 ? 'bg-purple-900/30 text-purple-400' : 
                                 'bg-pink-900/30 text-pink-400'
                             }`}>
                                {index % 2 === 0 ? <SparklesIcon className="w-5 h-5" /> : <FolderIcon className="w-5 h-5" />}
                             </div>

                             <button 
                                onClick={(e) => { e.stopPropagation(); setProjectToDelete(project.id); }}
                                className="p-2 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                title="Excluir projeto"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="absolute bottom-5 left-5 right-5">
                            <h2 className="text-xl font-medium text-white truncate group-hover:text-purple-200 transition-colors">
                                {project.name}
                            </h2>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-medium">
                                <span className="flex items-center gap-1.5 bg-[#27272a] px-2 py-1 rounded-md border border-[#3f3f46]">
                                    <ClockIcon className="w-3 h-3" />
                                    {formatDate(project.updated_at)}
                                </span>
                                <span>{project.files.length} arquivos</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {projects.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
                    <div className="w-16 h-16 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4">
                        <FolderIcon className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">Nenhum projeto encontrado</h3>
                    <p className="text-gray-500 max-w-md">
                        {title === "Meus Projetos" && "Você ainda não criou nenhum projeto."}
                        {title === "Projetos Compartilhados" && "Nenhum projeto foi compartilhado com você ainda."}
                        {title === "Projetos Recentes" && "Seus projetos recentes aparecerão aqui."}
                    </p>
                </div>
            )}
        </div>

        {/* Delete Confirmation Modal */}
        {projectToDelete !== null && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setProjectToDelete(null)}>
                <div 
                    className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-md overflow-hidden animate-slideInUp shadow-2xl relative"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                <TrashIcon className="w-5 h-5" />
                            </div>
                            <button onClick={() => setProjectToDelete(null)} className="text-gray-500 hover:text-white transition-colors">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <h3 className="text-xl font-semibold text-white mb-2">Excluir Projeto?</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Você tem certeza que deseja excluir este projeto? Esta ação removerá permanentemente todos os arquivos e histórico de chat e <span className="text-red-400 font-bold">não pode ser desfeita</span>.
                        </p>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setProjectToDelete(null)}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-white text-sm font-medium transition-colors"
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
