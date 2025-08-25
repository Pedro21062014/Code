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

// Helper function to decode the obfuscated keys.
// The keys are stored as reversed strings, then encoded in base64.
const decodeKey = (encodedKey: string): string => {
  if (!encodedKey) return '';
  try {
    const reversedString = atob(encodedKey);
    return reversedString.split('').reverse().join('');
  } catch (error) {
    console.error("Error decoding API key:", error);
    // Fallback to empty string if decoding fails to prevent app crash
    return '';
  }
};

// Function to get initial settings using the decoded keys
const getInitialSettings = (): UserSettings => {
  // Obfuscated default keys (reversed string, then base64 encoded)
  const encodedDefaults = {
    geminiKey: 'NEh0STFLdFh1blhoUVlYR2RnUmhTM29IbUxBWWppU3lhelJB',
    openAIKey: 'QUU1X2FmbTBzazZORTl6WmtqNUMtcGVIMW1hcVNTSEGNWRlpMY2VkXzRYWGJyaWNoWnlNLTV4ZnNWbkpGQmtidDh2VEJpd25hdDZDb1NTSGNKZmdUVzFFLXRLanlRMHzM25lYXp1cGxKYy1qb3JwLXNr',
    deepSeekKey: 'QUU1X2FmbTBzazZORTl6WmtqNUMtcGVIMW1hcVNTSEGNWRlpMY2VkXzRYWGJyaWNoWnlNLTV4ZnNWbkpGQmtidDh2VEJpd25hdDZDb1NTSGNKZmdUVzFFLXRLanlRMHzM25lYXp1cGxKYy1qb3JwLXNr',
  };

  return {
    geminiKey: decodeKey(encodedDefaults.geminiKey),
    openAIKey: decodeKey(encodedDefaults.openAIKey),
    deepSeekKey: decodeKey(encodedDefaults.deepSeekKey),
  };
};

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

  const [userSettings, setUserSettings] = useLocalStorage<UserSettings>('user-api-keys', getInitialSettings);
  
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
    
    const onChunk = (chunk: string) => {
        setChatMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
                try {
                  // Attempt to parse the accumulating content as JSON to find message
                  const potentialJson = JSON.parse(lastMessage.content + chunk);
                  if(potentialJson.message) {
                    return [
                       ...prev.slice(0, -1),
                       { ...lastMessage, content: lastMessage.content + chunk, isThinking: true }
                    ]
                  }
                } catch(e) {
                   // Not a valid JSON yet, just append
                }

                return [
                    ...prev.slice(0, -1),
                    { ...lastMessage, content: lastMessage.content + chunk }
                ];
            }
            return prev;
        });
    };

    try {
      let fullResponse;

      switch (provider) {
        case AIProvider.Gemini:
          if (!userSettings.geminiKey) throw new Error('A chave de API do Gemini não está definida. Por favor, adicione-a nas Configurações.');
          fullResponse = await generateCodeStreamWithGemini(prompt, files, onChunk, userSettings.geminiKey, model);
          break;
        case AIProvider.OpenAI:
          if (!userSettings.openAIKey) throw new Error('A chave de API da OpenAI não está definida. Por favor, adicione-a nas Configurações.');
          fullResponse = await generateCodeStreamWithOpenAI(prompt, files, onChunk, userSettings.openAIKey, model);
          break;
        case AIProvider.DeepSeek:
           if (!userSettings.deepSeekKey) throw new Error('A chave de API do DeepSeek não está definida. Por favor, adicione-a nas Configurações.');
           fullResponse = await generateCodeStreamWithDeepSeek(prompt, files, onChunk, userSettings.deepSeekKey, model);
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

      setChatMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: result.message },
      ]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado durante o streaming ou processamento.";
      setChatMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        // If the last message was the thinking one, replace it with the error.
        if (lastMessage && lastMessage.isThinking) {
           return [...prev.slice(0, -1), { role: 'assistant', content: `Erro: ${errorMessage}` }];
        }
        // Otherwise, add a new error message.
        return [...prev, { role: 'assistant', content: `Erro: ${errorMessage}` }];
      });
    }
  };

  const handleWelcomePrompt = (prompt: string) => {
    handleSendMessage(prompt, AIProvider.Gemini, 'gemini-2.5-flash');
  };

  const handleGithubImport = (importedFiles: ProjectFile[]) => {
    setFiles(importedFiles);
    setChatMessages([
      { role: 'assistant', content: `Importado com sucesso ${importedFiles.length} arquivos do repositório. Agora você pode conversar com a IA para modificar o projeto.`}
    ]);
    setView('editor');
    setGithubModalOpen(false);
  }

  const handleSupabaseIntegrate = (url: string, key: string) => {
    const prompt = `Please integrate Supabase into this project.
    - Create a new file at 'services/supabase.ts'. This file should initialize and export the Supabase client using the provided credentials.
    - Supabase Project URL: ${url}
    - Supabase Anon Key: ${key}
    - Then, create a sample component 'components/SupabaseData.tsx' that demonstrates fetching data from a hypothetical 'profiles' table and displaying it.
    - Finally, update App.tsx to import and render the new SupabaseData component.
    Do not modify any other existing files unless absolutely necessary to render the new component.`;
    handleSendMessage(prompt, AIProvider.Gemini, 'gemini-2.5-flash');
    setSupabaseModalOpen(false);
  }

  useEffect(() => {
    if (files.length > 0 && (!activeFile || !files.some(f => f.name === activeFile))) {
      setActiveFile(files[0].name);
    } else if (files.length === 0) {
      setActiveFile(null);
    }
  }, [files, activeFile]);

  const handleFileSelect = (fileName: string) => {
    setActiveFile(fileName);
    setSidebarOpen(false); // Close sidebar on file selection in mobile
  };
  
  const handleFileClose = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const handleDownload = () => {
      if (files.length === 0) {
          alert("Não há arquivos para baixar. Gere um projeto primeiro!");
          return;
      }
      downloadProjectAsZip(files, 'ai-codegen-project');
  }

  if (view === 'welcome') {
      return (
        <>
          <WelcomeScreen 
            onPromptSubmit={handleWelcomePrompt} 
            onShowPricing={() => setView('pricing')}
            onImportFromGithub={() => setGithubModalOpen(true)}
          />
          <GithubImportModal
            isOpen={isGithubModalOpen}
            onClose={() => setGithubModalOpen(false)}
            onImport={handleGithubImport}
          />
        </>
      )
  }

  if (view === 'pricing') {
    return <PricingPage onBack={() => setView('welcome')} />
  }

  return (
    <div className="relative h-screen w-screen font-sans bg-[#0B0C10] text-gray-300 overflow-hidden">
      <div className="flex h-full">
        <div className="hidden lg:flex flex-shrink-0">
          <Sidebar 
            files={files} 
            onFileSelect={handleFileSelect} 
            activeFile={activeFile}
            onDownload={handleDownload}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenGithubImport={() => setGithubModalOpen(true)}
            onOpenSupabaseIntegration={() => setSupabaseModalOpen(true)}
          />
        </div>
        
        <main className="flex-grow flex flex-col min-w-0">
          <Header 
            onToggleSidebar={() => setSidebarOpen(true)}
            onToggleChat={() => setChatOpen(true)}
          />
          <EditorView 
              files={files} 
              activeFile={activeFile} 
              onFileSelect={handleFileSelect}
              onFileClose={handleFileClose}
              onPublish={() => setPublishModalOpen(true)}
            />
        </main>
        
        <div className="hidden lg:flex flex-shrink-0">
          <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} />
        </div>
      </div>
      
      {/* Overlay Sidebar */}
      {isSidebarOpen && (
        <>
          <div className="absolute inset-0 bg-black/60 z-10 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="absolute top-0 left-0 h-full z-20 lg:hidden animate-slide-in">
            <Sidebar 
              files={files} 
              onFileSelect={handleFileSelect} 
              activeFile={activeFile}
              onDownload={handleDownload}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenGithubImport={() => setGithubModalOpen(true)}
              onOpenSupabaseIntegration={() => setSupabaseModalOpen(true)}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </>
      )}

      {/* Overlay ChatPanel */}
       {isChatOpen && (
        <>
          <div className="absolute inset-0 bg-black/60 z-10 lg:hidden" onClick={() => setChatOpen(false)} />
          <div className="absolute top-0 right-0 h-full z-20 lg:hidden animate-slide-in-right">
             <ChatPanel 
                messages={chatMessages} 
                onSendMessage={handleSendMessage} 
                onClose={() => setChatOpen(false)}
              />
          </div>
        </>
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialSettings={userSettings}
        onSave={setUserSettings}
      />
      <GithubImportModal
        isOpen={isGithubModalOpen}
        onClose={() => setGithubModalOpen(false)}
        onImport={handleGithubImport}
      />
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setPublishModalOpen(false)}
      />
      <SupabaseIntegrationModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        onIntegrate={handleSupabaseIntegrate}
      />
    </div>
  );
};

export default App;