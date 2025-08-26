import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EditorView } from './components/EditorView';
import { ChatPanel } from './components/ChatPanel';
import { SettingsModal } from './components/SettingsModal';
import { PricingPage } from './components/PricingPage';
import { GithubImportModal } from './components/GithubImportModal';
import { PublishModal } from './components/PublishModal';
import { SupabaseIntegrationModal } from './components/SupabaseIntegrationModal';
import { ProjectFile, ChatMessage, AIProvider, UserSettings } from './types';
import { downloadProjectAsZip } from './services/projectService';
import { INITIAL_CHAT_MESSAGE } from './constants';
import { generateCodeStreamWithGemini } from './services/geminiService';
import { generateCodeStreamWithOpenAI } from './services/openAIService';
import { generateCodeStreamWithDeepSeek } from './services/deepseekService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MenuIcon, ChatIcon } from './components/Icons';

const Header: React.FC<{ onToggleSidebar: () => void; onToggleChat: () => void }> = ({ onToggleSidebar, onToggleChat }) => (
  <div className="lg:hidden flex justify-between items-center p-2 bg-[#111217] border-b border-white/10 flex-shrink-0">
    <button onClick={onToggleSidebar} className="p-2 rounded-md text-gray-300 hover:bg-white/10">
      <MenuIcon />
    </button>
    <h1 className="text-lg font-semibold text-white truncate">Codegen Studio</h1>
    <button onClick={onToggleChat} className="p-2 rounded-md text-gray-300 hover:bg-white/10">
      <ChatIcon />
    </button>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<'welcome' | 'editor' | 'pricing'>('welcome');
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: INITIAL_CHAT_MESSAGE }]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isGithubModalOpen, setGithubModalOpen] = useState(false);
  const [isPublishModalOpen, setPublishModalOpen] = useState(false);
  const [isSupabaseModalOpen, setSupabaseModalOpen] = useState(false);

  // API keys are now handled by the backend proxy for security.
  // The UserSettings can be used for other preferences in the future.
  const [userSettings, setUserSettings] = useLocalStorage<UserSettings>('user-settings', {});
  
  const handleSendMessage = async (prompt: string, provider: AIProvider, model: string) => {
    const userMessage: ChatMessage = { role: 'user', content: prompt };
    const thinkingMessage: ChatMessage = {
      role: 'assistant',
      content: '', // Start with empty content for streaming
      isThinking: true,
    };

    if (view !== 'editor') {
      setView('editor');
      // Set messages directly for welcome screen prompt
      setChatMessages([userMessage, thinkingMessage]);
    } else {
      setChatMessages(prev => [...prev, userMessage, thinkingMessage]);
    }
    
    let accumulatedContent = "";
    const onChunk = (chunk: string) => {
        accumulatedContent += chunk;
        setChatMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
                return [
                    ...prev.slice(0, -1),
                    { ...lastMessage, content: accumulatedContent }
                ];
            }
            return prev;
        });
    };

    try {
      let fullResponse;

      switch (provider) {
        case AIProvider.Gemini:
          fullResponse = await generateCodeStreamWithGemini(prompt, files, onChunk, model);
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

      const result = JSON.parse(fullResponse);
      
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
                return [...prev.slice(0, -1), { ...lastMessage, content: result.message || 'Geração concluída.', isThinking: false }];
            }
            return [...prev, { role: 'assistant', content: result.message || 'Geração concluída.', isThinking: false }];
        });
        
    } catch (error) {
      console.error("Error handling send message:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
       setChatMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isThinking) {
                return [...prev.slice(0, -1), { role: 'assistant', content: `Erro: ${errorMessage}` }];
            }
            return [...prev, { role: 'assistant', content: `Erro: ${errorMessage}` }];
        });
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

  const handleIntegrateWithSupabase = (url: string, key: string) => {
    const supabaseClientFile: ProjectFile = {
      name: 'services/supabase.ts',
      language: 'typescript',
      content: `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '${url}';
const supabaseAnonKey = '${key}';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);`
    };

    setFiles(prevFiles => {
      const fileExists = prevFiles.some(f => f.name === supabaseClientFile.name);
      if (fileExists) {
        return prevFiles.map(f => f.name === supabaseClientFile.name ? supabaseClientFile : f);
      }
      return [...prevFiles, supabaseClientFile];
    });

    setChatMessages(prev => [...prev, {
      role: 'assistant',
      content: 'A integração com o Supabase foi configurada! O arquivo `services/supabase.ts` foi adicionado/atualizado. Agora posso usar o Supabase para tarefas de banco de dados.'
    }]);

    setSupabaseModalOpen(false);
  };

  const handleFileClose = (fileNameToClose: string) => {
    setFiles(currentFiles => {
      // Find the index of the file to close
      const closingFileIndex = currentFiles.findIndex(f => f.name === fileNameToClose);
      
      // If the closed file was the active one, determine the new active file
      if (activeFile === fileNameToClose) {
        if (currentFiles.length > 1) {
          // If there are other files, set the active file to the previous one (or the next one if it's the first)
          const newActiveIndex = closingFileIndex > 0 ? closingFileIndex - 1 : 0;
          // The new file to be active is at index `newActiveIndex` *after* removing the old one
          const remainingFiles = currentFiles.filter(f => f.name !== fileNameToClose);
          setActiveFile(remainingFiles[newActiveIndex]?.name || null);
        } else {
          setActiveFile(null);
        }
      }
      // Return the list of files without the closed one
      return currentFiles.filter(f => f.name !== fileNameToClose);
    });
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
          onPromptSubmit={(prompt) => handleSendMessage(prompt, AIProvider.Gemini, 'gemini-2.5-flash')} 
          onShowPricing={() => setView('pricing')}
          onImportFromGithub={() => setGithubModalOpen(true)}
        />;
      case 'pricing':
        return <PricingPage onBack={() => setView('welcome')} />;
      case 'editor':
        return (
          <div className="flex flex-col h-screen">
            <Header onToggleSidebar={() => setSidebarOpen(true)} onToggleChat={() => setChatOpen(true)} />
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar for Desktop */}
              <div className="hidden lg:block w-[320px] flex-shrink-0">
                <Sidebar
                  files={files}
                  activeFile={activeFile}
                  onFileSelect={setActiveFile}
                  onDownload={() => downloadProjectAsZip(files)}
                  onOpenSettings={() => setSettingsOpen(true)}
                  onOpenGithubImport={() => setGithubModalOpen(true)}
                  onOpenSupabaseIntegration={() => setSupabaseModalOpen(true)}
                />
              </div>
              
              {/* Sidebar for Mobile (Drawer) */}
              {isSidebarOpen && (
                 <div className="absolute top-0 left-0 h-full w-full bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}>
                    <div className="w-[320px] h-full bg-[#111217]" onClick={e => e.stopPropagation()}>
                        <Sidebar
                            files={files}
                            activeFile={activeFile}
                            onFileSelect={(file) => {setActiveFile(file); setSidebarOpen(false);}}
                            onDownload={() => {downloadProjectAsZip(files); setSidebarOpen(false);}}
                            onOpenSettings={() => {setSettingsOpen(true); setSidebarOpen(false);}}
                            onOpenGithubImport={() => {setGithubModalOpen(true); setSidebarOpen(false);}}
                            onOpenSupabaseIntegration={() => {setSupabaseModalOpen(true); setSidebarOpen(false);}}
                            onClose={() => setSidebarOpen(false)}
                        />
                    </div>
                </div>
              )}

              <main className="flex-1 min-w-0">
                <EditorView 
                  files={files} 
                  activeFile={activeFile} 
                  onFileSelect={setActiveFile}
                  onFileClose={handleFileClose}
                  onPublish={() => setPublishModalOpen(true)}
                />
              </main>

              {/* Chat Panel for Desktop */}
              <div className="hidden lg:block w-full max-w-sm xl:max-w-md flex-shrink-0">
                <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} />
              </div>
              
               {/* Chat Panel for Mobile (Drawer) */}
              {isChatOpen && (
                 <div className="absolute top-0 right-0 h-full w-full bg-black/50 z-20 lg:hidden" onClick={() => setChatOpen(false)}>
                    <div className="absolute right-0 w-full max-w-sm h-full bg-[#111217]" onClick={e => e.stopPropagation()}>
                       <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} onClose={() => setChatOpen(false)} />
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
    <>
      {mainContent()}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <GithubImportModal
        isOpen={isGithubModalOpen}
        onClose={() => setGithubModalOpen(false)}
        onImport={handleImportFromGithub}
      />
      <PublishModal 
        isOpen={isPublishModalOpen}
        onClose={() => setPublishModalOpen(false)}
      />
      <SupabaseIntegrationModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        onIntegrate={handleIntegrateWithSupabase}
      />
    </>
  );
};

export default App;