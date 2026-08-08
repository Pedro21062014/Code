import React, { useMemo, Component, type ReactNode } from 'react';
import { SandpackProvider, SandpackPreview } from '@codesandbox/sandpack-react';
import { ProjectFile } from '../types';

// ErrorBoundary: se o Sandpack quebrar, mostra um fallback simples em vez de
// derrubar o editor inteiro (evita a tela branca ao abrir o projeto).
class SandpackErrorBoundary extends Component<{ children: ReactNode; files: ProjectFile[] }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) {
    console.error('Sandpack preview falhou:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-[#09090b] text-gray-400 p-6 text-center">
          <p className="text-sm font-medium mb-2">Não foi possível renderizar o preview via Sandpack.</p>
          <p className="text-xs opacity-70">Verifique os arquivos do projeto e tente novamente.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

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
      const clean = f.name.startsWith('/') ? f.name.slice(1) : f.name;
      spFiles[clean] = f.content || '';
    });
    return spFiles;
  }, [files]);

  const template = useMemo(() => {
    const hasTsx = files.some(f => f.name.endsWith('.tsx') || f.name.endsWith('.ts'));
    return (hasTsx ? 'react-ts' : 'react') as 'react' | 'react-ts';
  }, [files]);

  return (
    <div className="w-full h-full relative bg-white dark:bg-[#09090b] overflow-hidden">
      <SandpackErrorBoundary files={files}>
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
      </SandpackErrorBoundary>
    </div>
  );
};

export default SandpackProjectPreview;
