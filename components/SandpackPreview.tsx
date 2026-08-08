import React, { useMemo } from 'react';
import { SandpackProvider, SandpackPreview } from '@codesandbox/sandpack-react';
import { ProjectFile } from '../types';

interface SandpackPreviewProps {
  files: ProjectFile[];
  dark?: boolean;
}

/**
 * Preview isolado via Sandpack (CodeSandbox).
 * Renderiza projetos React/TS corretamente no navegador, sem depender de
 * build server ou de iframes com a própria app (evita o "editor dentro de outro").
 */
export const SandpackProjectPreview: React.FC<SandpackPreviewProps> = ({ files, dark = false }) => {
  const sandpackFiles = useMemo(() => {
    const spFiles: Record<string, string> = {};
    if (!files || files.length === 0) return spFiles;

    files.forEach(f => {
      if (!f || !f.name) return;
      // Sandpack espera caminhos sem barra inicial
      const clean = f.name.startsWith('/') ? f.name.slice(1) : f.name;
      spFiles[clean] = f.content;
    });
    return spFiles;
  }, [files]);

  const template = useMemo(() => {
    const hasTsx = files.some(f => f.name.endsWith('.tsx') || f.name.endsWith('.ts'));
    return (hasTsx ? 'react-ts' : 'react') as 'react' | 'react-ts';
  }, [files]);

  return (
    <div className="w-full h-full relative bg-white dark:bg-[#09090b] overflow-hidden">
      <SandpackProvider
        key={JSON.stringify(Object.keys(sandpackFiles))}
        template={template}
        files={sandpackFiles}
        theme={dark ? 'dark' : 'light'}
        options={{
          externalResources: [],
          autoReload: true,
        }}
      >
        <SandpackPreview
          style={{ height: '100%', width: '100%' }}
          showOpenInCodeSandbox={false}
          showRefreshButton
          showNavigator
        />
      </SandpackProvider>
    </div>
  );
};

export default SandpackProjectPreview;
