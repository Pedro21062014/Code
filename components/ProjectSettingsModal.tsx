
import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon, SaveIcon, ImageIcon, TrashIcon, LoaderIcon } from './Icons';
import { SavedProject } from '../types';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: SavedProject;
  onSave: (projectId: number, updates: Partial<SavedProject>) => Promise<void>;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({ isOpen, onClose, project, onSave }) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [previewImage, setPreviewImage] = useState<string | null>(project.previewImage || null);
  const [logo, setLogo] = useState<string | null>(project.logo || null);
  const [isSaving, setIsSaving] = useState(false);

  const previewInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(project.name);
      setDescription(project.description || '');
      setPreviewImage(project.previewImage || null);
      setLogo(project.logo || null);
    }
  }, [isOpen, project]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        alert("A imagem deve ter no máximo 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(project.id, {
        name,
        description,
        previewImage: previewImage || undefined,
        logo: logo || undefined
      });
      onClose();
    } catch (error) {
      console.error("Failed to save project settings", error);
      alert("Erro ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-[#27272a] rounded-2xl w-full max-w-2xl overflow-hidden animate-slideInUp shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#27272a] bg-gray-50 dark:bg-[#0c0c0e] flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Configurações do Projeto</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                <CloseIcon className="w-4 h-4"/>
            </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-8">
            
            {/* Basic Info */}
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nome do Projeto</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="Minha Aplicação Incrível"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Descrição</label>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none h-24"
                        placeholder="Descreva brevemente o que sua aplicação faz..."
                    />
                </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-[#27272a]"></div>

            {/* Assets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Preview Image */}
                <div className="space-y-3">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Imagem de Capa (Preview)</label>
                    <p className="text-xs text-gray-400 mb-2">Exibida na galeria da comunidade. Formato 16:9 recomendado.</p>
                    
                    <div 
                        className="aspect-video w-full bg-gray-100 dark:bg-[#121214] border-2 border-dashed border-gray-300 dark:border-[#27272a] rounded-xl overflow-hidden relative group cursor-pointer hover:border-blue-500 transition-colors"
                        onClick={() => previewInputRef.current?.click()}
                    >
                        {previewImage ? (
                            <>
                                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); previewInputRef.current?.click(); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur-sm"><ImageIcon className="w-4 h-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }} className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-white backdrop-blur-sm"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                <ImageIcon className="w-8 h-8 opacity-50" />
                                <span className="text-xs">Clique para fazer upload</span>
                            </div>
                        )}
                        <input type="file" ref={previewInputRef} onChange={(e) => handleImageUpload(e, setPreviewImage)} accept="image/*" className="hidden" />
                    </div>
                </div>

                {/* Logo */}
                <div className="space-y-3">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Logo do App</label>
                    <p className="text-xs text-gray-400 mb-2">Exibido nos cartões de projeto. Formato 1:1.</p>
                    
                    <div className="flex items-start gap-4">
                        <div 
                            className="w-24 h-24 bg-gray-100 dark:bg-[#121214] border-2 border-dashed border-gray-300 dark:border-[#27272a] rounded-xl overflow-hidden relative group cursor-pointer hover:border-blue-500 transition-colors flex-shrink-0"
                            onClick={() => logoInputRef.current?.click()}
                        >
                            {logo ? (
                                <>
                                    <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); setLogo(null); }} className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white backdrop-blur-sm"><TrashIcon className="w-3 h-3" /></button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <div className="text-2xl font-bold opacity-20">{name.charAt(0).toUpperCase()}</div>
                                </div>
                            )}
                            <input type="file" ref={logoInputRef} onChange={(e) => handleImageUpload(e, setLogo)} accept="image/*" className="hidden" />
                        </div>
                        <div className="flex-1 text-xs text-gray-500">
                            Recomendamos um arquivo PNG ou SVG transparente.<br/>
                            Tamanho máximo: 1MB.
                            <button 
                                onClick={() => logoInputRef.current?.click()}
                                className="block mt-2 text-blue-500 hover:underline"
                            >
                                Selecionar Arquivo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <div className="p-6 border-t border-gray-200 dark:border-[#27272a] bg-gray-50 dark:bg-[#0c0c0e] flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1f1f22] rounded-lg text-sm font-medium transition-colors"
            >
                Cancelar
            </button>
            <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
                {isSaving ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
                Salvar Alterações
            </button>
        </div>
      </div>
    </div>
  );
};
