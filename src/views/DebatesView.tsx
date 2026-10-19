import React, { useState, useEffect } from 'react';
import { Post, Anime } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/PostCard';
import { 
  Zap, 
  Swords, 
  BarChart2, 
  Sparkles, 
  Lightbulb, 
  BookOpen, 
  Plus, 
  HelpCircle,
  TrendingUp,
  Clock
} from 'lucide-react';

interface DebatesViewProps {
  onOpenProfile: (username: string) => void;
  onOpenAnime: (animeId: string) => void;
  onOpenImageViewer: (images: string[], initialIndex: number) => void;
  onOpenReport: (targetType: 'post' | 'comment', targetId: string) => void;
  onOpenComments: (post: Post) => void;
  onOpenCreatePostWithCategory: (category: 'debate' | 'teoria' | 'enquete' | 'recomendacao') => void;
  animes: Anime[];
}

export const DebatesView: React.FC<DebatesViewProps> = ({
  onOpenProfile,
  onOpenAnime,
  onOpenImageViewer,
  onOpenReport,
  onOpenComments,
  onOpenCreatePostWithCategory,
  animes
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'debate' | 'teoria' | 'enquete' | 'recomendacao'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'trending'>('recent');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadDebates = async () => {
    setIsLoading(true);
    try {
      const res = await api.getPosts({
        category: activeTab !== 'all' ? activeTab : undefined,
        sort: sortBy
      });

      // Filter only debate-related posts if 'all'
      let filtered = res.posts;
      if (activeTab === 'all') {
        filtered = res.posts.filter(p => ['debate', 'teoria', 'enquete', 'recomendacao'].includes(p.category));
      }
      setPosts(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDebates();
  }, [activeTab, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <Swords className="w-4 h-4" />
            <span>ARENA DE DISCUSSÕES E ANÁLISES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Debates, Teorias & Powerscaling
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Comparações de combate, análises conceituais de poderes, enquetes da comunidade e resenhas críticas.
          </p>
        </div>

        <button
          onClick={() => {
            if (isAuthenticated) onOpenCreatePostWithCategory(activeTab === 'all' ? 'debate' : activeTab);
            else openAuthModal('login');
          }}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Iniciar Novo Debate</span>
        </button>
      </div>

      {/* Subcategory buttons & Sorting Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Todos os Debates', icon: Swords },
            { id: 'debate', label: 'Powerscaling & Batalhas', icon: Zap },
            { id: 'teoria', label: 'Teorias & Lore', icon: Lightbulb },
            { id: 'enquete', label: 'Enquetes com Votação', icon: BarChart2 },
            { id: 'recomendacao', label: 'Recomendações', icon: BookOpen }
          ].map(item => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === item.id
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
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

      {/* Posts list */}
      <div className="max-w-3xl space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Carregando debates...
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#0E1322] border border-white/5 text-center space-y-3">
            <Swords className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="font-semibold text-sm text-slate-300">
              Nenhum debate nesta categoria ainda
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Crie uma enquete de poderes, proponha uma comparação ou compartilhe sua teoria de fã.
            </p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onOpenProfile={onOpenProfile}
              onOpenAnime={onOpenAnime}
              onOpenImageViewer={onOpenImageViewer}
              onOpenReport={onOpenReport}
              onOpenComments={onOpenComments}
              onPostDeleted={postId => setPosts(prev => prev.filter(p => p.id !== postId))}
            />
          ))
        )}
      </div>

    </div>
  );
};
