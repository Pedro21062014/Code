import React, { useRef, useState, useCallback, useEffect } from 'react';
import { FloatingDock } from '@/components/ui/floating-dock';
import {
  IconHighlight,
  IconEraser,
  IconScreenshot,
  IconPaperclip,
  IconMessagePlus,
  IconExternalLink,
  IconCheck,
  IconX,
  IconCrop,
} from '@tabler/icons-react';

interface PreviewToolbarProps {
  /** Alvo do preview (container que envolve o iframe) para capturar o screenshot */
  targetRef: React.RefObject<HTMLDivElement>;
  onAttachToMessage?: (screenshot: string, note: string) => void;
  onAttachFile?: (data: string, mimeType: string, note?: string) => void;
  /** URL do preview para abrir em nova aba */
  previewUrl?: string | null;
}

/**
 * Barra flutuante de ferramentas sobre o preview.
 * Funcionalidades:
 *  - Anotar o preview (riscar/destacar) e, ao concluir (check), anexar à mensagem.
 *  - Screenshot com seleção de área: arrastar para selecionar a região e anexar.
 *  - Anexar um arquivo do computador à mensagem.
 *  - Abrir o preview em uma nova aba do navegador.
 */
export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({
  targetRef,
  onAttachToMessage,
  onAttachFile,
  previewUrl,
}) => {
  const [mode, setMode] = useState<'none' | 'annotate' | 'select'>('none');
  const [color, setColor] = useState('#ef4444');
  const [note, setNote] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const annotateNote = useRef('');
  const noteDismissed = useRef(false);

  // Estado de seleção de área (crop)
  const [selection, setSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const selectStart = useRef<{ x: number; y: number } | null>(null);

  // Sincroniza o tamanho do canvas de anotação com o container
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = targetRef.current;
    if (canvas && container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
  }, [targetRef]);

  useEffect(() => {
    if (mode === 'annotate' || mode === 'select') {
      syncCanvasSize();
    }
  }, [mode, syncCanvasSize]);

  const getPos = (e: React.PointerEvent) => {
    const container = targetRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // Captura o conteúdo do preview (mesmo-origin via srcdoc) para um canvas
  const capturePreviewContent = useCallback((): string | null => {
    const container = targetRef.current;
    if (!container) return null;
    const iframe = container.querySelector('iframe') as HTMLIFrameElement | null;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Preenchimento de fundo do preview
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Tenta desenhar o iframe (mesmo-origin)
    let captured = false;
    if (iframe) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.body) {
          const cloned = doc.body.cloneNode(true) as HTMLElement;
          const styles = Array.from(doc.querySelectorAll('style, link[rel="stylesheet"]'))
            .map((s) => (s as HTMLElement).outerHTML || s.textContent || '')
            .join('\n');

          const html = `<!DOCTYPE html><html><head>${styles}</head><body>${cloned.outerHTML}</body></html>`;
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${html}</div></foreignObject></svg>`;

          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            captured = true;
            // chamada posterior se necessário
          };
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        }
      } catch (e) {
        // cross-origin: não consegue ler o iframe
      }
    }

    // Desenha moldura de referência
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

    return canvas.toDataURL('image/png');
  }, [targetRef]);

  // Composição final: preview capturado + anotações
  const composeScreenshot = useCallback((): string | null => {
    const container = targetRef.current;
    if (!container) return null;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fundo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Anotações do canvas
    const annotCanvas = canvasRef.current;
    if (annotCanvas && annotCanvas.width > 0) {
      ctx.drawImage(annotCanvas, 0, 0, width, height);
    }

    // Tenta desenhar o conteúdo do iframe por baixo das anotações
    const iframe = container.querySelector('iframe') as HTMLIFrameElement | null;
    if (iframe) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.body) {
          const cloned = doc.body.cloneNode(true) as HTMLElement;
          const styles = Array.from(doc.querySelectorAll('style, link[rel="stylesheet"]'))
            .map((s) => (s as HTMLElement).outerHTML || '')
            .join('\n');
          const html = `<!DOCTYPE html><html><head>${styles}</head><body>${cloned.outerHTML}</body></html>`;
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${html}</div></foreignObject></svg>`;
          const img = new Image();
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        }
      } catch (e) {
        // cross-origin ignorado
      }
    }

    return canvas.toDataURL('image/png');
  }, [targetRef]);

  // Anexa à mensagem (screenshot composto)
  const handleAttach = useCallback(() => {
    const screenshot = composeScreenshot();
    if (screenshot && onAttachToMessage) {
      onAttachToMessage(screenshot, annotateNote.current);
    }
  }, [composeScreenshot, onAttachToMessage]);

  // Anexa à mensagem apenas a área selecionada (crop)
  const handleAttachSelection = useCallback(() => {
    if (!selection) return;
    const container = targetRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const src = canvasRef.current;
    if (!src) return;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = selection.w;
    cropCanvas.height = selection.h;
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, selection.w, selection.h);
    ctx.drawImage(src, selection.x, selection.y, selection.w, selection.h, 0, 0, selection.w, selection.h);

    const dataUrl = cropCanvas.toDataURL('image/png');
    if (onAttachToMessage) {
      onAttachToMessage(dataUrl, annotateNote.current);
    }
  }, [selection, targetRef, onAttachToMessage]);

  // Inicia / encerra o modo anotação
  const toggleAnnotate = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'annotate' ? 'none' : 'annotate';
      if (next === 'annotate') syncCanvasSize();
      return next;
    });
  }, [syncCanvasSize]);

  // Concluir anotação: anexa a imagem à mensagem
  const handleFinishAnnotate = useCallback(() => {
    setMode('none');
    handleAttach();
  }, [handleAttach]);

  const cancelAnnotate = useCallback(() => {
    setMode('none');
    resetCanvas();
  }, []);

  // Modo seleção de área para screenshot
  const toggleSelect = useCallback(() => {
    setSelection(null);
    setMode((prev) => (prev === 'select' ? 'none' : 'select'));
  }, []);

  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const parent = canvas.parentElement;
      canvas.width = parent?.clientWidth || 0;
      canvas.height = parent?.clientHeight || 0;
    }
    setSelection(null);
  }, []);

  // --- Handlers de desenho (anotação) ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode === 'select') {
      const pos = getPos(e);
      if (!pos) return;
      selectStart.current = pos;
      setSelection({ x: pos.x, y: pos.y, w: 0, h: 0 });
      return;
    }
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
    if (mode === 'select') {
      const pos = getPos(e);
      const start = selectStart.current;
      if (!pos || !start) return;
      setSelection({
        x: Math.min(start.x, pos.x),
        y: Math.min(start.y, pos.y),
        w: Math.abs(pos.x - start.x),
        h: Math.abs(pos.y - start.y),
      });
      return;
    }
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
    if (mode === 'select') {
      selectStart.current = null;
    }
  };

  // Anexar arquivo do computador
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAttachFile) return;
    const reader = new FileReader();
    reader.onload = () => {
      onAttachFile(reader.result as string, file.type || 'application/octet-stream');
    };
    if (file.type.startsWith('image/')) reader.readAsDataURL(file);
    else reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Abrir preview em nova aba
  const openInNewTab = useCallback(() => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Sem URL externa: tenta usar o srcDoc via blob
      const container = targetRef.current;
      const iframe = container?.querySelector('iframe') as HTMLIFrameElement | null;
      if (iframe && iframe.srcdoc) {
        const blob = new Blob([iframe.srcdoc], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        window.open(window.location.href, '_blank');
      }
    }
  }, [previewUrl, targetRef]);

  // Comentar: pede um comentário e anexa à mensagem
  const handleComment = useCallback(() => {
    setNote('');
    noteDismissed.current = false;
    setMode('none');
    // Anexa com um comentário
    const note = window.prompt('Adicione um comentário sobre este preview:');
    if (note) {
      annotateNote.current = note;
      handleAttach();
    }
  }, [handleAttach]);

  const dockItems = [
    {
      title: 'Anotar preview (check para anexar)',
      icon: <IconHighlight className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: toggleAnnotate,
    },
    {
      title: 'Screenshot com seleção de área',
      icon: <IconScreenshot className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: toggleSelect,
    },
    {
      title: 'Apagar anotações',
      icon: <IconEraser className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: resetCanvas,
    },
    {
      title: 'Anexar arquivo',
      icon: <IconPaperclip className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: () => fileInputRef.current?.click(),
    },
    {
      title: 'Comentar no preview',
      icon: <IconMessagePlus className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: handleComment,
    },
    {
      title: 'Abrir em nova aba',
      icon: <IconExternalLink className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: openInNewTab,
    },
  ];

  return (
    <>
      {/* Canvas de anotação / seleção sobre o preview */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`absolute inset-0 z-30 ${(mode === 'annotate' || mode === 'select') ? (mode === 'annotate' ? 'cursor-crosshair' : 'cursor-crosshair') : 'pointer-events-none'}`}
        style={{ display: (mode === 'annotate' || mode === 'select') ? 'block' : 'none' }}
      />

      {/* Overlay de seleção de área */}
      {mode === 'select' && selection && selection.w > 0 && selection.h > 0 && (
        <div className="absolute z-[35] pointer-events-none border-2 border-blue-500 bg-blue-500/10"
          style={{ left: selection.x, top: selection.y, width: selection.w, height: selection.h }}>
          <span className="absolute -top-6 left-0 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-white/80 dark:bg-neutral-900/80 px-1.5 py-0.5 rounded">
            {Math.round(selection.w)}×{Math.round(selection.h)}
          </span>
        </div>
      )}

      {/* Barra de controle de anotação */}
      {mode === 'annotate' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 px-3 py-2 shadow-lg">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Anotar:</span>
          {['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#000000'].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
              style={{ background: c }}
            />
          ))}
          <div className="w-px h-5 bg-gray-200 dark:bg-neutral-700" />
          <button onClick={handleFinishAnnotate} className="text-green-600 hover:text-green-800 dark:text-green-400" title="Concluir e anexar à mensagem">
            <IconCheck className="w-5 h-5" />
          </button>
          <button onClick={cancelAnnotate} className="text-gray-500 hover:text-gray-800 dark:hover:text-white" title="Cancelar">
            <IconX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de controle de seleção */}
      {mode === 'select' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 px-3 py-2 shadow-lg">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
            <IconCrop className="w-4 h-4" /> Selecione a área
          </span>
          <div className="w-px h-5 bg-gray-200 dark:bg-neutral-700" />
          {selection && selection.w > 0 && selection.h > 0 && (
            <>
              <button onClick={handleAttachSelection} className="text-green-600 hover:text-green-800 dark:text-green-400 flex items-center gap-1 text-xs font-medium" title="Anexar área selecionada à mensagem">
                <IconCheck className="w-5 h-5" /> Anexar
              </button>
            </>
          )}
          <button onClick={toggleSelect} className="text-gray-500 hover:text-gray-800 dark:hover:text-white" title="Cancelar">
            <IconX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.txt,.json,.js,.ts,.jsx,.tsx,.html,.css"
      />

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
