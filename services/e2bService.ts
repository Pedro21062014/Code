import { ProjectFile } from '../types';

export interface E2bPreviewResult {
  previewUrl: string;
  sandboxId: string;
  port: number;
  commands: string[];
}

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
