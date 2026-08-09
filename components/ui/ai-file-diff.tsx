"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { FileIconIconify } from "@/components/FileIconIconify";

interface AIFileDiffProps {
  file: string | { name: string; content?: string };
}

/**
 * Mostra o que a IA escreveu em um arquivo.
 * - Inicia COLAPSADO: só o cabeçalho (ícone do arquivo + nome + contagem),
 *   sem código.
 * - Ao expandir, mostra todas as linhas num espaço FIXO com scroll
 *   (é preciso descer para ver tudo).
 */
export const AIFileDiff: React.FC<AIFileDiffProps> = ({ file }) => {
  const name = typeof file === 'string' ? file : file.name;
  const rawContent = typeof file === 'string' ? '' : (file.content || '');
  const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

  const [open, setOpen] = useState(false); // começa colapsado

  const lines = useMemo(
    () => content
      .split('\n')
      .filter(l => l.trim() !== '')
      .map((l, i) => ({ content: l, number: i + 1 })),
    [content]
  );

  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0c0e]">
      {/* Cabeçalho (sempre visível) — clicável para expandir/colapsar */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#121214] transition-colors"
      >
        <span className="shrink-0">
          <FileIconIconify name={name} className="w-4 h-4" />
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-800 dark:text-gray-200">
          {name}
        </span>
        <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
          {lines.length} linha{lines.length !== 1 ? 's' : ''}
        </span>
        <span className="shrink-0 text-gray-400">
          {open ? <IconChevronDown className="w-4 h-4" /> : <IconChevronRight className="w-4 h-4" />}
        </span>
      </button>

      {/* Conteúdo: espaço fixo com scroll quando expandido */}
      {open && (
        <div className="border-t border-gray-200 dark:border-[#27272a]">
          <div className="h-[150px] overflow-y-auto ai-diff-scrollbar">
            <pre className="py-1 font-mono text-xs leading-relaxed">
              {lines.map((line, i) => (
                <div key={i} className="flex gap-3 px-3 bg-green-500/10">
                  {line.number !== undefined && (
                    <span className="w-6 shrink-0 select-none text-right text-gray-400 dark:text-gray-500 tabular-nums">
                      {line.number}
                    </span>
                  )}
                  <span className="w-2 shrink-0 select-none text-green-600 dark:text-green-400">+</span>
                  <span className="whitespace-pre text-gray-900 dark:text-white">{line.content}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFileDiff;
