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
          <p className="text-sm font-medium mb-2">Não foi possível renderizar o preview.</p>
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
 * Preview isolado via Sandpack (CodeSandbox), MOSTRANDO APENAS O PREVIEW
 * (página inteira do app), sem editor.
 *
 * - Projetos React/TS → template react / react-ts
 * - Projetos estáticos (HTML/CSS/JS) → template vanilla + index.html garantido
 */
export const SandpackProjectPreview: React.FC<SandpackPreviewProps> = ({ files, dark = false }) => {
  const { sandpackFiles, template } = useMemo(() => {
    const spFiles: Record<string, string> = {};
    if (!files || files.length === 0) return { sandpackFiles: spFiles, template: 'vanilla' as const };

    const hasReact = files.some(f =>
      (f.name && (f.name.endsWith('.tsx') || f.name.endsWith('.jsx'))) ||
      (f.name && (f.name.endsWith('.ts') || f.name.endsWith('.js')) && f.content && f.content.includes('React'))
    );
    const hasTsx = files.some(f => f.name.endsWith('.tsx') || f.name.endsWith('.ts'));

    files.forEach(f => {
      if (!f || !f.name) return;
      const clean = f.name.startsWith('/') ? f.name.slice(1) : f.name;
      const content = typeof f.content === 'string' ? f.content : '';

      if (clean === 'package.json') {
        try {
          const parsed = JSON.parse(content);
          spFiles[clean] = JSON.stringify(parsed, null, 2);
        } catch (e) { /* ignora inválido */ }
        return;
      }
      if (content.length > 2_000_000) return;
      spFiles[clean] = content;
    });

    // Se é estático e não tem index.html na raiz, monta um mínimo
    if (!hasReact && !spFiles['index.html']) {
      spFiles['index.html'] = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
</head>
<body>
  <div style="font-family:system-ui;color:#555;padding:3rem;text-align:center">
    <p>Arquivos do projeto disponíveis. Gere um index.html para o preview.</p>
  </div>
</body>
</html>`;
    }

    const t = hasReact ? (hasTsx ? 'react-ts' : 'react') : 'vanilla';
    return { sandpackFiles: spFiles, template: t as 'react' | 'react-ts' | 'vanilla' };
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
