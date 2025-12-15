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
    <pre className="p-4 text-sm whitespace-pre-wrap break-words text-gray-300 font-mono leading-relaxed">
      <code>{code}</code>
    </pre>
);

const EditorHeader: React.FC<{ projectName: string; onRunLocally: () => void; theme: Theme; onThemeChange: (theme: Theme) => void }> = ({ projectName, onRunLocally, theme, onThemeChange }) => (
    <div className="flex items-center justify-between px-4 py-2 border-b border-[#27272a] bg-[#121214] flex-shrink-0">
        <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Project</span>
            <span className="text-sm text-gray-200 font-medium">{projectName}</span>
        </div>
        <div className="flex items-center gap-2">
            {/* Theme toggler hidden as we are enforcing Dark Mode for Lovable UI consistency, but kept for logic compatibility */}
             <button
                onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
                className="hidden p-2 rounded-md text-gray-500 hover:bg-[#27272a] hover:text-white transition-colors"
            >
                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button 
              onClick={onRunLocally}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#27272a] hover:bg-[#3f3f46] text-gray-200 rounded-md border border-[#3f3f46] transition-all font-medium"
            >
                <TerminalIcon />
                <span>Run Local</span>
            </button>
        </div>
    </div>
);

const Toast: React.FC<{ message: string; onFix: () => void; onClose: () => void }> = ({ message, onFix, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
          onClose();
        }, 8000); 

        return () => clearTimeout(timer);
      }, [onClose]);

    return (
        <div className="absolute bottom-6 right-6 z-50 w-full max-w-sm animate-slideInUp">
            <div className="bg-[#18181b] rounded-lg shadow-2xl border border-red-500/50 overflow-hidden">
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 text-red-500">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-200 text-sm">Preview Error</p>
                            <p className="text-xs text-gray-400 mt-1 break-words leading-relaxed">{message}</p>
                            <div className="mt-3 flex gap-2">
                                <button
                                onClick={onFix}
                                className="px-3 py-1.5 text-xs font-semibold text-black bg-white rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                                >
                                <SparklesIcon /> Auto Fix
                                </button>
                                <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                                    Dismiss
                                </button>
                            </div>
                        </div>
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
    if (window.confirm(`Delete "${fileName}"?`)) {
        onFileDelete(fileName);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121214]">
      <EditorHeader projectName={projectName} onRunLocally={onRunLocally} theme={theme} onThemeChange={onThemeChange} />
      
      {/* File Tabs & Mode Switcher */}
      <div className="flex items-center justify-between border-b border-[#27272a] bg-[#09090b] flex-shrink-0 h-10">
        <div className="flex-grow flex-shrink overflow-x-auto overflow-y-hidden custom-scrollbar h-full">
            <div className="flex h-full">
            {files.map(file => (
                <button
                key={file.name}
                onClick={() => onFileSelect(file.name)}
                className={`flex items-center px-4 text-xs border-r border-[#27272a] h-full transition-colors duration-200 group ${
                    activeFile === file.name ? 'text-white bg-[#121214]' : 'text-gray-500 hover:bg-[#121214] hover:text-gray-300'
                }`}
                >
                <span className="truncate max-w-[150px]">{file.name}</span>
                <span onClick={(e) => handleDeleteFile(e, file.name)} className="ml-2 p-0.5 rounded-full hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <CloseIcon className="w-3 h-3" />
                </span>
                </button>
            ))}
            </div>
        </div>

        <div className="px-2 flex items-center gap-1 bg-[#09090b] h-full border-l border-[#27272a]">
          <button
            onClick={() => setViewMode('code')}
            className={`px-3 py-1 text-xs rounded-md transition-all ${viewMode === 'code' ? 'bg-[#27272a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Code
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1 text-xs rounded-md transition-all ${viewMode === 'preview' ? 'bg-[#27272a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-auto bg-[#121214] relative custom-scrollbar">
        {viewMode === 'code' ? (
          selectedFile ? <CodeDisplay code={selectedFile.content} /> : <div className="flex items-center justify-center h-full text-gray-600 text-sm">Select a file to view content</div>
        ) : (
          <CodePreview files={files} onError={onError} theme={theme} envVars={envVars} />
        )}
        {codeError && <Toast message={codeError} onFix={onFixCode} onClose={onClearError} />}
      </div>
    </div>
  );
};