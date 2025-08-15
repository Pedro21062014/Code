
import React from 'react';
import { SparklesIcon } from './Icons';

interface WelcomeScreenProps {
  onNewProject: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNewProject }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#1e1e1e] text-gray-400">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-gray-200 mb-2">AI CodeGen Studio</h1>
        <p className="text-lg mb-8">Your AI partner for web development.</p>
        <button
          onClick={onNewProject}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 ease-in-out flex items-center space-x-2 shadow-lg hover:shadow-blue-600/50"
        >
          <SparklesIcon />
          <span>Create New Project</span>
        </button>
        <div className="mt-12 text-sm text-gray-500">
          <p>Click "Create New Project" to start with a prompt,</p>
          <p>or use the chat on the right to begin generating code.</p>
        </div>
      </div>
    </div>
  );
};
