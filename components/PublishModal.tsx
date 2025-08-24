import React, { useState, useEffect } from 'react';
import { CloseIcon, PublishIcon } from './Icons';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose }) => {
  const [publishUrl, setPublishUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Generate a unique-ish URL for demonstration
      const randomId = Math.random().toString(36).substring(2, 10);
      setPublishUrl(`https://${randomId}.codegen.studio`);
      setIsCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(publishUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publishUrl)}`;

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
            <PublishIcon /> Seu projeto está no ar!
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:bg-white/10">
            <CloseIcon />
          </button>
        </div>
        
        <div className="text-gray-300 space-y-4">
          <p>
            Sua aplicação foi publicada em uma URL temporária. Compartilhe com qualquer pessoa ou use o QR code para testar no seu dispositivo móvel.
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
          
           <p className="text-xs text-gray-500 text-center">
             Nota: Este é um link de visualização temporário e expirará em 24 horas.
          </p>
        </div>
      </div>
    </div>
  );
};