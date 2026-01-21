
import React, { useState, useEffect } from 'react';
import { GithubIcon, CloseIcon, PlusIcon, LoaderIcon, CheckCircleIcon, TerminalIcon, KeyIcon, LogOutIcon } from './Icons';
import { ProjectFile } from '../types';

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: { login: string };
  html_url: string;
}

interface GithubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  githubToken: string | undefined;
  onOpenSettings: () => void;
  projectName: string;
  onSaveToken?: (token: string) => void;
  connectedRepo?: { owner: string; name: string; branch: string; url: string } | null;
  onConnect?: (repo: { owner: string; name: string; branch: string; url: string }) => void;
  onDisconnect?: () => void;
}

export const GithubSyncModal: React.FC<GithubSyncModalProps> = ({ 
    isOpen, onClose, files, githubToken, onOpenSettings, projectName, onSaveToken,
    connectedRepo, onConnect, onDisconnect
}) => {
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

  // Local state to track connection within the modal session if props update
  const [activeRepo, setActiveRepo] = useState(connectedRepo);

  useEffect(() => {
    if (isOpen) {
        setActiveRepo(connectedRepo); // Reset to prop state on open
        if (githubToken && !connectedRepo) {
            fetchRepos();
        }
        setSuccess(null);
        setError(null);
        setLogs([]);
        setNewRepoName(projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  }, [isOpen, githubToken, projectName, connectedRepo]);

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
      if (!response.ok) {
          if (response.status === 401) throw new Error("Token expirado ou inválido.");
          throw new Error('Falha ao buscar repositórios');
      }
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

  const handleDisconnect = () => {
      if (window.confirm("Isso removerá o vínculo deste projeto com o repositório GitHub. O código no GitHub permanecerá intacto.")) {
          if (onDisconnect) onDisconnect();
          setActiveRepo(null);
          fetchRepos(); // Load list for new selection
      }
  };

  const pushFilesToRepo = async (owner: string, repo: string, repoUrl?: string) => {
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
      const url = repoUrl || repoInfo.html_url;

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
        if (refResp.status === 409) {
             addLog("Repositório vazio ou conflito. Tentando push inicial.");
        } else {
            const refData = await refResp.json();
            if (refData.object && refData.object.url) {
                const commitResp = await fetch(refData.object.url, { headers });
                const commitData = await commitResp.json();
                baseTreeSha = commitData.tree.sha;
            }
        }
      } catch (e) {
        addLog("Repositório parece vazio. Criando commit inicial.");
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
      const parents = baseTreeSha ? [await (await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers })).json().then(r => r.object.sha).catch(() => null)] : [];
      
      const commitResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: 'Update from Codegen Studio',
          tree: treeData.sha,
          parents: parents.filter(p => p !== null)
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

      if (!finalResp.ok) {
          const errTxt = await finalResp.text();
          throw new Error(`Falha no git ref update: ${errTxt}`);
      }

      addLog("Sincronização concluída com sucesso.");
      setSuccess(`Código enviado para ${owner}/${repo}`);
      
      if (onConnect) {
          onConnect({ owner, name: repo, branch, url });
      }

      setTimeout(onClose, 2500);
    } catch (err: any) {
      addLog(`ERRO: ${err.message}`);
      setError(`Erro ao sincronizar: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateAndPush = async () => {
    if (!newRepoName.trim()) return;
    const sanitizedName = newRepoName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    
    setSyncing(true);
    setError(null);
    setLogs([`Criando repositório ${sanitizedName}...`]);
    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
        },
        body: JSON.stringify({
          name: sanitizedName,
          private: isPrivate,
          auto_init: true
        })
      });
      
      if (!response.ok) {
          const errData = await response.json();
          if (response.status === 422) {
              throw new Error(`O repositório '${sanitizedName}' já existe.`);
          }
          throw new Error(errData.message || 'Falha ao criar repositório');
      }
      
      const newRepo = await response.json();
      addLog("Repositório criado. Aguardando propagação...");
      await new Promise(r => setTimeout(r, 4000));
      await pushFilesToRepo(newRepo.owner.login, newRepo.name, newRepo.html_url);
    } catch (err: any) {
      setError(err.message);
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#09090b] rounded-2xl shadow-2xl w-full max-w-xl border border-gray-200 dark:border-[#27272a] overflow-hidden animate-slideInUp flex flex-col max-h-[85vh] transition-colors"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#27272a] flex justify-between items-center bg-gray-50/50 dark:bg-[#0c0c0e]/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="bg-black dark:bg-white p-1.5 rounded-lg">
                <GithubIcon className="w-5 h-5 text-white dark:text-black" />
            </div>
            <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Git Sync</h2>
                <p className="text-[10px] text-gray-500">Versionamento & Backup</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1c]">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-white dark:bg-[#09090b]">
          
          {!githubToken ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
               <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-[#18181b] flex items-center justify-center border border-gray-200 dark:border-[#27272a] shadow-inner">
                 <KeyIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
               </div>
              <div className="max-w-xs mx-auto">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Conexão Necessária</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Configure seu token do GitHub para sincronizar seus projetos automaticamente.
                  </p>
              </div>
              
              <div className="w-full max-w-sm flex flex-col gap-3">
                  <input
                    type="password"
                    placeholder="Cole seu token (ghp_...)"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 transition-all text-center"
                  />
                  <button 
                    type="button"
                    onClick={handleSaveToken}
                    disabled={!manualToken.trim()}
                    className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
                  >
                    Salvar e Continuar
                  </button>
              </div>
            </div>
          ) : syncing ? (
             <div className="py-8 space-y-6 flex flex-col items-center">
                 <div className="relative">
                     <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full animate-pulse"></div>
                     <LoaderIcon className="w-12 h-12 animate-spin text-blue-500 relative z-10" />
                 </div>
                 <div className="text-center">
                     <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Sincronizando...</h3>
                     <p className="text-xs text-gray-500">Enviando arquivos para o GitHub</p>
                 </div>
                 <div className="w-full bg-gray-50 dark:bg-[#121214] rounded-xl border border-gray-200 dark:border-[#27272a] p-4 h-40 overflow-y-auto font-mono text-[10px] text-gray-600 dark:text-gray-400 space-y-1 custom-scrollbar shadow-inner">
                     {logs.map((log, i) => <div key={i} className="border-l-2 border-gray-300 dark:border-gray-700 pl-2">{log}</div>)}
                 </div>
             </div>
          ) : success ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center animate-scaleIn">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                      <CheckCircleIcon className="w-10 h-10 text-green-500" />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sucesso!</h3>
                      <p className="text-gray-500 text-sm mt-1">{success}</p>
                  </div>
              </div>
          ) : activeRepo ? (
              // CONNECTED STATE VIEW
              <div className="flex flex-col items-center justify-center space-y-8 py-4">
                  <div className="w-full bg-gradient-to-br from-gray-50 to-white dark:from-[#121214] dark:to-black border border-gray-200 dark:border-[#27272a] rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden shadow-sm group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors"></div>
                      
                      <div className="w-16 h-16 bg-white dark:bg-[#1a1a1c] rounded-2xl flex items-center justify-center mb-4 shadow-md border border-gray-100 dark:border-[#27272a]">
                          <GithubIcon className="w-8 h-8 text-black dark:text-white" />
                      </div>
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">{activeRepo.owner}/{activeRepo.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold rounded-full border border-green-200 dark:border-green-800">
                              CONNECTED
                          </span>
                          <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                              {activeRepo.branch}
                          </span>
                      </div>
                      <a href={activeRepo.url} target="_blank" rel="noreferrer" className="mt-4 text-xs text-blue-500 hover:underline">Abrir no GitHub &rarr;</a>
                  </div>

                  <div className="w-full space-y-3">
                      <button 
                          type="button"
                          onClick={() => pushFilesToRepo(activeRepo.owner, activeRepo.name, activeRepo.url)}
                          className="w-full flex items-center justify-center gap-3 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                      >
                          <TerminalIcon className="w-4 h-4" />
                          Push Changes (Sincronizar)
                      </button>
                      
                      <button 
                          type="button"
                          onClick={handleDisconnect}
                          className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-medium text-xs hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      >
                          <LogOutIcon className="w-3.5 h-3.5" />
                          Desconectar Repositório
                      </button>
                  </div>
              </div>
          ) : (
            // SELECT / CREATE VIEW
            <>
              {/* Tab Switcher */}
              <div className="flex bg-gray-100 dark:bg-[#121214] p-1 rounded-xl border border-gray-200 dark:border-[#27272a]">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${!isCreating ? 'bg-white dark:bg-[#27272a] text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Selecionar Existente
                </button>
                <button 
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${isCreating ? 'bg-white dark:bg-[#27272a] text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Criar Novo
                </button>
              </div>

              {isCreating ? (
                <div className="space-y-6 animate-fadeIn py-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Nome do Repositório</label>
                    <div className="flex items-center bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] rounded-xl px-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <span className="text-gray-400 text-sm font-mono mr-2">git/</span>
                        <input 
                            type="text" 
                            value={newRepoName}
                            onChange={e => setNewRepoName(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, ''))}
                            className="flex-1 bg-transparent py-3 text-gray-900 dark:text-white text-sm focus:outline-none font-mono"
                            placeholder="meu-projeto-incrivel"
                        />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className={`p-4 rounded-xl border text-left transition-all ${isPrivate ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-500 shadow-sm' : 'bg-white dark:bg-[#121214] border-gray-200 dark:border-[#27272a] hover:border-gray-300'}`}
                    >
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Privado</div>
                        <div className={`text-sm font-semibold ${isPrivate ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>Apenas Você</div>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className={`p-4 rounded-xl border text-left transition-all ${!isPrivate ? 'bg-green-50 dark:bg-green-900/10 border-green-500 shadow-sm' : 'bg-white dark:bg-[#121214] border-gray-200 dark:border-[#27272a] hover:border-gray-300'}`}
                    >
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Público</div>
                        <div className={`text-sm font-semibold ${!isPrivate ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>Qualquer um</div>
                    </button>
                  </div>

                  <button 
                    type="button"
                    onClick={handleCreateAndPush}
                    disabled={!newRepoName}
                    className="w-full bg-black dark:bg-white text-white dark:text-black py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Criar e Inicializar
                  </button>
                  
                  {error && <p className="text-red-500 text-xs text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn py-2">
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar seus repositórios..."
                    className="w-full bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                  />
                  
                  <div className="h-64 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {loadingRepos ? (
                      <div className="h-full flex items-center justify-center gap-2 text-gray-500 text-sm"><LoaderIcon className="w-4 h-4 animate-spin" /> Carregando...</div>
                    ) : (
                      repositories.filter(r => r.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map(repo => (
                        <button 
                          type="button"
                          key={repo.id}
                          onClick={() => pushFilesToRepo(repo.owner.login, repo.name, repo.html_url)}
                          className="w-full text-left p-3 border border-gray-200 dark:border-[#27272a] hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl transition-all group flex items-center justify-between"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 truncate">{repo.full_name}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">{repo.private ? 'Privado' : 'Público'}</span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-black border border-gray-200 dark:border-[#27272a] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <TerminalIcon className="w-4 h-4 text-blue-500" />
                          </div>
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
