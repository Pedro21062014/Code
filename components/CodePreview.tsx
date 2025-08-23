import React, { useState, useEffect } from 'react';
import { ProjectFile } from '../types';

declare global {
  interface Window {
    Babel: any;
  }
}

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


export const CodePreview: React.FC<{ files: ProjectFile[] }> = ({ files }) => {
  const [srcDoc, setSrcDoc] = useState('<div class="flex items-center justify-center h-full text-gray-400">Generating preview...</div>');

  useEffect(() => {
    let urlsToRevoke: string[] = [];

    const generatePreview = async () => {
      if (!window.Babel) {
        return { html: '<div class="flex items-center justify-center h-full text-red-400">Babel.js is not loaded. Cannot generate preview.</div>', urlsToRevoke: [] };
      }

      const htmlFile = files.find(f => f.name.endsWith('.html'));
      if (!htmlFile) {
        return { html: '<div class="flex items-center justify-center h-full text-gray-400">No index.html file found.</div>', urlsToRevoke: [] };
      }

      const allFilesMap = new Map(files.map(f => [f.name, f]));
      const jsFiles = files.filter(f => /\.(tsx|ts|jsx|js)$/.test(f.name));
      const createdUrls: string[] = [];
      const importMap: { imports: { [key: string]: string } } = { imports: {} };

      try {
        for (const file of jsFiles) {
          let content = file.content;
          // 1. Rewrite relative imports to be absolute paths from the root
          const importRegex = /(from\s+|import\s*\()['"]((?:\.\/|\.\.\/)[^'"]+)['"]/g;
          content = content.replace(importRegex, (match, prefix, path) => {
            let absolutePath = resolvePath(file.name, path);
            
            if (!allFilesMap.has(absolutePath)) {
                const extensions = ['.ts', '.tsx', '.js', '.jsx'];
                for (const ext of extensions) {
                    if (allFilesMap.has(absolutePath + ext)) {
                        absolutePath += ext;
                        break;
                    }
                }
            }
            return `${prefix}"/${absolutePath}"`;
          });
          
          // 2. Transpile with Babel
          const result = window.Babel.transform(content, {
            presets: ['react', 'typescript'],
            filename: file.name,
          }).code;

          // 3. Create blob URL for transpiled code
          const blob = new Blob([result], { type: 'application/javascript' });
          const url = URL.createObjectURL(blob);
          createdUrls.push(url);
          importMap.imports[`/${file.name}`] = url;
        }

        // 4. Prepare the final HTML
        let finalHtml = htmlFile.content;
        finalHtml = finalHtml.replace(/<script type="importmap"[^>]*>[\s\S]*?<\/script>/, '');
        finalHtml = finalHtml.replace('</head>', `<script type="importmap">${JSON.stringify(importMap)}</script></head>`);
        
        // Update the script tag to use the import map
        finalHtml = finalHtml.replace(
            /(<script[^>]*src=["'])([^"']+)(["'][^>]*>)/,
            (match, prefix, src, suffix) => {
                const cleanSrc = src.startsWith('/') ? src : `/${src}`;
                return `${prefix}${cleanSrc}${suffix}`;
            }
        );

        return { html: finalHtml, urlsToRevoke: createdUrls };
      } catch (error) {
          console.error("Error generating preview:", error);
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
          return { html: `<pre class="p-4 text-red-400">Error generating preview:\n${errorMessage}</pre>`, urlsToRevoke: createdUrls };
      }
    };

    generatePreview().then(result => {
      setSrcDoc(result.html);
      urlsToRevoke = result.urlsToRevoke;
    });

    return () => {
      urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  return (
    <div className="w-full h-full bg-white">
      <iframe
        srcDoc={srcDoc}
        title="Project Preview"
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-full border-0"
      />
    </div>
  );
};