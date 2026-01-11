
import React, { useState, useEffect } from 'react';
import { GithubIcon, CloseIcon, KeyIcon, LoaderIcon } from './Icons';
import { ProjectFile } from '../types';

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  owner: {
    login: string;
  };
  updated_at: string;
}

interface GithubImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (files: ProjectFile[]) => void;
  githubToken: string | undefined;
  onOpenSettings: () => void;
  onSaveToken?: (token: string) => void;
}

const getFileLanguage = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'js': return 'javascript';
        case 'ts': return 'typescript';
        case 'tsx': return 'typescript';
        case 'html': return 'html';
        case 'css': return 'css';
        case 'json': return 'json';
        case 'md': return 'markdown';
        default: return 'plaintext';
    }
}

export const GithubImportModal: React.FC<GithubImportModalProps> = ({ isOpen, onClose, onImport, githubToken, onOpenSettings, onSaveToken }) => {
  const [repositories, setRepositories] = useState<GithubRepo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importingRepoName, setImportingRepoName] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');

  useEffect(() => {
    const fetchRepositories = async () => {
      if (!githubToken) return;
      setLoadingRepos(true);
      setRepoError(null);
      setRepositories([]);

      try {
        const response = await fetch('https://api.github.com/user/repos?sort=updated&direction=desc&per_page=100', {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        });

        if (!response.ok) {
          if (response.status === 401) throw new Error("Token expirado.");
          throw new Error(`Erro: ${response.status}`);
        }

        const data = await response.json();
        setRepositories(data);

      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido.";
        setRepoError(message);
      } finally {
        setLoadingRepos(false);
      }
    };
    
    if (isOpen) {
      setSearchTerm('');
      setImportError(null);
      setImportingRepoName(null);
      fetchRepositories();
    }
  }, [isOpen, githubToken]);

  const handleSaveToken = () => {
      if (manualToken.trim() && onSaveToken) {
          onSaveToken(manualToken.trim());
      }
  };

  const handleImport = async (repo: GithubRepo) => {
    setImportError(null);
    setImportingRepoName(repo.full_name);
    
    if (!githubToken) {
        setImportError("Token não encontrado.");
        return;
    }
    
    setIsLoading(true);

    try {
        const headers = {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        };
        
        const repoInfo = { owner: repo.owner.login, repo: repo.name };
        const repoDataResponse = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`, { headers });
        if (!repoDataResponse.ok) throw new Error("Erro ao acessar repositório.");
        
        const repoData = await repoDataResponse.json();
        const defaultBranch = repoData.default_branch;

        const branchResponse = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/branches/${defaultBranch}`, { headers });
        const branchData = await branchResponse.json();
        const treeSha = branchData.commit.commit.tree.sha;

        const treeResponse = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/git/trees/${treeSha}?recursive=1`, { headers });
        const treeData = await treeResponse.json();
        
        const fileBlobs = treeData.tree.filter((node: any) => node.type === 'blob' && node.size < 1000000);

        const importedFilesPromises = fileBlobs.map(async (fileNode: any) => {
            const contentResponse = await fetch(fileNode.url, { headers });
            if (!contentResponse.ok) return null;
            const blobData = await contentResponse.json();
            
            if (blobData.encoding !== 'base64') return null;
            
            let content;
            try {
                const binaryString = atob(blobData.content);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                content = new TextDecoder('utf-8').decode(bytes);
            } catch (e) { return null; }

            return {
                name: fileNode.path,
                language: getFileLanguage(fileNode.path),
                content: content,
            };
        });

        const importedFiles = (await Promise.all(importedFilesPromises)).filter((f): f is ProjectFile => f !== null);
        onImport(importedFiles);
        onClose();

    } catch (err) {
        setImportError("Falha na importação.");
    } finally {
        setIsLoading(false);
        setImportingRepoName(null);
    }
  };

  const filteredRepositories = repositories.filter(repo =>
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 animate-fadeIn"
      onClick={isLoading ? undefined : onClose}
    >
      <div 
        className="bg-white dark:bg-[#09090b] w-full max-w-2xl border border-gray-200 dark:border-[#27272a] shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[70vh] animate-slideInUp transition-colors"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Compacto */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#27272a] bg-gray-50 dark:bg-[#0c0c0e]">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white/90">
             <GithubIcon className="w-4 h-4" />
             <span className="text-sm font-medium">Clonar Repositório</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white transition-colors">
             <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {!githubToken ? (
           <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#18181b] flex items-center justify-center border border-gray-200 dark:border-[#27272a]">
                 <KeyIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                  <h3 className="text-gray-900 dark:text-white font-medium text-lg">Conexão Necessária</h3>
                  <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
                      Para acessar seus repositórios, insira seu Token de Acesso Pessoal do GitHub (escopo: repo).
                  </p>
              </div>
              
              <div className="w-full max-w-sm flex flex-col gap-2">
                  <input
                    type="password"
                    placeholder="ghp_..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="w-full p-2 bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button 
                    onClick={handleSaveToken}
                    disabled={!manualToken.trim()}
                    className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    Salvar e Continuar
                  </button>
              </div>
           </div>
        ) : (
           <div className="flex flex-col h-full overflow-hidden">
               <div className="p-2 border-b border-gray-200 dark:border-[#27272a]">
                  <input
                    type="text"
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar por nome..."
                    className="w-full bg-gray-50 dark:bg-[#121214] text-gray-900 dark:text-white text-sm px-3 py-2 rounded-lg border border-transparent focus:border-blue-500/50 dark:focus:border-[#3f3f46] focus:outline-none placeholder-gray-500 dark:placeholder-gray-600 font-mono"
                  />
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                   {loadingRepos ? (
                       <div className="flex items-center justify-center py-10 gap-2 text-gray-500 text-xs">
                           <LoaderIcon className="w-4 h-4 animate-spin" /> Carregando lista...
                       </div>
                   ) : filteredRepositories.length === 0 ? (
                       <div className="text-center py-10 text-gray-600 text-xs">Nenhum repositório encontrado.</div>
                   ) : (
                       <div className="space-y-0.5">
                           {filteredRepositories.map(repo => (
                               <button
                                   key={repo.id}
                                   onClick={() => handleImport(repo)}
                                   disabled={isLoading}
                                   className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#27272a] rounded-md group transition-colors disabled:opacity-50"
                               >
                                   <div className="flex items-center gap-3 overflow-hidden">
                                       <span className="text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                                            {repo.private ? (
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                            ) : (
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> 
                                            )}
                                       </span>
                                       <span className="text-sm text-gray-700 dark:text-gray-300 font-mono group-hover:text-black dark:group-hover:text-white truncate">
                                           {repo.full_name}
                                       </span>
                                   </div>
                                   {importingRepoName === repo.full_name ? (
                                       <LoaderIcon className="w-3.5 h-3.5 animate-spin text-black dark:text-white" />
                                   ) : (
                                       <span className="text-[10px] text-gray-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                           Clonar
                                       </span>
                                   )}
                               </button>
                           ))}
                       </div>
                   )}
               </div>
               
               {importError && (
                   <div className="p-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs text-center">
                       {importError}
                   </div>
               )}
           </div>
        )}
      </div>
    </div>
  );
};
