import React, { useState } from 'react';
import { CloseIcon, ImageIcon, SparklesIcon, SaveIcon } from './Icons';
import { generateImagesWithImagen } from '../services/geminiService';

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveImage: (base64Data: string, fileName: string) => void;
  apiKey: string | undefined;
  onOpenApiKeyModal: () => void;
}

const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({ isOpen, onClose, onSaveImage, apiKey, onOpenApiKeyModal }) => {
  const [prompt, setPrompt] = useState('');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  React.useEffect(() => {
    if (isOpen) {
        setPrompt('');
        setGeneratedImages([]);
        setError(null);
        setIsLoading(false);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!apiKey) {
      setError("Chave de API do Gemini não encontrada. Por favor, adicione uma nas configurações.");
      onOpenApiKeyModal();
      return;
    }
    if (!prompt.trim()) {
      setError("Por favor, insira um prompt para gerar a imagem.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const images = await generateImagesWithImagen(prompt, apiKey, numberOfImages, aspectRatio);
      setGeneratedImages(images);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
      setError(`Falha ao gerar imagens: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = (imageData: string) => {
    const fileName = prompt.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 30) || 'generated';
    const finalName = `${fileName}-${Date.now()}.png`;
    onSaveImage(imageData, finalName);
  }

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-var-bg-subtle rounded-lg shadow-xl w-full max-w-4xl p-6 border border-var-border-default animate-slideInUp flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-semibold text-var-fg-default flex items-center gap-2">
            <ImageIcon /> Gerador de Imagem AI
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-var-fg-muted hover:bg-var-bg-interactive">
            <CloseIcon />
          </button>
        </div>
        
        <div className="flex-grow flex gap-6 overflow-hidden">
            {/* Controls */}
            <div className="w-1/3 flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-var-fg-muted mb-1">Prompt</label>
                    <textarea 
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Ex: Um robô fofo segurando um skate vermelho, estilo de arte digital."
                        className="w-full p-2 h-32 bg-var-bg-interactive border border-var-border-default rounded-md text-var-fg-default placeholder-var-fg-subtle focus:outline-none focus:ring-2 focus:ring-var-accent/50 resize-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-var-fg-muted mb-1">Nº de Imagens</label>
                    <input 
                        type="number"
                        min="1"
                        max="4"
                        value={numberOfImages}
                        onChange={e => setNumberOfImages(parseInt(e.target.value))}
                        className="w-full p-2 bg-var-bg-interactive border border-var-border-default rounded-md text-var-fg-default"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-var-fg-muted mb-1">Proporção</label>
                    <select
                        value={aspectRatio}
                        onChange={e => setAspectRatio(e.target.value)}
                         className="w-full p-2 bg-var-bg-interactive border border-var-border-default rounded-md text-var-fg-default"
                    >
                        {aspectRatios.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full mt-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-var-accent-fg bg-var-accent hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait"
                >
                    <SparklesIcon /> {isLoading ? 'Gerando...' : 'Gerar Imagens'}
                </button>
                 {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}
            </div>

            {/* Image Display */}
            <div className="w-2/3 bg-var-bg-muted rounded-lg p-4 overflow-y-auto">
                {isLoading && (
                    <div className="flex items-center justify-center h-full text-var-fg-muted">
                        <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </div>
                )}
                {!isLoading && generatedImages.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-var-fg-muted">
                        <ImageIcon />
                        <p className="mt-2">Suas imagens geradas aparecerão aqui.</p>
                    </div>
                )}
                 {!isLoading && generatedImages.length > 0 && (
                    <div className={`grid gap-4 ${numberOfImages > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {generatedImages.map((imgData, index) => (
                            <div key={index} className="group relative">
                                <img 
                                    src={`data:image/png;base64,${imgData}`} 
                                    alt={`Generated image ${index + 1}`} 
                                    className="rounded-md w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => handleSave(imgData)}
                                        className="flex items-center gap-2 px-4 py-2 bg-var-accent text-var-accent-fg rounded-lg font-semibold hover:opacity-90"
                                    >
                                        <SaveIcon /> Salvar no Projeto
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                 )}
            </div>
        </div>
      </div>
    </div>
  );
};
