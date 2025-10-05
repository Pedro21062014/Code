import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AIProvider, AIModel } from '../types';
import { AI_MODELS } from '../constants';
import { SparklesIcon, CloseIcon, AppLogo, PaperclipIcon } from './Icons';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string, provider: AIProvider, model: string, attachments: { data: string; mimeType: string }[]) => void;
  isProUser: boolean;
  onClose?: () => void;
}

const HighlightedMessage: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(ia)/gi);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.toLowerCase() === 'ia' ? (
          <span key={i} className="bg-var-accent/30 text-var-accent font-bold p-0.5 rounded-sm">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

const MarkdownTable: React.FC<{ markdown: string }> = ({ markdown }) => {
  const lines = markdown.trim().split('\n').map(l => l.trim()).filter(Boolean);
  
  if (lines.length < 2 || !lines[0].includes('|') || !lines[1].includes('-')) {
    return <pre className="text-sm whitespace-pre-wrap font-mono bg-var-bg-default p-2 rounded-md my-2">{markdown}</pre>;
  }

  const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
  const rows = lines.slice(2).map(line => line.split('|').map(c => c.trim()).filter(Boolean));

  return (
    <div className="overflow-x-auto my-2 rounded-lg border border-var-border-default text-xs">
      <table className="w-full text-left text-var-fg-default">
        <thead className="text-xs text-var-fg-muted uppercase bg-var-bg-interactive">
          <tr>
            {headers.map((header, i) => <th key={i} scope="col" className="px-3 py-2 font-semibold">{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-var-border-default bg-var-bg-subtle/50">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 font-mono">
                  {cell === 'Criado' ? <span className="text-green-400 font-semibold">{cell}</span> :
                   cell === 'Modificado' ? <span className="text-yellow-400 font-semibold">{cell}</span> :
                   cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ThinkingIndicator = () => (
    <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-var-fg-muted rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-var-fg-muted rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-var-fg-muted rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
);


export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isProUser, onClose }) => {
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
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
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
        // Handle error display to the user if necessary
    }
  };
  
  return (
    <div className="bg-var-bg-subtle w-full flex flex-col h-full border-l border-var-border-default">
      <div className="p-4 border-b border-var-border-default flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg font-semibold text-var-fg-default">Chat</h2>
        {onClose && (
            <button onClick={onClose} className="p-1 rounded-md text-var-fg-muted hover:bg-var-bg-interactive">
                <CloseIcon />
            </button>
        )}
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            msg.role === 'system' ? (
                <div key={index} className="text-xs text-center text-var-fg-subtle italic my-2">
                    <span>{msg.content}</span>
                </div>
            ) : (
                <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && <AppLogo className="w-6 h-6 text-var-accent flex-shrink-0 mt-1" />}
                <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${msg.role === 'user' ? 'bg-var-accent text-var-accent-fg' : 'bg-var-bg-interactive text-var-fg-default'}`}>
                    {msg.isThinking ? (
                        <div className="flex items-center gap-2">
                            {msg.content && msg.content !== 'Pensando...' && <span className="text-var-fg-default">{msg.content}</span>}
                            <ThinkingIndicator />
                        </div>
                    ) : (
                        <div className="prose prose-sm prose-invert max-w-none">
                          {msg.role === 'user' ? (
                            <HighlightedMessage text={msg.content} />
                          ) : (
                            <p className="whitespace-pre-wrap m-0">{msg.content}</p>
                          )}
                          {msg.summary && <MarkdownTable markdown={msg.summary} />}
                        </div>
                    )}
                </div>
                </div>
            )
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-var-border-default bg-var-bg-subtle">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <select
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value as AIProvider)}
              className="bg-var-bg-interactive border border-var-border-default rounded-md px-2 py-1 text-xs text-var-fg-default focus:outline-none focus:ring-2 focus:ring-var-accent/50"
            >
              {availableProviders.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select 
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="bg-var-bg-interactive border border-var-border-default rounded-md px-2 py-1 text-xs w-full text-var-fg-default focus:outline-none focus:ring-2 focus:ring-var-accent/50"
            >
              {providerModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          {attachedFiles.length > 0 && (
            <div className="mb-2 p-2 border border-var-border-default rounded-md bg-var-bg-interactive space-y-2">
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between text-xs text-var-fg-muted">
                  <span className="truncate">{file.name}</span>
                  <button type="button" onClick={() => removeFile(file)} className="p-1 rounded-full hover:bg-var-bg-subtle">
                    <CloseIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="relative">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                  }
              }}
              placeholder="Descreva o que você quer construir ou alterar..."
              className="w-full p-2 pr-10 bg-var-bg-interactive border border-var-border-default rounded-md text-var-fg-default placeholder-var-fg-muted focus:outline-none focus:ring-2 focus:ring-var-accent/50 resize-none"
              rows={3}
            />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept="image/*,text/*" />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2.5 right-2.5 p-1 text-var-fg-muted hover:text-var-fg-default rounded-md hover:bg-var-bg-subtle"
                aria-label="Anexar arquivo"
            >
                <PaperclipIcon />
            </button>
          </div>
          <button type="submit" className="w-full mt-2 bg-var-accent hover:opacity-90 text-var-accent-fg font-bold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50" disabled={(!input.trim() && attachedFiles.length === 0) || !selectedModel}>
            <SparklesIcon />
            <span>Gerar</span>
          </button>
        </form>
      </div>
    </div>
  );
};