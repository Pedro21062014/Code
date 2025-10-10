import React, { useState, useEffect } from 'react';
import { ProjectFile, Theme } from '../types';
import { CodePreview } from './CodePreview';
import { CloseIcon, SunIcon, MoonIcon, SparklesIcon, TerminalIcon } from './Icons';

interface EditorViewProps {
  files: ProjectFile[];
  activeFile: string | null;
  projectName: string;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onFileSelect: (fileName: string) => void;
  onFileDelete: (fileName:string) => void;
  onRunLocally: () => void;
  codeError: string | null;
  onFixCode: () => void;
  onClearError: () => void;
  onError: (errorMessage: string) => void;
  envVars: Record<string, string>;
}

const CodeDisplay: React.FC<{ code: string }> = ({ code }) => (
    <pre className="p-4 text-sm whitespace-pre-wrap break-words text-var-fg-default">
      <code className="font-mono">{code}</code>
    </pre>
);

const EditorHeader: React.FC<{ projectName: string; onRunLocally: () => void; theme: Theme; onThemeChange: (theme: Theme) => void }> = ({ projectName, onRunLocally, theme, onThemeChange }) => (
    <div className="flex items-center justify-between p-2 border-b border-var-border-default flex-shrink-0">
        <div className="text-sm text-var-fg-muted font-medium">{projectName}</div>
        <div className="flex items-center gap-2">
             <button
                onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-md text-var-fg-muted hover:bg-var-bg-interactive hover:text-var-fg-default transition-colors"
                aria-label="Toggle theme"
            >
                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button 
              onClick={onRunLocally}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-var-accent text-var-accent-fg rounded-md hover:opacity-90 transition-opacity font-semibold"
            >
                <TerminalIcon />
                <span>Executar Local</span>
            </button>
        </div>
    </div>
);

const Toast: React.FC<{ message: string; onFix: () => void; onClose: () => void }> = ({ message, onFix, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
          onClose();
        }, 8000); // Auto-dismiss after 8 seconds

        return () => clearTimeout(timer);
      }, [onClose]);

    return (
        <div className="absolute bottom-4 right-4 z-50 w-full max-w-sm animate-slideInUp">
            <div className="bg-var-bg-subtle rounded-lg shadow-2xl border border-var-border-default overflow-hidden">
                <div className="p-4 border-l-4 border-red-500">
                    <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 flex-shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-var-fg-default">Erro na Visualização</p>
                            <p className="text-sm text-var-fg-muted mt-1 break-words">{message}</p>
                            <div className="mt-4 flex gap-2">
                                <button
                                onClick={onFix}
                                className="px-3 py-1 text-xs font-semibold text-white bg-var-accent rounded hover:opacity-90 transition-all flex items-center gap-1.5"
                                >
                                <SparklesIcon /> Corrigir com IA
                                </button>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-var-bg-interactive text-var-fg-subtle hover:text-var-fg-default flex-shrink-0">
                            <CloseIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const EditorView: React.FC<EditorViewProps> = ({ files, activeFile, projectName, theme, onThemeChange, onFileSelect, onFileDelete, onRunLocally, codeError, onFixCode, onClearError, onError, envVars }) => {
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');

  const selectedFile = files.find(f => f.name === activeFile);

  const handleDeleteFile = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza de que deseja excluir "${fileName}" do projeto?`)) {
        onFileDelete(fileName);
    }
  };

  return (
    <div className="flex flex-col h-full bg-var-bg-subtle">
      <EditorHeader projectName={projectName} onRunLocally={onRunLocally} theme={theme} onThemeChange={onThemeChange} />
      
      <div className="flex items-center justify-between border-b border-var-border-default bg-var-bg-muted flex-shrink-0">
        <div className="flex-grow flex-shrink overflow-x-auto overflow-y-hidden">
            <div className="flex">
            {files.map(file => (
                <button
                key={file.name}
                onClick={() => onFileSelect(file.name)}
                className={`flex items-center px-4 py-2.5 text-sm border-r border-var-border-default relative transition-colors duration-200 ${
                    activeFile === file.name ? 'text-var-fg-default bg-var-bg-subtle' : 'text-var-fg-muted hover:bg-var-bg-interactive'
                }`}
                >
                <span className="truncate max-w-xs">{file.name}</span>
                <span onClick={(e) => handleDeleteFile(e, file.name)} className="ml-3 p-1 rounded-full hover:bg-var-bg-interactive">
                    <CloseIcon className="w-3 h-3" />
                </span>
                 {activeFile === file.name && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-var-accent"></div>}
                </button>
            ))}
            </div>
        </div>

        <div className="p-1 bg-var-bg-default rounded-md m-2 flex-shrink-0">
          <button
            onClick={() => setViewMode('code')}
            className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'code' ? 'bg-var-accent text-var-accent-fg' : 'text-var-fg-muted hover:bg-var-bg-interactive'}`}
          >
            Código
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'preview' ? 'bg-var-accent text-var-accent-fg' : 'text-var-fg-muted hover:bg-var-bg-interactive'}`}
          >
            Visualização
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-auto bg-var-bg-subtle relative">
        {viewMode === 'code' ? (
          selectedFile ? <CodeDisplay code={selectedFile.content} /> : <div className="p-4 text-var-fg-muted">Selecione um arquivo para ver seu conteúdo.</div>
        ) : (
          <CodePreview files={files} onError={onError} theme={theme} envVars={envVars} />
        )}
        {codeError && <Toast message={codeError} onFix={onFixCode} onClose={onClearError} />}
      </div>
    </div>
  );
};