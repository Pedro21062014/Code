import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EditorView } from './components/EditorView';
import { ChatPanel } from './components/ChatPanel';
import { ProjectFile, ChatMessage, AIProvider } from './types';
import { downloadProjectAsZip } from './services/projectService';
import { INITIAL_CHAT_MESSAGE } from './constants';
import { generateCodeWithGemini } from './services/geminiService';
import { generateCodeWithMockAPI } from './services/mockAIService';
import { MenuIcon, ChatIcon } from './components/Icons';

const Header: React.FC<{ onToggleSidebar: () => void; onToggleChat: () => void }> = ({ onToggleSidebar, onToggleChat }) => (
  <div className="lg:hidden flex justify-between items-center p-2 bg-[#252526] border-b border-gray-700 flex-shrink-0">
    <button onClick={onToggleSidebar} className="p-2 rounded-md text-gray-300 hover:bg-gray-700">
      <MenuIcon />
    </button>
    <h1 className="text-lg font-semibold text-white truncate">AI CodeGen Studio</h1>
    <button onClick={onToggleChat} className="p-2 rounded-md text-gray-300 hover:bg-gray-700">
      <ChatIcon />
    </button>
  </div>
);

const App: React.FC = () => {
  const [projectState, setProjectState] = useState<'welcome' | 'editor'>('welcome');
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: INITIAL_CHAT_MESSAGE }]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);

  const handleNewProject = () => {
    setFiles([]);
    setActiveFile(null);
    setProjectState('editor');
    setChatMessages([{ role: 'assistant', content: INITIAL_CHAT_MESSAGE }]);
  };
  
  const handleMessageSubmit = async (prompt: string, provider: AIProvider) => {
    const userMessage: ChatMessage = { role: 'user', content: prompt };
    const thinkingMessage: ChatMessage = {
      role: 'assistant',
      content: `Generating code for: "${prompt.substring(0, 50)}..."`,
      isThinking: true,
    };
    setChatMessages(prev => [...prev, userMessage, thinkingMessage]);
    
    if (projectState === 'welcome') {
      setProjectState('editor');
    }

    try {
      let result;
      switch (provider) {
        case AIProvider.Gemini:
          result = await generateCodeWithGemini(prompt, files);
          break;
        case AIProvider.OpenAI:
        case AIProvider.DeepSeek:
          result = await generateCodeWithMockAPI(provider, files);
          break;
        default:
          throw new Error('Unsupported AI provider');
      }
      
      setFiles(prevFiles => {
          const updatedFilesMap = new Map(prevFiles.map(f => [f.name, f]));
          result.files.forEach(file => {
              updatedFilesMap.set(file.name, file);
          });
          return Array.from(updatedFilesMap.values());
      });

      setChatMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: result.message },
      ]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      setChatMessages(prev => [
        ...prev.slice(0, -1), 
        { role: 'assistant', content: `Error: ${errorMessage}` }
      ]);
    }
  };

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
          alert("There are no files to download. Generate a project first!");
          return;
      }
      downloadProjectAsZip(files, 'ai-codegen-project');
  }

  return (
    <div className="relative h-screen w-screen font-sans bg-[#1e1e1e] overflow-hidden">
      <div className="flex h-full">
        <div className="hidden lg:flex flex-shrink-0">
          <Sidebar 
            files={files} 
            onFileSelect={handleFileSelect} 
            activeFile={activeFile}
            onDownload={handleDownload}
          />
        </div>
        
        <main className="flex-grow flex flex-col min-w-0">
          <Header 
            onToggleSidebar={() => setSidebarOpen(true)}
            onToggleChat={() => setChatOpen(true)}
          />
          {projectState === 'welcome' && <WelcomeScreen onNewProject={handleNewProject} />}
          {projectState === 'editor' && (
            <EditorView 
              files={files} 
              activeFile={activeFile} 
              onFileSelect={handleFileSelect}
              onFileClose={handleFileClose}
            />
          )}
        </main>
        
        <div className="hidden lg:flex flex-shrink-0">
          <ChatPanel messages={chatMessages} onSendMessage={handleMessageSubmit} />
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
                onSendMessage={handleMessageSubmit} 
                onClose={() => setChatOpen(false)}
              />
          </div>
        </>
      )}
    </div>
  );
};

export default App;