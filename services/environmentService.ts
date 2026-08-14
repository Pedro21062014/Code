// ============================================================
// environmentService — Mecanismo de ambiente unificado (in-browser)
//
// Mostra o preview ao vivo de QUALQUER projeto React / Next.js
// sem depender de sandbox externo (E2B removido).
//
// Estratégia:
//   1) WebContainer (primário) — roda Node.js real no navegador,
//      suporta Vite/React e Next.js.
//   2) Navebox (fallback) — motor Node in-browser alternativo.
//
// O preview exibe a URL do servidor de dev ativo. O terminal
// executa comandos no mesmo ambiente ativo (sem E2B).
// ============================================================

import { ProjectFile } from '../types';
import { startWebContainerPreview, killWebContainer, getWebContainer, execInWebContainer } from './webcontainerService';
import { startNaveboxPreview, stopNavebox, getNaveboxEngine, execInNavebox } from './naveboxService';

export type PreviewEngine = 'webcontainer' | 'navebox';

export interface EnvironmentStartResult {
  engine: PreviewEngine;
  url: string | null;
  running: boolean;
}

let _activeEngine: PreviewEngine | null = null;

/** Motor atualmente em uso pelo preview (para o terminal rotear). */
export const getActiveEngine = () => _activeEngine;

/** Detecta o tipo do projeto a partir dos arquivos. */
export function detectProjectKind(files: ProjectFile[]): 'next' | 'react' | 'static' | 'unknown' {
  const names = files.map(f => f.name);
  const hasNext = names.some(n =>
    /next\.config\.(js|ts|mjs|cjs)$/.test(n) ||
    n.includes('pages/_app') ||
    n.includes('app/layout')
  );
  if (hasNext) return 'next';
  const hasVite = names.some(n => /vite\.config\.(js|ts|mjs|cjs)$/.test(n));
  const hasReact = names.some(n => /\.(tsx|jsx)$/.test(n));
  const hasPackageJson = names.some(n => n === 'package.json' || n === '/package.json');
  if (hasReact || hasVite) return 'react';
  if (hasPackageJson) return 'unknown';
  return 'static';
}

/** Prepara comandos padrão para o tipo de projeto, quando a IA não fornecer. */
export function defaultCommandsFor(kind: ReturnType<typeof detectProjectKind>, files: ProjectFile[]): string[] {
  const hasPkg = files.some(f => f.name === 'package.json' || f.name === '/package.json');
  if (kind === 'static' || !hasPkg) return ['npx --yes serve -l 3000'];
  if (kind === 'next') return ['npm install', 'npm run dev -- --host 0.0.0.0 --port 3000'];
  return ['npm install', 'npm run dev -- --host 0.0.0.0 --port 3000'];
}

/**
 * Sobe o ambiente e inicia o preview ao vivo.
 * Tenta WebContainer primeiro; se não produzir URL, cai para Navebox.
 */
export const startEnvironment = async (
  files: ProjectFile[],
  terminalCommands: string[] = []
): Promise<EnvironmentStartResult> => {
  if (!files || files.length === 0) {
    throw new Error('Nenhum arquivo para iniciar o preview.');
  }

  const commands = terminalCommands.length > 0
    ? terminalCommands.filter(Boolean)
    : defaultCommandsFor(detectProjectKind(files), files);

  // --- 1) WebContainer (primário) ---
  try {
    const wcResult = await startWebContainerPreview(files, commands);
    if (wcResult.url) {
      _activeEngine = 'webcontainer';
      return { engine: 'webcontainer', url: wcResult.url, running: true };
    }
    console.warn('[environment] WebContainer subiu mas sem URL; tentando Navebox.');
  } catch (e: any) {
    console.warn('[environment] WebContainer falhou, tentando Navebox:', e?.message);
  }

  // --- 2) Navebox (fallback) ---
  try {
    const navResult = await startNaveboxPreview(files, commands);
    if (navResult.url) {
      _activeEngine = 'navebox';
      return { engine: 'navebox', url: navResult.url, running: true };
    }
  } catch (e: any) {
    console.error('[environment] Navebox também falhou:', e?.message);
  }

  throw new Error('Nenhum ambiente in-browser conseguiu subir o preview.');
};

/**
 * Executa um comando no ambiente ativo (terminal interativo).
 * Roteia para o motor que está de pé (WebContainer ou Navebox).
 */
export const execInEnvironment = async (
  command: string,
  cwd = '/'
): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
  if (_activeEngine === 'navebox') {
    return execInNavebox(command, cwd);
  }
  return execInWebContainer(command, cwd);
};

/** Desliga o ambiente ativo. */
export const stopEnvironment = async () => {
  try { await stopNavebox(); } catch (e) {}
  try { await killWebContainer(); } catch (e) {}
  _activeEngine = null;
};

// Re-exports para compatibilidade com os chamadores existentes
export { getWebContainer, getNaveboxEngine };
