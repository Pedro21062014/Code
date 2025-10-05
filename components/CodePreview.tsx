import React, { useState, useEffect } from 'react';
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
    body {
      font-family: 'Inter', sans-serif;
    }
  </style>
</head>
<body class="bg-gray-900 text-gray-300">
  <div class="flex flex-col items-center justify-center h-screen">
    <svg class="animate-spin h-8 w-8 text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p class="text-lg font-medium">Construindo sua aplicação...</p>
  </div>
</body>
</html>
`;

const BASE_IMPORT_MAP = {
  imports: {
    "react": "https://esm.sh/react@^19.1.0",
    "react/": "https://esm.sh/react@^19.1.0/",
    "react-dom": "https://esm.sh/react-dom@^19.1.1",
    "react-dom/": "https://esm.sh/react-dom@^19.1.1/",
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@^2.44.4",
  }
};


/**
 * Resolves a relative path from a base file path.
 * E.g., resolvePath('components/Card.tsx', './Icon.tsx') => 'components/Icon.tsx'
 */
const resolvePath = (base: string, relative: string): string => {
  const stack = base.split('/');
  stack.pop(); // Remove filename to get directory
  const parts = relative.split('/');

  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
};


export const CodePreview: React.FC<{ files: ProjectFile[]; onError: (errorMessage: string) => void; theme: Theme; envVars: Record<string, string> }> = ({ files, onError, theme, envVars }) => {
  const [srcDoc, setSrcDoc] = useState(LOADING_HTML);

  useEffect(() => {
    let urlsToRevoke: string[] = [];

    const generatePreview = async () => {
      if (files.length === 0) {
        return { html: LOADING_HTML, urlsToRevoke: [] };
      }

      if (!window.Babel) {
        onError("Babel.js não foi carregado.");
        return { html: '<div class="flex items-center justify-center h-full text-red-400">Babel.js não foi carregado. Não é possível gerar a visualização.</div>', urlsToRevoke: [] };
      }

      const htmlFile = files.find(f => f.name.toLowerCase() === 'index.html');
      if (!htmlFile) {
        const message = `
        <!DOCTYPE html>
        <html lang="pt-BR" class="dark">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0;">
          <div style="font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; color: #c9d1d9; background-color: #0d1117; padding: 2rem; text-align: center; box-sizing: border-box;">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: #484f58; margin-bottom: 1rem;"><path d="M14 3v4a1 1 0 0 0 1 1h4"></path><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path><line x1="9" y1="14" x2="15" y2="14"></line></svg>
            <h2 style="font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem 0;">Apenas para Visualização Web</h2>
            <p style="color: #8b949e; max-width: 450px; line-height: 1.5; margin: 0;">
              A aba "Visualização" foi projetada para renderizar projetos web que contêm um arquivo <code style="background-color: #21262d; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.875rem;">index.html</code>.
              Para ver o conteúdo de outros arquivos de código, por favor, use a aba "Código".
            </p>
          </div>
        </body>
        </html>
        `;
        return { html: message, urlsToRevoke: [] };
      }

      const allFilesMap = new Map(files.map(f => [f.name, f]));
      const jsFiles = files.filter(f => /\.(tsx|ts|jsx|js)$/.test(f.name));
      const cssFiles = files.filter(f => f.name.endsWith('.css'));
      const imageFiles = files.filter(f => /\.(png|jpe?g|gif|svg|webp)$/i.test(f.name));
      const createdUrls: string[] = [];
      const importMap = JSON.parse(JSON.stringify(BASE_IMPORT_MAP)); // Deep copy base map

      try {
        const assetBlobUrls = new Map<string, string>();
        
        // Process CSS files
        for (const file of cssFiles) {
          const blob = new Blob([file.content], { type: 'text/css' });
          const url = URL.createObjectURL(blob);
          createdUrls.push(url);
          assetBlobUrls.set(file.name, url);
        }

        // Process Image files
        for (const file of imageFiles) {
            try {
                const byteCharacters = atob(file.content);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const mimeType = `image/${file.name.split('.').pop() || 'png'}`;
                const blob = new Blob([byteArray], { type: mimeType });
                const url = URL.createObjectURL(blob);
                createdUrls.push(url);
                assetBlobUrls.set(file.name, url);
            } catch (e) {
                console.warn(`Could not create blob URL for image ${file.name}:`, e);
            }
        }

        // Process JS files
        for (const file of jsFiles) {
          let content = file.content;
          
          const importRegex = /(from\s*|import\s*\()(['"])([^'"]+)(['"])/g;
          content = content.replace(importRegex, (match, prefix, openQuote, path, closeQuote) => {
              const isExternal = Object.keys(BASE_IMPORT_MAP.imports).some(pkg => path === pkg || path.startsWith(pkg + '/'));
              if (isExternal || path.startsWith('http')) {
                  return match;
              }

              let absolutePath = path.startsWith('.') ? resolvePath(file.name, path) : path;
              if (absolutePath.startsWith('/')) {
                  absolutePath = absolutePath.substring(1);
              }

              let resolvedFile = null;
              const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
              for (const ext of extensions) {
                  if (allFilesMap.has(absolutePath + ext)) {
                      resolvedFile = absolutePath + ext;
                      break;
                  }
              }

              if (resolvedFile) {
                  return `${prefix}${openQuote}/${resolvedFile}${closeQuote}`;
              }
              
              console.warn(`Could not resolve local import for path: "${path}" in file: "${file.name}"`);
              return match;
          });
          
          let transformedCode;
          if (/\.(tsx|ts|jsx)$/.test(file.name)) {
            const presets: any[] = ['react'];
            if (/\.(ts|tsx)$/.test(file.name)) {
              presets.push(['typescript', { allExtensions: true, isTSX: file.name.endsWith('.tsx') }]);
            }
            
            const transformResult = window.Babel.transform(content, {
              presets,
              filename: file.name,
            });
            transformedCode = transformResult.code;
          } else {
            transformedCode = content;
          }

          const blob = new Blob([transformedCode], { type: 'application/javascript' });
          const url = URL.createObjectURL(blob);
          createdUrls.push(url);
          importMap.imports[`/${file.name}`] = url;
        }

        let finalHtml = htmlFile.content;
        
        // Replace asset paths (CSS, images) in HTML
        finalHtml = finalHtml.replace(/(src|href)=["']((?:\.\/|\/)?)([^"']+)["']/g, (match, attr, prefix, path) => {
            const assetPath = path.startsWith('/') ? path.substring(1) : path;
            if (assetBlobUrls.has(assetPath)) {
              return `${attr}="${assetBlobUrls.get(assetPath)}"`;
            }
            return match;
        });

        // Create and inject environment variables script
        const envContent = `window.process = { env: ${JSON.stringify(envVars)} };`;
        const envBlob = new Blob([envContent], { type: 'application/javascript' });
        const envUrl = URL.createObjectURL(envBlob);
        createdUrls.push(envUrl);
        const envScript = `<script src="${envUrl}"></script>`;

        const themeScript = `
          <script>
            document.documentElement.className = '${theme}';
          </script>
        `;

        finalHtml = finalHtml.replace(/<script type="importmap"[^>]*>[\s\S]*?<\/script>/, '');
        finalHtml = finalHtml.replace('</head>', `${envScript}${themeScript}<script type="importmap">${JSON.stringify(importMap)}</script></head>`);
        
        const scriptSrcRegex = /(<script[^>]*src=["'])([^"']+)(["'][^>]*>)/;
        const match = finalHtml.match(scriptSrcRegex);
        if (match) {
            const originalSrc = match[2];
            let key = originalSrc.startsWith('/') ? originalSrc : `/${originalSrc}`;
            if(!key.endsWith('.js') && !key.endsWith('.tsx') && !key.endsWith('.ts')) {
              key = `${key}.tsx`; // Best guess for React projects
            }
            const blobUrl = importMap.imports[key] || importMap.imports[key.replace('.tsx', '.js')];

            if (blobUrl) {
                finalHtml = finalHtml.replace(originalSrc, blobUrl);
            } else {
                console.warn(`Could not find blob URL for main script: ${originalSrc} (resolved to ${key})`);
            }
        }

        return { html: finalHtml, urlsToRevoke: createdUrls };
      } catch (error) {
          console.error("Erro ao gerar a visualização:", error);
          const errorMessage = error instanceof Error ? error.message.replace(/ \(\d+:\d+\)$/, '') : "Ocorreu um erro desconhecido.";
          onError(errorMessage);
          return { html: `<div class="p-4 text-red-400 bg-var-bg-subtle"><pre>Erro ao gerar a visualização:\n${errorMessage}</pre></div>`, urlsToRevoke: createdUrls };
      }
    };

    setSrcDoc(LOADING_HTML);

    generatePreview().then(result => {
      setSrcDoc(result.html);
      urlsToRevoke = result.urlsToRevoke;
    });

    return () => {
      urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files, onError, theme, envVars]);

  return (
    <div className="w-full h-full bg-var-bg-muted">
      <iframe
        srcDoc={srcDoc}
        title="Visualização do Projeto"
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-full border-0"
      />
    </div>
  );
};
