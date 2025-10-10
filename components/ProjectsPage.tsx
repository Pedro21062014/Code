import React from 'react';
import { AppLogo, TrashIcon } from './Icons';
import { SavedProject } from '../types';
import { useSession } from '@supabase/auth-helpers-react'; // Fictional hook, illustrates the need for session

interface ProjectsPageProps {
  projects: SavedProject[];
  onLoadProject: (projectId: number) => void;
  onDeleteProject: (projectId: number) => void;
  onBack: () => void;
  onNewProject: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ projects, onLoadProject, onDeleteProject, onBack, onNewProject }) => {

  const handleDelete = (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation(); // Prevent card click
    if (window.confirm('Tem certeza de que deseja excluir este projeto? Esta ação não pode ser desfeita.')) {
      onDeleteProject(projectId);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-screen bg-var-bg-default text-var-fg-default overflow-y-auto font-sans">
      <header className="fixed top-0 left-0 right-0 z-10 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <button onClick={onNewProject} className="flex items-center gap-2">
            <AppLogo className="w-6 h-6 text-var-accent" />
            <span className="text-var-fg-default font-semibold text-lg">codegen<span className="font-light">studio</span></span>
          </button>
          <button onClick={onBack} className="text-sm text-var-fg-muted hover:text-var-fg-default transition-colors">
            &larr; Voltar
          </button>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center px-4 pt-24 pb-12">
        <h1 className="text-5xl md:text-6xl font-bold text-var-fg-default tracking-tight">Meus Projetos</h1>
        <p className="mt-4 text-lg text-var-fg-muted max-w-2xl">Carregue um projeto salvo para continuar trabalhando ou exclua projetos antigos.</p>

        <div className="mt-12 w-full max-w-4xl">
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).map(project => (
                <div 
                  key={project.id} 
                  onClick={() => onLoadProject(project.id)}
                  className="group relative flex flex-col justify-between bg-var-bg-subtle p-6 rounded-lg border border-var-border-default hover:border-var-accent transition-all cursor-pointer shadow-lg hover:shadow-var-accent/10"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-var-fg-default truncate group-hover:text-var-accent">{project.name}</h2>
                    <p className="text-sm text-var-fg-muted mt-1">
                      Atualizado em: {new Date(project.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, project.id)}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-var-fg-subtle bg-var-bg-interactive opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all"
                    aria-label="Excluir projeto"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-var-border-default rounded-lg">
              <h2 className="text-xl font-semibold text-var-fg-muted">
                Nenhum projeto salvo encontrado.
              </h2>
              <p className="text-var-fg-subtle mt-2">
                Use o ícone de salvar na barra lateral do editor para salvar seu trabalho.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};