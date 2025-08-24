import React, { useState } from 'react';
import { GithubIcon, CloseIcon } from './Icons';
import { ProjectFile } from '../types';

interface GithubImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (files: ProjectFile[]) => void;
}

const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname !== 'github.com') {
            return null;
        }
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts.length < 2) {
            return null;
        }
        return { owner: pathParts[0], repo: pathParts[1] };
    } catch (e) {
        return null;
    }
};

const getFileLanguage = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'js': return 'javascript';
        case 'ts': return 'typescript';
        case 'tsx': return 'typescript';
        case 'html': return 'html';
        case 'css': return 'css';
        case 'json': return 'json';
        case 'md': return 'markdown';
        default: return 'plaintext';
    }
}

export const GithubImportModal: React.FC<GithubImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    setError(null);
    const repoInfo = parseGitHubUrl(repoUrl);

    if (!repoInfo) {
      setError("URL de repositório do GitHub inválida. Por favor, use um formato como 'https://github.com/proprietario/repo'.");
      return;
    }
    
    setIsLoading(true);

    try {
        // 1. Fetch file list from jsDelivr API
        const fileListUrl = `https://data.jsdelivr.com/v1/package/gh/${repoInfo.owner}/${repoInfo.repo}@latest/flat`;
        const response = await fetch(fileListUrl);
        if (!response.ok) throw new Error(`Não foi possível buscar a lista de arquivos do repositório. Status: ${response.status}`);
        
        const data = await response.json();
        const filesToFetch = data.files.map((file: any) => file.name);

        // 2. Fetch content for each file
        const importedFiles: ProjectFile[] = await Promise.all(
            filesToFetch.map(async (filePath: string) => {
                const fileContentUrl = `https://cdn.jsdelivr.net/gh/${repoInfo.owner}/${repoInfo.repo}@latest${filePath}`;
                const contentResponse = await fetch(fileContentUrl);
                const content = await contentResponse.text();
                return {
                    name: filePath.startsWith('/') ? filePath.substring(1) : filePath,
                    language: getFileLanguage(filePath),
                    content: content,
                };
            })
        );
        
        onImport(importedFiles);

    } catch (err) {
        const message = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
        setError(`Falha ao importar repositório: ${message}`);
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <div 
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-[#1C1C1F] rounded-lg shadow-xl w-full max-w-lg p-6 border border-gray-700/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <GithubIcon /> Importar do GitHub
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:bg-white/10">
            <CloseIcon />
          </button>
        </div>
        
        <div className="text-gray-300 space-y-4">
            <p>
                Insira a URL de um repositório público do GitHub para importar seus arquivos para o editor.
            </p>
            <div>
                 <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-300 mb-1">
                    URL do Repositório Público
                </label>
                <input
                    type="text"
                    id="repoUrl"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/facebook/react"
                    className="w-full p-2 bg-[#2A2B30] border border-gray-700/50 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    disabled={isLoading}
                />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleImport}
            disabled={isLoading || !repoUrl}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importando...
                </>
            ) : "Importar Repositório"}
          </button>
        </div>
      </div>
    </div>
  );
};