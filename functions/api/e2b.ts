// Cloudflare Pages Function
// Path: /api/e2b
// Integração E2B: cria um sandbox, escreve os arquivos gerados, executa os
// terminalCommands da IA e retorna uma URL de preview ao vivo.
//
// Requer a variável de ambiente E2B_API_KEY configurada no Cloudflare Pages.
import { Sandbox } from '@e2b/code-interpreter';

interface ProjectFileInput {
  name: string;
  content: string;
}

const DEFAULT_PORT = 3000;
const NODE_TEMPLATE = 'base';

function extractPort(command: string, fallback: number): number {
  const m = command.match(/(?:--port|-p|-l)\s+(\d+)/);
  if (m) return parseInt(m[1], 10);
  const colon = command.match(/:(\d{2,5})/);
  if (colon) return parseInt(colon[1], 10);
  return fallback;
}

/**
 * Cria/ajusta um vite.config para fixar host, porta e desabilitar HMR.
 * HMR (hot reload) é a causa mais comum de o dev server cair no sandbox.
 */
function ensureViteConfig(sandbox: any, files: ProjectFileInput[], port: number) {
  const hasVite = files.some((f) => /vite\.config\.(js|ts|mjs|cjs)$/.test(f.name));
  const hasPackageJson = files.some((f) => f.name === 'package.json' || f.name === '/package.json');
  if (!hasPackageJson) return;

  const cfg = `export default {
  server: {
    host: '0.0.0.0',
    port: ${port},
    strictPort: true,
    hmr: false,
    watch: { usePolling: false }
  },
  preview: {
    host: '0.0.0.0',
    port: ${port},
    strictPort: true
  }
};
`;

  // Se não tem vite.config, cria um; se tem, não sobrescrevemos (tentamos via flags)
  if (!hasVite) {
    try {
      sandbox.files.write('/vite.config.mjs', cfg);
    } catch (e) {
      console.warn('Falha ao criar vite.config.mjs:', e?.message || e);
    }
  }
}

export const onRequestPost = async (context: any) => {
  const req = context.request;
  const E2B_API_KEY = context.env.E2B_API_KEY;

  if (!E2B_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'E2B_API_KEY não configurada no servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const files: ProjectFileInput[] = body.files || [];
    const terminalCommands: string[] = body.terminalCommands || [];
    const requestedPort = parseInt(body.port, 10);
    const targetPort = requestedPort > 0 ? requestedPort : DEFAULT_PORT;

    if (files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum arquivo enviado para o sandbox.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Cria o sandbox
    const sandbox = await Sandbox.create(NODE_TEMPLATE, {
      apiKey: E2B_API_KEY,
      timeoutMs: 60 * 60 * 1000,
      metadata: { app: 'codegen-studio', createdBy: 'codegem' },
    });

    // 2. Escreve os arquivos
    for (const file of files) {
      if (!file.name || typeof file.content !== 'string') continue;
      const cleanPath = file.name.startsWith('/') ? file.name.slice(1) : file.name;
      const parent = cleanPath.split('/').slice(0, -1).join('/');
      if (parent) {
        await sandbox.files.makeDir('/' + parent, { recursive: true }).catch(() => {});
      }
      await sandbox.files.write('/' + cleanPath, file.content);
    }

    // 2.5 Garante vite.config com host/porta/hmr fixos (estabilidade + porta 3000)
    const hasPackageJson = files.some((f) => f.name === 'package.json' || f.name === '/package.json');
    ensureViteConfig(sandbox, files, targetPort);

    // 3. Monta comandos
    let commands = terminalCommands.filter(Boolean);

    // Garante que, para projetos Node, SEMPRE haja `npm install` antes do servidor
    // e que o último comando seja o servidor de dev (se a IA só passou o dev, adiciona install).
    if (hasPackageJson) {
      const hasInstall = commands.some((c) => /npm\s+(install|i)\b/.test(c));
      if (!hasInstall) {
        commands = ['npm install', ...commands];
      }
    }

    if (commands.length === 0) {
      commands = hasPackageJson
        ? ['npm install', `npm run dev -- --host 0.0.0.0 --port ${targetPort}`]
        : [`npx --yes serve -l ${targetPort}`];
    }

    // 4. Ajusta o comando do servidor (último) para usar a porta alvo + host
    const serverIdx = commands.length - 1;
    const serverCmd = commands[serverIdx];

    if (serverCmd.includes('npm run dev') || serverCmd.includes('vite')) {
      // Remove flags antigas de host/port e aplica as corretas + HMR off
      const cleaned = serverCmd
        .replace(/\s+--(?:host|port|p|hmr|strictPort)\s+[^\s]+/g, '')
        .replace(/\s+--\s+--(?:host|port|hmr|strictPort)\s+[^\s]+/g, '')
        .replace(/\s+--\s+--\s+--(?:host|port|hmr|strictPort)\s+[^\s]+/g, '')
        .trim();
      // Usa nohup para manter vivo + log em arquivo
      commands[serverIdx] = `nohup ${cleaned} -- --host 0.0.0.0 --port ${targetPort} --strictPort --hmr false > /tmp/server.log 2>&1 &`;
    } else if (serverCmd.includes('serve')) {
      const cleaned = serverCmd.replace(/\s+-l\s+\d+/, '');
      commands[serverIdx] = `nohup ${cleaned} -l ${targetPort} > /tmp/server.log 2>&1 &`;
    } else {
      // Comando arbitrário: roda em background via nohup
      commands[serverIdx] = `nohup ${serverCmd} > /tmp/server.log 2>&1 &`;
    }

    // 5. Executa TUDO em background para não estourar o limite (~30s) da
    //    Cloudflare Function. Encadeia install + dev num único comando nohup.
    //    Se houver setups antes do servidor, eles entram antes do dev.
    let setupCmds = commands.slice(0, -1).join(' && ');
    let serverStart = commands[serverIdx];
    // Remove "&" e "nohup" finais do servidor p/ encadear com &&, e re-aplica no final
    serverStart = serverStart.replace(/\s*&\s*$/, '');
    serverStart = serverStart.replace(/^nohup\s+/, '');
    const chain = `nohup ${setupCmds ? `${setupCmds} && ` : ''}${serverStart} > /tmp/server.log 2>&1 &`;

    try {
      await sandbox.commands.run(chain, { cwd: '/', background: true });
    } catch (e: any) {
      console.warn('Falha ao iniciar pipeline do servidor:', e?.message || e);
    }

    // 6. Detecta a porta: verificação RÁPIDA (não bloquear a função).
    // O Cloudflare Pages Function tem limite de ~30s; fazer polling longo aqui
    // causava timeout (502). Então: tenta a porta alvo e as comuns uma única
    // vez, rapidamente, e retorna a URL imediatamente. O frontend revalida.
    const candidatePorts = Array.from(new Set(
      [targetPort, 3000, 5173, 5174, 4173, 8080, 8000, 3001].filter(p => p > 0)
    ));

    let port = candidatePorts[0];
    let previewUrl = `https://${sandbox.getHost(port)}`;
    let ready = false;

    // 1 passada curta por porta (máx ~3s cada) — se achar, para.
    for (const p of candidatePorts.slice(0, 4)) {
      const host = sandbox.getHost(p);
      const url = `https://${host}`;
      try {
        const probe = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(2500) });
        if (probe.ok || probe.status >= 200) {
          port = p;
          previewUrl = url;
          ready = true;
          break;
        }
      } catch (e) {
        // ainda subindo / porta errada
      }
    }

    return new Response(
      JSON.stringify({
        previewUrl,
        sandboxId: sandbox.sandboxId,
        port,
        commands,
        ready,
        logHint: '/tmp/server.log',
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

// Handler de execução de comandos no terminal do sandbox (pasta do app).
// POST /api/e2b/exec  body: { sandboxId, command, cwd? }
export const onRequestExec = async (context: any) => {
  const E2B_API_KEY = context.env.E2B_API_KEY;
  if (!E2B_API_KEY) {
    return new Response(JSON.stringify({ error: 'E2B_API_KEY não configurada.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const body = await context.request.json().catch(() => ({}));
    const sandboxId = body.sandboxId;
    const command = body.command;
    const cwd = body.cwd || '/';

    if (!sandboxId || !command) {
      return new Response(JSON.stringify({ error: 'sandboxId e command são obrigatórios.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Conecta ao sandbox existente (persistente)
    const sandbox = await Sandbox.connect(sandboxId, { apiKey: E2B_API_KEY });

    let stdout = '';
    let stderr = '';
    const res = await sandbox.commands.run(command, {
      cwd,
      timeoutMs: 60000,
      onStdout: (d: any) => { stdout += typeof d === 'string' ? d : (d?.text ?? ''); },
      onStderr: (d: any) => { stderr += typeof d === 'string' ? d : (d?.text ?? ''); },
    });

    return new Response(JSON.stringify({
      stdout,
      stderr,
      exitCode: res?.exitCode ?? 0,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
