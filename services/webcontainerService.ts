import { ProjectFile } from '../types';

/**
 * Serviço de preview via WebContainer.
 *
 * O WebContainer roda Node.js no próprio navegador (via @webcontainer/api).
 * A autenticação é OAuth-based (StackBlitz). Configure:
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
  /** URL do servidor de dev quando disponível */
  url?: string;
  port?: number;
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

// Mantém a referência do WebContainer para poder matar/reiniciar
let _instance: any = null;

export const getWebContainer = () => _instance;

export const killWebContainer = async () => {
  if (_instance) {
    try { await _instance.teardown(); } catch (e) {}
    _instance = null;
  }
};

/**
 * Inicia o WebContainer, monta os arquivos, roda os comandos e retorna a URL
 * do servidor de dev (quando disponível via 'server-ready').
 */
export const startWebContainerPreview = async (
  files: ProjectFile[],
  terminalCommands: string[] = []
): Promise<WebContainerPreviewResult> => {
  const { WebContainer, auth } = await import('@webcontainer/api');
  const { clientId, scope } = getConfig();

  if (clientId) {
    const status = auth.init({ clientId, scope: scope || 'owner' });
    if (status && status.status === 'need-auth') {
      auth.startAuthFlow({ popup: true });
    }
  }

  // Mata instância anterior
  if (_instance) {
    try { await _instance.teardown(); } catch (e) {}
    _instance = null;
  }

  const wc = await WebContainer.boot();
  _instance = wc;

  // Escreve os arquivos do projeto no filesystem virtual
  await wc.mount(buildTree(files) as any);

  // Aguarda o servidor de dev para capturar a URL
  let url: string | undefined;
  let port = 3000;
  wc.on('server-ready', (portNumber: number, serverUrl: string) => {
    port = portNumber;
    url = serverUrl;
  });

  // Executa os comandos de instalação/servidor
  // Se a IA não deu comandos, usa npm install + npm run dev
  let commands = terminalCommands.filter(Boolean);
  if (commands.length === 0) {
    const hasPkg = files.some(f => f.name === 'package.json');
    commands = hasPkg
      ? ['npm install', 'npm run dev -- --host 0.0.0.0']
      : ['npx --yes serve -l 3000'];
  }

  for (const cmd of commands) {
    try {
      const proc = await wc.spawn('bash', ['-c', cmd]);
      proc.output.pipeTo(new WritableStream({
        write(data) { console.log('[wc]', data); },
      }));
      // Não espera o dev server terminar (fica rodando)
      const isServer = /dev|serve/.test(cmd);
      if (!isServer) {
        await proc.exit;
      } else {
        // Dá um tempo para o servidor subir e capturar a URL
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (e) {
      console.warn('WebContainer comando falhou:', cmd, e);
    }
  }

  return {
    type: 'webcontainer',
    running: true,
    message: 'WebContainer iniciado com sucesso.',
    url,
    port,
  };
};
