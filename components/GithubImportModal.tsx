import React from 'react';
import { GithubIcon, CloseIcon } from './Icons';

interface GithubImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GithubImportModal: React.FC<GithubImportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleConnect = () => {
    // In a real application, this would redirect to the GitHub OAuth URL
    // e.g., window.location.href = 'https://github.com/login/oauth/authorize?client_id=...';
    console.log("Redirecting to GitHub for authentication...");
    alert("This would redirect to GitHub for authentication. This feature is for demonstration purposes.");
    onClose();
  };


  return (
    <div 
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-[#1C1C1F] rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-700/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <GithubIcon /> Import from GitHub
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:bg-white/10">
            <CloseIcon />
          </button>
        </div>
        
        <div className="text-gray-300 space-y-4">
            <p>
                To import a project, Codegen Studio needs permission to access your GitHub repositories.
            </p>
            <p>
                We will only ask for read-access to your public repositories. We will never write to your repositories or access private information.
            </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleConnect}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 flex items-center gap-2"
          >
            <GithubIcon className="w-4 h-4" />
            <span>Connect with GitHub</span>
          </button>
        </div>
      </div>
    </div>
  );
};
