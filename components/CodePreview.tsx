
import React, { useState, useEffect, useRef } from 'react';
import { ProjectFile, Theme } from '../types';

declare global {
  interface Window {
    Babel: any;
  }
}

const LOADING_HTML = `
<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; margin: 0; background: #09090b; }
    .loader { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; color: #71717a; }
  </style>
</head>
<body>
  <div class="loader">
    <svg class="animate-spin h-8 w-8 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p class="text-sm font-medium">Renderizando aplicação React...</p>
  </div>
</body>
</html>
`;

const BASE_IMPORT_MAP = {
  imports: {
    "react": "https://esm.sh/react@^19.1.0",
    "react/": "https://esm.sh/react@^19.1.0/",
    "react-dom": "https://esm.sh/react-dom@^19.1.1",
    "react-dom/client": "https://esm.sh/react-dom@^19.1.1/client",
    "react-router-dom": "https://esm.sh/react-router-dom@^6.22.0",
    "lucide-react": "https://esm.sh/lucide-react@^0.344.0",
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@^2.44.4",
  }
};

const resolvePath = (base: string, relative: string): string => {
  const stack = base.split('/');
  stack.pop(); 
  const parts = relative.split('/');
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
};

interface CodePreviewProps {
  files: ProjectFile[];
  onError: (errorMessage: string) => void;
  theme: Theme;
  envVars: Record<string, string>;
  onUrlChange?: (url: string) => void;
}

export const CodePreview: React.FC<CodePreviewProps> = ({ files, onError, theme, envVars, onUrlChange }) => {
  const [iframeSrc, setIframeSrc] = useState<string | undefined>(undefined);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'URL_CHANGE') {
        onUrlChange?.(event.data.url);
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [onUrlChange]);

  useEffect(() => {
    let urlsToRevoke: string[] = [];

    const generatePreview = async () => {
      if (files.length === 0) return { src: undefined, urlsToRevoke: [] };
      if (!window.Babel) {
        onError("Babel.js não carregado.");
        return { src: undefined, urlsToRevoke: [] };
      }

      const allFilesMap = new Map(files.map(f => [f.name, f]));
      const jsFiles = files.filter(f => /\.(tsx|ts|jsx|js)$/.test(f.name));
      const cssFiles = files.filter(f => f.name.endsWith('.css'));
      const htmlFiles = files.filter(f => f.name.toLowerCase().endsWith('.html'));
      const entryHtmlFile = htmlFiles.find(f => f.name.toLowerCase() === 'index.html') || htmlFiles[0];

      if (!entryHtmlFile) {
        const message = `<html><body style="background:#09090b;color:#71717a;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">Nenhum index.html encontrado</body></html>`;
        const blob = new Blob([message], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        return { src: url, urlsToRevoke: [url] };
      }

      const createdUrls: string[] = [];
      const importMap = JSON.parse(JSON.stringify(BASE_IMPORT_MAP));

      try {
        // Build internal import map for all project JS/TS files
        for (const file of jsFiles) {
          let content = file.content;
          
          // Basic resolution of relative imports
          const importRegex = /(from\s*|import\s*\()(['"])([^'"]+)(['"])/g;
          content = content.replace(importRegex, (match, prefix, openQuote, path, closeQuote) => {
            if (path.startsWith('http') || Object.keys(importMap.imports).some(p => path === p || path.startsWith(p + '/'))) {
              return match;
            }
            let absolutePath = path.startsWith('.') ? resolvePath(file.name, path) : path;
            if (absolutePath.startsWith('/')) absolutePath = absolutePath.substring(1);
            
            const exts = ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'];
            for (const ext of exts) {
              if (allFilesMap.has(absolutePath + ext)) {
                return `${prefix}${openQuote}/${absolutePath + ext}${closeQuote}`;
              }
            }
            return match;
          });

          const transformed = window.Babel.transform(content, {
            presets: ['react', ['typescript', { allExtensions: true, isTSX: true }]],
            filename: file.name,
          }).code;

          const blob = new Blob([transformed], { type: 'application/javascript' });
          const url = URL.createObjectURL(blob);
          createdUrls.push(url);
          importMap.imports[`/${file.name}`] = url;
          // Also map without leading slash for consistency
          importMap.imports[file.name] = url;
        }

        let entryHtml = entryHtmlFile.content;
        
        // Navigation Tracker & Environment Injection
        const injectedScript = `
          <script>
            window.process = { env: ${JSON.stringify(envVars)} };
            (function() {
              const notify = () => {
                window.parent.postMessage({ type: 'URL_CHANGE', url: window.location.hash || window.location.pathname }, '*');
              };
              const originalPushState = history.pushState;
              const originalReplaceState = history.replaceState;
              history.pushState = function() {
                originalPushState.apply(this, arguments);
                notify();
              };
              history.replaceState = function() {
                originalReplaceState.apply(this, arguments);
                notify();
              };
              window.addEventListener('popstate', notify);
              window.addEventListener('hashchange', notify);
              // Initial notification
              setTimeout(notify, 500);
            })();
            document.documentElement.classList.add('${theme}');
          </script>
          <script type="importmap">${JSON.stringify(importMap)}</script>
        `;

        entryHtml = entryHtml.replace('</head>', `${injectedScript}</head>`);

        // Resolve scripts in HTML
        entryHtml = entryHtml.replace(/<script\s+type="module"\s+src=["']([^"']+)["']>/g, (match, src) => {
          const path = src.startsWith('/') ? src.substring(1) : src;
          const blobUrl = importMap.imports[`/${path}`] || importMap.imports[path];
          return blobUrl ? `<script type="module" src="${blobUrl}">` : match;
        });

        const finalBlob = new Blob([entryHtml], { type: 'text/html' });
        const finalUrl = URL.createObjectURL(finalBlob);
        createdUrls.push(finalUrl);

        return { src: finalUrl, urlsToRevoke: createdUrls };
      } catch (err: any) {
        onError(err.message);
        return { src: undefined, urlsToRevoke: createdUrls };
      }
    };

    const loadingBlob = new Blob([LOADING_HTML], { type: 'text/html' });
    const loadingUrl = URL.createObjectURL(loadingBlob);
    setIframeSrc(loadingUrl);

    generatePreview().then(res => {
      URL.revokeObjectURL(loadingUrl);
      if (res.src) {
        setIframeSrc(res.src);
        urlsToRevoke = res.urlsToRevoke;
      }
    });

    return () => urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
  }, [files, theme, envVars, onError]);

  return (
    <div className="w-full h-full bg-[#09090b]">
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
};
