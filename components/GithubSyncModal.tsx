
import React, { useState, useEffect } from 'react';
import { GithubIcon, CloseIcon, PlusIcon, LoaderIcon, CheckCircleIcon, TerminalIcon, KeyIcon } from './Icons';
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
  onSaveToken?: (token: string) => void;
}

export const GithubSyncModal: React.FC<GithubSyncModalProps> = ({ isOpen, onClose, files, githubToken, onOpenSettings, projectName, onSaveToken }) => {
  const [repositories, setRepositories] = useState<GithubRepo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [manualToken, setManualToken] = useState('');

  useEffect(() => {
    if (isOpen && githubToken) {
      fetchRepos();
      setSuccess(null);
      setError(null);
      setLogs([]);
      setNewRepoName(projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  }, [isOpen, githubToken, projectName]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

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

  const handleSaveToken = () => {
      if (manualToken.trim() && onSaveToken) {
          onSaveToken(manualToken.trim());
      }
  };

  const pushFilesToRepo = async (owner: string, repo: string) => {
    setSyncing(true);
    setError(null);
    setLogs([`Iniciando sincronização com ${owner}/${repo}...`]);
    
    try {
      const headers = {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
      };

      addLog("Verificando branch padrão...");
      const repoResp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if(!repoResp.ok) throw new Error("Repositório não acessível");
      const repoInfo = await repoResp.json();
      const branch = repoInfo.default_branch || 'main';

      addLog(`Preparando ${files.length} arquivos para upload...`);
      // Create blobs concurrently
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

      addLog("Obtendo referência do commit...");
      let baseTreeSha;
      try {
        const refResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers });
        const refData = await refResp.json();
        const commitResp = await fetch(refData.object.url, { headers });
        const commitData = await commitResp.json();
        baseTreeSha = commitData.tree.sha;
      } catch (e) {
        addLog("Repositório vazio detectado. Criando commit inicial.");
      }

      addLog("Construindo árvore de arquivos...");
      const treeResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems
        })
      });
      const treeData = await treeResp.json();

      addLog("Criando commit...");
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

      addLog("Atualizando referência remota...");
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

      addLog("Sincronização concluída com sucesso.");
      setSuccess(`Código enviado para ${owner}/${repo}`);
      setTimeout(onClose, 2500);
    } catch (err: any) {
      addLog(`ERRO: ${err.message}`);
      setError(`Erro ao sincronizar: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateAndPush = async () => {
    setSyncing(true);
    setError(null);
    setLogs([`Criando repositório ${newRepoName}...`]);
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
      addLog("Repositório criado. Aguardando propagação...");
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-[#09090b] rounded-2xl shadow-2xl w-full max-w-xl border border-[#27272a] overflow-hidden animate-slideInUp flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#27272a] flex justify-between items-center bg-[#0c0c0e]">
          <div className="flex items-center gap-2">
            <GithubIcon className="w-5 h-5 text-white" />
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Version Control</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {!githubToken ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
               <div className="w-16 h-16 rounded-2xl bg-[#18181b] flex items-center justify-center border border-[#27272a]">
                 <GithubIcon className="w-8 h-8 text-gray-500" />
               </div>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                  Token do GitHub não configurado. Adicione-o aqui para sincronizar seus projetos.
              </p>
              
              <div className="w-full max-w-sm flex flex-col gap-2">
                  <input
                    type="password"
                    placeholder="ghp_..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="w-full p-2 bg-[#121214] border border-[#27272a] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button 
                    onClick={handleSaveToken}
                    disabled={!manualToken.trim()}
                    className="px-6 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Salvar e Continuar
                  </button>
              </div>
            </div>
          ) : syncing ? (
             <div className="py-4 space-y-4">
                 <div className="flex items-center gap-3 text-white">
                     <LoaderIcon className="w-5 h-5 animate-spin text-blue-500" />
                     <span className="font-mono text-sm">Executando operação git...</span>
                 </div>
                 <div className="bg-[#000] rounded-lg border border-[#27272a] p-4 h-48 overflow-y-auto font-mono text-[10px] text-gray-400 space-y-1 custom-scrollbar">
                     {logs.map((log, i) => <div key={i}>{log}</div>)}
                 </div>
             </div>
          ) : success ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                      <CheckCircleIcon className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-white font-medium">Sincronização Concluída</h3>
                  <p className="text-gray-500 text-sm">{success}</p>
              </div>
          ) : (
            <>
              {/* Tab Switcher */}
              <div className="flex bg-[#121214] p-1 rounded-lg border border-[#27272a]">
                <button 
                  onClick={() => setIsCreating(false)}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${!isCreating ? 'bg-[#27272a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Push Existente
                </button>
                <button 
                  onClick={() => setIsCreating(true)}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${isCreating ? 'bg-[#27272a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Criar Novo
                </button>
              </div>

              {isCreating ? (
                <div className="space-y-5 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-500 uppercase ml-1">Repository Name</label>
                    <div className="flex items-center bg-[#121214] border border-[#27272a] rounded-lg px-3 focus-within:border-blue-500 transition-colors">
                        <span className="text-gray-500 text-sm font-mono mr-1">git/</span>
                        <input 
                            type="text" 
                            value={newRepoName}
                            onChange={e => setNewRepoName(e.target.value)}
                            className="flex-1 bg-transparent py-3 text-white text-sm focus:outline-none font-mono"
                            placeholder="project-name"
                        />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setIsPrivate(true)}
                      className={`py-3 px-4 rounded-lg border text-left transition-all ${isPrivate ? 'bg-blue-900/10 border-blue-500/50' : 'bg-[#121214] border-[#27272a] hover:border-gray-600'}`}
                    >
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Visibilidade</div>
                        <div className={`text-sm font-medium ${isPrivate ? 'text-blue-400' : 'text-white'}`}>Privado</div>
                    </button>
                    <button 
                      onClick={() => setIsPrivate(false)}
                      className={`py-3 px-4 rounded-lg border text-left transition-all ${!isPrivate ? 'bg-green-900/10 border-green-500/50' : 'bg-[#121214] border-[#27272a] hover:border-gray-600'}`}
                    >
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Visibilidade</div>
                        <div className={`text-sm font-medium ${!isPrivate ? 'text-green-400' : 'text-white'}`}>Público</div>
                    </button>
                  </div>

                  <button 
                    onClick={handleCreateAndPush}
                    disabled={!newRepoName}
                    className="w-full bg-white text-black py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Inicializar Repositório
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Filtrar seus repositórios..."
                    className="w-full bg-[#121214] border border-[#27272a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 transition-all font-mono placeholder-gray-600"
                  />
                  
                  <div className="h-48 overflow-y-auto custom-scrollbar border border-[#27272a] rounded-lg bg-[#0c0c0e]">
                    {loadingRepos ? (
                      <div className="h-full flex items-center justify-center"><LoaderIcon className="w-5 h-5 animate-spin text-gray-600" /></div>
                    ) : (
                      repositories.filter(r => r.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map(repo => (
                        <button 
                          key={repo.id}
                          onClick={() => pushFilesToRepo(repo.owner.login, repo.name)}
                          className="w-full text-left px-4 py-3 border-b border-[#27272a] last:border-0 hover:bg-[#18181b] transition-colors group flex items-center justify-between"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-mono text-gray-300 group-hover:text-white transition-colors">{repo.full_name}</span>
                            <span className="text-[10px] text-gray-600">{repo.private ? 'Private' : 'Public'}</span>
                          </div>
                          <span className="text-[10px] text-white font-bold bg-[#27272a] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">PUSH</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
