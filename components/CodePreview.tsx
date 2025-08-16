import React, { useState, useEffect } from 'react';
import { ProjectFile } from '../types';

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

interface CodePreviewProps {
  files: ProjectFile[];
}

export const CodePreview: React.FC<CodePreviewProps> = ({ files }) => {
  const [srcDoc, setSrcDoc] = useState('<div class="flex items-center justify-center h-full text-gray-400">Generating preview...</div>');

  useEffect(() => {
    // This function will assemble the preview logic inside useEffect
    const generatePreview = () => {
      const htmlFile = files.find(f => f.name.endsWith('.html'));
      if (!htmlFile) {
        return { html: '<div class="flex items-center justify-center h-full text-gray-400">No index.html file found to preview.</div>', urlsToRevoke: [] };
      }

      const jsFiles = files.filter(f => /\.(tsx|ts|jsx|js)$/.test(f.name));
      if (jsFiles.length === 0) {
        return { html: htmlFile.content, urlsToRevoke: [] };
      }
      
      const allFilesMap = new Map(files.map(f => [f.name, f]));
      const rewrittenFiles = new Map<string, string>();
      const createdUrls: string[] = [];
      const importMap = { imports: {} };
      
      // 1. Create blob URLs for original file content and build the import map
      jsFiles.forEach(file => {
        const blob = new Blob([file.content], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        createdUrls.push(url);
        importMap.imports[`/${file.name}`] = url;
      });

      // 2. Rewrite all relative imports to be absolute paths from the root
      jsFiles.forEach(file => {
        let content = file.content;
        // Handles: from './module', from '../module', import('./module')
        const importRegex = /(from\s+|import\()['"]((?:\.\/|\.\.\/)[^'"]+)['"]/g;
        content = content.replace(importRegex, (match, prefix, path) => {
            let absolutePath = resolvePath(file.name, path);
            
            // Handle extensionless imports by checking if the resolved file exists
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
        rewrittenFiles.set(file.name, content);
      });
      
      // 3. Prepare the final HTML content
      let finalHtml = htmlFile.content;
      
      // Remove existing importmap if any, we are replacing it.
      finalHtml = finalHtml.replace(/<script type="importmap"[^>]*>[\s\S]*?<\/script>/, '');

      // Inject our new import map
      finalHtml = finalHtml.replace('</head>', `<script type="importmap">${JSON.stringify(importMap)}</script></head>`);

      // 4. Find the entry point and inline its rewritten content
      const entryPointMatch = finalHtml.match(/<script.*?src=["'](.*?)["']/);
      if (entryPointMatch) {
          let entryPointPath = entryPointMatch[1].startsWith('/') ? entryPointMatch[1].substring(1) : entryPointMatch[1];
          const mainScriptContent = rewrittenFiles.get(entryPointPath);

          if (mainScriptContent) {
              finalHtml = finalHtml.replace(
                /<script.*?src=["'].*?["']><\/script>/,
                `<script type="module">${mainScriptContent}</script>`
              );
          }
      }
      
      return { html: finalHtml, urlsToRevoke: createdUrls };
    };

    const { html, urlsToRevoke } = generatePreview();
    setSrcDoc(html);

    // Cleanup function for blob URLs
    return () => {
        urlsToRevoke.forEach(URL.revokeObjectURL);
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
