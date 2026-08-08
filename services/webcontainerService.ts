import { ProjectFile } from '../types';

/**
 * Serviço de fallback via WebContainer.
 *
 * O WebContainer roda Node.js no próprio navegador (via @webcontainer/api).
 * A autenticação é OAuth-based (StackBlitz). Deixe aqui a config da sua app:
 *
 *   VITE_WEB_CONTAINER_CLIENT_ID  = seu OAuth client id
 *   VITE_WEB_CONTAINER_SCOPE      = escopo (ex: 'owner')
 *
 * Requisitos: o app precisa dos headers COOP/COEP
 * (Cross-Origin-Embedder-Policy: require-corp / Cross-Origin-Opener-Policy:
 * same-origin), caso contrário o WebContainer não inicia.
 */

export interface WebContainerPreviewResult {
  type: 'webcontainer';
  running: boolean;
  message: string;
}

const getConfig = () => ({
  clientId: (import.meta as any).env?.VITE_WEB_CONTAINER_CLIENT_ID as string | undefined,
  scope: (import.meta as any).env?.VITE_WEB_CONTAINER_SCOPE as string | undefined,
});

/**
 * Monta uma FileSystemTree (formato que o @webcontainer/api espera) a partir
 * dos arquivos do projeto, lidando com pastas aninhadas.
 */
function buildTree(files: ProjectFile[]): Record<string, any> {
  const tree: Record<string, any> = {};
  files.forEach(f => {
    if (!f || !f.name) return;
    const clean = f.name.startsWith('/') ? f.name.slice(1) : f.name;
    const parts = clean.split('/');
    let node = tree;
    parts.forEach((part, i) => {
      const isLast = i === parts.length - 1;
      if (isLast) {
        node[part] = { file: { contents: f.content } };
      } else {
        if (!node[part]) node[part] = { directory: {} };
        node[part] = node[part].directory ? node[part] : { directory: node[part] };
        node = node[part].directory;
      }
    });
  });
  return tree;
}

/**
 * Inicia o WebContainer como fallback. Se a autenticação estiver configurada,
 * roda o fluxo OAuth; caso contrário, tenta boot direto (pode falhar sem COOP/COEP).
 */
export const startWebContainerPreview = async (
  files: ProjectFile[],
  terminalCommands: string[] = []
): Promise<WebContainerPreviewResult> => {
  const { WebContainer, auth } = await import('@webcontainer/api');
  const { clientId, scope } = getConfig();

  // Autenticação opcional (se o usuário configurar o OAuth client)
  if (clientId) {
    const status = auth.init({ clientId, scope: scope || 'owner' });
    if (status && status.status === 'need-auth') {
      auth.startAuthFlow({ popup: true });
    }
  }

  const wc = await WebContainer.boot();

  // Escreve os arquivos do projeto no filesystem virtual
  await wc.mount(buildTree(files) as any);

  // Executa os comandos de instalação/servidor se existirem
  for (const cmd of terminalCommands) {
    try {
      const proc = await wc.spawn('bash', ['-c', cmd]);
      await proc.exit;
    } catch (e) {
      console.warn('WebContainer comando falhou:', cmd, e);
    }
  }

  return {
    type: 'webcontainer',
    running: true,
    message: 'WebContainer iniciado com sucesso.',
  };
};
