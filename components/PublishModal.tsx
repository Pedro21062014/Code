import React from 'react';
import { CloseIcon, DownloadIcon, TerminalIcon } from './Icons';

interface LocalRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  projectName: string;
}

export const PublishModal: React.FC<LocalRunModalProps> = ({ isOpen, onClose, onDownload, projectName }) => {
  if (!isOpen) return null;

  const handleDownloadAndClose = () => {
    onDownload();
    onClose();
  };

  return (
     <div 
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-var-bg-subtle rounded-lg shadow-xl w-full max-w-lg p-6 border border-var-border-default animate-slideInUp"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-var-fg-default flex items-center gap-2">
            <TerminalIcon /> Executar Projeto Localmente
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-var-fg-muted hover:bg-var-bg-interactive">
            <CloseIcon />
          </button>
        </div>
        
        <div className="text-var-fg-muted space-y-4 text-sm">
          <p>
            Para visualizar seu projeto em um ambiente de desenvolvimento local, siga estas etapas:
          </p>
          <ol className="list-decimal list-inside space-y-3 bg-var-bg-interactive p-4 rounded-lg border border-var-border-default">
            <li>
              <strong>Baixe o projeto:</strong> Clique no botão abaixo para baixar os arquivos do projeto como um arquivo ZIP.
              <button
                onClick={handleDownloadAndClose}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-var-accent-fg bg-var-accent hover:opacity-90 transition-opacity"
              >
                <DownloadIcon /> Baixar {projectName}.zip
              </button>
            </li>
            <li>
              <strong>Descompacte o arquivo:</strong> Extraia o conteúdo do arquivo ZIP para uma pasta em seu computador.
            </li>
            <li>
              <strong>Abra o terminal:</strong> Navegue até a pasta do projeto descompactado usando seu terminal ou prompt de comando.
            </li>
            <li>
              <strong>Inicie um servidor local:</strong> Se você tiver o Node.js instalado, o comando mais fácil é:
              <pre className="bg-var-bg-muted p-2 rounded-md mt-1 text-xs font-mono"><code>npx serve</code></pre>
              <p className="text-xs text-var-fg-subtle mt-1">Se você não tem o `serve`, pode instalá-lo com `npm install -g serve` ou usar outro servidor local como o `Live Server` do VS Code.</p>
            </li>
            <li>
              <strong>Visualize no navegador:</strong> Abra seu navegador e acesse o endereço fornecido pelo servidor, geralmente{' '}
              <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="text-var-accent hover:underline">http://localhost:3000</a>.
            </li>
          </ol>
        </div>

      </div>
    </div>
  );
};
