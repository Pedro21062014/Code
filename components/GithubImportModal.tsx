import React, { useState, useEffect } from 'react';
import { GithubIcon, CloseIcon } from './Icons';
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
}

interface GithubImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (files: ProjectFile[]) => void;
  githubToken: string | undefined;
  onOpenSettings: () => void;
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
        case 'py': return 'python';
        case 'rb': return 'ruby';
        case 'go': return 'go';
        case 'rs': return 'rust';
        case 'java': return 'java';
        case 'cs': return 'csharp';
        case 'php': return 'php';
        case 'sh': return 'shell';
        case 'yml':
        case 'yaml': return 'yaml';
        case 'dockerfile': return 'dockerfile';
        case 'sql': return 'sql';
        case 'graphql': return 'graphql';
        case 'vue': return 'vue';
        case 'svelte': return 'svelte';
        default: return 'plaintext';
    }
}

export const GithubImportModal: React.FC<GithubImportModalProps> = ({ isOpen, onClose, onImport, githubToken, onOpenSettings }) => {
  const [repositories, setRepositories] = useState<GithubRepo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importingRepoName, setImportingRepoName] = useState<string | null>(null);

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
          if (response.status === 401) throw new Error("Token do GitHub inválido ou expirado. Verifique-o nas configurações.");
          throw new Error(`Não foi possível buscar repositórios. Status: ${response.status}`);
        }

        const data = await response.json();
        setRepositories(data);

      } catch (err) {
        const message = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
        setRepoError(message);
      } finally {
        setLoadingRepos(false);
      }
    };
    
    if (isOpen) {
      // Reset state on open
      setSearchTerm('');
      setImportError(null);
      setImportingRepoName(null);
      fetchRepositories();
    }
  }, [isOpen, githubToken]);


  const handleImport = async (repo: GithubRepo) => {
    setImportError(null);
    setImportingRepoName(repo.full_name);
    
    if (!githubToken) {
        setImportError("Token de acesso do GitHub não encontrado. Por favor, adicione seu token nas configurações.");
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
        if (!repoDataResponse.ok) {
            if (repoDataResponse.status === 404) throw new Error("Repositório não encontrado. Verifique a URL e se o token tem acesso a ele.");
            if (repoDataResponse.status === 401) throw new Error("Token do GitHub inválido ou expirado.");
            throw new Error(`Não foi possível buscar os metadados do repositório. Status: ${repoDataResponse.status}`);
        }
        const repoData = await repoDataResponse.json();
        const defaultBranch = repoData.default_branch;

        const branchResponse = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/branches/${defaultBranch}`, { headers });
        if (!branchResponse.ok) throw new Error(`Não foi possível buscar a branch padrão '${defaultBranch}'.`);
        const branchData = await branchResponse.json();
        const treeSha = branchData.commit.commit.tree.sha;

        const treeResponse = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/git/trees/${treeSha}?recursive=1`, { headers });
        if (!treeResponse.ok) throw new Error('Não foi possível buscar a árvore de arquivos do repositório.');
        const treeData = await treeResponse.json();
        
        const fileBlobs = treeData.tree.filter((node: any) => node.type === 'blob' && node.size < 1000000);

        const importedFilesPromises = fileBlobs.map(async (fileNode: any) => {
            const contentResponse = await fetch(fileNode.url, { headers });
            if (!contentResponse.ok) {
                console.warn(`Skipping file ${fileNode.path} due to fetch error.`);
                return null;
            }
            const blobData = await contentResponse.json();
            
            if (blobData.encoding !== 'base64') {
                console.warn(`Skipping file ${fileNode.path} due to unsupported encoding: ${blobData.encoding}`);
                return null;
            }
            
            let content;
            try {
                // Use TextDecoder for better UTF-8 support
                const binaryString = atob(blobData.content);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                content = new TextDecoder('utf-8').decode(bytes);
            } catch (e) {
                console.warn(`Skipping file ${fileNode.path} due to decoding error (likely a binary file).`);
                return null;
            }

            return {
                name: fileNode.path,
                language: getFileLanguage(fileNode.path),
                content: content,
            };
        });

        const importedFiles = (await Promise.all(importedFilesPromises)).filter((f): f is ProjectFile => f !== null);
        
        onImport(importedFiles);

    } catch (err) {
        const message = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
        setImportError(`Falha ao importar repositório: ${message}`);
    } finally {
        setIsLoading(false);
        setImportingRepoName(null);
    }
  };

  const filteredRepositories = repositories.filter(repo =>
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-var-fg-muted">
           <svg className="animate-spin h-8 w-8 text-var-accent mb-4" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Importando <span className="font-bold text-var-fg-default">{importingRepoName}</span>...</p>
          <p className="text-sm text-var-fg-subtle">Isso pode levar alguns instantes.</p>
        </div>
      );
    }

    if (!githubToken) {
      return (
        <div className="p-3 bg-yellow-900/50 border border-yellow-700/50 rounded-lg text-sm text-yellow-200 mt-4">
          Nenhum token de acesso do GitHub foi encontrado. Por favor, <button onClick={onOpenSettings} className="underline font-bold hover:text-white">adicione um nas configurações</button> para ver e importar seus repositórios.
        </div>
      );
    }

    return (
      <>
        <div className="my-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar em seus repositórios..."
            className="w-full p-2 bg-var-bg-interactive border border-var-border-default rounded-md text-var-fg-default placeholder-var-fg-subtle focus:outline-none focus:ring-2 focus:ring-var-accent/50"
          />
        </div>
        
        {loadingRepos && <div className="flex items-center justify-center h-64 text-var-fg-muted"><svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Buscando repositórios...</div>}
        {repoError && <p className="text-red-400 text-sm py-4 text-center">{repoError}</p>}
        
        {!loadingRepos && !repoError && (
          <div className="max-h-80 overflow-y-auto border border-var-border-default rounded-md bg-var-bg-muted">
            {filteredRepositories.length > 0 ? (
              <ul>
                {filteredRepositories.map(repo => (
                  <li key={repo.id} className="border-b border-var-border-default last:border-b-0">
                    <button
                      onClick={() => handleImport(repo)}
                      className="w-full text-left p-3 hover:bg-var-accent/10 transition-colors duration-150"
                    >
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-var-fg-default">{repo.full_name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${repo.private ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
                          {repo.private ? 'Privado' : 'Público'}
                        </span>
                      </div>
                      <p className="text-sm text-var-fg-muted mt-1 truncate">{repo.description}</p>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-var-fg-subtle text-center p-8">Nenhum repositório encontrado.</p>
            )}
          </div>
        )}
      </>
    );
  };


  return (
    <div 
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center"
      onClick={isLoading ? undefined : onClose}
    >
      <div 
        className="bg-var-bg-subtle rounded-lg shadow-xl w-full max-w-2xl p-6 border border-var-border-default"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-var-fg-default flex items-center gap-2">
            <GithubIcon /> Importar do GitHub
          </h2>
          <button onClick={isLoading ? undefined : onClose} className="p-1 rounded-md text-var-fg-muted hover:bg-var-bg-interactive disabled:opacity-50" disabled={isLoading}>
            <CloseIcon />
          </button>
        </div>
        
        {renderContent()}

        {importError && <p className="text-red-400 text-sm mt-4 text-center">{importError}</p>}

      </div>
    </div>
  );
};
