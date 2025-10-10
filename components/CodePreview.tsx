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
  const [iframeSrc, setIframeSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    let urlsToRevoke: string[] = [];

    const generatePreview = async () => {
      if (files.length === 0) {
        return { src: undefined, urlsToRevoke: [] };
      }

      if (!window.Babel) {
        onError("Babel.js não foi carregado.");
        return { src: URL.createObjectURL(new Blob(['<div class="flex items-center justify-center h-full text-red-400">Babel.js não foi carregado. Não é possível gerar a visualização.</div>'], { type: 'text/html' })), urlsToRevoke: [] };
      }
      
      const allFilesMap = new Map(files.map(f => [f.name, f]));
      const jsFiles = files.filter(f => /\.(tsx|ts|jsx|js)$/.test(f.name));
      const cssFiles = files.filter(f => f.name.endsWith('.css'));
      const imageFiles = files.filter(f => /\.(png|jpe?g|gif|svg|webp)$/i.test(f.name));
      const htmlFiles = files.filter(f => f.name.toLowerCase().endsWith('.html'));
      
      const entryHtmlFile = htmlFiles.find(f => f.name.toLowerCase() === 'index.html') || htmlFiles[0];

      if (!entryHtmlFile) {
        const message = `
        <!DOCTYPE html><html lang="pt-BR" class="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></head><body style="margin: 0;"><div style="font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; color: #c9d1d9; background-color: #0d1117; padding: 2rem; text-align: center; box-sizing: border-box;"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: #484f58; margin-bottom: 1rem;"><path d="M14 3v4a1 1 0 0 0 1 1h4"></path><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path><line x1="9" y1="14" x2="15" y2="14"></line></svg><h2 style="font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem 0;">Apenas para Visualização Web</h2><p style="color: #8b949e; max-width: 450px; line-height: 1.5; margin: 0;">A aba "Visualização" foi projetada para renderizar projetos web que contêm um arquivo <code style="background-color: #21262d; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.875rem;">index.html</code>. Para ver o conteúdo de outros arquivos de código, por favor, use a aba "Código".</p></div></body></html>
        `;
        const blob = new Blob([message], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        return { src: url, urlsToRevoke: [url] };
      }
      
      // FIX: Changed 'createdUrls' to a let as it is reassigned later.
      let createdUrls: string[] = [];
      const importMap = JSON.parse(JSON.stringify(BASE_IMPORT_MAP));

      try {
        const assetBlobUrls = new Map<string, string>();
        
        // 1. Process and create blob URLs for non-HTML assets (CSS, images)
        for (const file of [...cssFiles, ...imageFiles]) {
            try {
                let blob: Blob;
                if (file.language === 'image') {
                    const byteCharacters = atob(file.content);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const mimeType = `image/${file.name.split('.').pop() || 'png'}`;
                    blob = new Blob([byteArray], { type: mimeType });
                } else { // CSS
                    blob = new Blob([file.content], { type: 'text/css' });
                }
                const url = URL.createObjectURL(blob);
                createdUrls.push(url);
                assetBlobUrls.set(file.name, url);
            } catch (e) {
                console.warn(`Could not create blob URL for asset ${file.name}:`, e);
            }
        }
        
        // 2. Transpile and create blob URLs for JS/TS files and build import map
        for (const file of jsFiles) {
          let content = file.content;
          
          const importRegex = /(from\s*|import\s*\()(['"])([^'"]+)(['"])/g;
          content = content.replace(importRegex, (match, prefix, openQuote, path, closeQuote) => {
              const isExternal = Object.keys(BASE_IMPORT_MAP.imports).some(pkg => path === pkg || path.startsWith(pkg + '/'));
              if (isExternal || path.startsWith('http')) return match;

              let absolutePath = path.startsWith('.') ? resolvePath(file.name, path) : path;
              if (absolutePath.startsWith('/')) absolutePath = absolutePath.substring(1);

              const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
              for (const ext of extensions) {
                  if (allFilesMap.has(absolutePath + ext)) {
                      return `${prefix}${openQuote}/${absolutePath + ext}${closeQuote}`;
                  }
              }
              console.warn(`Could not resolve local import for path: "${path}" in file: "${file.name}"`);
              return match;
          });
          
          let transformedCode = content;
          if (/\.(tsx|ts|jsx)$/.test(file.name)) {
            transformedCode = window.Babel.transform(content, {
              presets: ['react', ['typescript', { allExtensions: true, isTSX: file.name.endsWith('.tsx') }]],
              filename: file.name,
            }).code;
          }

          const blob = new Blob([transformedCode], { type: 'application/javascript' });
          const url = URL.createObjectURL(blob);
          createdUrls.push(url);
          importMap.imports[`/${file.name}`] = url;
        }

        // 3. Three-pass process for HTML files to handle inter-linking
        const processedHtmlContents = new Map<string, string>();
        const htmlBlobUrls = new Map<string, string>();

        // Pass 1: Replace asset links
        for (const htmlFile of htmlFiles) {
            let tempHtml = htmlFile.content;
            tempHtml = tempHtml.replace(/(src|href)=["']((?:\.\/|\/)?)([^"']+)["']/g, (match, attr, prefix, path) => {
                const assetPath = resolvePath(htmlFile.name, path);
                if (assetBlobUrls.has(assetPath)) {
                  return `${attr}="${assetBlobUrls.get(assetPath)}"`;
                }
                return match;
            });
            processedHtmlContents.set(htmlFile.name, tempHtml);
        }

        // Pass 2: Create initial blob URLs for HTML files (with broken HTML links)
        for (const [name, content] of processedHtmlContents.entries()) {
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            createdUrls.push(url);
            htmlBlobUrls.set(name, url);
        }

        // Pass 3: Re-process HTML content to fix inter-HTML links
        for (const htmlFile of htmlFiles) {
            let finalHtml = processedHtmlContents.get(htmlFile.name)!;
            finalHtml = finalHtml.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])([^"']+?\.html)\1/g, (match, quote, path) => {
                const resolvedHtmlPath = resolvePath(htmlFile.name, path);
                if (htmlBlobUrls.has(resolvedHtmlPath)) {
                    return match.replace(path, htmlBlobUrls.get(resolvedHtmlPath)!);
                }
                return match;
            });
            processedHtmlContents.set(htmlFile.name, finalHtml);
        }
        
        // 4. Inject scripts and final processing for the entry HTML file
        let entryHtml = processedHtmlContents.get(entryHtmlFile.name)!;
        const envContent = `window.process = { env: ${JSON.stringify(envVars)} };`;
        const envBlob = new Blob([envContent], { type: 'application/javascript' });
        const envUrl = URL.createObjectURL(envBlob);
        createdUrls.push(envUrl);
        
        const scriptsToInject = `
          <script src="${envUrl}"></script>
          <script>document.documentElement.className = '${theme}';</script>
          <script type="importmap">${JSON.stringify(importMap)}</script>
        `;

        entryHtml = entryHtml.replace('</head>', `${scriptsToInject}</head>`);
        
        // Replace main script src with its blob URL
        const scriptSrcRegex = /(<script[^>]*src=["'])([^"']+)(["'][^>]*>)/;
        const match = entryHtml.match(scriptSrcRegex);
        if (match) {
            const originalSrc = match[2];
            let key = originalSrc.startsWith('/') ? originalSrc : resolvePath(entryHtmlFile.name, originalSrc);
            const blobUrl = importMap.imports[`/${key}`] || importMap.imports[key];
            if (blobUrl) {
                entryHtml = entryHtml.replace(originalSrc, blobUrl);
            } else {
                console.warn(`Could not find blob URL for main script: ${originalSrc} (resolved to ${key})`);
            }
        }
        
        // 5. Final blob URL for the entry point
        const finalBlob = new Blob([entryHtml], { type: 'text/html' });
        const finalUrl = URL.createObjectURL(finalBlob);
        createdUrls.push(finalUrl);

        // Update all other HTML blobs to have the final content
        htmlBlobUrls.forEach((url, name) => URL.revokeObjectURL(url));
        createdUrls = createdUrls.filter(url => !htmlBlobUrls.has(url));

        for (const [name, content] of processedHtmlContents.entries()) {
             const finalHtmlBlob = new Blob([content], { type: 'text/html' });
             const finalHtmlUrl = URL.createObjectURL(finalHtmlBlob);
             createdUrls.push(finalHtmlUrl);
             if (name === entryHtmlFile.name) {
                 //This is our entry point
             }
        }
        
        // Find the correct final URL for the entry point
        const entryBlob = new Blob([entryHtml], { type: 'text/html' });
        const entryUrl = URL.createObjectURL(entryBlob);
        createdUrls.push(entryUrl);


        return { src: entryUrl, urlsToRevoke: createdUrls };

      } catch (error) {
          console.error("Erro ao gerar a visualização:", error);
          const errorMessage = error instanceof Error ? error.message.replace(/ \(\d+:\d+\)$/, '') : "Ocorreu um erro desconhecido.";
          onError(errorMessage);
          const errorBlob = new Blob([`<div class="p-4 text-red-400 bg-var-bg-subtle"><pre>Erro ao gerar a visualização:\n${errorMessage}</pre></div>`], { type: 'text/html' });
          const errorUrl = URL.createObjectURL(errorBlob);
          return { src: errorUrl, urlsToRevoke: [...createdUrls, errorUrl] };
      }
    };
    
    setIframeSrc(undefined); // Show loading state

    const loadingBlob = new Blob([LOADING_HTML], {type: 'text/html'});
    const loadingUrl = URL.createObjectURL(loadingBlob);
    setIframeSrc(loadingUrl);

    generatePreview().then(result => {
      URL.revokeObjectURL(loadingUrl);
      setIframeSrc(result.src);
      urlsToRevoke = result.urlsToRevoke;
    });

    return () => {
      urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files, onError, theme, envVars]);

  return (
    <div className="w-full h-full bg-var-bg-muted">
      <iframe
        key={iframeSrc} // Force re-render when src changes
        src={iframeSrc}
        title="Visualização do Projeto"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        className="w-full h-full border-0"
      />
    </div>
  );
};