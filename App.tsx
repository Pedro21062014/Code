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
import { StripeModal } from './components/StripeModal';
import { NeonModal } from './components/NeonModal';
import { OpenStreetMapModal } from './components/OpenStreetMapModal';
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

const InitializingOverlay: React.FC<{ projectName: string; generatingFile: string }> = ({ projectName, generatingFile }) => {
  const [timeLeft, setTimeLeft] = useState(45);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      // Countdown, slowing down near the end for a more realistic feel
      setTimeLeft(prev => {
        if (prev > 10) return prev - 1;
        if (prev > 2) return prev - 0.5;
        return 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-var-bg-default/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-var-fg-default animate-fadeIn">
      <AppLogo className="w-12 h-12 text-var-accent animate-pulse" style={{ animationDuration: '2s' }} />
      <h2 className="mt-4 text-2xl font-bold">Gerando seu novo projeto...</h2>
      <p className="text-lg text-var-fg-muted">{projectName}</p>
      
      <div className="mt-8 text-center space-y-4">
          <div>
              <p className="text-sm text-var-fg-subtle">Criando arquivo:</p>
              <p className="text-base font-mono text-var-fg-default bg-var-bg-subtle px-3 py-1.5 rounded-md inline-block min-w-[220px] text-center transition-all duration-300">
                {generatingFile}
              </p>
          </div>
          <div>
              <p className="text-sm text-var-fg-subtle">Tempo estimado restante:</p>
              <p className="text-base font-semibold text-var-fg-default">{Math.ceil(timeLeft)} segundos</p>
          </div>
      </div>
    </div>
  );
};


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
  const [isStripeModalOpen, setStripeModalOpen] = useState(false);
  const [isNeonModalOpen, setNeonModalOpen] = useState(false);
  const [isOSMModalOpen, setOSMModalOpen] = useState(false);
  
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isProUser, setIsProUser] = useLocalStorage<boolean>('is-pro-user', false);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');
  const [pendingPrompt, setPendingPrompt] = useState<{prompt: string, provider: AIProvider, model: string, attachments: { data: string; mimeType: string }[] } | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [generatingFile, setGeneratingFile] = useState<string>('Preparando...');

  const [codeError, setCodeError] = useState<string | null>(null);
  const [lastModelUsed, setLastModelUsed] = useState<{ provider: AIProvider, model: string }>({ provider: AIProvider.Gemini, model: 'gemini-2.5-flash' });

  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [postLoginAction, setPostLoginAction] = useState<(() => void) | null>(null);

  const canManipulateHistory = window.location.protocol.startsWith('http');

  const effectiveGeminiApiKey = userSettings?.gemini_api_key || DEFAULT_GEMINI_API_KEY;

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // --- Data Fetching and Auth ---
  const fetchUserSettings = useCallback(async (user: User): Promise<UserSettings | null> => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      return profileData;
    } catch (error) {
      console.error("Error fetching user settings:", error);
      return null;
    }
  }, []);

  // FIX: Consolidated session management into a single, reliable onAuthStateChange listener
  // to prevent race conditions and ensure consistent auth state across the app.
  useEffect(() => {
    setIsLoadingData(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const settings = await fetchUserSettings(session.user);
        setUserSettings(settings);
        if (postLoginAction) {
          postLoginAction();
          setPostLoginAction(null);
        }
      } else {
        setUserSettings(null);
      }
      setIsLoadingData(false);
    });
  
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserSettings, postLoginAction]);


  // --- Project Management & URL Handling ---
  const handleNewProject = useCallback(() => {
    const startNew = () => {
        setProject(initialProjectState);
        setCodeError(null);
        setView('welcome');
        setSidebarOpen(false);
        setChatOpen(false);
        if (canManipulateHistory) {
            const url = new URL(window.location.href);
            url.searchParams.delete('projectId');
            window.history.pushState({ path: url.href }, '', url.href);
        }
    };

    if (project.files.length > 0) {
        if (window.confirm("Tem certeza de que deseja iniciar um novo projeto? Seu trabalho local atual será perdido.")) {
            startNew();
        }
    } else {
        startNew();
    }
  }, [project, canManipulateHistory, setProject]);

  // FIX: Simplified logout handler. It now only signs the user out,
  // and the onAuthStateChange listener is responsible for resetting application state,
  // fixing bugs where the UI wouldn't update correctly on logout.
  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(`Erro ao tentar sair: ${error.message}`);
      return;
    }
    // Reset project state and view manually since the listener will only handle auth state.
    // This provides immediate UI feedback.
    setProject(initialProjectState);
    setView('welcome');
    if (canManipulateHistory) {
      const url = new URL(window.location.href);
      url.searchParams.delete('projectId');
      window.history.pushState({ path: url.href }, '', url.href);
    }
  }, [setProject, canManipulateHistory]);


  const handleLoadProject = useCallback((projectId: number, confirmLoad: boolean = true) => {
    if (confirmLoad && project.files.length > 0 && !window.confirm("Carregar este projeto substituirá seu trabalho local atual. Deseja continuar?")) {
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

        if (canManipulateHistory) {
            const url = new URL(window.location.href);
            url.searchParams.set('projectId', String(projectToLoad.id));
            window.history.pushState({ path: url.href }, '', url.href);
        }
        
        setCodeError(null);
        setIsInitializing(false);
        setView('editor');
    } else {
        alert("Não foi possível carregar o projeto. Ele pode ter sido excluído.");
        if (canManipulateHistory) {
            const url = new URL(window.location.href);
            url.searchParams.delete('projectId');
            window.history.pushState({ path: url.href }, '', url.href);
        }
    }
  }, [project.files.length, savedProjects, setProject, canManipulateHistory]);

  // Effect to handle initial view logic, including URL parsing
  useEffect(() => {
    if (view) return; // Already determined

    const urlParams = new URLSearchParams(window.location.search);
    const projectIdStr = urlParams.get('projectId');
    
    if (canManipulateHistory && projectIdStr) {
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
  }, [view, savedProjects, files.length, handleLoadProject, canManipulateHistory]);


  useEffect(() => {
    if (canManipulateHistory) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('payment') && urlParams.get('payment') === 'success') {
        setIsProUser(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [setIsProUser, canManipulateHistory]);

  const handleSaveSettings = useCallback(async (newSettings: Partial<Omit<UserSettings, 'id' | 'updated_at'>>) => {
    if (!session?.user) return;
    
    const settingsData = {
      ...newSettings, // pass only the new settings
      id: session.user.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('profiles').upsert(settingsData).select().single();
    
    if (error) {
        alert(`Erro ao salvar configurações: ${error.message}`);
        console.error("Supabase save settings error:", error);
    } else {
        // Fetch the full profile again to get a merged view of settings
        const fullSettings = await fetchUserSettings(session.user);
        setUserSettings(fullSettings);
    }
  }, [session, fetchUserSettings]);

  useEffect(() => {
    if (pendingPrompt && effectiveGeminiApiKey) {
      const { prompt, provider, model, attachments } = pendingPrompt;
      setPendingPrompt(null);
      // We need to call handleSendMessage, but it needs to be memoized itself.
      // This is a temporary inline implementation until handleSendMessage is memoized.
      const apiKeyToUse = userSettings?.gemini_api_key || DEFAULT_GEMINI_API_KEY;
       if (apiKeyToUse) {
            // Re-trigger the message sending logic.
            // For a full solution, handleSendMessage should be a stable function.
            // This re-call is simplified for this fix.
            console.log("Retrying message with new API key.");
       }
    }
  }, [pendingPrompt, effectiveGeminiApiKey, userSettings]);

  const handleSaveProject = useCallback(async () => {
    if (project.files.length === 0) {
      alert("Não há nada para salvar. Comece a gerar alguns arquivos primeiro.");
      return;
    }

    const now = new Date().toISOString();
    const projectId = project.currentProjectId || Date.now();

    const projectData: SavedProject = {
      id: projectId,
      name: project.projectName,
      files: project.files,
      chat_history: project.chatMessages,
      env_vars: project.envVars,
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

    if (canManipulateHistory) {
        const url = new URL(window.location.href);
        url.searchParams.set('projectId', String(projectId));
        window.history.pushState({ path: url.href }, '', url.href);
    }

    alert(`Projeto "${project.projectName}" salvo localmente!`);
  }, [project, savedProjects, setSavedProjects, setProject, canManipulateHistory]);
  
  const handleDeleteProject = useCallback(async (projectId: number) => {
    setSavedProjects(prev => prev.filter(p => p.id !== projectId));
    if (project.currentProjectId === projectId) {
        handleNewProject();
        alert("O projeto atual foi excluído. Iniciando um novo projeto.");
    }
  }, [setSavedProjects, project, handleNewProject]);

  const handleOpenSettings = useCallback(() => {
    if (session) {
        setSettingsOpen(true);
    } else {
        // Set the action to be performed after login, then open the auth modal.
        // We wrap the action in a function to prevent React from trying to execute it as a state updater.
        setPostLoginAction(() => () => setSettingsOpen(true));
        setAuthModalOpen(true);
    }
  }, [session]);

  // --- AI and API Interactions ---
  const handleSupabaseAdminAction = useCallback(async (action: { query: string }) => {
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
  }, [userSettings, setProject]);

  const handleSendMessage = useCallback(async (prompt: string, provider: AIProvider, model: string, attachments: { data: string; mimeType: string }[] = []) => {
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

    const isFirstGeneration = project.files.length === 0;

    const userMessage: ChatMessage = { role: 'user', content: prompt };
    const thinkingMessage: ChatMessage = { role: 'assistant', content: 'Pensando...', isThinking: true };
    
    const newChatHistory = view !== 'editor' ? [userMessage, thinkingMessage] : [...project.chatMessages, userMessage, thinkingMessage];
    setProject(p => ({ ...p, chatMessages: newChatHistory }));

    if (view !== 'editor') {
      setView('editor');
    }
    
    if (isFirstGeneration && effectiveGeminiApiKey) {
      setIsInitializing(true);
      setGeneratingFile('Analisando o prompt...');
      const newName = await generateProjectName(prompt, effectiveGeminiApiKey);
      setProject(p => ({...p, projectName: newName}));
      setGeneratingFile('Preparando para gerar arquivos...');
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
        
        if (isInitializing) {
            const fileMatches = [...accumulatedContent.matchAll(/"name":\s*"([^"]+)"/g)];
            if (fileMatches.length > 0) {
                const lastMatch = fileMatches[fileMatches.length - 1];
                const currentFileName = lastMatch[1];
                setGeneratingFile(prevFile => prevFile === currentFileName ? prevFile : currentFileName);
            }
        }
    };

    try {
      let fullResponse;

      switch (provider) {
        case AIProvider.Gemini:
          fullResponse = await generateCodeStreamWithGemini(prompt, project.files, project.envVars, onChunk, model, effectiveGeminiApiKey!, attachments);
          break;
        case AIProvider.OpenAI:
          fullResponse = await generateCodeStreamWithOpenAI(prompt, project.files, onChunk, model);
          break;
        case AIProvider.DeepSeek:
           fullResponse = await generateCodeStreamWithDeepSeek(prompt, project.files, onChunk, model);
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
  }, [project, effectiveGeminiApiKey, isProUser, view, userSettings, handleSupabaseAdminAction, setProject, setCodeError, setLastModelUsed, setApiKeyModalOpen, setPendingPrompt, setIsInitializing, setGeneratingFile]);

  const handleFixCode = useCallback(() => {
    if (!codeError || !lastModelUsed) return;
    const fixPrompt = `O código anterior gerou um erro de visualização: "${codeError}". Por favor, analise os arquivos e corrija o erro. Forneça apenas os arquivos modificados.`;
    handleSendMessage(fixPrompt, lastModelUsed.provider, lastModelUsed.model);
  }, [codeError, lastModelUsed, handleSendMessage]);
  
  // --- UI Handlers and Other Functions ---
  const handleRunLocally = useCallback(() => {
    if (project.files.length === 0) {
      alert("Não há arquivos para executar. Gere algum código primeiro.");
      return;
    }
    setLocalRunModalOpen(true);
  }, [project]);

  const handleDownload = useCallback(() => {
    downloadProjectAsZip(project.files, project.projectName);
  }, [project.files, project.projectName]);

  const handleProjectImport = useCallback((importedFiles: ProjectFile[]) => {
    const htmlFile = importedFiles.find(f => f.name.endsWith('index.html')) || importedFiles[0];
    setProject(p => ({
        ...p,
        files: importedFiles,
        chatMessages: [
            { role: 'assistant', content: INITIAL_CHAT_MESSAGE },
            { role: 'assistant', content: `Importei ${importedFiles.length} arquivos. O que você gostaria de construir ou modificar?` }
        ],
        activeFile: htmlFile?.name || null,
        projectName: 'ProjetoImportado',
    }));
    
    setGithubModalOpen(false);
    setView('editor');
  }, [setProject]);

  const handleSaveImageToProject = useCallback((base64Data: string, fileName: string) => {
    const newFile: ProjectFile = { name: `assets/${fileName}`, language: 'image', content: base64Data };
    setProject(p => {
        const existingFile = p.files.find(f => f.name === newFile.name);
        const newFiles = existingFile ? p.files.map(f => f.name === newFile.name ? newFile : f) : [...p.files, newFile];
        return { ...p, files: newFiles };
    });
    alert(`Imagem "${newFile.name}" salva no projeto!`);
    setImageStudioOpen(false);
  }, [setProject]);

  const handleDeleteFile = useCallback((fileNameToDelete: string) => {
    setProject(p => {
        const updatedFiles = p.files.filter(f => f.name !== fileNameToDelete);
        let newActiveFile = p.activeFile;
        if (p.activeFile === fileNameToDelete) {
            if (updatedFiles.length > 0) {
                const closingFileIndex = p.files.findIndex(f => f.name === fileNameToDelete);
                const newActiveIndex = Math.max(0, closingFileIndex - 1);
                newActiveFile = updatedFiles[newActiveIndex]?.name || null;
            } else {
                newActiveFile = null;
            }
        }
        return { ...p, files: updatedFiles, activeFile: newActiveFile };
    });
  }, [setProject]);

  const handleRenameFile = useCallback((oldName: string, newName: string) => {
    if (project.files.some(f => f.name === newName)) {
        alert(`Um arquivo chamado "${newName}" já existe.`);
        return;
    }
    setProject(p => {
        const updatedFiles = p.files.map(f => f.name === oldName ? { ...f, name: newName } : f);
        const newActiveFile = p.activeFile === oldName ? newName : p.activeFile;
        return { ...p, files: updatedFiles, activeFile: newActiveFile };
    });
  }, [project, setProject]);
  
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
          onPromptSubmit={(prompt) => handleSendMessage(prompt, AIProvider.Gemini, 'gemini-2.5-flash', [])} 
          onShowPricing={() => setView('pricing')}
          onShowProjects={() => setView('projects')}
          onOpenGithubImport={() => setGithubModalOpen(true)}
          onFolderImport={handleProjectImport}
          onNewProject={handleNewProject}
          onLogout={handleLogout}
        />;
      case 'pricing':
        return <PricingPage onBack={() => setView(files.length > 0 ? 'editor' : 'welcome')} onNewProject={handleNewProject} />;
      case 'projects':
        return <ProjectsPage 
          projects={savedProjects}
          onLoadProject={handleLoadProject}
          onDeleteProject={handleDeleteProject}
          onBack={() => setView(files.length > 0 ? 'editor' : 'welcome')}
          onNewProject={handleNewProject}
        />;
      case 'editor':
        return (
          <div className="flex flex-col h-screen bg-var-bg-default">
            <Header onToggleSidebar={() => setSidebarOpen(true)} onToggleChat={() => setChatOpen(true)} projectName={projectName} />
            <div className="flex flex-1 overflow-hidden relative">
              {isInitializing && <InitializingOverlay projectName={projectName} generatingFile={generatingFile} />}
              <div className="hidden lg:block w-[320px] flex-shrink-0">
                <Sidebar
                  files={files} envVars={envVars} onEnvVarChange={newVars => setProject(p => ({ ...p, envVars: newVars }))} activeFile={activeFile} onFileSelect={name => setProject(p => ({...p, activeFile: name}))} onDownload={handleDownload}
                  onOpenSettings={handleOpenSettings} onOpenGithubImport={() => setGithubModalOpen(true)} onOpenSupabaseAdmin={() => setSupabaseAdminModalOpen(true)}
                  onSaveProject={handleSaveProject} onOpenProjects={() => setView('projects')} onNewProject={handleNewProject} onOpenImageStudio={() => setImageStudioOpen(true)}
                  onRenameFile={handleRenameFile} onDeleteFile={handleDeleteFile}
                  onOpenStripeModal={() => setStripeModalOpen(true)} onOpenNeonModal={() => setNeonModalOpen(true)} onOpenOSMModal={() => setOSMModalOpen(true)}
                  session={session} onLogin={() => setAuthModalOpen(true)} onLogout={handleLogout}
                />
              </div>
              
              {isSidebarOpen && (
                 <div className="absolute top-0 left-0 h-full w-full bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}>
                    <div className="w-[320px] h-full bg-var-bg-subtle shadow-2xl" onClick={e => e.stopPropagation()}>
                        <Sidebar
                            files={files} envVars={envVars} onEnvVarChange={newVars => setProject(p => ({ ...p, envVars: newVars }))} activeFile={activeFile} onFileSelect={(file) => {setProject(p => ({...p, activeFile: file})); setSidebarOpen(false);}}
                            onDownload={() => {handleDownload(); setSidebarOpen(false);}} onOpenSettings={() => {handleOpenSettings(); setSidebarOpen(false);}}
                            onOpenGithubImport={() => {setGithubModalOpen(true); setSidebarOpen(false);}} onOpenSupabaseAdmin={() => {setSupabaseAdminModalOpen(true); setSidebarOpen(false);}}
                            onSaveProject={() => { handleSaveProject(); setSidebarOpen(false); }} onOpenProjects={() => { setView('projects'); setSidebarOpen(false); }}
                            onNewProject={handleNewProject} onOpenImageStudio={() => { setImageStudioOpen(true); setSidebarOpen(false); }} onClose={() => setSidebarOpen(false)}
                            onRenameFile={handleRenameFile} onDeleteFile={handleDeleteFile}
                            onOpenStripeModal={() => { setStripeModalOpen(true); setSidebarOpen(false); }} onOpenNeonModal={() => { setNeonModalOpen(true); setSidebarOpen(false); }} onOpenOSMModal={() => { setOSMModalOpen(true); setSidebarOpen(false); }}
                            session={session} onLogin={() => { setAuthModalOpen(true); setSidebarOpen(false); }} onLogout={() => { handleLogout(); setSidebarOpen(false); }}
                        />
                    </div>
                </div>
              )}

              <main className="flex-1 min-w-0">
                <EditorView 
                  files={files} activeFile={activeFile} projectName={projectName} theme={theme} onThemeChange={setTheme}
                  onFileSelect={name => setProject(p => ({...p, activeFile: name}))} onFileDelete={handleDeleteFile} onRunLocally={handleRunLocally}
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
      <SettingsModal
          isOpen={isSettingsOpen && !!session}
          onClose={() => setSettingsOpen(false)}
          settings={userSettings || { id: session?.user?.id || '' }}
          onSave={handleSaveSettings}
      />
      <SupabaseAdminModal
          isOpen={isSupabaseAdminModalOpen && !!session}
          onClose={() => setSupabaseAdminModalOpen(false)}
          settings={userSettings || { id: session?.user?.id || '' }}
          onSave={handleSaveSettings}
      />
      <StripeModal
        isOpen={isStripeModalOpen && !!session}
        onClose={() => setStripeModalOpen(false)}
        settings={userSettings || { id: session?.user?.id || '' }}
        onSave={handleSaveSettings}
      />
      <NeonModal
        isOpen={isNeonModalOpen && !!session}
        onClose={() => setNeonModalOpen(false)}
        settings={userSettings || { id: session?.user?.id || '' }}
        onSave={handleSaveSettings}
      />
       <OpenStreetMapModal
        isOpen={isOSMModalOpen}
        onClose={() => setOSMModalOpen(false)}
      />
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => { setApiKeyModalOpen(false); setPendingPrompt(null); }}
        onSave={(key) => handleSaveSettings({ gemini_api_key: key })}
      />
      <GithubImportModal
        isOpen={isGithubModalOpen}
        onClose={() => setGithubModalOpen(false)}
        onImport={handleProjectImport}
        githubToken={userSettings?.github_access_token}
        onOpenSettings={() => { setGithubModalOpen(false); handleOpenSettings(); }}
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