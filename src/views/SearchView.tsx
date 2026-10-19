import React, { useState, useEffect } from 'react';
import { Post, Anime, UserProfile } from '../types';
import { api } from '../services/api';
import { PostCard } from '../components/PostCard';
import { BadgeIcon } from '../components/BadgeIcon';
import { 
  Search, 
  Users, 
  Tv, 
  FileText, 
  Hash, 
  X,
  ChevronRight
} from 'lucide-react';

interface SearchViewProps {
  onOpenProfile: (username: string) => void;
  onOpenAnime: (animeId: string) => void;
  onOpenImageViewer: (images: string[], initialIndex: number) => void;
  onOpenReport: (targetType: 'post' | 'comment', targetId: string) => void;
  animes: Anime[];
}

export const SearchView: React.FC<SearchViewProps> = ({
  onOpenProfile,
  onOpenAnime,
  onOpenImageViewer,
  onOpenReport,
  animes
}) => {
  const [query, setQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'posts' | 'users' | 'animes'>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [matchingUsers, setMatchingUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!query.trim()) {
      setPosts([]);
      setMatchingUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const postsRes = await api.getPosts({ search: query });
        setPosts(postsRes.posts || []);

        // Also check default seed users for matches
        const searchLower = query.toLowerCase().replace(/^@/, '');
        const sampleNicks = ['hikari_curador', 'fern_arcana', 'satoru_infinity', 'yuki_sakura'];
        const matchedProfiles: UserProfile[] = [];

        for (const nick of sampleNicks) {
          if (nick.includes(searchLower)) {
            try {
              const u = await api.getUserProfile(nick);
              if (u.profile) matchedProfiles.push(u.profile);
            } catch {
              // ignore
            }
          }
        }
        setMatchingUsers(matchedProfiles);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const matchingAnimes = animes.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase()) || 
    a.japaneseTitle.toLowerCase().includes(query.toLowerCase()) ||
    a.genres.some(g => g.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Pesquisar por membros (@nick), animes, episódios, tags ou teorias..."
          className="w-full bg-[#0E1322] border border-white/10 rounded-2xl pl-12 pr-10 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-xl"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-3.5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-white/5 pb-3">
        {[
          { id: 'all', label: 'Todos os Resultados' },
          { id: 'posts', label: 'Publicações' },
          { id: 'users', label: 'Membros' },
          { id: 'animes', label: 'Animes' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as any)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
              filterType === tab.id
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {query.trim() === '' ? (
        <div className="py-12 text-center space-y-4">
          <Search className="w-10 h-10 text-slate-700 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-slate-300">
              Explore a Comunidade Hikari
            </h3>
            <p className="text-xs text-slate-500">
              Digite termos como "Frieren", "Gojo", "Zoltraak" ou busque um membro por @nick.
            </p>
          </div>

          {/* Quick tags suggestions */}
          <div className="pt-2 flex items-center justify-center gap-2 flex-wrap text-xs">
            {['Frieren', 'Jujutsu Kaisen', 'Solo Leveling', 'Teoria', 'Powerscaling', 'Fanarts'].map(tag => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-400 border border-white/5 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      ) : isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Buscando resultados...
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* MEMBERS MATCHES */}
          {(filterType === 'all' || filterType === 'users') && matchingUsers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Membros Encontrados</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchingUsers.map(u => (
                  <div
                    key={u.id}
                    onClick={() => onOpenProfile(u.username)}
                    className="p-3 rounded-xl bg-[#0E1322] border border-white/5 hover:border-indigo-500/40 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatarUrl}
                        alt={u.displayName}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-white">
                            {u.displayName}
                          </span>
                          {u.primaryBadge && (
                            <BadgeIcon badge={u.primaryBadge} size="sm" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          @{u.username} · {u.followersCount} seguidores
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANIMES MATCHES */}
          {(filterType === 'all' || filterType === 'animes') && matchingAnimes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-indigo-400" />
                <span>Animes Encontrados</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchingAnimes.map(a => (
                  <div
                    key={a.id}
                    onClick={() => onOpenAnime(a.id)}
                    className="p-3 rounded-xl bg-[#0E1322] border border-white/5 hover:border-indigo-500/40 transition-colors cursor-pointer flex items-center gap-3"
                  >
                    <img
                      src={a.coverUrl}
                      alt={a.title}
                      className="w-12 h-16 rounded-lg object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-0.5">
                      <h4 className="font-semibold text-xs text-white">
                        {a.title}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {a.japaneseTitle}
                      </p>
                      <div className="text-[10px] text-indigo-400">
                        {a.episodesCount} episódios · {a.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POSTS MATCHES */}
          {(filterType === 'all' || filterType === 'posts') && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Discussões ({posts.length})</span>
              </h3>
              {posts.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#0E1322] border border-white/5 text-center text-xs text-slate-400">
                  Nenhuma publicação corresponde ao termo pesquisado.
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
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
