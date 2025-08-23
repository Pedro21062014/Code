
import React, { useState } from 'react';
import { ProjectFile } from '../types';
import { CodePreview } from './CodePreview';
import { CloseIcon } from './Icons';

interface EditorViewProps {
  files: ProjectFile[];
  activeFile: string | null;
  onFileSelect: (fileName: string) => void;
  onFileClose: (fileName:string) => void;
}

const CodeDisplay: React.FC<{ code: string }> = ({ code }) => (
    <pre className="p-4 text-sm whitespace-pre-wrap break-words">
      <code className="font-mono">{code}</code>
    </pre>
);

export const EditorView: React.FC<EditorViewProps> = ({ files, activeFile, onFileSelect, onFileClose }) => {
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');

  const selectedFile = files.find(f => f.name === activeFile);

  const handleCloseFile = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    onFileClose(fileName);
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0C10]">
      <div className="flex items-center border-b border-gray-800 bg-[#16171D]">
        <div className="flex-grow flex-shrink overflow-x-auto overflow-y-hidden">
            <div className="flex">
            {files.map(file => (
                <button
                key={file.name}
                onClick={() => onFileSelect(file.name)}
                className={`flex items-center px-4 py-2 text-sm border-r border-gray-800 ${
                    activeFile === file.name ? 'bg-[#1C1C1F] text-white' : 'text-gray-400 hover:bg-white/5'
                }`}
                >
                <span>{file.name}</span>
                <span onClick={(e) => handleCloseFile(e, file.name)} className="ml-2 p-1 rounded-full hover:bg-gray-600">
                    <CloseIcon />
                </span>
                </button>
            ))}
            </div>
        </div>

        <div className="p-1 bg-[#0B0C10] rounded-md m-1 flex-shrink-0">
          <button
            onClick={() => setViewMode('code')}
            className={`px-3 py-1 text-xs rounded ${viewMode === 'code' ? 'bg-blue-800 text-white' : 'text-gray-300'}`}
          >
            Code
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1 text-xs rounded ${viewMode === 'preview' ? 'bg-blue-800 text-white' : 'text-gray-300'}`}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-auto">
        {viewMode === 'code' ? (
          selectedFile ? <CodeDisplay code={selectedFile.content} /> : <div className="p-4 text-gray-500">Select a file to view its content.</div>
        ) : (
          <CodePreview files={files} />
        )}
      </div>
    </div>
  );
};
