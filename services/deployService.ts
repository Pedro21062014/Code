import { ProjectFile } from '../types';

export interface DeployResult {
  url: string;
  deploymentId: string;
  projectName: string;
  filesCount: number;
}

/**
 * Publica os arquivos buildados (dist) via endpoint /api/deploy.
 * Retorna a URL pública.
 */
export const deployFiles = async (
  files: { name: string; content: string }[],
  projectName: string
): Promise<DeployResult> => {
  const response = await fetch('/api/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files, projectName }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Erro ao publicar (${response.status})`);
  }
  return data as DeployResult;
};
