
import React from 'react';
import { ProjectFile, Theme } from '../types';
import { SandpackProvider, SandpackLayout, SandpackPreview, SandpackFileExplorer } from '@codesandbox/sandpack-react';

interface CodePreviewProps {
  files: ProjectFile[];
  onError: (errorMessage: string) => void;
  theme: Theme;
  envVars: Record<string, string>;
  onUrlChange?: (url: string) => void;
}

export const CodePreview: React.FC<CodePreviewProps> = ({ files, onError, theme, envVars, onUrlChange }) => {
  // Map our ProjectFile structure to Sandpack's files object
  const sandpackFiles = files.reduce((acc, file) => {
    // Sandpack expects files to be an object with paths as keys
    // We ensure the path is consistent. If it starts with src/, etc.
    acc[file.name] = file.content;
    return acc;
  }, {} as Record<string, string>);

  // Determine if we should use a specific template based on files present
  // If package.json exists, sandpack will use it.
  const hasPackageJson = files.some(f => f.name === 'package.json');
  
  return (
    <div className="w-full h-full bg-[#09090b] overflow-hidden">
      <SandpackProvider
        template="vite-react-ts" // Default fallback template
        files={sandpackFiles}
        theme={theme === 'dark' ? 'dark' : 'light'}
        options={{
          classes: {
            "sp-wrapper": "h-full flex flex-col",
            "sp-layout": "flex-1 h-full border-0 rounded-none",
            "sp-preview": "h-full",
          },
          recompileMode: "immediate",
          recompileDelay: 500,
          externalResources: ["https://cdn.tailwindcss.com"],
        }}
        customSetup={{
          environment: "node", // Use Node environment for Vite/React templates
        }}
      >
        <SandpackLayout style={{ height: '100%', borderRadius: 0, border: 'none' }}>
          <SandpackPreview 
            style={{ height: '100%' }} 
            showNavigator={false} 
            showRefreshButton={true}
            showOpenInCodeSandbox={false}
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
};
