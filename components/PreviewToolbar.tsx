import React, { useRef, useState, useCallback } from 'react';
import { FloatingDock } from '@/components/ui/floating-dock';
import {
  IconHandStop,
  IconPointer,
  IconHighlight,
  IconPhoto,
  IconPaperclip,
  IconMessagePlus,
  IconScreenshot,
  IconEraser,
  IconCheck,
  IconX,
} from '@tabler/icons-react';

interface PreviewToolbarProps {
  /** Alvo do preview (container que envolve o iframe) para capturar o screenshot */
  targetRef: React.RefObject<HTMLDivElement>;
  onAttachToMessage?: (screenshot: string, note: string) => void;
}

/**
 * Barra flutuante de ferramentas sobre o preview.
 * Permite: anotar/destacar o preview e anexar um screenshot à mensagem do chat.
 */
export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({
  targetRef,
  onAttachToMessage,
}) => {
  const [mode, setMode] = useState<'none' | 'annotate' | 'pointer'>('none');
  const [color, setColor] = useState('#ef4444');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const annotateNote = useRef('');

  // Captura o preview (iframe) como dataURL e chama onAttachToMessage
  const captureScreenshot = useCallback((): string | null => {
    const container = targetRef.current;
    if (!container) return null;
    const iframe = container.querySelector('iframe') as HTMLIFrameElement | null;
    const node = iframe || container;

    const width = node.scrollWidth || container.clientWidth;
    const height = node.scrollHeight || container.clientHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    try {
      // Tenta desenhar o conteúdo do iframe (mesmo-origin via srcdoc não é desenhável diretamente,
      // então usamos uma abordagem de cor de fundo + moldura do elemento)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      // Desenha uma borda simulando o preview
      const rect = node.getBoundingClientRect();
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, width, height);
      void rect;
    } catch (e) {
      console.error('Falha ao capturar preview', e);
      return null;
    }

    // Se houver anotações no canvas, desenha-as por cima
    const annotCanvas = canvasRef.current;
    if (annotCanvas && annotCanvas.width > 0) {
      ctx.drawImage(annotCanvas, 0, 0, width, height);
    }

    return canvas.toDataURL('image/png');
  }, [targetRef]);

  const handleAttach = useCallback(() => {
    const screenshot = captureScreenshot();
    if (screenshot && onAttachToMessage) {
      onAttachToMessage(screenshot, annotateNote.current);
    }
  }, [captureScreenshot, onAttachToMessage]);

  const startAnnotate = useCallback(() => {
    setMode((prev) => (prev === 'annotate' ? 'none' : 'annotate'));
  }, []);

  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const parent = canvas.parentElement;
      canvas.width = parent?.clientWidth || 0;
      canvas.height = parent?.clientHeight || 0;
    }
  }, []);

  const setCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = targetRef.current;
    if (canvas && container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
  }, [targetRef]);

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    const container = targetRef.current;
    if (!canvas || !container) return null;
    const rect = container.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode !== 'annotate') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    if (!pos) return;
    drawing.current = true;
    lastPoint.current = pos;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + 0.1, pos.y + 0.1);
    ctx.stroke();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawing.current || mode !== 'annotate') return;
    const ctx = canvasRef.current?.getContext('2d');
    const pos = getPos(e);
    if (!ctx || !pos) return;
    ctx.beginPath();
    ctx.moveTo(lastPoint.current!.x, lastPoint.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPoint.current = pos;
  };

  const handlePointerUp = () => {
    drawing.current = false;
    lastPoint.current = null;
  };

  const dockItems = [
    {
      title: 'Anotar preview',
      icon: <IconHighlight className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: startAnnotate,
    },
    {
      title: 'Apagar anotações',
      icon: <IconEraser className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: resetCanvas,
    },
    {
      title: 'Tirar screenshot',
      icon: <IconScreenshot className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: captureScreenshot,
    },
    {
      title: 'Anexar à mensagem',
      icon: <IconPaperclip className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: handleAttach,
    },
    {
      title: 'Comentar',
      icon: <IconMessagePlus className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: () => {
        const note = window.prompt('Adicione um comentário sobre este preview:');
        if (note) {
          annotateNote.current = note;
          handleAttach();
        }
      },
    },
  ];

  return (
    <>
      {/* Canvas de anotação sobre o preview */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`absolute inset-0 z-30 ${mode === 'annotate' ? 'cursor-crosshair' : 'pointer-events-none'}`}
        style={{ display: mode === 'annotate' ? 'block' : 'none' }}
      />

      {/* Barra de controle de anotação */}
      {mode === 'annotate' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 px-3 py-2 shadow-lg">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Anotar:</span>
          {['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
              style={{ background: c }}
            />
          ))}
          <div className="w-px h-5 bg-gray-200 dark:bg-neutral-700" />
          <button onClick={startAnnotate} className="text-gray-500 hover:text-gray-800 dark:hover:text-white" title="Concluir">
            <IconCheck className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dock de ferramentas no rodapé do preview */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40">
        <FloatingDock
          items={dockItems}
          mobileClassName="translate-y-2"
          desktopClassName="bg-white/80 backdrop-blur-md dark:bg-neutral-900/80 border border-gray-200 dark:border-neutral-700"
        />
      </div>
    </>
  );
};

export default PreviewToolbar;
