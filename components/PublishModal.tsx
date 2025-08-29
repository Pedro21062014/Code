import React from 'react';
import { CloseIcon, PublishIcon } from './Icons';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  publishUrl: string | null;
  error: string | null;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, isLoading, publishUrl, error }) => {
  const [isCopied, setIsCopied] = React.useState(false);

  // Reset copy state when url changes
  React.useEffect(() => {
    setIsCopied(false);
  }, [publishUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!publishUrl) return;
    navigator.clipboard.writeText(publishUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const qrCodeUrl = publishUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publishUrl)}` : '';

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-gray-300">
           <svg className="animate-spin h-8 w-8 text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="font-semibold">Publicando no Netlify...</p>
          <p className="text-sm text-gray-500">Isso pode levar um minuto.</p>
        </div>
      );
    }
    
    if (error) {
       return (
        <div className="p-4 bg-red-900/50 border border-red-700/50 rounded-lg text-sm text-red-200 my-4">
          <p className="font-bold mb-1">Falha na Publicação</p>
          <p className="font-mono text-xs">{error}</p>
        </div>
       );
    }

    if (publishUrl) {
      return (
        <div className="text-gray-300 space-y-4">
          <p>
            Sua aplicação foi publicada no Netlify. Compartilhe com qualquer pessoa ou use o QR code para testar no seu dispositivo móvel.
          </p>
          <div className="flex items-center space-x-2">
            <input 
              type="text"
              readOnly
              value={publishUrl}
              className="w-full p-2 bg-[#2A2B30] border border-gray-700/50 rounded-md text-green-400 font-mono"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {isCopied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <div className="flex justify-center p-4 bg-[#2A2B30] rounded-md mt-4">
            <img src={qrCodeUrl} alt="QR Code for published URL" className="w-40 h-40 rounded-lg" />
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
     <div 
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-[#1C1C1F] rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-700/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <PublishIcon /> 
            {publishUrl ? 'Seu projeto está no ar!' : 'Publicar Projeto'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:bg-white/10">
            <CloseIcon />
          </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};