"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { IconChevronDown, IconChevronUp, IconFileCode, IconTerminal2 } from "@tabler/icons-react";
import AILoader from "@/components/ui/ai-loader";

interface AIActivityCardProps {
  title: string;
  subtitle?: string;
  type: "file" | "command";
  /** Comando que está rodando (apenas para type=command) */
  command?: string;
  /** Saída do comando (preenchida quando disponível) */
  output?: string;
  /** Marca como "em progresso" → ativa o gradiente de brilho */
  active?: boolean;
  /** Número de linhas a mostrar quando expandido */
  maxLines?: number;
}

/**
 * Card de atividade: mostra o arquivo sendo escrito ou o comando bash rodando,
 * com gradiente de brilho animado enquanto está ativo. Clicando, expande para
 * revelar o comando e a saída.
 */
export const AIActivityCard: React.FC<AIActivityCardProps> = ({
  title,
  subtitle,
  type,
  command,
  output,
  active = true,
  maxLines = 12,
}) => {
  const [open, setOpen] = useState(false);

  const lines = (output || '').split('\n').filter(Boolean);
  const hasDetails = type === 'command' || (output && output.length > 0);

  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0c0e] shadow-sm">
      {/* Cabeçalho clicável */}
      <button
        type="button"
        onClick={() => hasDetails && setOpen(o => !o)}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
          hasDetails && "cursor-pointer hover:bg-gray-50 dark:hover:bg-[#121214]",
          !hasDetails && "cursor-default"
        )}
      >
        <span className={cn(
          "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border",
          type === 'file'
            ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
        )}>
          {type === 'file' ? <IconFileCode className="w-4 h-4" /> : <IconTerminal2 className="w-4 h-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500">
            {type === 'file' ? 'Escrevendo arquivo' : 'Rodando comando'}
          </span>
          <span className="block text-[13px] font-mono text-gray-800 dark:text-gray-200 truncate">
            {type === 'file' ? title : (command || title)}
          </span>
          {subtitle && (
            <span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">{subtitle}</span>
          )}
        </span>
        {active ? (
          <span className="flex-shrink-0 text-blue-600 dark:text-blue-400">
            <AILoader variant={type === 'command' ? 'bar' : 'grid'} showElapsed />
          </span>
        ) : (
          <span className="flex-shrink-0 text-[10px] font-bold text-green-600 dark:text-green-400">Concluído</span>
        )}
        {hasDetails && (
          <span className="flex-shrink-0 text-gray-400">
            {open ? <IconChevronUp className="w-4 h-4" /> : <IconChevronDown className="w-4 h-4" />}
          </span>
        )}
      </button>

      {/* Gradiente de brilho animado quando ativo */}
      {active && (
        <div className="relative h-1 w-full bg-gray-100 dark:bg-[#1f1f22] overflow-hidden">
          <div
            className="absolute top-0 h-full w-2/5 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500"
            style={{ animation: 'aiActivityBar 1.2s ease-in-out infinite' }}
          />
        </div>
      )}

      {/* Conteúdo expandido: comando + saída */}
      {open && (
        <div className="border-t border-gray-200 dark:border-[#27272a] bg-gray-50 dark:bg-[#08080a] p-3 font-mono text-xs space-y-2">
          {type === 'command' && command && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Comando</p>
              <pre className="whitespace-pre-wrap text-emerald-600 dark:text-emerald-400">$ {command}</pre>
            </div>
          )}
          {output && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Saída</p>
              <pre className={cn(
                "whitespace-pre-wrap text-gray-700 dark:text-gray-300 overflow-y-auto ai-diff-scrollbar",
                lines.length > maxLines ? `max-h-[${maxLines * 18}px]` : ""
              )}>
                {output}
              </pre>
            </div>
          )}
          {!output && type === 'command' && (
            <p className="text-gray-400 italic">Aguardando saída...</p>
          )}
        </div>
      )}

      <style>{`
        @keyframes aiActivityBar {
          0% { left: -40%; }
          100% { left: 110%; }
        }
      `}</style>
    </div>
  );
};

export default AIActivityCard;
