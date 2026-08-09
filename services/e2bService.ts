import { ProjectFile } from '../types';

export interface E2bPreviewResult {
  previewUrl: string;
  sandboxId: string;
  port: number;
  commands: string[];
  ready?: boolean;
}

/**
 * Faz polling leve no navegador até o servidor responder (ou dar timeout).
 * Como o backend não pode fazer polling longo (limite do Cloudflare = 502),
 * o frontend espera o servidor subir após receber a URL.
 */
export const waitForServerReady = async (
  url: string,
  timeoutMs = 25000
): Promise<boolean> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const probe = await fetch(url, { method: 'HEAD', mode: 'no-cors', signal: AbortSignal.timeout(2000) });
      // no-cors retorna opaque, mas se não lançar erro o servidor está respondendo
      return true;
    } catch (e) {
      // ainda subindo
    }
    await new Promise(r => setTimeout(r, 1200));
  }
  return false;
};

/**
 * Inicia um sandbox E2B com os arquivos do projeto, executa os terminalCommands
 * da IA e retorna a URL de preview ao vivo.
 */
export const startE2bPreview = async (
  files: ProjectFile[],
  terminalCommands: string[] = [],
  port?: number
): Promise<E2bPreviewResult> => {
  const response = await fetch('/api/e2b', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files,
      terminalCommands,
      port,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `Erro ao iniciar preview (${response.status})`);
  }

  if (!data?.previewUrl) {
    throw new Error('Resposta do E2B sem URL de preview.');
  }

  return data as E2bPreviewResult;
};

/**
 * Mata um sandbox E2B (cleanup) para não deixar instâncias rodando.
 */
export const killE2bSandbox = async (sandboxId: string): Promise<void> => {
  try {
    await fetch(`/api/e2b?sandboxId=${encodeURIComponent(sandboxId)}`, { method: 'DELETE' });
  } catch (error) {
    console.error('Falha ao matar sandbox E2B:', error);
  }
};
