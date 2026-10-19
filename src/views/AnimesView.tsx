import React, { useState, useEffect } from 'react';
import { Anime, Post } from '../types';
import { api } from '../services/api';
import { PostCard } from '../components/PostCard';
import { 
  Tv, 
  ChevronRight, 
  ArrowLeft, 
  Plus, 
  MessageSquare, 
  Layers, 
  Sparkles,
  Calendar,
  Film,
  TrendingUp
} from 'lucide-react';

interface AnimesViewProps {
  animes: Anime[];
  selectedAnimeId?: string;
  onSelectAnime: (animeId: string) => void;
  onBackToCatalog: () => void;
  onOpenProfile: (username: string) => void;
  onOpenImageViewer: (images: string[], initialIndex: number) => void;
  onOpenReport: (targetType: 'post' | 'comment', targetId: string) => void;
  onOpenComments: (post: Post) => void;
  onOpenCreatePostWithAnime: (animeId: string, episodeNum?: number) => void;
}

export const AnimesView: React.FC<AnimesViewProps> = ({
  animes,
  selectedAnimeId,
  onSelectAnime,
  onBackToCatalog,
  onOpenProfile,
  onOpenImageViewer,
  onOpenReport,
  onOpenComments,
  onOpenCreatePostWithAnime
}) => {
  const [activeAnime, setActiveAnime] = useState<Anime | null>(null);
  const [discussions, setDiscussions] = useState<Post[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'trending'>('recent');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterGenre, setFilterGenre] = useState<string>('all');

  useEffect(() => {
    if (selectedAnimeId) {
      const found = animes.find(a => a.id === selectedAnimeId);
      setActiveAnime(found || null);
      if (found) {
        loadAnimeDiscussions(found.id);
      }
    } else {
      setActiveAnime(null);
      setDiscussions([]);
    }
  }, [selectedAnimeId, animes, sortBy]);

  const loadAnimeDiscussions = async (animeId: string) => {
    setIsLoading(true);
    try {
      const res = await api.getAnime(animeId, sortBy);
      setDiscussions(res.discussions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDiscussions = selectedEpisode === 'all'
    ? discussions
    : discussions.filter(d => d.episodeNumber === selectedEpisode);

  // If viewing a specific anime hub
  if (activeAnime) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Back navigation */}
        <button
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para todas as discussões</span>
        </button>

        {/* Anime Showcase Hero Header */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0E1322]">
          <div className="absolute inset-0">
            <img
              src={activeAnime.bannerUrl || activeAnime.coverUrl}
              alt={activeAnime.title}
              className="w-full h-full object-cover opacity-20"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E1322] via-[#0E1322]/80 to-transparent" />
          </div>

          <div className="relative p-6 sm:p-8 z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            <div className="md:col-span-3 shrink-0">
              <img
                src={activeAnime.coverUrl}
                alt={activeAnime.title}
                className="w-40 sm:w-48 aspect-[3/4] object-cover rounded-2xl border border-white/10 shadow-2xl mx-auto md:mx-0"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="md:col-span-9 space-y-3 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-indigo-400 flex-wrap">
                <span className="font-medium">{activeAnime.japaneseTitle}</span>
                <span aria-hidden="true">·</span>
                <span>{activeAnime.status}</span>
                <span aria-hidden="true">·</span>
                <span>{activeAnime.episodesCount} Episódios</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                {activeAnime.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {activeAnime.synopsis}
              </p>

              {/* Genres unboxed with · */}
              <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-slate-400 flex-wrap">
                {activeAnime.genres.map((g, i) => (
                  <React.Fragment key={g}>
                    <span>{g}</span>
                    {i < activeAnime.genres.length - 1 && <span aria-hidden="true">·</span>}
                  </React.Fragment>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-center md:justify-start gap-3 flex-wrap">
                <button
                  onClick={() => onOpenCreatePostWithAnime(activeAnime.id, selectedEpisode === 'all' ? undefined : selectedEpisode)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {selectedEpisode === 'all' ? 'Nova Discussão sobre o Anime' : `Debater Episódio ${selectedEpisode}`}
                  </span>
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* EPISODE SELECTOR CAROUSEL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              <span>Discussões por Episódio</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              {activeAnime.episodesCount} episódios catalogados
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedEpisode('all')}
              className={`px-3 py-1.5 text-xs rounded-xl whitespace-nowrap transition-colors ${
                selectedEpisode === 'all'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Todos os Episódios
            </button>

            {Array.from({ length: Math.min(activeAnime.episodesCount, 30) }, (_, i) => i + 1).map(ep => (
              <button
                key={ep}
                onClick={() => setSelectedEpisode(ep)}
                className={`px-3 py-1.5 text-xs rounded-xl whitespace-nowrap transition-colors ${
                  selectedEpisode === ep
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Ep. {ep}
              </button>
            ))}
          </div>
        </div>

        {/* EPISODE DISCUSSIONS FEED */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 border-b border-white/5 pb-2">
            <div>
              <span>
                {selectedEpisode === 'all'
                  ? `Todas as discussões de ${activeAnime.title}`
                  : `Discussões do Episódio ${selectedEpisode}`}
              </span>
              <span className="tabular-nums ml-2 text-slate-500">
                ({filteredDiscussions.length} publicações)
              </span>
            </div>

            {/* Sorting Filter: Recentes vs Em alta */}
            <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 w-fit">
              <span className="text-[11px] text-slate-400 px-2 font-medium">Ordenar:</span>
              <button
                onClick={() => setSortBy('recent')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  sortBy === 'recent'
                    ? 'bg-white/15 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Ordenar por data (mais recentes primeiro)"
              >
                <span>Recentes</span>
              </button>
              <button
                onClick={() => setSortBy('trending')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  sortBy === 'trending'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Ordenar por engajamento de curtidas e respostas"
              >
                <TrendingUp className="w-3 h-3 text-amber-400" />
                <span>Em alta</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Carregando discussões...
            </div>
          ) : filteredDiscussions.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#0E1322] border border-white/5 text-center space-y-3">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-300">
                Ainda não há publicações para este episódio
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Compartilhe sua análise da cena, trilha sonora ou teorias para os próximos acontecimentos.
              </p>
              <button
                onClick={() => onOpenCreatePostWithAnime(activeAnime.id, selectedEpisode === 'all' ? undefined : selectedEpisode)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Iniciar Tópico do Episódio</span>
              </button>
            </div>
          ) : (
            filteredDiscussions.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onOpenProfile={onOpenProfile}
                onOpenAnime={onSelectAnime}
                onOpenImageViewer={onOpenImageViewer}
                onOpenReport={onOpenReport}
                onOpenComments={onOpenComments}
                onPostDeleted={postId => setDiscussions(prev => prev.filter(p => p.id !== postId))}
              />
            ))
          )}
        </div>

      </div>
    );
  }

  // ALL ANIMES DIRECTORY GRID
  const allGenres = ['all', 'Ação', 'Fantasia', 'Aventura', 'Sobrenatural', 'Drama'];
  const displayedAnimes = filterGenre === 'all'
    ? animes
    : animes.filter(a => a.genres.includes(filterGenre));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Topics Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          Tópicos de Discussão por Obra
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
          Acesse discussões e debates organizados pelas obras que a comunidade está acompanhando.
        </p>

        {/* Genre filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1">
          {allGenres.map(genre => (
            <button
              key={genre}
              onClick={() => setFilterGenre(genre)}
              className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
                filterGenre === genre
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {genre === 'all' ? 'Todos os Gêneros' : genre}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {displayedAnimes.map(anime => (
          <div
            key={anime.id}
            onClick={() => onSelectAnime(anime.id)}
            className="group bg-[#0E1322] border border-white/5 hover:border-indigo-500/40 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 cursor-pointer flex flex-col"
          >
            {/* Visual cover */}
            <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
              <img
                src={anime.coverUrl}
                alt={anime.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E1322] via-transparent to-transparent" />
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[11px] font-semibold text-amber-300 tabular-nums">
                ★ {anime.score}
              </div>
            </div>

            {/* Info */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <div className="text-[11px] text-indigo-400 line-clamp-1">
                  {anime.japaneseTitle}
                </div>
                <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                  {anime.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {anime.synopsis}
                </p>
              </div>

              {/* Footer info unboxed with · */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span>{anime.episodesCount} Episódios</span>
                <span className="flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
                  <span>Explorar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
