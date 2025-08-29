

import React, { useState } from 'react';
import { ProjectFile } from '../types';
import { CodePreview } from './CodePreview';
import { CloseIcon, PublishIcon } from './Icons';

interface EditorViewProps {
  files: ProjectFile[];
  activeFile: string | null;
  onFileSelect: (fileName: string) => void;
  onFileClose: (fileName:string) => void;
  onPublish: () => void;
  codeError: string | null;
  onFixCode: () => void;
  onClearError: () => void;
  onError: (errorMessage: string) => void;
}

const CodeDisplay: React.FC<{ code: string }> = ({ code }) => (
    <pre className="p-4 text-sm whitespace-pre-wrap break-words text-gray-300">
      <code className="font-mono">{code}</code>
    </pre>
);

const EditorHeader: React.FC<{ onPublish: () => void }> = ({ onPublish }) => (
    <div className="flex items-center justify-between p-2 border-b border-white/10 flex-shrink-0">
        <div className="text-sm text-gray-400">projeto-codegen-studio</div>
        <button 
          onClick={onPublish}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
            <PublishIcon />
            <span>Publicar</span>
        </button>
    </div>
);

const ErrorBanner: React.FC<{ message: string; onFix: () => void; onClose: () => void }> = ({ message, onFix, onClose }) => (
    <div className="flex items-center justify-between p-3 bg-red-800/50 border-b border-red-500/30 text-red-200 text-sm flex-shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="font-medium truncate">Erro: <span className="font-normal opacity-90">{message}</span></p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
             <button
                onClick={onFix}
                className="px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
             >
                Corrigir Código
            </button>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
                <CloseIcon />
            </button>
        </div>
    </div>
);


export const EditorView: React.FC<EditorViewProps> = ({ files, activeFile, onFileSelect, onFileClose, onPublish, codeError, onFixCode, onClearError, onError }) => {
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');

  const selectedFile = files.find(f => f.name === activeFile);

  const handleCloseFile = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    onFileClose(fileName);
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0C10] bg-opacity-80" style={{
        backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 120%, rgba(28, 78, 157, 0.3), transparent)'
    }}>
      <EditorHeader onPublish={onPublish} />
      {codeError && <ErrorBanner message={codeError} onFix={onFixCode} onClose={onClearError} />}
      
      <div className="flex items-center border-b border-white/10 bg-black/20">
        <div className="flex-grow flex-shrink overflow-x-auto overflow-y-hidden">
            <div className="flex">
            {files.map(file => (
                <button
                key={file.name}
                onClick={() => onFileSelect(file.name)}
                className={`flex items-center px-4 py-2 text-sm border-r border-white/10 ${
                    activeFile === file.name ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'
                }`}
                >
                <span>{file.name}</span>
                <span onClick={(e) => handleCloseFile(e, file.name)} className="ml-2 p-1 rounded-full hover:bg-white/20">
                    <CloseIcon />
                </span>
                </button>
            ))}
            </div>
        </div>

        <div className="p-1 bg-black/30 rounded-md m-2 flex-shrink-0">
          <button
            onClick={() => setViewMode('code')}
            className={`px-3 py-1 text-xs rounded ${viewMode === 'code' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}
          >
            Código
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1 text-xs rounded ${viewMode === 'preview' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}
          >
            Visualização
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-auto bg-black/10">
        {viewMode === 'code' ? (
          selectedFile ? <CodeDisplay code={selectedFile.content} /> : <div className="p-4 text-gray-500">Selecione um arquivo para ver seu conteúdo.</div>
        ) : (
          <CodePreview files={files} onError={onError} />
        )}
      </div>
    </div>
  );
};