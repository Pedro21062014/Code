// Serviço Navebox com import DINÂMICO do @pedrobef/navebox.
// Mantém o bundle principal leve e evita OOM no build.

export interface NaveboxPreviewResult {
  running: boolean;
  url?: string;
  port?: number;
}

let _engine: any = null;

export const getNaveboxEngine = () => _engine;

/** Executa um comando no motor Navebox ativo (in-browser, sem E2B). */
export const execInNavebox = async (
  command: string,
  cwd = '/'
): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
  if (!_engine) {
    return { stdout: '', stderr: 'Motor Navebox não iniciado.', exitCode: 1 };
  }
  const parts = command.trim().split(/\s+/);
  const bin = parts[0];
  const args = parts.slice(1);
  try {
    // engine.run retorna { exitCode, stdout, stderr }
    const res = await _engine.run(bin, args);
    return {
      stdout: typeof res?.stdout === 'string' ? res.stdout : '',
      stderr: typeof res?.stderr === 'string' ? res.stderr : '',
      exitCode: res?.exitCode ?? 0,
    };
  } catch (e: any) {
    return { stdout: '', stderr: e?.message || 'Erro ao executar comando.', exitCode: 1 };
  }
};

function toTemplateFiles(files: { name: string; content: string }[]): { path: string; content: string }[] {
  return files.map(f => ({
    path: f.name.startsWith('/') ? f.name.slice(1) : f.name,
    content: f.content,
  }));
}

export const startNaveboxPreview = async (
  files: { name: string; content: string }[],
  terminalCommands: string[] = []
): Promise<NaveboxPreviewResult> => {
  const { bootBrowserNode } = await import('@pedrobef/navebox');

  if (_engine) {
    try { await _engine.stop(); } catch (e) {}
    _engine = null;
  }

  const engine = await bootBrowserNode(toTemplateFiles(files), {
    provider: 'compat',
    allowTrustedSameOrigin: true,
    serviceWorkerUrl: '/navebox-sw.js',
  });
  _engine = engine;

  let url: string | undefined;
  let port = 3000;
  engine.onServer((server: any) => {
    port = server.port;
    url = server.url;
  });

  const hasPkg = files.some(f => f.name === 'package.json');
  const commands = terminalCommands.length > 0
    ? terminalCommands
    : (hasPkg ? ['npm install', 'npm run dev -- --host 0.0.0.0'] : ['npx --yes serve -l 3000']);

  for (const cmd of commands) {
    try {
      const parts = cmd.split(/\s+/);
      await engine.run(parts[0], parts.slice(1));
    } catch (e) {
      console.warn('Navebox comando falhou:', cmd, e);
    }
  }

  try {
    await engine.start();
  } catch (e) {
    console.warn('Navebox start falhou:', e);
  }

  await new Promise(r => setTimeout(r, 2500));

  return { running: true, url, port };
};

export const stopNavebox = async () => {
  if (_engine) {
    try { await _engine.stop(); } catch (e) {}
    _engine = null;
  }
};
