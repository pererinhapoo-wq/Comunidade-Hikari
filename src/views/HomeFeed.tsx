import React, { useState, useEffect } from 'react';
import { Post, Anime } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/PostCard';
import { BadgeIcon } from '../components/BadgeIcon';
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Flame, 
  ShieldAlert, 
  Layers, 
  Plus, 
  MessageSquare,
  Compass,
  Tv
} from 'lucide-react';

interface HomeFeedProps {
  onOpenProfile: (username: string) => void;
  onOpenAnime: (animeId: string) => void;
  onOpenImageViewer: (images: string[], initialIndex: number) => void;
  onOpenReport: (targetType: 'post' | 'comment', targetId: string) => void;
  onOpenComments: (post: Post) => void;
  onOpenCreatePost: () => void;
  onOpenHikariBridge: () => void;
  onSelectTab: (tab: any, param?: string) => void;
  animes: Anime[];
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  onOpenProfile,
  onOpenAnime,
  onOpenImageViewer,
  onOpenReport,
  onOpenComments,
  onOpenCreatePost,
  onOpenHikariBridge,
  onSelectTab,
  animes
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [feedScope, setFeedScope] = useState<'all' | 'following'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'trending'>('recent');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const loadPosts = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.getPosts({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        feedType: feedScope === 'following' ? 'following' : undefined,
        sort: sortBy
      });

      setPosts(res.posts || []);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Erro ao carregar o feed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [feedScope, sortBy, selectedCategory]);

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* 2-COLUMN DESKTOP SPLIT WITH FULL VIEWPORT DENSITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* MAIN FEED COLUMN (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CINEMATIC HERO SPOTLIGHT CARD */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0B0F1C]">
            <div className="absolute inset-0">
              <img
                src="/src/assets/images/hikari_hero_banner_1792424735133.jpg"
                alt="Comunidade Hikari Atmosfera"
                className="w-full h-full object-cover opacity-35"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1C] via-[#0B0F1C]/70 to-transparent" />
            </div>

            <div className="relative p-6 sm:p-8 z-10 space-y-3 max-w-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                <Sparkles className="w-4 h-4" />
                <span>COMUNIDADE PREMIUM DE ANIMES</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display text-balance">
                Onde a paixão por animes encontra debates profundos.
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Participe de discussões organizadas por episódios, teorias, galeria de fanarts e colecione emblemas visuais únicos.
              </p>

              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => {
                    if (isAuthenticated) onOpenCreatePost();
                    else openAuthModal('login');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Publicação</span>
                </button>

                <button
                  onClick={() => onSelectTab('debates')}
                  className="px-4 py-2 text-xs font-medium text-slate-200 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span>Explorar Debates</span>
                </button>
              </div>
            </div>
          </div>

          {/* INTERACTIVE FEED TABS & SORTING CONTROLS */}
          <div className="space-y-3">
            
            {/* Main Scope and Sorting Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
              
              {/* Scope Selector: Todos vs Seguindo */}
              <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 w-fit">
                <button
                  onClick={() => setFeedScope('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    feedScope === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos os Membros
                </button>
                <button
                  onClick={() => {
                    if (!isAuthenticated) openAuthModal('login');
                    else setFeedScope('following');
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    feedScope === 'following'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Seguindo</span>
                </button>
              </div>

              {/* Sorting Filter: Recentes vs Em alta */}
              <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 w-fit">
                <span className="text-[11px] text-slate-400 px-2 font-medium">Ordenar:</span>
                <button
                  onClick={() => setSortBy('recent')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    sortBy === 'recent'
                      ? 'bg-white/15 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Ordenar por data de publicação (mais recentes primeiro)"
                >
                  <span>Recentes</span>
                </button>
                <button
                  onClick={() => setSortBy('trending')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    sortBy === 'trending'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Ordenar por engajamento real de curtidas e respostas"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Em alta</span>
                </button>
              </div>

            </div>

            {/* Filter by Category Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'Tudo' },
                { id: 'episodio', label: 'Episódios' },
                { id: 'teoria', label: 'Teorias' },
                { id: 'debate', label: 'Debates & Lutas' },
                { id: 'galeria', label: 'Fanarts' },
                { id: 'enquete', label: 'Enquetes' },
                { id: 'recomendacao', label: 'Recomendações' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-white/15 text-white font-medium border border-white/20'
                      : 'text-slate-400 hover:text-slate-200 bg-white/5 border border-transparent'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

          </div>

          {/* POSTS LIST */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-[#0E1322] border border-white/5 rounded-2xl p-5 animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5" />
                    <div className="space-y-1.5 flex-1">
                      <div className="w-32 h-3.5 rounded bg-white/5" />
                      <div className="w-24 h-2.5 rounded bg-white/5" />
                    </div>
                  </div>
                  <div className="w-full h-16 rounded-xl bg-white/5" />
                </div>
              ))}
            </div>
          ) : errorMsg ? (
            <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/30 text-center space-y-2">
              <p className="text-xs text-rose-300">{errorMsg}</p>
              <button
                onClick={loadPosts}
                className="px-3 py-1.5 bg-rose-900/50 hover:bg-rose-900 text-rose-200 text-xs rounded-lg transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#0E1322] border border-white/5 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="font-semibold text-sm text-slate-300">
                Nenhuma publicação encontrada
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Não há discussões nesta categoria no momento. Que tal inaugurar a conversa?
              </p>
              <button
                onClick={() => {
                  if (isAuthenticated) onOpenCreatePost();
                  else openAuthModal('login');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Iniciar Discussão</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onOpenProfile={onOpenProfile}
                  onOpenAnime={onOpenAnime}
                  onOpenImageViewer={onOpenImageViewer}
                  onOpenReport={onOpenReport}
                  onOpenComments={onOpenComments}
                  onPostDeleted={handlePostDeleted}
                />
              ))}
            </div>
          )}

        </div>

        {/* RIGHT SIDEBAR (4 Cols Desktop) */}
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          
          {/* TRENDING TOPICS */}
          <div className="p-5 rounded-2xl bg-[#0E1322] border border-white/5 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-white font-display">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Assuntos em Destaque</span>
            </div>

            <div className="space-y-2 text-xs">
              <div 
                onClick={() => onSelectTab('debates')}
                className="p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5"
              >
                <div className="font-medium text-slate-200">#FrierenEpisodio28</div>
                <div className="text-[11px] text-slate-500 mt-0.5">142 discussões sobre o exame de 1ª classe</div>
              </div>

              <div 
                onClick={() => onSelectTab('debates')}
                className="p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5"
              >
                <div className="font-medium text-slate-200">#GojoVsSukunaShinjuku</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Enquete ativa e debates conceituais</div>
              </div>

              <div 
                onClick={() => onSelectTab('galeria')}
                className="p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5"
              >
                <div className="font-medium text-slate-200">#SoloLevelingFanarts</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Ilustrações de alta resolução dos membros</div>
              </div>
            </div>
          </div>

          {/* SPOTLIGHT BADGE (COLLECTIBLE HIGHLIGHT) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-950/40 to-[#0E1322] border border-violet-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Emblema Lendário em Destaque</span>
              </span>
              <span className="text-[10px] text-purple-300 font-medium">Lendário</span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src="/src/assets/images/badge_celestial_crest_1792424737159.jpg"
                alt="Brasão Celestial Hikari"
                className="w-14 h-14 rounded-xl object-cover border border-amber-400/60 shadow-lg shadow-purple-900/40"
              />
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white font-display">
                  Brasão Celestial Hikari
                </h4>
                <p className="text-[11px] text-slate-300 line-clamp-2">
                  A mais alta honraria colecionável concedida a pilares da comunidade.
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('emblemas')}
              className="w-full py-1.5 text-xs font-medium text-indigo-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors"
            >
              Explorar Coleção Completa
            </button>
          </div>

          {/* FUTURE HIKARI INTEGRATION TEASER */}
          <div className="p-5 rounded-2xl bg-[#0E1322] border border-indigo-900/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <Layers className="w-4 h-4" />
              <span>Integração Hikari</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Seu perfil e emblema principal serão futuramente sincronizados com os comentários de episódios no site Hikari.
            </p>
            <button
              onClick={onOpenHikariBridge}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Ver detalhes da arquitetura</span>
              <span>→</span>
            </button>
          </div>

          {/* COMMUNITY PRINCIPLES */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300">Diretrizes da Comunidade:</div>
            <div>• Sempre utilize o aviso de spoiler para revelações de enredo.</div>
            <div>• Debates respeitosos com argumentos e sem ataques pessoais.</div>
            <div>• O sistema de conquistas é colecionável e livre de níveis artificiais.</div>
          </div>

        </div>

      </div>

    </div>
  );
};
