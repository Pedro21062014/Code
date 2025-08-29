import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EditorView } from './components/EditorView';
import { ChatPanel } from './components/ChatPanel';
import { SettingsModal } from './components/SettingsModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { PricingPage } from './components/PricingPage';
import { GithubImportModal } from './components/GithubImportModal';
import { PublishModal } from './components/PublishModal';
import { AuthModal } from './components/AuthModal';
import { ProjectFile, ChatMessage, AIProvider, UserSettings, Theme } from './types';
import { downloadProjectAsZip, createProjectZip } from './services/projectService';
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
  const [view, setView] = useState<'welcome' | 'editor' | 'pricing'>('welcome');
  const [files, setFiles] =useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: INITIAL_CHAT_MESSAGE }]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isApiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [isGithubModalOpen, setGithubModalOpen] = useState(false);
  const [isPublishModalOpen, setPublishModalOpen] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  
  const [userSettings, setUserSettings] = useLocalStorage<UserSettings>('user-settings', {});
  const [isProUser, setIsProUser] = useLocalStorage<boolean>('is-pro-user', false);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');
  const [pendingPrompt, setPendingPrompt] = useState<{prompt: string, provider: AIProvider, model: string} | null>(null);
  const [projectName, setProjectName] = useState('NovoProjeto');
  const [isInitializing, setIsInitializing] = useState(false);

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ url: string | null; error: string | null }>({ url: null, error: null });
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
      const { prompt, provider, model } = pendingPrompt;
      setPendingPrompt(null);
      handleSendMessage(prompt, provider, model);
    }
  }, [pendingPrompt, userSettings.geminiApiKey]);

  const handleNewProject = () => {
    setFiles([]);
    setActiveFile(null);
    setChatMessages([{ role: 'assistant', content: INITIAL_CHAT_MESSAGE }]);
    setProjectName('NovoProjeto');
    setCodeError(null);
    setView('welcome');
    setSidebarOpen(false);
    setChatOpen(false);
  };

  const handleSendMessage = async (prompt: string, provider: AIProvider, model: string) => {
    setCodeError(null);
    setLastModelUsed({ provider, model });
    
    if (provider === AIProvider.Gemini && !userSettings.geminiApiKey) {
      setPendingPrompt({ prompt, provider, model });
      setApiKeyModalOpen(true);
      return;
    }
    
    if (provider !== AIProvider.Gemini && !isProUser) {
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
          fullResponse = await generateCodeStreamWithGemini(prompt, files, onChunk, model, userSettings.geminiApiKey!);
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

       setChatMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
                return [...prev.slice(0, -1), { ...lastMessage, content: result.message || 'Geração concluída.', summary: result.summary, isThinking: false }];
            }
            return [...prev, { role: 'assistant', content: result.message || 'Geração concluída.', summary: result.summary, isThinking: false }];
        });
        
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

  const handlePublish = async () => {
    if (files.length === 0) {
        alert("Não há arquivos para publicar.");
        return;
    }
    setIsPublishing(true);
    setPublishResult({ url: null, error: null });
    setPublishModalOpen(true);

    try {
        const zipBlob = await createProjectZip(files);
        const response = await fetch('/api/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/zip' },
            body: zipBlob,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        setPublishResult({ url: data.url, error: null });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Ocorreu um erro desconhecido durante a publicação.";
        setPublishResult({ url: null, error: message });
    } finally {
        setIsPublishing(false);
    }
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
          onPromptSubmit={(prompt) => handleSendMessage(prompt, AIProvider.Gemini, 'gemini-2.5-flash')} 
          onShowPricing={() => setView('pricing')}
          onImportFromGithub={() => setGithubModalOpen(true)}
        />;
      case 'pricing':
        return <PricingPage onBack={() => setView(files.length > 0 ? 'editor' : 'welcome')} />;
      case 'editor':
        return (
          <div className="flex flex-col h-screen bg-var-bg-default">
            <Header onToggleSidebar={() => setSidebarOpen(true)} onToggleChat={() => setChatOpen(true)} projectName={projectName} />
            <div className="flex flex-1 overflow-hidden relative">
              {isInitializing && <InitializingOverlay projectName={projectName} />}
              <div className="hidden lg:block w-[320px] flex-shrink-0">
                <Sidebar
                  files={files}
                  activeFile={activeFile}
                  onFileSelect={setActiveFile}
                  onDownload={() => downloadProjectAsZip(files, projectName)}
                  onOpenSettings={() => setSettingsOpen(true)}
                  onOpenGithubImport={() => setGithubModalOpen(true)}
                  onNewProject={handleNewProject}
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
                            activeFile={activeFile}
                            onFileSelect={(file) => {setActiveFile(file); setSidebarOpen(false);}}
                            onDownload={() => {downloadProjectAsZip(files, projectName); setSidebarOpen(false);}}
                            onOpenSettings={() => {setSettingsOpen(true); setSidebarOpen(false);}}
                            onOpenGithubImport={() => {setGithubModalOpen(true); setSidebarOpen(false);}}
                            onNewProject={handleNewProject}
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
                  onPublish={handlePublish}
                  codeError={codeError}
                  onFixCode={handleFixCode}
                  onClearError={() => setCodeError(null)}
                  onError={setCodeError}
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
        isOpen={isPublishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        isLoading={isPublishing}
        publishUrl={publishResult.url}
        error={publishResult.error}
      />
    </div>
  );
};

export default App;