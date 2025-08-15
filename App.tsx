
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EditorView } from './components/EditorView';
import { ChatPanel } from './components/ChatPanel';
import { ProjectFile, ChatMessage } from './types';
import { downloadProjectAsZip } from './services/projectService';
import { INITIAL_CHAT_MESSAGE } from './constants';

const App: React.FC = () => {
  const [projectState, setProjectState] = useState<'welcome' | 'editor'>('welcome');
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: INITIAL_CHAT_MESSAGE }]);

  const handleNewProject = () => {
    setFiles([]);
    setActiveFile(null);
    setProjectState('editor');
    setChatMessages([{ role: 'assistant', content: INITIAL_CHAT_MESSAGE }]);
  };
  
  const handleCodeUpdate = useCallback((newFiles: ProjectFile[], message: string) => {
      setFiles(prevFiles => {
          const updatedFilesMap = new Map(prevFiles.map(f => [f.name, f]));
          newFiles.forEach(file => {
              updatedFilesMap.set(file.name, file);
          });
          return Array.from(updatedFilesMap.values());
      });

      setChatMessages(prev => {
        const lastMessage = prev[prev.length -1];
        if (lastMessage && lastMessage.isThinking) {
            return [...prev.slice(0, -1), {role: 'assistant', content: message}];
        }
        return [...prev, {role: 'assistant', content: message}];
      });

      if (projectState === 'welcome') {
        setProjectState('editor');
      }
  }, [projectState]);

  useEffect(() => {
    // If files are updated and no file is active, or active file was deleted, select the first one.
    if (files.length > 0 && (!activeFile || !files.some(f => f.name === activeFile))) {
      setActiveFile(files[0].name);
    } else if (files.length === 0) {
        setActiveFile(null);
    }
  }, [files, activeFile]);

  const handleFileSelect = (fileName: string) => {
    setActiveFile(fileName);
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
    <div className="flex h-screen w-screen font-sans">
      <Sidebar 
        files={files} 
        onFileSelect={handleFileSelect} 
        activeFile={activeFile}
        onDownload={handleDownload}
       />
      <main className="flex-grow flex flex-col min-w-0">
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
      <ChatPanel files={files} onCodeUpdate={handleCodeUpdate}/>
    </div>
  );
};

export default App;
