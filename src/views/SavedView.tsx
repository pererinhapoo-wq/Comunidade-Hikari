import React, { useState, useEffect } from 'react';
import { Post } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/PostCard';
import { Bookmark, Sparkles } from 'lucide-react';

interface SavedViewProps {
  onOpenProfile: (username: string) => void;
  onOpenAnime: (animeId: string) => void;
  onOpenImageViewer: (images: string[], initialIndex: number) => void;
  onOpenReport: (targetType: 'post' | 'comment', targetId: string) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  onOpenProfile,
  onOpenAnime,
  onOpenImageViewer,
  onOpenReport
}) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadSaved = async () => {
    setIsLoading(true);
    try {
      const res = await api.getPosts({ feedType: 'saved' });
      setPosts(res.posts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
          <Bookmark className="w-4 h-4 fill-indigo-500/20" />
          <span>COLEÇÃO PESSOAL</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white font-display">
          Publicações Salvas
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Análises, fanarts e teorias que você guardou para consultar a qualquer momento.
        </p>
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Carregando salvos...
        </div>
      ) : posts.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0E1322] border border-white/5 text-center space-y-2">
          <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">
            Nenhuma publicação salva
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Clique no ícone de marcador em qualquer publicação para guardá-la nesta lista.
          </p>
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
              onPostDeleted={postId => setPosts(prev => prev.filter(p => p.id !== postId))}
            />
          ))}
        </div>
      )}

    </div>
  );
};
