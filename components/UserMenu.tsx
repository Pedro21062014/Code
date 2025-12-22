
import React, { useState, useRef, useEffect } from 'react';
import { SettingsIcon, LogOutIcon, LogInIcon } from './Icons';

interface UserMenuProps {
  user: any | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onLogin, onLogout, onOpenSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button
        onClick={onLogin}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
      >
        <LogInIcon className="w-4 h-4" />
        Login
      </button>
    );
  }

  const initial = user.email ? user.email[0].toUpperCase() : 'U';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold text-sm shadow-md hover:ring-2 hover:ring-white/20 transition-all border border-white/10"
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl py-1 z-50 animate-fadeIn origin-top-right">
          <div className="px-4 py-3 border-b border-[#27272a]">
            <p className="text-xs text-gray-400 mb-0.5">Logado como</p>
            <p className="text-sm text-white font-medium truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <button
                onClick={() => { onOpenSettings(); setIsOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#27272a] hover:text-white flex items-center gap-3 transition-colors"
            >
                <SettingsIcon className="w-4 h-4" />
                Configurações
            </button>
            <button
                onClick={() => { onLogout(); setIsOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#27272a] hover:text-red-300 flex items-center gap-3 transition-colors"
            >
                <LogOutIcon className="w-4 h-4" />
                Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
