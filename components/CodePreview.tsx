
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ProjectFile, Theme } from '../types';
import { AppLogo } from './Icons';

interface CodePreviewProps {
  files: ProjectFile[];
  onError: (errorMessage: string) => void;
  theme: Theme;
  envVars: Record<string, string>;
}

// Utility to resolve path parts (like node's path.resolve but simpler)
const resolvePath = (base: string, relative: string) => {
    const stack = base.split('/');
    stack.pop(); // Remove current filename
    const parts = relative.split('/');
    for (const part of parts) {
        if (part === '.') continue;
        if (part === '..') {
            if (stack.length > 0) stack.pop();
        } else {
            stack.push(part);
        }
    }
    return stack.join('/');
};

export const CodePreview: React.FC<CodePreviewProps> = ({ files, theme, envVars }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0); 
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const srcDoc = useMemo(() => {
    if (files.length === 0) return '';
    setRuntimeError(null);

    // 1. Create a map of "standardized paths" to blob URLs
    // Standardized path = path relative to project root, e.g., "src/components/Header"
    // We strip extensions for matching logic if needed, but import map keys usually keep them or use clean names.
    const blobs: Record<string, string> = {};
    const processedFiles: { name: string; content: string; blobUrl: string }[] = [];

    // Helper: clean name for import map keys (e.g., "src/App.tsx" -> "./src/App")
    const getImportMapKey = (fileName: string) => {
        // Ensure it starts with ./ for import map
        let clean = fileName.startsWith('./') ? fileName : `./${fileName}`;
        // Remove extension for matching imports without extension
        return clean.replace(/\.(tsx|ts|js|jsx|css)$/, '');
    };

    // First pass: Create blobs for all files 'as is' to get URLs (placeholder)
    // Actually, we need to rewrite content BEFORE creating blobs to fix imports.
    
    // We need to map "Standard Paths" -> "Original Content" first.
    const fileMap = new Map<string, string>();
    files.forEach(f => fileMap.set(f.name, f.content));

    // Rewrite imports in all JS/TS files
    files.forEach(file => {
        if (file.name.endsWith('.css') || file.name.endsWith('.html')) {
             const blob = new Blob([file.content], { type: file.name.endsWith('.css') ? 'text/css' : 'text/html' });
             const url = URL.createObjectURL(blob);
             blobs[getImportMapKey(file.name)] = url;
             // Also add full name mapping
             blobs[`./${file.name}`] = url;
             return;
        }

        let content = file.content;
        
        // Regex to find import ... from '...'
        // This is a basic regex, might not cover all edge cases (like dynamic imports or comments)
        // matches: import ... from "path"; import "path"; export ... from "path";
        content = content.replace(/(import|export)\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g, (match, keyword, importPath) => {
            if (importPath.startsWith('.')) {
                // Resolve relative path to absolute standardized path (e.g. src/components/Header)
                const resolved = resolvePath(file.name, importPath);
                
                // Check if file exists with extensions
                let targetFile = files.find(f => 
                    f.name === resolved || 
                    f.name === `${resolved}.tsx` || 
                    f.name === `${resolved}.ts` || 
                    f.name === `${resolved}.js` || 
                    f.name === `${resolved}.jsx`
                );

                if (targetFile) {
                    // Rewrite import to the absolute key we will use in importmap
                    // e.g., "./src/components/Header"
                    const newImport = `./${targetFile.name.replace(/\.(tsx|ts|js|jsx)$/, '')}`;
                    // Reconstruct the import statement
                    const parts = match.split(/['"]/);
                    return `${parts[0]}'${newImport}'${parts[2] || ''}`;
                }
            }
            return match;
        });

        // Inject Environment Variables manually at the top of file if needed?
        // Actually, we can inject `process.env` in the main HTML.

        const blob = new Blob([content], { type: 'text/tsx' });
        const url = URL.createObjectURL(blob);
        
        // Map multiple variants to ensure resolution hits
        const keyBase = getImportMapKey(file.name);
        blobs[keyBase] = url;
        blobs[`./${file.name}`] = url; // Full name
    });

    const imports = {
        "react": "https://esm.sh/react@18.2.0",
        "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
        "react/jsx-runtime": "https://esm.sh/react@18.2.0/jsx-runtime",
        "lucide-react": "https://esm.sh/lucide-react@0.263.1",
        "framer-motion": "https://esm.sh/framer-motion@10.16.4",
        "clsx": "https://esm.sh/clsx@2.0.0",
        "tailwind-merge": "https://esm.sh/tailwind-merge@1.14.0",
        "date-fns": "https://esm.sh/date-fns@2.30.0",
        ...blobs
    };

    // Construct Environment Variables Script
    const envScript = `
      window.process = {
        env: ${JSON.stringify(envVars)}
      };
    `;

    // Find Entry Point
    const entryFile = files.find(f => 
        f.name === 'src/main.tsx' || 
        f.name === 'src/index.tsx' || 
        f.name === 'main.tsx' || 
        f.name === 'index.tsx'
    );

    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    const cssContent = cssFiles.map(f => f.content).join('\n');

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script>
            ${envScript}
            window.onerror = function(msg, url, line, col, error) {
                window.parent.postMessage({ type: 'PREVIEW_ERROR', message: msg }, '*');
                return false;
            };
            window.addEventListener('unhandledrejection', function(event) {
                window.parent.postMessage({ type: 'PREVIEW_ERROR', message: event.reason ? event.reason.toString() : 'Unhandled Rejection' }, '*');
            });
          </script>
          <style>
            ${cssContent}
            body { background-color: ${theme === 'dark' ? '#000' : '#fff'}; color: ${theme === 'dark' ? '#fff' : '#000'}; }
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: rgba(100,100,100,0.3); border-radius: 3px; }
          </style>
          <script type="importmap">
            ${JSON.stringify({ imports })}
          </script>
        </head>
        <body>
          <div id="root"></div>
          ${entryFile ? `
            <script type="text/babel" data-type="module" data-presets="react,typescript">
              import React from 'react';
              import { createRoot } from 'react-dom/client';
              import App from '${getImportMapKey(entryFile.name)}';

              const rootElement = document.getElementById('root');
              if (rootElement) {
                  const root = createRoot(rootElement);
                  root.render(React.createElement(App));
                  window.onload = () => {
                      setTimeout(() => {
                          window.parent.postMessage({ type: 'PREVIEW_LOADED' }, '*');
                      }, 100);
                  };
              }
            </script>
          ` : '<div style="padding: 20px;">No entry point (src/main.tsx) found.</div>'}
        </body>
      </html>
    `;
  }, [files, theme, envVars]);

  useEffect(() => {
    setIsLoading(true);
    const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'PREVIEW_LOADED') {
            setIsLoading(false);
        }
        if (event.data?.type === 'PREVIEW_ERROR') {
            setIsLoading(false);
            setRuntimeError(event.data.message);
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [srcDoc]);

  // Safety timeout
  useEffect(() => {
      if (isLoading) {
          const timer = setTimeout(() => setIsLoading(false), 4000);
          return () => clearTimeout(timer);
      }
  }, [isLoading]);

  if (files.length === 0) {
    return (
      <div className="w-full h-full bg-[#09090b] flex flex-col items-center justify-center gap-6 animate-fadeIn">
         <div className="relative group">
             <div className="absolute inset-0 bg-blue-500 blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity duration-1000"></div>
             <AppLogo className="w-16 h-16 text-gray-800 relative z-10" />
         </div>
         <p className="text-gray-600 font-mono text-xs tracking-widest uppercase">Aguardando Código</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white relative group">
      <iframe
        key={key}
        ref={iframeRef}
        title="Preview"
        srcDoc={srcDoc}
        className="w-full h-full border-none bg-white block"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />

      {runtimeError && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 text-white p-4 rounded-lg shadow-xl backdrop-blur-md animate-slideInUp z-20">
              <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                      <h4 className="font-bold text-sm mb-1">Erro de Execução</h4>
                      <p className="text-xs font-mono opacity-90 break-all">{runtimeError}</p>
                  </div>
                  <button onClick={() => setRuntimeError(null)} className="ml-auto text-white/50 hover:text-white"><svg className="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
          </div>
      )}

      {/* Modern Minimalist Loading Overlay */}
      <div className={`absolute inset-0 bg-[#09090b]/90 backdrop-blur-md flex items-center justify-center z-10 transition-opacity duration-700 pointer-events-none ${isLoading ? 'opacity-100' : 'opacity-0'}`}>
           <div className="flex flex-col items-center gap-4">
              <div className="relative">
                  <div className="absolute inset-0 bg-white blur-xl opacity-20 animate-pulse"></div>
                  <AppLogo className="w-10 h-10 text-white relative z-10 animate-bounce" />
              </div>
           </div>
      </div>
    </div>
  );
};
