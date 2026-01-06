
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
        className="bg-white dark:bg-[#18181b] rounded-lg shadow-xl w-full max-w-lg p-6 border border-gray-200 dark:border-[#27272a] animate-slideInUp transition-colors"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MapIcon /> Integração com OpenStreetMap
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-[#27272a] hover:text-black dark:hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </div>
        
        <div className="text-gray-600 dark:text-gray-400 space-y-4 text-sm">
            <p>
                A integração com o OpenStreetMap é feita através de bibliotecas de frontend como a <a href="https://leafletjs.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-white hover:underline">Leaflet.js</a>.
            </p>
            <p>
                Não é necessária nenhuma configuração de chave de API aqui. A IA já sabe como gerar o código necessário para adicionar um mapa ao seu projeto.
            </p>
            <div className="bg-gray-50 dark:bg-[#27272a] p-4 rounded-lg border border-gray-200 dark:border-[#3f3f46]">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Como usar:</h3>
                <p>
                    Simplesmente peça à IA no chat. Por exemplo:
                </p>
                <code className="block bg-gray-100 dark:bg-[#121214] p-2 rounded-md mt-2 text-xs font-mono text-gray-800 dark:text-white border border-gray-200 dark:border-transparent">
                    "Adicione uma página de 'Contato' com um mapa mostrando o endereço da nossa empresa."
                </code>
            </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-lg"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};
