import React, { useState } from 'react';
import { SaveIcon, TrashIcon, PlusIcon } from './Icons';

interface EnvVarsTabProps {
  envVars: Record<string, string>;
  onChange: (vars: Record<string, string>) => void;
}

export const EnvVarsTab: React.FC<EnvVarsTabProps> = ({ envVars, onChange }) => {
  const [entries, setEntries] = useState<Array<{key: string, value: string}>>(() => {
    const keys = Object.keys(envVars);
    if (keys.length === 0) return [{ key: '', value: '' }];
    return keys.map(k => ({ key: k, value: envVars[k] }));
  });

  const updateEntry = (index: number, field: 'key' | 'value', val: string) => {
    const newEntries = [...entries];
    newEntries[index][field] = val;
    setEntries(newEntries);
  };

  const removeEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    if (newEntries.length === 0) newEntries.push({ key: '', value: '' });
    setEntries(newEntries);
  };

  const addEntry = () => {
    setEntries([...entries, { key: '', value: '' }]);
  };

  const handleSave = () => {
    const result: Record<string, string> = {};
    entries.forEach(e => {
      const k = e.key.trim();
      const v = e.value.trim();
      if (k) result[k] = v;
    });
    onChange(result);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] p-6 text-gray-900 dark:text-white overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full">
        <h2 className="text-lg font-bold mb-2">Variáveis de Ambiente</h2>
        <p className="text-gray-500 text-sm mb-6">
          Defina as variáveis de ambiente (ex: chaves de API) para o seu projeto.
          Elas serão passadas para o WebContainer e escritas no arquivo local <code>.env</code>.
        </p>

        <div className="space-y-3 mb-6">
          {entries.map((entry, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="NOME_DA_VARIAVEL"
                value={entry.key}
                onChange={e => updateEntry(i, 'key', e.target.value)}
                className="flex-1 bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors"
              />
              <span className="text-gray-400">=</span>
              <input
                type="text"
                placeholder="Valor"
                value={entry.value}
                onChange={e => updateEntry(i, 'value', e.target.value)}
                className="flex-[2] bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button 
                onClick={() => removeEntry(i)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-[#27272a]"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={addEntry}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-[#27272a] rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#121214] transition-colors"
          >
            <PlusIcon className="w-4 h-4" /> Adicionar Variável
          </button>
          
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <SaveIcon className="w-4 h-4" /> Salvar Variáveis
          </button>
        </div>
      </div>
    </div>
  );
};
