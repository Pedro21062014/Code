"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import AIDiff, { type AIDiffLine } from "@/components/ui/ai-diff";
import { IconChevronDown, IconChevronRight, IconFileCode } from "@tabler/icons-react";

interface AIFileDiffProps {
  file: string | { name: string; content?: string };
}

/**
 * Mostra o que a IA escreveu em um arquivo.
 * - Inicia COLAPSADO: só mostra o cabeçalho (nome do arquivo + contagem de linhas),
 *   sem nenhum código.
 * - Ao expandir, mostra 7 linhas por vez num container com scroll.
 * - Conforme o usuário rola até o fim, carrega mais 7 linhas (incremental).
 */
export const AIFileDiff: React.FC<AIFileDiffProps> = ({ file }) => {
  const name = typeof file === 'string' ? file : file.name;
  const rawContent = typeof file === 'string' ? '' : (file.content || '');
  const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

  const [open, setOpen] = useState(false); // começa colapsado
  const [visibleCount, setVisibleCount] = useState(7); // 7 linhas por vez
  const scrollRef = useRef<HTMLDivElement>(null);

  const lines: AIDiffLine[] = useMemo(
    () => content
      .split('\n')
      .filter(l => l.trim() !== '')
      .map((l, i) => ({ content: l, kind: 'added' as const, number: i + 1 })),
    [content]
  );

  const STEP = 7;
  const hasMore = visibleCount < lines.length;
  const visibleLines = lines.slice(0, visibleCount);

  // Ao rolar até perto do fim, carrega mais 7 linhas
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setVisibleCount(prev => Math.min(prev + STEP, lines.length));
    }
  };

  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0c0e]">
      {/* Cabeçalho (sempre visível) — clicável para expandir/colapsar */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#121214] transition-colors"
      >
        <IconFileCode className="w-4 h-4 text-blue-500 flex-shrink-0" />
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

      {/* Conteúdo: só aparece quando expandido */}
      {open && (
        <div className="border-t border-gray-200 dark:border-[#27272a]">
          <AIDiff
            title={name}
            lines={visibleLines}
          />
          {/* Container com scroll — vai aparecendo o resto ao rolar */}
          {lines.length > STEP && (
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="max-h-[150px] overflow-y-auto ai-diff-scrollbar border-t border-gray-200 dark:border-[#27272a]"
            >
              <pre className="py-1 font-mono text-xs leading-relaxed">
                {lines.slice(STEP).map((line, i) => (
                  <div key={i} className={cn("flex gap-3 px-3 bg-green-500/10")}>
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
          )}
        </div>
      )}
    </div>
  );
};

export default AIFileDiff;
