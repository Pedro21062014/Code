import React from 'react';
import { TetrisLoader } from '@/components/ui/loader-tetris';

interface GenerationLoaderProps {
  generatingFile: string | null;
  runningCommand?: string | null;
  isGenerating: boolean;
  dark?: boolean;
}

/**
 * Overlay de loading profissional mostrado enquanto o app está gerando código.
 * Apresenta: brilho animado (shimmer), o arquivo que a IA está criando/escrevendo
 * e o comando de terminal que está rodando no sandbox E2B.
 */
export const GenerationLoader: React.FC<GenerationLoaderProps> = ({
  generatingFile,
  runningCommand,
  isGenerating,
  dark = false,
}) => {
  if (!isGenerating) return null;

  const hasFile = !!generatingFile;
  const hasCommand = !!runningCommand;

  const fileName = generatingFile || 'aguardando...';

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md overflow-hidden">
      {/* Brilho animado de fundo (aurora sutil) */}
      <div className="absolute inset-0 opacity-60 pointer-events-none" style={{
        background: 'linear-gradient(120deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08), rgba(236,72,153,0.06), rgba(59,130,246,0.08))',
        backgroundSize: '300% 300%',
        animation: 'genShimmer 6s ease infinite',
      }} />
      <style>{`
        @keyframes genShimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes genBar {
          0% { left: -40%; }
          100% { left: 110%; }
        }
        @keyframes genSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="rounded-2xl border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#111114] shadow-2xl shadow-blue-500/5 overflow-hidden">
          {/* Header com barra de progresso animada */}
          <div className="px-6 pt-5 pb-4 relative overflow-hidden">
            <div className="h-1 w-full absolute top-0 left-0 bg-gray-100 dark:bg-[#1f1f22]">
              <div className="absolute top-0 h-full w-2/5 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500"
                   style={{ animation: 'genBar 1.2s ease-in-out infinite' }} />
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <TetrisLoader columns={6} rows={10} cellSize={4} gap={1} speed={50} label="Building your app" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Construindo seu app
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Fique à vontade para assistir o bot trabalhar
                </p>
              </div>
            </div>
          </div>

          {/* Arquivo sendo criado/escrito */}
          <div className="border-t border-gray-100 dark:border-[#1f1f22] px-6 py-3 flex items-center gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500">
                {hasFile ? 'Escrevendo arquivo' : 'Aguardando arquivos...'}
              </p>
              <p className="text-[13px] font-mono text-gray-700 dark:text-gray-200 truncate">
                {fileName}
              </p>
            </div>
            {hasFile && (
              <span className="flex-shrink-0 text-[10px] font-bold text-blue-600 dark:text-blue-400 animate-pulse">…</span>
            )}
          </div>

          {/* Comando rodando no sandbox */}
          <div className="border-t border-gray-100 dark:border-[#1f1f22] px-6 py-3 flex items-center gap-3 bg-gray-50/60 dark:bg-[#0c0c0e]/60">
            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500">
                {hasCommand ? 'Rodando comando no sandbox' : 'Preparando sandbox...'}
              </p>
              <p className="text-[13px] font-mono text-emerald-700 dark:text-emerald-300 truncate">
                {runningCommand ? `$ ${runningCommand}` : 'npm install && npm run dev'}
              </p>
            </div>
            {hasCommand && (
              <span className="flex-shrink-0 inline-block w-3.5 h-3.5 rounded-full border-2 border-emerald-500/30 border-t-emerald-500"
                    style={{ animation: 'genSpin 0.8s linear infinite' }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerationLoader;
