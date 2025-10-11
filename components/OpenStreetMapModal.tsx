import React from 'react';
import { CloseIcon, MapIcon } from './Icons';

interface OpenStreetMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpenStreetMapModal: React.FC<OpenStreetMapModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
            <MapIcon /> Integração com OpenStreetMap
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-var-fg-muted hover:bg-var-bg-interactive">
            <CloseIcon />
          </button>
        </div>
        
        <div className="text-var-fg-muted space-y-4 text-sm">
            <p>
                A integração com o OpenStreetMap é feita através de bibliotecas de frontend como a <a href="https://leafletjs.com/" target="_blank" rel="noopener noreferrer" className="text-var-accent hover:underline">Leaflet.js</a>.
            </p>
            <p>
                Não é necessária nenhuma configuração de chave de API aqui. A IA já sabe como gerar o código necessário para adicionar um mapa ao seu projeto.
            </p>
            <div className="bg-var-bg-interactive p-4 rounded-lg border border-var-border-default">
                <h3 className="font-semibold text-var-fg-default mb-2">Como usar:</h3>
                <p>
                    Simplesmente peça à IA no chat. Por exemplo:
                </p>
                <code className="block bg-var-bg-muted p-2 rounded-md mt-2 text-xs font-mono text-var-fg-default">
                    "Adicione uma página de 'Contato' com um mapa mostrando o endereço da nossa empresa."
                </code>
            </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};