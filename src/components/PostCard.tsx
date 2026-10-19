import React, { useState } from 'react';
import { Post, Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BadgeIcon } from './BadgeIcon';
import { 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Share2, 
  Eye, 
  EyeOff, 
  MoreHorizontal, 
  Trash2, 
  Flag, 
  Send,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  onOpenProfile: (username: string) => void;
  onOpenAnime: (animeId: string) => void;
  onOpenImageViewer: (images: string[], initialIndex: number) => void;
  onOpenReport: (targetType: 'post' | 'comment', targetId: string) => void;
  onOpenComments: (post: Post) => void;
  onPostDeleted?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onOpenProfile,
  onOpenAnime,
  onOpenImageViewer,
  onOpenReport,
  onOpenComments,
  onPostDeleted
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  
  const [likesCount, setLikesCount] = useState<number>(post.likesCount);
  const [isLiked, setIsLiked] = useState<boolean>(!!post.isLiked);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(!!post.isBookmarked);
  const [showSpoiler, setShowSpoiler] = useState<boolean>(!post.isSpoiler);
  const [poll, setPoll] = useState(post.poll);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  const isAuthor = user?.id === post.authorId || user?.role === 'admin';

  // Format date helper
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    // Optimistic update
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount(prev => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await api.toggleLikePost(post.id);
      setIsLiked(res.isLiked);
      setLikesCount(res.likesCount);
    } catch {
      // Revert on error
      setIsLiked(!nextLiked);
      setLikesCount(prev => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const nextSaved = !isBookmarked;
    setIsBookmarked(nextSaved);

    try {
      const res = await api.toggleBookmarkPost(post.id);
      setIsBookmarked(res.isBookmarked);
    } catch {
      setIsBookmarked(!nextSaved);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }).catch(() => {
      // Fallback
    });
  };

  const handleVote = async (optionId: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await api.votePoll(post.id, optionId);
      setPoll(res.poll);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Deseja realmente excluir esta publicação da comunidade?')) return;
    try {
      await api.deletePost(post.id);
      onPostDeleted?.(post.id);
    } catch (err) {
      console.error(err);
    }
  };

  const categoryLabel: Record<string, string> = {
    geral: 'Geral',
    episodio: 'Episódio',
    teoria: 'Teoria',
    debate: 'Debate',
    galeria: 'Galeria',
    recomendacao: 'Recomendação',
    enquete: 'Enquete'
  };

  return (
    <article className="bg-[#0E1322] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/20 hover:border-white/10 transition-colors">
      
      {/* AUTHOR & METADATA HEADER (Strict Zero-Pill Rule) */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenProfile(post.author.username)}
            className="relative shrink-0 group"
          >
            <img
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-indigo-400 transition-colors"
              referrerPolicy="no-referrer"
            />
          </button>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => onOpenProfile(post.author.username)}
                className="text-sm font-semibold text-white hover:text-indigo-300 transition-colors"
              >
                {post.author.displayName}
              </button>

              <span className="text-xs text-slate-400">
                @{post.author.username}
              </span>

              {/* Primary Badge equipped by author */}
              {post.author.primaryBadge && (
                <BadgeIcon badge={post.author.primaryBadge} size="sm" />
              )}
            </div>

            {/* Zero-Pill Unboxed Metadata with · separator */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 flex-wrap">
              <span>{categoryLabel[post.category] || post.category}</span>

              {post.animeTitle && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    onClick={() => post.animeId && onOpenAnime(post.animeId)}
                    className="hover:text-indigo-300 text-slate-300 font-medium transition-colors"
                  >
                    {post.animeTitle}
                    {post.episodeNumber ? ` (Ep. ${post.episodeNumber})` : ''}
                  </button>
                </>
              )}

              <span aria-hidden="true">·</span>
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Options menu trigger */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title="Mais opções"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 w-44 bg-[#141B2D] border border-white/10 rounded-xl shadow-xl py-1 text-xs text-slate-200">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenReport('post', post.id);
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2 text-rose-300"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Denunciar publicação</span>
              </button>

              {isAuthor && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleDeletePost();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2 text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir publicação</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SPOILER SHIELD CONTAINER */}
      {post.isSpoiler && !showSpoiler ? (
        <div className="my-3 p-4 rounded-xl bg-violet-950/20 border border-violet-800/30 flex flex-col items-center justify-center text-center gap-2">
          <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-violet-400" />
            <span>Aviso de Spoiler</span>
          </div>
          <p className="text-xs text-slate-300 max-w-md">
            {post.spoilerWarning || 'Esta publicação contém informações e detalhes sobre o enredo.'}
          </p>
          <button
            onClick={() => setShowSpoiler(true)}
            className="mt-1 px-3.5 py-1.5 text-xs font-medium text-white bg-violet-600/80 hover:bg-violet-600 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Revelar Conteúdo</span>
          </button>
        </div>
      ) : (
        <>
          {/* POST CONTENT TEXT */}
          {post.content && (
            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line mb-3">
              {post.content}
            </div>
          )}

          {/* SPOILER HIDE BUTTON IF REVEALED */}
          {post.isSpoiler && showSpoiler && (
            <div className="mb-3">
              <button
                onClick={() => setShowSpoiler(false)}
                className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                <EyeOff className="w-3 h-3" />
                <span>Ocultar spoiler</span>
              </button>
            </div>
          )}

          {/* IMAGE GALLERY (UP TO 5 IMAGES, COMPOSITE GRID) */}
          {post.images && post.images.length > 0 && (
            <div
              className={`mb-3 rounded-xl overflow-hidden gap-1.5 ${
                post.images.length === 1
                  ? 'flex'
                  : post.images.length === 2
                  ? 'grid grid-cols-2'
                  : post.images.length === 3
                  ? 'grid grid-cols-3'
                  : 'grid grid-cols-2'
              }`}
            >
              {post.images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => onOpenImageViewer(post.images, idx)}
                  className={`relative overflow-hidden cursor-pointer group bg-black/40 ${
                    post.images.length === 1 ? 'w-full max-h-[460px]' : 'h-48'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Imagem ${idx + 1} da publicação`}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              ))}
            </div>
          )}

          {/* INTERACTIVE POLL */}
          {poll && (
            <div className="my-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
              <div className="text-xs font-semibold text-slate-200">
                {poll.question}
              </div>
              <div className="space-y-1.5">
                {poll.options.map(option => {
                  const voteCount = option.votes.length;
                  const total = poll.totalVotes || 1;
                  const percent = Math.round((voteCount / total) * 100);
                  const isUserVoted = poll.userVotedOptionId === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleVote(option.id)}
                      className={`relative w-full text-left p-2.5 rounded-lg border text-xs transition-colors overflow-hidden ${
                        isUserVoted
                          ? 'border-indigo-500 bg-indigo-950/30 text-white font-medium'
                          : 'border-white/5 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {/* Vote percent fill background */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 ${
                          isUserVoted ? 'bg-indigo-600/30' : 'bg-white/5'
                        } transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                      <div className="relative flex items-center justify-between z-10">
                        <span className="flex items-center gap-1.5 truncate">
                          {isUserVoted && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                          <span>{option.text}</span>
                        </span>
                        <span className="text-slate-400 tabular-nums ml-2 shrink-0">
                          {percent}% ({voteCount})
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="text-[11px] text-slate-400 tabular-nums text-right">
                Total de votos: {poll.totalVotes}
              </div>
            </div>
          )}

          {/* TAGS (Clean Unboxed style) */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-3 text-xs text-indigo-400/80">
              {post.tags.map((tag, idx) => (
                <span key={idx} className="hover:text-indigo-300 cursor-pointer">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {/* FOOTER ACTIONS BAR */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
        
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg transition-colors ${
            isLiked ? 'text-rose-400 bg-rose-950/30' : 'hover:text-white hover:bg-white/5'
          }`}
          title="Curtir"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span className="tabular-nums">{likesCount}</span>
        </button>

        {/* Comment Button (Opens Bottom Sheet) */}
        <button
          onClick={() => onOpenComments(post)}
          className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Ver comentários"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="tabular-nums">{post.commentsCount}</span>
        </button>

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          className={`p-1.5 rounded-lg transition-colors ${
            isBookmarked ? 'text-indigo-400 bg-indigo-950/30' : 'hover:text-white hover:bg-white/5'
          }`}
          title={isBookmarked ? 'Salvo' : 'Salvar publicação'}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-indigo-500 text-indigo-500' : ''}`} />
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="p-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors relative"
          title="Compartilhar link"
        >
          <Share2 className="w-4 h-4" />
          {shareCopied && (
            <span className="absolute -top-7 right-0 px-2 py-0.5 bg-indigo-600 text-[10px] text-white rounded shadow-md whitespace-nowrap">
              Link copiado!
            </span>
          )}
        </button>
      </div>

    </article>
  );
};
