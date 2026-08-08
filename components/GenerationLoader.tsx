import React from 'react';
import { TetrisLoader } from '@/components/ui/loader-tetris';

interface GenerationLoaderProps {
  generatingFile: string | null;
  isGenerating: boolean;
  dark?: boolean;
}

/**
 * Overlay de loading mostrado enquanto o app está gerando código.
 * Usa o TetrisLoader para "jogar tetris" enquanto o usuário espera.
 */
export const GenerationLoader: React.FC<GenerationLoaderProps> = ({ generatingFile, isGenerating, dark = false }) => {
  if (!isGenerating) return null;

  const fileName = generatingFile ? `Gerando ${generatingFile}...` : 'Gerando seu projeto...';

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-white/85 dark:bg-[#09090b]/85 backdrop-blur-sm">
      <div className="bg-card text-card-foreground flex items-center gap-5 rounded-lg border px-5 py-4 shadow-sm">
        <TetrisLoader columns={8} rows={16} cellSize={3} gap={1} speed={40} label="Building your app" />
        <div className="space-y-1">
          <p className="text-sm font-medium">{fileName}</p>
          <p className="text-muted-foreground text-xs">Construindo seu app. Sinta-se à vontade para assistir o bot jogar.</p>
        </div>
      </div>
    </div>
  );
};

export default GenerationLoader;
