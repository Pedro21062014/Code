import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AIProvider, AIModel } from '../types';
import { AI_MODELS } from '../constants';
import { SparklesIcon, CloseIcon, AppLogo, PaperclipIcon, ChevronDownIcon, MenuIcon } from './Icons';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string, provider: AIProvider, model: string, attachments: { data: string; mimeType: string }[]) => void;
  isProUser: boolean;
  onClose?: () => void;
  onToggleSidebar?: () => void;
  projectName?: string;
}

const HighlightedMessage: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(ia)/gi);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.toLowerCase() === 'ia' ? (
          <span key={i} className="text-blue-400 font-bold">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

const ThinkingIndicator = () => (
    <div className="flex items-center space-x-1.5 p-1">
        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
    </div>
);


export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isProUser, onClose, onToggleSidebar, projectName }) => {
  const [input, setInput] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AIProvider.Gemini);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const availableProviders = isProUser ? Object.values(AIProvider) : [AIProvider.Gemini];
  const providerModels = AI_MODELS.filter(m => m.provider === selectedProvider);

  useEffect(() => {
    if (!availableProviders.includes(selectedProvider)) {
      setSelectedProvider(AIProvider.Gemini);
    }
  }, [isProUser, selectedProvider, availableProviders]);
  
  useEffect(() => {
    if (providerModels.length > 0 && !providerModels.some(m => m.id === selectedModel)) {
        setSelectedModel(providerModels[0].id);
    }
  }, [selectedProvider, providerModels, selectedModel]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (fileToRemove: File) => {
    setAttachedFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || !selectedModel) return;

    try {
        const filePromises = attachedFiles.map(file => {
            return new Promise<{ data: string; mimeType: string }>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64Data = (event.target?.result as string).split(',')[1];
                    resolve({ data: base64Data, mimeType: file.type });
                };
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
            });
        });

        const attachments = await Promise.all(filePromises);
        onSendMessage(input, selectedProvider, selectedModel, attachments);
        
        setInput('');
        setAttachedFiles([]);
    } catch (error) {
        console.error("Error processing file attachments:", error);
    }
  };
  
  return (
    <div className="bg-[#121214] w-full flex flex-col h-full border-r border-[#27272a] text-sm">
      <div className="px-4 py-3 border-b border-[#27272a] flex justify-between items-center flex-shrink-0 bg-[#121214]">
        <div className="flex items-center gap-3">
            {onToggleSidebar && (
                <button onClick={onToggleSidebar} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#27272a] transition-colors">
                    <MenuIcon className="w-5 h-5" />
                </button>
            )}
            <div className="flex flex-col">
                <h2 className="text-gray-200 font-medium text-sm">{projectName || 'Project'}</h2>
                <span className="text-[10px] text-gray-500">AI Assistant</span>
            </div>
        </div>
        {onClose && (
            <button onClick={onClose} className="p-1 rounded text-gray-500 hover:text-white hover:bg-[#27272a]">
                <CloseIcon />
            </button>
        )}
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-6">
          {messages.map((msg, index) => (
            msg.role === 'system' ? (
                <div key={index} className="flex justify-center">
                    <span className="text-xs text-gray-600 bg-[#18181b] px-2 py-1 rounded border border-[#27272a]">{msg.content}</span>
                </div>
            ) : (
                <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'assistant' ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-[#27272a] border border-[#3f3f46]'}`}>
                        {msg.role === 'assistant' ? <AppLogo className="w-5 h-5 text-white" /> : <div className="text-xs text-gray-400">You</div>}
                    </div>
                    
                    <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                         <div className={`px-4 py-2.5 rounded-2xl ${
                             msg.role === 'user' 
                             ? 'bg-[#27272a] text-gray-100 rounded-tr-sm' 
                             : 'text-gray-300 rounded-tl-sm'
                         }`}>
                             {msg.isThinking ? (
                                <ThinkingIndicator />
                            ) : (
                                <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            )}
                         </div>
                    </div>
                </div>
            )
          ))}
          <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-[#27272a] bg-[#121214]">
        <form onSubmit={handleSubmit} className="relative bg-[#18181b] border border-[#27272a] rounded-xl focus-within:ring-1 focus-within:ring-gray-500 focus-within:border-gray-500 transition-all">
           
           {/* Model Selection */}
           <div className="flex items-center gap-2 p-2 border-b border-[#27272a]">
                <div className="relative">
                    <select
                        value={selectedProvider}
                        onChange={e => setSelectedProvider(e.target.value as AIProvider)}
                        className="appearance-none bg-[#27272a] hover:bg-[#3f3f46] text-xs text-gray-300 font-medium py-1 pl-2 pr-7 rounded cursor-pointer focus:outline-none transition-colors"
                    >
                        {availableProviders.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <ChevronDownIcon className="w-3 h-3" />
                    </div>
                </div>
                
                <div className="h-4 w-px bg-[#27272a]"></div>
                
                <div className="relative flex-grow">
                     <select 
                        value={selectedModel}
                        onChange={e => setSelectedModel(e.target.value)}
                        className="appearance-none w-full bg-[#27272a] hover:bg-[#3f3f46] text-xs text-gray-300 font-medium py-1 pl-2 pr-7 rounded cursor-pointer focus:outline-none transition-colors truncate"
                    >
                        {providerModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <ChevronDownIcon className="w-3 h-3" />
                    </div>
                </div>
           </div>

           {/* Attachments */}
           {attachedFiles.length > 0 && (
            <div className="px-2 pt-2 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-1 text-xs bg-[#27272a] text-gray-300 px-2 py-1 rounded-md border border-[#3f3f46]">
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button type="button" onClick={() => removeFile(file)} className="hover:text-white"><CloseIcon className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                }
            }}
            placeholder="Ask anything..."
            className="w-full p-3 bg-transparent text-gray-200 placeholder-gray-600 focus:outline-none resize-none text-sm min-h-[80px]"
            rows={1}
          />
          
          <div className="flex justify-between items-center p-2">
             <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept="image/*,text/*" />
             <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-gray-500 hover:text-white hover:bg-[#27272a] rounded-md transition-colors"
            >
                <PaperclipIcon />
            </button>
            <button 
                type="submit" 
                disabled={(!input.trim() && attachedFiles.length === 0) || !selectedModel}
                className="bg-white text-black p-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
                <SparklesIcon className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};