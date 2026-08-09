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

/** Converte uma FileSystemTree (JSON) do WebContainer em lista de {name, content}. */
function flattenTree(tree: Record<string, any>, base = ''): { name: string; content: string }[] {
  const out: { name: string; content: string }[] = [];
  for (const key of Object.keys(tree || {})) {
    const node = tree[key];
    const path = base ? `${base}/${key}` : key;
    if (node?.file?.contents) {
      const contents = typeof node.file.contents === 'string'
        ? node.file.contents
        : Buffer.from(node.file.contents).toString('utf-8');
      out.push({ name: path, content: contents });
    } else if (node?.directory) {
      out.push(...flattenTree(node.directory, path));
    }
  }
  return out;
}

let _authInit = false;

const getConfig = () => ({
  // 1. Via variável de ambiente (Vite build) ou 2. via global config dinâmica
  clientId: (import.meta as any).env?.VITE_WEB_CONTAINER_CLIENT_ID as string
    || (window as any).__WEB_CONTAINER_CLIENT_ID__ as string
    || undefined,
  scope: (import.meta as any).env?.VITE_WEB_CONTAINER_SCOPE as string
    || (window as any).__WEB_CONTAINER_SCOPE__ as string
    || '',
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

  // auth.init só pode ser chamado UMA vez. Guard global.
  if (clientId && !_authInit) {
    try {
      auth.init({ clientId, scope: scope || '' });
      _authInit = true;
    } catch (e) {
      console.warn('WebContainer auth.init falhou (talvez já inicializado):', e);
    }
  }
  // NÃO chama auth.startAuthFlow — evita a tela de permissão do StackBlitz.
  // O boot do WebContainer deve funcionar com o clientId registrado.

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

/**
 * Fluxo de deploy estilo Vercel:
 * 1. Verifica código / roda npm run build no WebContainer
 * 2. Exporta o dist
 * 3. Retorna os arquivos buildados (para enviar ao storage/CDN)
 */
export const buildAndExportDist = async (
  files: ProjectFile[],
  terminalCommands: string[] = []
): Promise<{ dist: { name: string; content: string }[]; buildLog: string }> => {
  const wc = _instance || await (async () => {
    const { WebContainer } = await import('@webcontainer/api');
    const wc = await WebContainer.boot();
    _instance = wc;
    return wc;
  })();

  // Monta os arquivos
  await wc.mount(buildTree(files) as any);

  let buildLog = '';
  const run = async (cmd: string) => {
    const proc = await wc.spawn('bash', ['-c', cmd]);
    proc.output.pipeTo(new WritableStream({
      write(data) { buildLog += typeof data === 'string' ? data : ''; },
    }));
    const code = await proc.exit;
    if (code !== 0) throw new Error(`Comando falhou (exit ${code}): ${cmd}`);
  };

  // 1. Instala
  try {
    await run('npm install');
  } catch (e: any) {
    console.warn('npm install falhou:', e?.message);
  }

  // 2. Build
  try {
    await run('npm run build');
  } catch (e: any) {
    throw new Error(`Build falhou: ${e?.message}\n\nLog:\n${buildLog}`);
  }

  // 3. Exporta dist (json tree)
  const distTree = await wc.fs.export('/dist', { format: 'json' }) as any;
  const dist = flattenTree(distTree);

  return { dist, buildLog };
};
