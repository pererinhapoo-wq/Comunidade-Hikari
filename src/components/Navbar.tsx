import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BadgeIcon } from './BadgeIcon';
import { 
  Home, 
  Tv, 
  MessageSquare, 
  Image as ImageIcon, 
  Award, 
  Bell, 
  Bookmark, 
  Search, 
  Plus, 
  User, 
  LogOut,
  Layers
} from 'lucide-react';

export type ActiveTab = 
  | 'inicio' 
  | 'animes' 
  | 'debates' 
  | 'galeria' 
  | 'emblemas' 
  | 'notificacoes' 
  | 'salvos' 
  | 'pesquisar' 
  | 'perfil';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab, param?: string) => void;
  onOpenCreatePost: () => void;
  onOpenHikariBridge: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreatePost,
  onOpenHikariBridge
}) => {
  const { user, isAuthenticated, unreadCount, openAuthModal, logout } = useAuth();

  return (
    <>
      {/* =========================================================================
          DESKTOP & TABLET TOP BAR CONTRACT (Strict 3-Zone Contract)
          Zone 1: Single text element wordmark
          Zone 2: 4-5 clean single-line nav links
          Zone 3: 1 primary action
      ========================================================================= */}
      <header className="sticky top-0 z-30 w-full bg-[#090C15]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          
          {/* ZONE 1: Single text wordmark */}
          <button
            onClick={() => onSelectTab('inicio')}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-indigo-400 transition-colors flex items-center gap-2"
          >
            <span className="font-display bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              Comunidade Hikari
            </span>
          </button>

          {/* ZONE 2: 4-5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => onSelectTab('inicio')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${activeTab === 'inicio' ? 'text-indigo-400 font-semibold' : ''}`}
            >
              Início
            </button>
            <button
              onClick={() => onSelectTab('debates')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${activeTab === 'debates' ? 'text-indigo-400 font-semibold' : ''}`}
            >
              Debates
            </button>
            <button
              onClick={() => onSelectTab('galeria')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${activeTab === 'galeria' ? 'text-indigo-400 font-semibold' : ''}`}
            >
              Galeria
            </button>
            <button
              onClick={() => onSelectTab('emblemas')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${activeTab === 'emblemas' ? 'text-indigo-400 font-semibold' : ''}`}
            >
              Emblemas
            </button>
            <button
              onClick={() => onSelectTab('pesquisar')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${activeTab === 'pesquisar' ? 'text-indigo-400 font-semibold' : ''}`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar</span>
            </button>
          </nav>

          {/* ZONE 3: 1 primary action or user panel */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Future Hikari Integration Spec Button */}
            <button
              onClick={onOpenHikariBridge}
              title="Ver especificação de integração futura com o site Hikari"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/40 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ponte Hikari</span>
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {/* Bookmarks */}
                <button
                  onClick={() => onSelectTab('salvos')}
                  className={`p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors ${activeTab === 'salvos' ? 'text-indigo-400' : ''}`}
                  title="Publicações Salvas"
                >
                  <Bookmark className="w-4 h-4" />
                </button>

                {/* Notifications Bell */}
                <button
                  onClick={() => onSelectTab('notificacoes')}
                  className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Notificações"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
                  )}
                </button>

                {/* Create post CTA */}
                <button
                  onClick={onOpenCreatePost}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publicar</span>
                </button>

                {/* Profile Pill */}
                <button
                  onClick={() => onSelectTab('perfil', user.username)}
                  className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-6 h-6 rounded-full object-cover border border-white/20"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs font-medium text-slate-200 hidden md:inline truncate max-w-[90px]">
                    {user.displayName}
                  </span>
                  {user.primaryBadge && (
                    <BadgeIcon badge={user.primaryBadge} size="sm" />
                  )}
                </button>

                {/* Logout button */}
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                  title="Sair da conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-colors whitespace-nowrap shrink-0"
              >
                Entrar na Comunidade
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          MOBILE BOTTOM TAB BAR (Thumb-Zone Navigation Anchor)
          Fixed bottom bar with 5 destinations, height: 60px (< 15% mobile viewport)
          Each button min 44x44px hitbox
      ========================================================================= */}
      <nav 
        aria-label="Navegação móvel"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090C15]/95 backdrop-blur-lg border-t border-white/10 h-15 pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-full max-w-md mx-auto px-2">
          
          {/* Tab 1: Início */}
          <button
            onClick={() => onSelectTab('inicio')}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'inicio' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-0.5">Início</span>
          </button>

          {/* Tab 2: Debates */}
          <button
            onClick={() => onSelectTab('debates')}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'debates' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-0.5">Debates</span>
          </button>

          {/* Tab 3: Quick Action (Create Post) */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                if (isAuthenticated) {
                  onOpenCreatePost();
                } else {
                  openAuthModal('login');
                }
              }}
              className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 active:scale-95 transition-transform"
              title="Nova Publicação"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Tab 4: Galeria */}
          <button
            onClick={() => onSelectTab('galeria')}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'galeria' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-0.5">Galeria</span>
          </button>

          {/* Tab 5: Perfil / Auth */}
          <button
            onClick={() => {
              if (isAuthenticated && user) {
                onSelectTab('perfil', user.username);
              } else {
                openAuthModal('login');
              }
            }}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-colors relative ${
              activeTab === 'perfil' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAuthenticated && user ? (
              <div className="relative">
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-5 h-5 rounded-full object-cover border border-white/20"
                  referrerPolicy="no-referrer"
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-500 rounded-full" />
                )}
              </div>
            ) : (
              <User className="w-5 h-5" />
            )}
            <span className="text-[10px] font-medium tracking-tight mt-0.5">
              {isAuthenticated ? 'Perfil' : 'Entrar'}
            </span>
          </button>

        </div>
      </nav>
    </>
  );
};
