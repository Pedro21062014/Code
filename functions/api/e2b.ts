// Cloudflare Pages Function
// Path: /api/e2b
// Integração E2B: cria um sandbox, escreve os arquivos gerados, executa os
// terminalCommands da IA e retorna uma URL de preview ao vivo.
//
// Requer a variável de ambiente E2B_API_KEY configurada no Cloudflare Pages:
//   Settings -> Environment variables -> E2B_API_KEY = e2b_xxxxxxxx
import { Sandbox } from '@e2b/code-interpreter';

interface ProjectFileInput {
  name: string;
  content: string;
}

const DEFAULT_PORT = 3000;
// Sandbox NodeJS com Node, npm e ferramentas web pré-instaladas.
const NODE_TEMPLATE = 'base';

function extractPort(command: string, fallback: number): number {
  // Suporta: --port 5173, -p 5173, -l 5173 (serve), :5173
  const m = command.match(/(?:--port|-p|-l)\s+(\d+)/);
  if (m) return parseInt(m[1], 10);
  const colon = command.match(/:(\d{2,5})/);
  if (colon) return parseInt(colon[1], 10);
  return fallback;
}

export const onRequestPost = async (context: any) => {
  const req = context.request;
  const E2B_API_KEY = context.env.E2B_API_KEY;

  if (!E2B_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'E2B_API_KEY não configurada no servidor. Adicione a variável de ambiente no Cloudflare Pages.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const files: ProjectFileInput[] = body.files || [];
    const terminalCommands: string[] = body.terminalCommands || [];
    const requestedPort = parseInt(body.port, 10);

    if (files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum arquivo enviado para o sandbox.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Cria o sandbox (5 min -> 1h). Não matamos no fim: ele persiste para o preview.
    const sandbox = await Sandbox.create(NODE_TEMPLATE, {
      apiKey: E2B_API_KEY,
      timeoutMs: 60 * 60 * 1000, // 1 hora (limite Hobby)
      metadata: { app: 'codegen-studio', createdBy: 'codegem' },
    });

    // 2. Escreve todos os arquivos no filesystem do sandbox
    for (const file of files) {
      if (!file.name || typeof file.content !== 'string') continue;
      const cleanPath = file.name.startsWith('/') ? file.name.slice(1) : file.name;
      // Garante que os diretórios pais existem
      const parent = cleanPath.split('/').slice(0, -1).join('/');
      if (parent) {
        await sandbox.files.makeDir('/' + parent, { recursive: true }).catch(() => {});
      }
      await sandbox.files.write('/' + cleanPath, file.content);
    }

    // 3. Determina se é um projeto Node ou estático
    const hasPackageJson = files.some((f) => f.name === 'package.json' || f.name === '/package.json');

    // 4. Monta a lista de comandos
    let commands = terminalCommands.filter(Boolean);
    if (commands.length === 0) {
      commands = hasPackageJson
        ? [
            'npm install',
            `npm run dev -- --host 0.0.0.0 --port ${DEFAULT_PORT}`,
          ]
        : [`npx --yes serve -l ${DEFAULT_PORT}`];
    }

    // Se a IA pediu "npm run dev" sem host/porta, força 0.0.0.0 numa porta conhecida.
    const devIndex = commands.findIndex((c) => c.includes('npm run dev'));
    if (devIndex !== -1 && !commands[devIndex].includes('--host')) {
      commands[devIndex] = `${commands[devIndex]} -- --host 0.0.0.0 --port ${DEFAULT_PORT}`;
    }

    // 5. Executa: todos os comandos de setup em foreground, o último (servidor) em background.
    const setupCommands = commands.slice(0, -1);
    for (const cmd of setupCommands) {
      const res = await sandbox.commands.run(cmd, { cwd: '/', timeoutMs: 180_000 });
      if (res && res.exitCode && res.exitCode !== 0) {
        console.warn(`Comando de setup falhou (${res.exitCode}):`, cmd, res.stderr);
      }
    }

    const serverCmd = commands[commands.length - 1];
    // Evita que o processo bloqueie o retorno; roda em background
    await sandbox.commands.run(serverCmd, { cwd: '/', background: true });

    // 6. Descobre a porta e gera a URL de preview
    const port = requestedPort > 0 ? requestedPort : extractPort(serverCmd, DEFAULT_PORT);
    const host = sandbox.getHost(port);
    const previewUrl = `https://${host}`;

    // 7. Espera o servidor ficar pronto (polling) antes de retornar a URL
    // (limitado para não estourar o timeout da Cloudflare Pages Function)
    let ready = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const probe = await fetch(previewUrl, { method: 'GET', signal: AbortSignal.timeout(2500) });
        if (probe.ok || probe.status >= 200) { ready = true; break; }
      } catch (e) {
        // ainda subindo
      }
      await new Promise(r => setTimeout(r, 1500));
    }

    return new Response(
      JSON.stringify({
        previewUrl,
        sandboxId: sandbox.sandboxId,
        port,
        commands,
        ready,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro no E2B:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro desconhecido no E2B.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Permite matar o sandbox (cleanup) via DELETE /api/e2b?sandboxId=...
export const onRequestDelete = async (context: any) => {
  const E2B_API_KEY = context.env.E2B_API_KEY;
  if (!E2B_API_KEY) {
    return new Response(JSON.stringify({ error: 'E2B_API_KEY não configurada.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const url = new URL(context.request.url);
    const sandboxId = url.searchParams.get('sandboxId');
    if (!sandboxId) {
      return new Response(JSON.stringify({ error: 'sandboxId é obrigatório.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    await Sandbox.kill(sandboxId, { apiKey: E2B_API_KEY });
    return new Response(JSON.stringify({ killed: true, sandboxId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
