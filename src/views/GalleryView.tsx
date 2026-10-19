import React, { useState, useEffect } from 'react';
import { Post, Anime } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BadgeIcon } from '../components/BadgeIcon';
import { 
  Palette, 
  Heart, 
  Plus, 
  Eye, 
  Sparkles,
  ExternalLink,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

interface GalleryViewProps {
  onOpenProfile: (username: string) => void;
  onOpenImageViewer: (images: string[], initialIndex: number) => void;
  onOpenCreatePostWithCategory: (category: 'galeria') => void;
  onOpenComments?: (post: Post) => void;
  animes: Anime[];
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  onOpenProfile,
  onOpenImageViewer,
  onOpenCreatePostWithCategory,
  onOpenComments,
  animes
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedAnimeId, setSelectedAnimeId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'trending'>('recent');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadGallery = async () => {
    setIsLoading(true);
    try {
      const res = await api.getPosts({
        category: 'galeria',
        animeId: selectedAnimeId !== 'all' ? selectedAnimeId : undefined,
        sort: sortBy
      });
      // Also include any posts with images if gallery posts are few
      let allVisualPosts = res.posts.filter(p => p.images && p.images.length > 0);
      if (allVisualPosts.length === 0) {
        const generalRes = await api.getPosts({ 
          animeId: selectedAnimeId !== 'all' ? selectedAnimeId : undefined,
          sort: sortBy
        });
        allVisualPosts = generalRes.posts.filter(p => p.images && p.images.length > 0);
      }
      setPosts(allVisualPosts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, [selectedAnimeId, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-pink-400 mb-1">
            <Palette className="w-4 h-4" />
            <span>GALERIA DA COMUNIDADE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Fanarts, Ilustrações & Criações
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Artes visuais de alta definição publicadas pelos ilustradores e fãs da Comunidade Hikari.
          </p>
        </div>

        <button
          onClick={() => {
            if (isAuthenticated) onOpenCreatePostWithCategory('galeria');
            else openAuthModal('login');
          }}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Publicar Fanart</span>
        </button>
      </div>

      {/* Filter by Anime & Sorting Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedAnimeId('all')}
            className={`px-3 py-1.5 text-xs rounded-xl whitespace-nowrap transition-colors ${
              selectedAnimeId === 'all'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Todas as Obras
          </button>
          {animes.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedAnimeId(a.id)}
              className={`px-3 py-1.5 text-xs rounded-xl whitespace-nowrap transition-colors ${
                selectedAnimeId === a.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {a.title}
            </button>
          ))}
        </div>

        {/* Sorting Filter: Recentes vs Em alta */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 w-fit shrink-0 self-start sm:self-auto">
          <span className="text-[11px] text-slate-400 px-2 font-medium">Ordenar:</span>
          <button
            onClick={() => setSortBy('recent')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
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
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              sortBy === 'trending'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Ordenar por engajamento real de curtidas e comentários"
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Em alta</span>
          </button>
        </div>
      </div>

      {/* Grid of Visual Cards */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Carregando galeria...
        </div>
      ) : posts.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0E1322] border border-white/5 text-center space-y-3">
          <Palette className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-semibold text-sm text-slate-300">
            Nenhuma ilustração encontrada para este filtro
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Compartilhe sua pintura digital, wallpaper ou fanart original com a comunidade.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.flatMap(p => 
            p.images.map((imgUrl, imgIndex) => (
              <div
                key={`${p.id}_${imgIndex}`}
                className="group relative rounded-2xl overflow-hidden bg-[#0E1322] border border-white/5 shadow-xl hover:border-indigo-500/40 transition-all duration-300 flex flex-col"
              >
                {/* Image */}
                <div 
                  onClick={() => onOpenImageViewer(p.images, imgIndex)}
                  className="relative aspect-[4/3] sm:aspect-square overflow-hidden cursor-pointer bg-black/60"
                >
                  <img
                    src={imgUrl}
                    alt={p.content.slice(0, 30) || 'Fanart da comunidade'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-xs font-medium text-white flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-indigo-400" />
                      <span>Visualizar em Alta Resolução</span>
                    </span>
                  </div>
                </div>

                {/* Creator Attribution & Caption */}
                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {p.content || 'Ilustração da comunidade.'}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <button
                      onClick={() => onOpenProfile(p.author.username)}
                      className="flex items-center gap-2 group/author"
                    >
                      <img
                        src={p.author.avatarUrl}
                        alt={p.author.displayName}
                        className="w-6 h-6 rounded-full object-cover border border-white/10"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-xs font-medium text-slate-200 group-hover/author:text-indigo-300 truncate max-w-[120px]">
                        {p.author.displayName}
                      </span>
                      {p.author.primaryBadge && (
                        <BadgeIcon badge={p.author.primaryBadge} size="sm" />
                      )}
                    </button>

                    <div className="flex items-center gap-3">
                      {/* Comments trigger */}
                      {onOpenComments && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenComments(p);
                          }}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Ver comentários"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="tabular-nums">{p.commentsCount || 0}</span>
                        </button>
                      )}

                      {/* Likes count */}
                      <div className="flex items-center gap-1 text-xs text-rose-400 tabular-nums">
                        <Heart className="w-3.5 h-3.5 fill-rose-500/50" />
                        <span>{p.likesCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
