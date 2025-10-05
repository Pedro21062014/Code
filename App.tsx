import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EditorView } from './components/EditorView';
import { ChatPanel } from './components/ChatPanel';
import { SettingsModal } from './components/SettingsModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { PricingPage } from './components/PricingPage';
import { ProjectsPage } from './components/ProjectsPage';
import { GithubImportModal } from './components/GithubImportModal';
import { PublishModal } from './components/PublishModal';
import { AuthModal } from './components/AuthModal';
import { ImageStudioModal } from './components/ImageStudioModal';
import { SupabaseAdminModal } from './components/SupabaseAdminModal';
import { ProjectFile, ChatMessage, AIProvider, UserSettings, Theme, SavedProject } from './types';
import { downloadProjectAsZip } from './services/projectService';
import { INITIAL_CHAT_MESSAGE, DEFAULT_GEMINI_API_KEY } from './constants';
import { generateCodeStreamWithGemini, generateProjectName } from './services/geminiService';
import { generateCodeStreamWithOpenAI } from './services/openAIService';
import { generateCodeStreamWithDeepSeek } from './services/deepseekService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MenuIcon, ChatIcon, AppLogo } from './components/Icons';
import { supabase } from './services/supabase';
import type { Session, User } from '@supabase/supabase-js';


const Header: React.FC<{ onToggleSidebar: () => void; onToggleChat: () => void; projectName: string }> = ({ onToggleSidebar, onToggleChat, projectName }) => (
  <div className="lg:hidden flex justify-between items-center p-2 bg-var-bg-subtle border-b border-var-border-default flex-shrink-0">
    <button onClick={onToggleSidebar} className="p-2 rounded-md text-var-fg-muted hover:bg-var-bg-interactive">
      <MenuIcon />
    </button>
    <h1 className="text-sm font-semibold text-var-fg-default truncate">{projectName}</h1>
    <button onClick={onToggleChat} className="p-2 rounded-md text-var-fg-muted hover:bg-var-bg-interactive">
      <ChatIcon />
    </button>
  </div>
);

const InitializingOverlay: React.FC<{ projectName: string }> = ({ projectName }) => (
  <div className="absolute inset-0 bg-var-bg-default/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-var-fg-default animate-fadeIn">
    <AppLogo className="w-12 h-12 text-var-accent animate-pulse" style={{ animationDuration: '2s' }} />
    <h2 className="mt-4 text-2xl font-bold">Gerando seu novo projeto...</h2>
    <p className="text-lg text-var-fg-muted">{projectName}</p>
  </div>
);


const extractAndParseJson = (text: string): any => {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    console.error("Could not find valid JSON object delimiters {} in AI response:", text);
    throw new Error("Não foi encontrado nenhum objeto JSON válido na resposta da IA. A resposta pode estar incompleta ou em um formato inesperado.");
  }

  const jsonString = text.substring(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonString);
  } catch (parseError) {
    console.error("Failed to parse extracted JSON:", parseError);
    console.error("Extracted JSON string:", jsonString);
    const message = parseError instanceof Error ? parseError.message : "Erro de análise desconhecido.";
    throw new Error(`A resposta da IA continha um JSON malformado. Detalhes: ${message}`);
  }
};

interface ProjectState {
  files: ProjectFile[];
  activeFile: string | null;
  chatMessages: ChatMessage[];
  projectName: string;
  envVars: Record<string, string>;
  currentProjectId: number | null; // Database ID
}

const initialProjectState: ProjectState = {
  files: [],
  activeFile: null,
  chatMessages: [{ role: 'assistant', content: INITIAL_CHAT_MESSAGE }],
  projectName: 'NovoProjeto',
  envVars: {},
  currentProjectId: null,
};


const App: React.FC = () => {
  const [project, setProject] = useLocalStorage<ProjectState>('codegen-studio-project', initialProjectState);
  const { files, activeFile, chatMessages, projectName, envVars, currentProjectId } = project;
  
  const [savedProjects, setSavedProjects] = useLocalStorage<SavedProject[]>('codegen-studio-saved-projects', []);
  const [view, setView] = useState<'welcome' | 'editor' | 'pricing' | 'projects'>();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isApiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [isGithubModalOpen, setGithubModalOpen] = useState(false);
  const [isLocalRunModalOpen, setLocalRunModalOpen] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isImageStudioOpen, setImageStudioOpen] = useState(false);
  const [isSupabaseAdminModalOpen, setSupabaseAdminModalOpen] = useState(false);
  
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isProUser, setIsProUser] = useLocalStorage<boolean>('is-pro-user', false);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');
  const [pendingPrompt, setPendingPrompt] = useState<{prompt: string, provider: AIProvider, model: string, attachments: { data: string; mimeType: string }[] } | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const [codeError, setCodeError] = useState<string | null>(null);
  const [lastModelUsed, setLastModelUsed] = useState<{ provider: AIProvider, model: string }>({ provider: AIProvider.Gemini, model: 'gemini-2.5-flash' });

  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const effectiveGeminiApiKey = userSettings?.gemini_api_key || DEFAULT_GEMINI_API_KEY;

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // --- Data Fetching and Auth ---
  const fetchUserSettings = useCallback(async (user: User) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      setUserSettings(profileData);
    } catch (error) {
      console.error("Error fetching user settings:", error);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserSettings(session.user);
      } else {
        setUserSettings(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          fetchUserSettings(session.user);
        }
        setIsLoadingData(false); // Done loading auth info
    });

    return () => subscription.unsubscribe();
  }, [fetchUserSettings]);

  // --- Project Management & URL Handling ---
  const handleLoadProject = useCallback((projectId: number, confirmLoad: boolean = true) => {
    if (confirmLoad && files.length > 0 && !window.confirm("Carregar este projeto substituirá seu trabalho local atual. Deseja continuar?")) {
        return;
    }

    const projectToLoad = savedProjects.find(p => p.id === projectId);
    if (projectToLoad) {
        setProject({
            files: projectToLoad.files,
            projectName: projectToLoad.name,
            chatMessages: projectToLoad.chat_history,
            envVars: projectToLoad.env_vars || {},
            currentProjectId: projectToLoad.id,
            activeFile: projectToLoad.files.find(f => f.name.includes('html'))?.name || projectToLoad.files[0]?.name || null,
        });

        const url = new URL(window.location.href);
        url.searchParams.set('projectId', String(projectToLoad.id));
        window.history.pushState({ path: url.href }, '', url.href);
        
        setCodeError(null);
        setIsInitializing(false);
        setView('editor');
    } else {
        alert("Não foi possível carregar o projeto. Ele pode ter sido excluído.");
        const url = new URL(window.location.href);
        url.searchParams.delete('projectId');
        window.history.pushState({ path: url.href }, '', url.href);
    }
  }, [files.length, savedProjects, setProject]);

  // Effect to handle initial view logic, including URL parsing
  useEffect(() => {
    if (view) return; // Already determined

    const urlParams = new URLSearchParams(window.location.search);
    const projectIdStr = urlParams.get('projectId');
    
    if (projectIdStr) {
      const projectId = parseInt(projectIdStr, 10);
      const projectExists = savedProjects.some(p => p.id === projectId);
      if (projectExists) {
        handleLoadProject(projectId, false); // Load without confirmation
        setView('editor');
        return;
      }
    }
    
    // Fallback to default logic if no valid project ID in URL
    if (files.length > 0) {
      setView('editor');
    } else {
      setView('welcome');
    }
  }, [view, savedProjects, files.length, handleLoadProject]);


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('payment') && urlParams.get('payment') === 'success') {
      setIsProUser(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setIsProUser]);

  useEffect(() => {
    if (pendingPrompt && effectiveGeminiApiKey) {
      const { prompt, provider, model, attachments } = pendingPrompt;
      setPendingPrompt(null);
      handleSendMessage(prompt, provider, model, attachments);
    }
  }, [pendingPrompt, effectiveGeminiApiKey]);

  const handleNewProject = (confirmNew: boolean = true) => {
    const startNew = () => {
        setProject(initialProjectState);
        setCodeError(null);
        setView('welcome');
        setSidebarOpen(false);
        setChatOpen(false);
        const url = new URL(window.location.href);
        url.searchParams.delete('projectId');
        window.history.pushState({ path: url.href }, '', url.href);
    };

    if (confirmNew && files.length > 0) {
        if (window.confirm("Tem certeza de que deseja iniciar um novo projeto? Seu trabalho local atual será perdido.")) {
            startNew();
        }
    } else {
        startNew();
    }
  };
  
  const handleSaveProject = async () => {
    if (files.length === 0) {
      alert("Não há nada para salvar. Comece a gerar alguns arquivos primeiro.");
      return;
    }

    const now = new Date().toISOString();
    const projectId = currentProjectId || Date.now();

    const projectData: SavedProject = {
      id: projectId,
      name: projectName,
      files: files,
      chat_history: chatMessages,
      env_vars: envVars,
      created_at: savedProjects.find(p => p.id === projectId)?.created_at || now,
      updated_at: now,
    };

    setSavedProjects(prev => {
      const existingIndex = prev.findIndex(p => p.id === projectId);
      if (existingIndex > -1) {
        const newProjects = [...prev];
        newProjects[existingIndex] = projectData;
        return newProjects;
      }
      return [projectData, ...prev];
    });

    setProject(p => ({ ...p, currentProjectId: projectId }));

    const url = new URL(window.location.href);
    url.searchParams.set('projectId', String(projectId));
    window.history.pushState({ path: url.href }, '', url.href);

    alert(`Projeto "${projectName}" salvo localmente!`);
  };

  const handleDeleteProject = async (projectId: number) => {
    setSavedProjects(prev => prev.filter(p => p.id !== projectId));
    if (currentProjectId === projectId) {
        handleNewProject(false);
        alert("O projeto atual foi excluído. Iniciando um novo projeto.");
    }
  };

  // --- AI and API Interactions ---
  const handleSupabaseAdminAction = async (action: { query: string }) => {
    if (!userSettings?.supabase_project_url || !userSettings?.supabase_service_key) {
        setProject(p => ({ ...p, chatMessages: [...p.chatMessages, { role: 'system', content: "Ação do Supabase ignorada: Credenciais de administrador não configuradas."}] }));
        return;
    }
    
    setProject(p => ({ ...p, chatMessages: [...p.chatMessages, { role: 'system', content: `Executando consulta SQL no Supabase: ${action.query.substring(0, 100)}...`}] }));

    try {
        const response = await fetch('/api/supabase-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectUrl: userSettings.supabase_project_url,
                serviceKey: userSettings.supabase_service_key,
                query: action.query,
            }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            setProject(p => ({ ...p, chatMessages: [...p.chatMessages, { role: 'system', content: "Consulta SQL executada com sucesso!" }] }));
        } else {
            throw new Error(result.error || "Ocorreu um erro desconhecido no servidor.");
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Falha na comunicação com a função de back-end.";
        setProject(p => ({ ...p, chatMessages: [...p.chatMessages, { role: 'system', content: `Erro ao executar a consulta SQL: ${message}` }] }));
    }
  };

  const handleSendMessage = async (prompt: string, provider: AIProvider, model: string, attachments: { data: string; mimeType: string }[] = []) => {
    setCodeError(null);
    setLastModelUsed({ provider, model });
    
    if (prompt.toLowerCase().includes('ia') && !effectiveGeminiApiKey) {
      setProject(p => ({...p, chatMessages: [...p.chatMessages, { role: 'assistant', content: 'Para adicionar funcionalidades de IA ao seu projeto, primeiro adicione sua chave de API do Gemini.'}]}));
      setApiKeyModalOpen(true);
      return;
    }
    
    if (provider === AIProvider.Gemini && !effectiveGeminiApiKey) {
      setPendingPrompt({ prompt, provider, model, attachments });
      setApiKeyModalOpen(true);
      return;
    }
    
    if ((provider === AIProvider.OpenAI || provider === AIProvider.DeepSeek) && !isProUser) {
        alert('Este modelo está disponível apenas para usuários Pro. Por favor, atualize seu plano na página de preços.');
        return;
    }

    const isFirstGeneration = files.length === 0;

    const userMessage: ChatMessage = { role: 'user', content: prompt };
    const thinkingMessage: ChatMessage = { role: 'assistant', content: 'Pensando...', isThinking: true };
    
    const newChatHistory = view !== 'editor' ? [userMessage, thinkingMessage] : [...chatMessages, userMessage, thinkingMessage];
    setProject(p => ({ ...p, chatMessages: newChatHistory }));

    if (view !== 'editor') {
      setView('editor');
    }
    
    if (isFirstGeneration && effectiveGeminiApiKey) {
      setIsInitializing(true);
      const newName = await generateProjectName(prompt, effectiveGeminiApiKey);
      setProject(p => ({...p, projectName: newName}));
    }

    let thoughtMessageFound = false;
    let accumulatedContent = "";
    const onChunk = (chunk: string) => {
        accumulatedContent += chunk;
        if (!thoughtMessageFound) {
            const separatorIndex = accumulatedContent.indexOf('\n---\n');
            if (separatorIndex !== -1) {
                const thought = accumulatedContent.substring(0, separatorIndex).trim();
                setProject(p => {
                    const newMessages = [...p.chatMessages];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage?.isThinking) {
                        lastMessage.content = thought;
                    }
                    return { ...p, chatMessages: newMessages };
                });
                thoughtMessageFound = true;
            }
        }
    };

    try {
      let fullResponse;

      switch (provider) {
        case AIProvider.Gemini:
          fullResponse = await generateCodeStreamWithGemini(prompt, files, envVars, onChunk, model, effectiveGeminiApiKey!, attachments);
          break;
        case AIProvider.OpenAI:
          fullResponse = await generateCodeStreamWithOpenAI(prompt, files, onChunk, model);
          break;
        case AIProvider.DeepSeek:
           fullResponse = await generateCodeStreamWithDeepSeek(prompt, files, onChunk, model);
          break;
        default:
          throw new Error('Provedor de IA não suportado');
      }
      
      let finalJsonPayload = fullResponse;
      const separatorIndex = fullResponse.indexOf('\n---\n');
      if (separatorIndex !== -1) {
          finalJsonPayload = fullResponse.substring(separatorIndex + 5);
      }
      
      const result = extractAndParseJson(finalJsonPayload);
      
      if (result.files && Array.isArray(result.files)) {
        setProject(p => {
            const updatedFilesMap = new Map(p.files.map(f => [f.name, f]));
            result.files.forEach((file: ProjectFile) => {
                updatedFilesMap.set(file.name, file);
            });
            const newFiles = Array.from(updatedFilesMap.values());
            let newActiveFile = p.activeFile;
            if (result.files.length > 0 && !newActiveFile) {
                const foundFile = result.files.find((f: ProjectFile) => f.name.includes('html')) || result.files[0];
                newActiveFile = foundFile.name;
            }
            return { ...p, files: newFiles, activeFile: newActiveFile };
        });
      }
      
      if (result.environmentVariables) {
        if (result.environmentVariables.GEMINI_API_KEY !== undefined && userSettings?.gemini_api_key) {
            result.environmentVariables.GEMINI_API_KEY = userSettings.gemini_api_key;
        }

        setProject(p => {
            const newVars = { ...p.envVars };
            for (const [key, value] of Object.entries(result.environmentVariables)) {
                if (value === null) {
                    delete newVars[key];
                } else {
                    newVars[key] = value as string;
                }
            }
            return { ...p, envVars: newVars };
        });
      }

       setProject(p => {
            const newMessages = [...p.chatMessages];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage?.role === 'assistant') {
                lastMessage.content = result.message || 'Geração concluída.';
                lastMessage.summary = result.summary;
                lastMessage.isThinking = false;
                return { ...p, chatMessages: newMessages };
            }
            return p;
        });

       if (result.supabaseAdminAction) {
         await handleSupabaseAdminAction(result.supabaseAdminAction);
       }
        
    } catch (error) {
      console.error("Error handling send message:", error);
      const errorMessageText = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
      
      setProject(p => {
            const newMessages = [...p.chatMessages];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage?.isThinking) {
                 lastMessage.content = `Erro: ${errorMessageText}`;
                 lastMessage.isThinking = false;
            } else {
                newMessages.push({ role: 'assistant', content: `Erro: ${errorMessageText}`, isThinking: false });
            }
            return { ...p, chatMessages: newMessages };
        });
    } finally {
        if (isFirstGeneration) {
            setIsInitializing(false);
        }
    }
  };

  const handleFixCode = () => {
    if (!codeError || !lastModelUsed) return;
    const fixPrompt = `O código anterior gerou um erro de visualização: "${codeError}". Por favor, analise os arquivos e corrija o erro. Forneça apenas os arquivos modificados.`;
    handleSendMessage(fixPrompt, lastModelUsed.provider, lastModelUsed.model);
  };
  
  // --- UI Handlers and Other Functions ---
  const handleRunLocally = () => {
    if (files.length === 0) {
      alert("Não há arquivos para executar. Gere algum código primeiro.");
      return;
    }
    setLocalRunModalOpen(true);
  };

  const handleDownload = () => {
    downloadProjectAsZip(files, projectName);
  };

  const handleImportFromGithub = (importedFiles: ProjectFile[]) => {
    const htmlFile = importedFiles.find(f => f.name.endsWith('index.html')) || importedFiles[0];
    setProject(p => ({
        ...p,
        files: importedFiles,
        chatMessages: [
            { role: 'assistant', content: INITIAL_CHAT_MESSAGE },
            { role: 'assistant', content: `Importei ${importedFiles.length} arquivos do seu repositório. O que você gostaria de construir ou modificar?` }
        ],
        activeFile: htmlFile?.name || null,
    }));
    
    setGithubModalOpen(false);
    setView('editor');
  };

  const handleSaveImageToProject = (base64Data: string, fileName: string) => {
    const newFile: ProjectFile = { name: `assets/${fileName}`, language: 'image', content: base64Data };
    setProject(p => {
        const existingFile = p.files.find(f => f.name === newFile.name);
        const newFiles = existingFile ? p.files.map(f => f.name === newFile.name ? newFile : f) : [...p.files, newFile];
        return { ...p, files: newFiles };
    });
    alert(`Imagem "${newFile.name}" salva no projeto!`);
    setImageStudioOpen(false);
  };

  const handleFileClose = (fileNameToClose: string) => {
    setProject(p => {
        const updatedFiles = p.files.filter(f => f.name !== fileNameToClose);
        let newActiveFile = p.activeFile;
        if (p.activeFile === fileNameToClose) {
            if (updatedFiles.length > 0) {
                const closingFileIndex = p.files.findIndex(f => f.name === fileNameToClose);
                const newActiveIndex = Math.max(0, closingFileIndex - 1);
                newActiveFile = updatedFiles[newActiveIndex]?.name || null;
            } else {
                newActiveFile = null;
            }
        }
        return { ...p, files: updatedFiles, activeFile: newActiveFile };
    });
  };
  
  const handleSaveSettings = async (newSettings: Omit<UserSettings, 'id' | 'updated_at'>) => {
    if (!session?.user) return;
    const settingsData = { ...newSettings, id: session.user.id, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('profiles').upsert(settingsData).select().single();
    if (error) {
        alert(`Erro ao salvar configurações: ${error.message}`);
    } else {
        setUserSettings(data);
    }
  };
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { setSidebarOpen(false); setChatOpen(false); }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoadingData || !view) {
    return (
        <div className={`${theme} flex flex-col items-center justify-center h-screen bg-var-bg-default text-var-fg-default`}>
            <AppLogo className="w-12 h-12 text-var-accent animate-pulse" style={{ animationDuration: '2s' }} />
            <p className="mt-4 text-lg">Carregando...</p>
        </div>
    );
  }

  const mainContent = () => {
    switch (view) {
      case 'welcome':
        return <WelcomeScreen 
          session={session}
          onLoginClick={() => setAuthModalOpen(true)}
          // FIX: Changed default model from gemini-2.5-pro to the recommended gemini-2.5-flash.
          onPromptSubmit={(prompt) => handleSendMessage(prompt, AIProvider.Gemini, 'gemini-2.5-flash')} 
          onShowPricing={() => setView('pricing')}
          onShowProjects={() => setView('projects')}
          onImportFromGithub={() => setGithubModalOpen(true)}
        />;
      case 'pricing':
        return <PricingPage onBack={() => setView(files.length > 0 ? 'editor' : 'welcome')} />;
      case 'projects':
        return <ProjectsPage 
          projects={savedProjects}
          onLoadProject={handleLoadProject}
          onDeleteProject={handleDeleteProject}
          onBack={() => setView(files.length > 0 ? 'editor' : 'welcome')}
        />;
      case 'editor':
        return (
          <div className="flex flex-col h-screen bg-var-bg-default">
            <Header onToggleSidebar={() => setSidebarOpen(true)} onToggleChat={() => setChatOpen(true)} projectName={projectName} />
            <div className="flex flex-1 overflow-hidden relative">
              {isInitializing && <InitializingOverlay projectName={projectName} />}
              <div className="hidden lg:block w-[320px] flex-shrink-0">
                <Sidebar
                  files={files} envVars={envVars} onEnvVarChange={newVars => setProject(p => ({ ...p, envVars: newVars }))} activeFile={activeFile} onFileSelect={name => setProject(p => ({...p, activeFile: name}))} onDownload={() => downloadProjectAsZip(files, projectName)}
                  onOpenSettings={() => setSettingsOpen(true)} onOpenGithubImport={() => setGithubModalOpen(true)} onOpenSupabaseAdmin={() => setSupabaseAdminModalOpen(true)}
                  onSaveProject={handleSaveProject} onOpenProjects={() => setView('projects')} onNewProject={() => handleNewProject()} onOpenImageStudio={() => setImageStudioOpen(true)}
                  session={session} onLogin={() => setAuthModalOpen(true)} onLogout={() => supabase.auth.signOut()}
                />
              </div>
              
              {isSidebarOpen && (
                 <div className="absolute top-0 left-0 h-full w-full bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}>
                    <div className="w-[320px] h-full bg-var-bg-subtle shadow-2xl" onClick={e => e.stopPropagation()}>
                        <Sidebar
                            files={files} envVars={envVars} onEnvVarChange={newVars => setProject(p => ({ ...p, envVars: newVars }))} activeFile={activeFile} onFileSelect={(file) => {setProject(p => ({...p, activeFile: file})); setSidebarOpen(false);}}
                            onDownload={() => {downloadProjectAsZip(files, projectName); setSidebarOpen(false);}} onOpenSettings={() => {setSettingsOpen(true); setSidebarOpen(false);}}
                            onOpenGithubImport={() => {setGithubModalOpen(true); setSidebarOpen(false);}} onOpenSupabaseAdmin={() => {setSupabaseAdminModalOpen(true); setSidebarOpen(false);}}
                            onSaveProject={() => { handleSaveProject(); setSidebarOpen(false); }} onOpenProjects={() => { setView('projects'); setSidebarOpen(false); }}
                            onNewProject={() => handleNewProject()} onOpenImageStudio={() => { setImageStudioOpen(true); setSidebarOpen(false); }} onClose={() => setSidebarOpen(false)}
                            session={session} onLogin={() => { setAuthModalOpen(true); setSidebarOpen(false); }} onLogout={() => { supabase.auth.signOut(); setSidebarOpen(false); }}
                        />
                    </div>
                </div>
              )}

              <main className="flex-1 min-w-0">
                <EditorView 
                  files={files} activeFile={activeFile} projectName={projectName} theme={theme} onThemeChange={setTheme}
                  onFileSelect={name => setProject(p => ({...p, activeFile: name}))} onFileClose={handleFileClose} onRunLocally={handleRunLocally}
                  codeError={codeError} onFixCode={handleFixCode} onClearError={() => setCodeError(null)} onError={setCodeError} envVars={envVars}
                />
              </main>
              
              <div className="hidden lg:block w-full max-w-sm xl:max-w-md flex-shrink-0">
                <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} isProUser={isProUser} />
              </div>
              
              {isChatOpen && (
                 <div className="absolute top-0 right-0 h-full w-full bg-black/50 z-20 lg:hidden" onClick={() => setChatOpen(false)}>
                    <div className="absolute right-0 w-full max-w-sm h-full bg-var-bg-subtle shadow-2xl" onClick={e => e.stopPropagation()}>
                       <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} isProUser={isProUser} onClose={() => setChatOpen(false)} />
                    </div>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <div className={theme}>
      {mainContent()}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
      {session && userSettings && (
        <>
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setSettingsOpen(false)}
                settings={userSettings}
                onSave={handleSaveSettings}
            />
            <SupabaseAdminModal
                isOpen={isSupabaseAdminModalOpen}
                onClose={() => setSupabaseAdminModalOpen(false)}
                settings={userSettings}
                onSave={handleSaveSettings}
            />
        </>
      )}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => { setApiKeyModalOpen(false); setPendingPrompt(null); }}
        onSave={(key) => handleSaveSettings({ gemini_api_key: key })}
      />
      <GithubImportModal
        isOpen={isGithubModalOpen}
        onClose={() => setGithubModalOpen(false)}
        onImport={handleImportFromGithub}
        githubToken={userSettings?.github_access_token}
        onOpenSettings={() => { setGithubModalOpen(false); setSettingsOpen(true); }}
      />
      <PublishModal 
        isOpen={isLocalRunModalOpen}
        onClose={() => setLocalRunModalOpen(false)}
        onDownload={handleDownload}
        projectName={projectName}
      />
      <ImageStudioModal
        isOpen={isImageStudioOpen}
        onClose={() => setImageStudioOpen(false)}
        onSaveImage={handleSaveImageToProject}
        apiKey={effectiveGeminiApiKey}
        onOpenApiKeyModal={() => { setImageStudioOpen(false); setApiKeyModalOpen(true); }}
       />
    </div>
  );
};

export default App;
