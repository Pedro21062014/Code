import React, { useState, useRef, useEffect } from 'react';
import { execInE2b } from '../services/e2bService';

interface TerminalProps {
  sandboxId: string | null;
  isGenerating?: boolean;
}

interface Line {
  type: 'cmd' | 'out' | 'err' | 'info';
  text: string;
}

/**
 * Terminal interativo que executa comandos na pasta do app no sandbox E2B.
 */
export const Terminal: React.FC<TerminalProps> = ({ sandboxId, isGenerating }) => {
  const [lines, setLines] = useState<Line[]>([
    { type: 'info', text: 'Codegem Terminal — digite um comando (ex: ls, npm run build).' },
    { type: 'info', text: 'Trabalhando na pasta do app (/).' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [cwd, setCwd] = useState('/');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const runCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    setLines(prev => [...prev, { type: 'cmd', text: `${cwd} $ ${cmd}` }]);
    setInput('');

    if (!sandboxId) {
      setLines(prev => [...prev, { type: 'err', text: 'Sandbox ainda não iniciado. Aguarde o preview carregar.' }]);
      return;
    }

    setBusy(true);
    try {
      const result = await execInE2b(sandboxId, cmd, cwd);
      if (result.stdout) {
        setLines(prev => [...prev, ...result.stdout.split('\n').filter(l => l !== '').map(l => ({ type: 'out' as const, text: l }))]);
      }
      if (result.stderr) {
        setLines(prev => [...prev, ...result.stderr.split('\n').filter(l => l !== '').map(l => ({ type: 'err' as const, text: l }))]);
      }
      if (result.exitCode !== 0) {
        setLines(prev => [...prev, { type: 'err', text: `(exit code: ${result.exitCode})` }]);
      }
    } catch (e: any) {
      setLines(prev => [...prev, { type: 'err', text: e?.message || 'Erro ao executar comando.' }]);
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand(input);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-black text-gray-200 font-mono text-xs overflow-hidden">
      {/* Barra de título */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1c] border-b border-gray-700/50 flex-shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <span className="ml-2 text-[10px] text-gray-400">Terminal — {cwd}</span>
        {isGenerating && <span className="ml-auto text-[10px] text-blue-400 animate-pulse">sandbox iniciando...</span>}
      </div>

      {/* Saída */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {lines.map((line, i) => (
          <div key={i} className={
            line.type === 'cmd' ? 'text-green-400' :
            line.type === 'err' ? 'text-red-400' :
            line.type === 'info' ? 'text-gray-500 italic' :
            'text-gray-200'
          }>
            {line.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-t border-gray-700/50 flex-shrink-0">
        <span className="text-green-400 shrink-0">$</span>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
          placeholder={busy ? 'executando...' : 'digite um comando'}
          className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-600 disabled:opacity-50"
        />
      </div>
    </div>
  );
};

export default Terminal;
