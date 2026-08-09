"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import AIDiff, { type AIDiffLine } from "@/components/ui/ai-diff";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

interface AIFileDiffProps {
  file: string | { name: string; content?: string };
}

/**
 * Mostra o que a IA escreveu em um arquivo, no máximo 7 linhas por vez,
 * com scroll e opção de colapsar/expandir.
 */
export const AIFileDiff: React.FC<AIFileDiffProps> = ({ file }) => {
  const name = typeof file === 'string' ? file : file.name;
  const content = typeof file === 'string' ? '' : (file.content || '');

  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Converte o conteúdo em linhas de diff (todas "added")
  const lines: AIDiffLine[] = content
    .split('\n')
    .filter(l => l.trim() !== '')  // remove linhas em branco
    .map((l, i) => ({ content: l, kind: 'added' as const, number: i + 1 }));

  const MAX_VISIBLE = 7;
  const showCollapse = lines.length > MAX_VISIBLE;
  const visibleLines = expanded ? lines : lines.slice(0, MAX_VISIBLE);

  return (
    <div>
      <AIDiff
        title={name}
        lines={visibleLines}
      />
      {showCollapse && (
        <div className="flex items-center justify-between px-1 pt-1">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {collapsed ? <IconChevronUp className="w-3 h-3" /> : <IconChevronDown className="w-3 h-3" />}
            {collapsed ? 'Expandir' : 'Colapsar'}
          </button>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
            {lines.length} linha{lines.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      {!collapsed && showCollapse && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full mt-1 text-center text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          {expanded ? 'Mostrar menos' : `Ver todas as ${lines.length} linhas`}
        </button>
      )}
    </div>
  );
};

export default AIFileDiff;
