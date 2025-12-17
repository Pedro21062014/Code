
import React, { useState, useEffect } from 'react';
import { GithubIcon, CloseIcon, PlusIcon, LoaderIcon, CheckCircleIcon } from './Icons';
import { ProjectFile } from '../types';

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: { login: string };
}

interface GithubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  githubToken: string | undefined;
  onOpenSettings: () => void;
  projectName: string;
}

export const GithubSyncModal: React.FC<GithubSyncModalProps> = ({ isOpen, onClose, files, githubToken, onOpenSettings, projectName }) => {
  const [repositories, setRepositories] = useState<GithubRepo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRepoName, setNewRepoName] = useState(projectName.toLowerCase().replace(/\s+/g, '-'));
  const [isPrivate, setIsPrivate] = useState(true);

  useEffect(() => {
    if (isOpen && githubToken) {
      fetchRepos();
      setSuccess(null);
      setError(null);
      setNewRepoName(projectName.toLowerCase().replace(/\s+/g, '-'));
    }
  }, [isOpen, githubToken]);

  const fetchRepos = async () => {
    setLoadingRepos(true);
    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
        },
      });
      if (!response.ok) throw new Error('Falha ao buscar repositórios');
      const data = await response.json();
      setRepositories(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingRepos(false);
    }
  };

  const pushFilesToRepo = async (owner: string, repo: string) => {
    setSyncing(true);
    setError(null);
    try {
      const headers = {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
      };

      // 1. Get default branch
      const repoResp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      const repoInfo = await repoResp.json();
      const branch = repoInfo.default_branch || 'main';

      // 2. Create blobs for each file
      const treeItems = await Promise.all(files.map(async (file) => {
        const blobResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            content: btoa(unescape(encodeURIComponent(file.content))),
            encoding: 'base64'
          })
        });
        const blobData = await blobResp.json();
        return {
          path: file.name,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha
        };
      }));

      // 3. Get latest commit SHA
      let baseTreeSha;
      try {
        const refResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers });
        const refData = await refResp.json();
        const commitResp = await fetch(refData.object.url, { headers });
        const commitData = await commitResp.json();
        baseTreeSha = commitData.tree.sha;
      } catch (e) {
        // Might be a fresh repo with no commits
      }

      // 4. Create new tree
      const treeResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems
        })
      });
      const treeData = await treeResp.json();

      // 5. Create commit
      const commitResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: 'Update from Codegen Studio',
          tree: treeData.sha,
          parents: baseTreeSha ? [await (await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers })).json().then(r => r.object.sha)] : []
        })
      });
      const commitData = await commitResp.json();

      // 6. Update reference
      const finalResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        method: baseTreeSha ? 'PATCH' : 'POST',
        headers,
        body: JSON.stringify({
          sha: commitData.sha,
          force: true,
          ...(baseTreeSha ? {} : { ref: `refs/heads/${branch}` })
        })
      });

      if (!finalResp.ok) throw new Error('Falha ao atualizar referência do Git');

      setSuccess(`Sincronizado com sucesso em ${owner}/${repo}`);
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(`Erro ao sincronizar: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateAndPush = async () => {
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
        },
        body: JSON.stringify({
          name: newRepoName,
          private: isPrivate,
          auto_init: true // Create README to ensure branch exists
        })
      });
      if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Falha ao criar repositório');
      }
      const newRepo = await response.json();
      // Wait a bit for GitHub to initialize the repo
      await new Promise(r => setTimeout(r, 2000));
      await pushFilesToRepo(newRepo.owner.login, newRepo.name);
    } catch (err: any) {
      setError(err.message);
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-[#18181b] rounded-2xl shadow-2xl w-full max-w-lg border border-[#27272a] overflow-hidden animate-slideInUp" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-[#27272a] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GithubIcon className="w-5 h-5 text-white" />
            <h2 className="text-xl font-bold text-white">Sincronizar com GitHub</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!githubToken ? (
            <div className="bg-amber-900/20 border border-amber-900/50 p-4 rounded-xl text-center">
              <p className="text-amber-200 text-sm mb-4">Token do GitHub não configurado.</p>
              <button onClick={onOpenSettings} className="px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded-lg hover:bg-amber-400 transition-colors">
                Ir para Configurações
              </button>
            </div>
          ) : (
            <>
              <div className="flex bg-[#09090b] p-1 rounded-xl">
                <button 
                  onClick={() => setIsCreating(false)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isCreating ? 'bg-[#27272a] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Selecionar Repo
                </button>
                <button 
                  onClick={() => setIsCreating(true)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isCreating ? 'bg-[#27272a] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Criar Novo
                </button>
              </div>

              {isCreating ? (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-1">Nome do Repositório</label>
                    <input 
                      type="text" 
                      value={newRepoName}
                      onChange={e => setNewRepoName(e.target.value)}
                      placeholder="meu-app-incrivel"
                      className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-4 px-1">
                    <button 
                      onClick={() => setIsPrivate(true)}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all ${isPrivate ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-transparent border-[#27272a] text-gray-500'}`}
                    >
                      Privado
                    </button>
                    <button 
                      onClick={() => setIsPrivate(false)}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all ${!isPrivate ? 'bg-green-600/20 border-green-500 text-green-400' : 'bg-transparent border-[#27272a] text-gray-500'}`}
                    >
                      Público
                    </button>
                  </div>
                  <button 
                    onClick={handleCreateAndPush}
                    disabled={syncing || !newRepoName}
                    className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {syncing ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
                    Criar e Sincronizar
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Filtrar repositórios..."
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <div className="max-h-60 overflow-y-auto custom-scrollbar border border-[#27272a] rounded-xl bg-[#09090b]">
                    {loadingRepos ? (
                      <div className="p-8 text-center"><LoaderIcon className="w-6 h-6 animate-spin mx-auto text-gray-600" /></div>
                    ) : (
                      repositories.filter(r => r.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map(repo => (
                        <button 
                          key={repo.id}
                          onClick={() => pushFilesToRepo(repo.owner.login, repo.name)}
                          disabled={syncing}
                          className="w-full text-left px-4 py-3 border-b border-[#27272a] last:border-0 hover:bg-[#18181b] transition-colors group flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-200 group-hover:text-white">{repo.full_name}</p>
                            <span className="text-[10px] text-gray-500">{repo.private ? 'Privado' : 'Público'}</span>
                          </div>
                          <span className="text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Push →</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}
              {success && <p className="text-xs text-green-500 bg-green-500/10 p-3 rounded-xl border border-green-500/20 flex items-center gap-2"><CheckCircleIcon className="w-4 h-4" /> {success}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
