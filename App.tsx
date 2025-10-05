import React, { useState, useEffect } from 'react';
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
import { INITIAL_CHAT_MESSAGE } from './constants';
import { generateCodeStreamWithGemini, generateProjectName } from './services/geminiService';
import { generateCodeStreamWithOpenAI } from './services/openAIService';
import { generateCodeStreamWithDeepSeek } from './services/deepseekService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MenuIcon, ChatIcon, AppLogo } from './components/Icons';
import { supabase } from './services/supabase';
import type { Session } from '@supabase/supabase-js';


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


/**
 * Extracts and parses a JSON object from a string that might contain other text (like markdown).
 * It finds the first '{' and the last '}' to demarcate the JSON string.
 * @param text The string containing the JSON object.
 * @returns The parsed JSON object.
 * @throws An error if a valid JSON object cannot be found or parsed.
 */
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


const App: React.FC = () => {
  const [view, setView] = useState<'welcome' | 'editor' | 'pricing' | 'projects'>('welcome');
  const [files, setFiles] =useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: INITIAL_CHAT_MESSAGE }]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isApiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [isGithubModalOpen, setGithubModalOpen] = useState(false);
  const [isLocalRunModalOpen, setLocalRunModalOpen] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isImageStudioOpen, setImageStudioOpen] = useState(false);
  const [isSupabaseAdminModalOpen, setSupabaseAdminModalOpen] = useState(false);
  
  const [userSettings, setUserSettings] = useLocalStorage<UserSettings>('user-settings', {});
  const [isProUser, setIsProUser] = useLocalStorage<boolean>('is-pro-user', false);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');
  const [savedProjects, setSavedProjects] = useLocalStorage<SavedProject[]>('saved-projects', []);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<{prompt: string, provider: AIProvider, model: string, attachments: { data: string; mimeType: string }[] } | null>(null);
  const [projectName, setProjectName] = useState('NovoProjeto');
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [isInitializing, setIsInitializing] = useState(false);

  const [codeError, setCodeError] = useState<string | null>(null);
  const [lastModelUsed, setLastModelUsed] = useState<{ provider: AIProvider, model: string }>({ provider: AIProvider.Gemini, model: 'gemini-2.5-flash' });

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('payment') && urlParams.get('payment') === 'success') {
      setIsProUser(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setIsProUser]);

  useEffect(() => {
    if (pendingPrompt && userSettings.geminiApiKey) {
      const { prompt, provider, model, attachments } = pendingPrompt;
      setPendingPrompt(null);
      handleSendMessage(prompt, provider, model, attachments);
    }
  }, [pendingPrompt, userSettings.geminiApiKey]);

  const handleNewProject = () => {
    setFiles([]);
    setActiveFile(null);
    setChatMessages([{ role: 'assistant', content: INITIAL_CHAT_MESSAGE }]);
    setProjectName('NovoProjeto');
    setEnvVars({});
    setCodeError(null);
    setCurrentProjectId(null);
    setView('welcome');
    setSidebarOpen(false);
    setChatOpen(false);
  };
  
  const handleSaveProject = () => {
    if (files.length === 0) {
      alert("Não há nada para salvar. Comece a gerar alguns arquivos primeiro.");
      return;
    }

    const project: SavedProject = {
      id: currentProjectId || Date.now().toString(),
      name: projectName,
      files: files,
      chatHistory: chatMessages,
      envVars: envVars,
      savedAt: new Date().toISOString(),
    };

    if (currentProjectId) {
      // Update existing project
      setSavedProjects(prev => prev.map(p => p.id === currentProjectId ? project : p));
    } else {
      // Save as new project
      setSavedProjects(prev => [...prev, project]);
      setCurrentProjectId(project.id);
    }
    alert(`Projeto "${projectName}" salvo!`);
  };

  const handleLoadProject = (projectId: string) => {
    const projectToLoad = savedProjects.find(p => p.id === projectId);
    if (projectToLoad) {
      setFiles(projectToLoad.files);
      setProjectName(projectToLoad.name);
      setChatMessages(projectToLoad.chatHistory);
      setEnvVars(projectToLoad.envVars || {});
      setCurrentProjectId(projectToLoad.id);
      
      const firstFile = projectToLoad.files.find(f => f.name.includes('html')) || projectToLoad.files[0];
      setActiveFile(firstFile?.name || null);
      
      setCodeError(null);
      setIsInitializing(false);
      setView('editor');
    } else {
      alert("Não foi possível carregar o projeto. Ele pode ter sido excluído.");
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setSavedProjects(prev => prev.filter(p => p.id !== projectId));
    if (currentProjectId === projectId) {
      // If we delete the currently loaded project, we should reset.
      handleNewProject();
      alert("O projeto atual foi excluído. Voltando para a tela inicial.");
    }
  };

  const handleSupabaseAdminAction = async (action: { query: string }) => {
    if (!userSettings.supabaseProjectUrl || !userSettings.supabaseServiceKey) {
        setChatMessages(prev => [...prev, { role: 'system', content: "Ação do Supabase ignorada: Credenciais de administrador não configuradas."}]);
        return;
    }

    setChatMessages(prev => [...prev, { role: 'system', content: `Executando consulta SQL no Supabase: ${action.query.substring(0, 100)}...`}]);

    try {
        const response = await fetch('/api/supabase-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectUrl: userSettings.supabaseProjectUrl,
                serviceKey: userSettings.supabaseServiceKey,
                query: action.query,
            }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            setChatMessages(prev => [...prev, { role: 'system', content: "Consulta SQL executada com sucesso!" }]);
        } else {
            throw new Error(result.error || "Ocorreu um erro desconhecido no servidor.");
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Falha na comunicação com a função de back-end.";
        setChatMessages(prev => [...prev, { role: 'system', content: `Erro ao executar a consulta SQL: ${message}` }]);
    }
};

  const handleSendMessage = async (prompt: string, provider: AIProvider, model: string, attachments: { data: string; mimeType: string }[] = []) => {
    setCodeError(null);
    setLastModelUsed({ provider, model });
    
    if (prompt.toLowerCase().includes('ia') && !userSettings.geminiApiKey) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Para adicionar funcionalidades de IA ao seu projeto, primeiro adicione sua chave de API do Gemini.'}]);
      setApiKeyModalOpen(true);
      return;
    }
    
    if (provider === AIProvider.Gemini && !userSettings.geminiApiKey) {
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
    const thinkingMessage: ChatMessage = {
      role: 'assistant',
      content: 'Pensando...',
      isThinking: true,
    };

    if (view !== 'editor') {
      setView('editor');
      setChatMessages([userMessage, thinkingMessage]);
    } else {
      setChatMessages(prev => [...prev, userMessage, thinkingMessage]);
    }
    
    if (isFirstGeneration && userSettings.geminiApiKey) {
      setIsInitializing(true);
      const newName = await generateProjectName(prompt, userSettings.geminiApiKey);
      setProjectName(newName);
    }

    let accumulatedContent = "";
    const onChunk = (chunk: string) => {
        accumulatedContent += chunk;
        setChatMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
                const updatedMessage = { ...lastMessage, content: accumulatedContent };
                if (lastMessage.isThinking) {
                    updatedMessage.isThinking = true; 
                }
                return [ ...prev.slice(0, -1), updatedMessage ];
            }
            return prev;
        });
    };

    try {
      let fullResponse;

      switch (provider) {
        case AIProvider.Gemini:
          fullResponse = await generateCodeStreamWithGemini(prompt, files, envVars, onChunk, model, userSettings.geminiApiKey!, attachments);
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
      
      const result = extractAndParseJson(fullResponse);
      
      if (result.files && Array.isArray(result.files)) {
        setFiles(prevFiles => {
            const updatedFilesMap = new Map(prevFiles.map(f => [f.name, f]));
            result.files.forEach((file: ProjectFile) => {
                updatedFilesMap.set(file.name, file);
            });
            return Array.from(updatedFilesMap.values());
        });
        if (result.files.length > 0 && !activeFile) {
          const newFile = result.files.find((f: ProjectFile) => f.name.includes('html')) || result.files[0];
          setActiveFile(newFile.name);
        }
      }
      
      if (result.environmentVariables) {
        // If the AI created the GEMINI_API_KEY, populate it with the user's actual key.
        if (result.environmentVariables.GEMINI_API_KEY !== undefined && userSettings.geminiApiKey) {
            result.environmentVariables.GEMINI_API_KEY = userSettings.geminiApiKey;
        }

        setEnvVars(prev => {
            const newVars = { ...prev };
            for (const [key, value] of Object.entries(result.environmentVariables)) {
                if (value === null) {
                    delete newVars[key];
                } else {
                    newVars[key] = value as string;
                }
            }
            return newVars;
        });
      }

       setChatMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
                return [...prev.slice(0, -1), { ...lastMessage, content: result.message || 'Geração concluída.', summary: result.summary, isThinking: false }];
            }
            return [...prev, { role: 'assistant', content: result.message || 'Geração concluída.', summary: result.summary, isThinking: false }];
        });

       if (result.supabaseAdminAction) {
         await handleSupabaseAdminAction(result.supabaseAdminAction);
       }
        
    } catch (error) {
      console.error("Error handling send message:", error);
      const errorMessageText = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
      
      let finalMessage = `Erro: ${errorMessageText}`;
      try {
        if (accumulatedContent.includes('{')) {
          const parsedError = extractAndParseJson(accumulatedContent);
          if (parsedError.message) {
              finalMessage = parsedError.message;
          }
        }
      } catch (e) { /* Ignore */ }

       setChatMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isThinking) {
                return [...prev.slice(0, -1), { role: 'assistant', content: finalMessage, isThinking: false }];
            }
            return [...prev, { role: 'assistant', content: finalMessage, isThinking: false }];
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
    setFiles(importedFiles);
    setChatMessages([
      { role: 'assistant', content: INITIAL_CHAT_MESSAGE },
      { role: 'assistant', content: `Importei ${importedFiles.length} arquivos do seu repositório. O que você gostaria de construir ou modificar?` }
    ]);
    if (importedFiles.length > 0) {
      const htmlFile = importedFiles.find(f => f.name.endsWith('index.html')) || importedFiles[0];
      setActiveFile(htmlFile.name);
    }
    setGithubModalOpen(false);
    setView('editor');
  };

  const handleSaveImageToProject = (base64Data: string, fileName: string) => {
    const newFile: ProjectFile = {
        name: `assets/${fileName}`,
        language: 'image',
        content: base64Data,
    };
    setFiles(prev => {
        // Create assets directory representation if it doesn't exist (not really a dir, just a prefix convention)
        const assetFileExists = prev.some(f => f.name.startsWith('assets/'));
        if (!assetFileExists) {
            // This is just a conceptual placeholder; we don't create actual directory files
        }

        if (prev.find(f => f.name === newFile.name)) {
            return prev.map(f => f.name === newFile.name ? newFile : f);
        }
        return [...prev, newFile];
    });
    alert(`Imagem "${newFile.name}" salva no projeto!`);
    setImageStudioOpen(false);
  };


  const handleFileClose = (fileNameToClose: string) => {
    const updatedFiles = files.filter(f => f.name !== fileNameToClose);
    setFiles(updatedFiles);
  
    if (activeFile === fileNameToClose) {
      if (updatedFiles.length > 0) {
        const closingFileIndex = files.findIndex(f => f.name === fileNameToClose);
        // Activate the previous file, or the first one if the closed file was the first
        const newActiveIndex = Math.max(0, closingFileIndex - 1);
        setActiveFile(updatedFiles[newActiveIndex]?.name || null);
      } else {
        setActiveFile(null); // No files left
      }
    }
  };
  
  const handleSaveApiKey = (key: string) => {
    setUserSettings(prev => ({ ...prev, geminiApiKey: key }));
    setApiKeyModalOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
        setChatOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mainContent = () => {
    switch (view) {
      case 'welcome':
        return <WelcomeScreen 
          session={session}
          onLoginClick={() => setAuthModalOpen(true)}
          onPromptSubmit={(prompt) => handleSendMessage(prompt, AIProvider.Gemini, 'gemini-2.5-pro')} 
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
                  files={files}
                  envVars={envVars}
                  onEnvVarChange={setEnvVars}
                  activeFile={activeFile}
                  onFileSelect={setActiveFile}
                  onDownload={() => downloadProjectAsZip(files, projectName)}
                  onOpenSettings={() => setSettingsOpen(true)}
                  onOpenGithubImport={() => setGithubModalOpen(true)}
                  onOpenSupabaseAdmin={() => setSupabaseAdminModalOpen(true)}
                  onSaveProject={handleSaveProject}
                  onOpenProjects={() => setView('projects')}
                  onNewProject={handleNewProject}
                  onOpenImageStudio={() => setImageStudioOpen(true)}
                  session={session}
                  onLogin={() => setAuthModalOpen(true)}
                  onLogout={() => supabase.auth.signOut()}
                />
              </div>
              
              {isSidebarOpen && (
                 <div className="absolute top-0 left-0 h-full w-full bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}>
                    <div className="w-[320px] h-full bg-var-bg-subtle shadow-2xl" onClick={e => e.stopPropagation()}>
                        <Sidebar
                            files={files}
                            envVars={envVars}
                            onEnvVarChange={setEnvVars}
                            activeFile={activeFile}
                            onFileSelect={(file) => {setActiveFile(file); setSidebarOpen(false);}}
                            onDownload={() => {downloadProjectAsZip(files, projectName); setSidebarOpen(false);}}
                            onOpenSettings={() => {setSettingsOpen(true); setSidebarOpen(false);}}
                            onOpenGithubImport={() => {setGithubModalOpen(true); setSidebarOpen(false);}}
                             onOpenSupabaseAdmin={() => {setSupabaseAdminModalOpen(true); setSidebarOpen(false);}}
                            onSaveProject={() => { handleSaveProject(); setSidebarOpen(false); }}
                            onOpenProjects={() => { setView('projects'); setSidebarOpen(false); }}
                            onNewProject={handleNewProject}
                            onOpenImageStudio={() => { setImageStudioOpen(true); setSidebarOpen(false); }}
                            onClose={() => setSidebarOpen(false)}
                            session={session}
                            onLogin={() => { setAuthModalOpen(true); setSidebarOpen(false); }}
                            onLogout={() => { supabase.auth.signOut(); setSidebarOpen(false); }}
                        />
                    </div>
                </div>
              )}

              <main className="flex-1 min-w-0">
                <EditorView 
                  files={files} 
                  activeFile={activeFile}
                  projectName={projectName}
                  theme={theme}
                  onThemeChange={setTheme}
                  onFileSelect={setActiveFile}
                  onFileClose={handleFileClose}
                  onRunLocally={handleRunLocally}
                  codeError={codeError}
                  onFixCode={handleFixCode}
                  onClearError={() => setCodeError(null)}
                  onError={setCodeError}
                  envVars={envVars}
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
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={userSettings}
        onSettingsChange={setUserSettings}
      />
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => { setApiKeyModalOpen(false); setPendingPrompt(null); }}
        onSave={handleSaveApiKey}
      />
      <GithubImportModal
        isOpen={isGithubModalOpen}
        onClose={() => setGithubModalOpen(false)}
        onImport={handleImportFromGithub}
        githubToken={userSettings.githubAccessToken}
        onOpenSettings={() => {
          setGithubModalOpen(false);
          setSettingsOpen(true);
        }}
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
        apiKey={userSettings.geminiApiKey}
        onOpenApiKeyModal={() => {
            setImageStudioOpen(false);
            setApiKeyModalOpen(true);
        }}
       />
       <SupabaseAdminModal
            isOpen={isSupabaseAdminModalOpen}
            onClose={() => setSupabaseAdminModalOpen(false)}
            settings={userSettings}
            onSettingsChange={setUserSettings}
       />
    </div>
  );
};

export default App;