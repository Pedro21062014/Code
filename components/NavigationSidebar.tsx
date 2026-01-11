
import React, { useState } from 'react';
import { 
    AppLogo, HomeIcon, ProjectsIcon, UsersIcon, ClockIcon, SettingsIcon, 
    LogInIcon, LogOutIcon, CubeIcon, GalleryIcon
} from './Icons';

interface NavigationSidebarProps {
  activeView: string;
  onNavigate: (view: 'welcome' | 'projects' | 'shared' | 'recent' | 'pricing' | 'integrations' | 'gallery') => void;
  session: any | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  credits: number; // Mantido na interface para compatibilidade, mas ignorado
  currentPlan: string;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeView,
  onNavigate,
  session,
  onLogin,
  onLogout,
  onOpenSettings,
  currentPlan
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const userName = session?.user?.displayName || session?.user?.email?.split('@')[0] || 'Dev';
  const userInitial = userName.charAt(0).toUpperCase();
  const userPhoto = session?.user?.photoURL;
  const isLoggedIn = !!session;

  const NavItem = ({ view, icon, label, onClick, active, isBottom = false }: { view?: string, icon: React.ReactNode, label: string, onClick?: () => void, active?: boolean, isBottom?: boolean }) => {
    const isActive = active || (view && activeView === view);
    return (
      <button 
          onClick={onClick ? onClick : () => view && onNavigate(view as any)}
          className={`group flex items-center relative transition-all duration-200 rounded-xl
              ${isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'w-[calc(100%-16px)] px-3 py-2.5 gap-3 mx-2'}
              ${isActive 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/5 dark:shadow-white/5' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#18181b] hover:text-black dark:hover:text-white'}
              ${isBottom ? 'mt-auto' : ''}
          `}
          title={isCollapsed ? label : undefined}
      >
          <div className={`flex-shrink-0 transition-transform duration-200 ${!isActive && 'group-hover:scale-110'}`}>
              {icon}
          </div>
          
          {!isCollapsed && (
              <span className="text-sm font-medium whitespace-nowrap overflow-hidden animate-fadeIn">
                  {label}
              </span>
          )}

          {/* Indicador de ativo para modo colapsado */}
          {isCollapsed && isActive && (
              <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-1 h-5 bg-black dark:bg-white rounded-r-full"></div>
          )}
      </button>
    );
  };

  return (
    <aside 
        className={`flex flex-col border-r border-gray-200 dark:border-[#27272a] bg-gray-50 dark:bg-[#09090b] transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] z-50
            ${isCollapsed ? 'w-[60px]' : 'w-[240px]'}
        `}
    >
        {/* Header / Toggle */}
        <div className={`flex items-center h-20 flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'justify-center w-full' : 'px-6 justify-start'}`}>
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`group flex items-center gap-3 focus:outline-none ${isCollapsed ? 'justify-center' : 'w-full'}`}
            >
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] group-hover:border-gray-400 dark:group-hover:border-gray-600 group-hover:bg-gray-50 dark:group-hover:bg-[#1a1a1c] transition-all flex-shrink-0">
                    <AppLogo className="w-6 h-6 text-black dark:text-white" />
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col items-start animate-fadeIn overflow-hidden">
                        <span className="font-bold text-base tracking-tight text-gray-900 dark:text-white leading-none whitespace-nowrap">codegen</span>
                        <span className="text-[10px] text-gray-500 font-mono">studio</span>
                    </div>
                )}
            </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 flex flex-col gap-2 py-4 overflow-y-auto custom-scrollbar">
            <NavItem view="welcome" icon={<HomeIcon className="w-5 h-5" />} label="Início" />
            <NavItem view="projects" icon={<ProjectsIcon className="w-5 h-5" />} label="Meus Projetos" onClick={isLoggedIn ? undefined : onLogin} />
            <NavItem view="gallery" icon={<GalleryIcon className="w-5 h-5" />} label="Galeria" />
            <NavItem view="shared" icon={<UsersIcon className="w-5 h-5" />} label="Compartilhados" onClick={isLoggedIn ? undefined : onLogin} />
            <NavItem view="recent" icon={<ClockIcon className="w-5 h-5" />} label="Recentes" onClick={isLoggedIn ? undefined : onLogin} />
            <NavItem view="integrations" icon={<CubeIcon className="w-5 h-5" />} label="Integrações" />
            
            <div className="h-px bg-gray-200 dark:bg-[#27272a] mx-4 my-2 opacity-50"></div>
            
            <NavItem view="pricing" icon={<span className="font-bold text-lg w-5 h-5 flex items-center justify-center">$</span>} label="Planos & Preços" />
            
            <div className="flex-1"></div> {/* Spacer to push settings down */}
            
            {/* Explicit Settings Item */}
            <NavItem 
                icon={<SettingsIcon className="w-5 h-5" />} 
                label="Configurações" 
                onClick={onOpenSettings} 
            />
        </div>

        {/* Footer / Profile */}
        <div className="p-4 border-t border-gray-200 dark:border-[#27272a] flex-shrink-0 bg-gray-50 dark:bg-[#09090b]">
            {isLoggedIn ? (
                <div className="flex flex-col gap-3">
                    
                    {/* User Profile */}
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center flex-col' : ''}`}>
                        <div className="relative group cursor-pointer" onClick={onOpenSettings}>
                            {userPhoto ? (
                                <img 
                                    src={userPhoto} 
                                    alt={userName} 
                                    className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-white/10 shadow-sm bg-gray-100 dark:bg-zinc-800"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md border border-white/10">
                                    {userInitial}
                                </div>
                            )}
                            
                            {/* Status Dot */}
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#09090b] rounded-full shadow-sm"></div>
                        </div>

                        {!isCollapsed && (
                            <div className="flex-1 min-w-0 animate-fadeIn">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{userName}</div>
                                <div className="text-[10px] text-gray-500 capitalize">{currentPlan} Plan</div>
                            </div>
                        )}

                        {!isCollapsed && (
                            <button onClick={onLogout} className="text-gray-500 hover:text-red-500 transition-colors p-1.5 hover:bg-gray-200 dark:hover:bg-[#18181b] rounded-md" title="Sair">
                                <LogOutIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <button 
                    onClick={onLogin}
                    className={`flex items-center gap-3 rounded-xl transition-all duration-200
                        ${isCollapsed ? 'justify-center w-10 h-10 p-0 bg-blue-600 text-white mx-auto' : 'w-full px-4 py-2.5 bg-white dark:bg-[#18181b] hover:bg-gray-100 dark:hover:bg-[#202023] text-black dark:text-white border border-gray-200 dark:border-[#27272a]'}
                    `}
                    title="Fazer Login"
                >
                    <LogInIcon className="w-5 h-5" />
                    {!isCollapsed && <span className="text-sm font-medium">Entrar</span>}
                </button>
            )}
        </div>
    </aside>
  );
};
