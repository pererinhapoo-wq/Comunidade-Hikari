import React, { useState, useEffect, useRef } from 'react';
import { Post, Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BadgeIcon } from './BadgeIcon';
import { 
  X, 
  Send, 
  Heart, 
  Trash2, 
  AlertTriangle, 
  ChevronUp, 
  ChevronDown, 
  MessageSquare,
  Sparkles,
  Loader2,
  Reply,
  ArrowUpCircle
} from 'lucide-react';

interface CommentsBottomSheetProps {
  isOpen: boolean;
  post: Post | null;
  onClose: () => void;
  onOpenProfile: (username: string) => void;
  onCommentCountChange?: (postId: string, newCount: number) => void;
}

export const CommentsBottomSheet: React.FC<CommentsBottomSheetProps> = ({
  isOpen,
  post,
  onClose,
  onOpenProfile,
  onCommentCountChange
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [newComment, setNewComment] = useState<string>('');
  const [isSpoiler, setIsSpoiler] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Mobile sheet states: 'partial' (62vh) or 'expanded' (92vh)
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  // Reply target comment
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);

  // Pagination / chunking for comments performance
  const PAGE_CHUNK = 15;
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_CHUNK);
  
  // Track revealed spoilers for specific comment IDs
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());

  // Touch drag tracking for mobile bottom sheet
  const touchStartY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Default avatar helper for unified anime design
  const getDefaultAvatar = (seed?: string) => 
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed || 'hikari_membro')}&backgroundColor=141b2d`;

  // Lock body scroll when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Load comments when post changes or sheet opens
  useEffect(() => {
    if (!isOpen || !post) {
      setComments([]);
      setReplyTarget(null);
      setIsExpanded(false);
      setVisibleCount(PAGE_CHUNK);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    api.getComments(post.id)
      .then(res => {
        if (isMounted) {
          setComments(res.comments || []);
          setVisibleCount(PAGE_CHUNK);
        }
      })
      .catch(err => console.error('[Comments] Error loading comments:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, post?.id]);

  // Keyboard escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  // Handle mobile touch gestures for bottom sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    // Drag down gesture: collapse if expanded, or close if at partial height
    if (deltaY > 60 && (!listRef.current || listRef.current.scrollTop <= 5)) {
      touchStartY.current = null;
      if (isExpanded) {
        setIsExpanded(false);
      } else {
        onClose();
      }
    } else if (deltaY < -40 && !isExpanded) {
      // Swiped upward, expand sheet
      setIsExpanded(true);
      touchStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await api.createComment(post.id, {
        content: newComment.trim(),
        isSpoiler,
        parentCommentId: replyTarget?.id
      });

      setComments(prev => [...prev, res.comment]);
      const nextCount = (post.commentsCount || comments.length) + 1;
      onCommentCountChange?.(post.id, nextCount);
      setNewComment('');
      setIsSpoiler(false);
      setReplyTarget(null);

      // Scroll to bottom of comments list
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      console.error('[Comments] Failed to add comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    // Optimistic toggle
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const nextLiked = !c.isLiked;
        return {
          ...c,
          isLiked: nextLiked,
          likesCount: nextLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1)
        };
      }
      return c;
    }));

    try {
      const res = await api.toggleLikeComment(commentId);
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            isLiked: res.isLiked,
            likesCount: res.likesCount
          };
        }
        return c;
      }));
    } catch (err) {
      console.error('[Comments] Failed to like comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Deseja excluir este comentário?')) return;

    try {
      await api.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      const nextCount = Math.max(0, (post.commentsCount || comments.length) - 1);
      onCommentCountChange?.(post.id, nextCount);
    } catch (err) {
      console.error('[Comments] Failed to delete comment:', err);
    }
  };

  const handleStartReply = (comment: Comment) => {
    setReplyTarget(comment);
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    inputRef.current?.focus();
  };

  const toggleRevealSpoiler = (commentId: string) => {
    setRevealedSpoilers(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const diffMinutes = Math.floor((Date.now() - d.getTime()) / (1000 * 60));
      if (diffMinutes < 1) return 'agora';
      if (diffMinutes < 60) return `${diffMinutes}m`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h`;
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  // Chunked display: show only the most recent `visibleCount` comments
  const visibleComments = comments.slice(Math.max(0, comments.length - visibleCount));
  const hiddenCount = Math.max(0, comments.length - visibleCount);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 transition-opacity duration-200"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* BOTTOM SHEET / DESKTOP MODAL CONTAINER */}
      <div
        ref={sheetRef}
        className={`w-full sm:max-w-xl md:max-w-2xl bg-[#0B0F1C] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ease-out overflow-hidden animate-in slide-in-from-bottom-4 ${
          isExpanded ? 'h-[90vh] sm:h-[86vh]' : 'h-[58vh] sm:h-[70vh]'
        }`}
      >
        
        {/* MOBILE DRAG HANDLE BAR */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setIsExpanded(prev => !prev)}
          className="pt-2.5 pb-1 sm:hidden flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
          title="Arraste para expandir ou recolher"
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-600/70 hover:bg-slate-500 transition-colors" />
        </div>

        {/* SHEET HEADER */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="px-5 py-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0B0F1C]"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-sm text-white">
              Comentários
            </h3>
            <span className="text-xs text-slate-400 tabular-nums">
              ({comments.length})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Desktop Expand / Minimize Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors hidden sm:flex"
              title={isExpanded ? "Reduzir painel" : "Expandir painel"}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Fechar comentários"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* POST CONTEXT SUMMARY SNIPPET */}
        <div className="px-5 py-2.5 bg-[#0E1424] border-b border-white/5 flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              onOpenProfile(post.author.username);
              onClose();
            }}
            className="shrink-0 hover:opacity-85 transition-opacity"
            title={`Ver perfil de ${post.author.displayName}`}
          >
            <img
              src={post.author.avatarUrl || getDefaultAvatar(post.author.username)}
              alt={post.author.displayName}
              onError={e => {
                (e.currentTarget as HTMLImageElement).src = getDefaultAvatar(post.author.username);
              }}
              className="w-7 h-7 rounded-full object-cover border border-white/10"
              referrerPolicy="no-referrer"
            />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => {
                  onOpenProfile(post.author.username);
                  onClose();
                }}
                className="font-semibold text-white hover:text-indigo-300 transition-colors truncate max-w-[140px]"
              >
                {post.author.displayName}
              </button>
              <span className="text-slate-400 truncate text-[11px]">
                @{post.author.username}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              {post.content || (post.images.length ? 'Publicação com imagens' : '')}
            </p>
          </div>
        </div>

        {/* COMMENTS SCROLLABLE LIST (INDEPENDENT SCROLL) */}
        <div 
          ref={listRef}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain"
        >
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span>Carregando comentários...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-xs font-semibold text-slate-300">
                Ainda não há comentários
              </h4>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Seja a primeira pessoa a compartilhar seus pensamentos sobre esta publicação.
              </p>
            </div>
          ) : (
            <>
              {/* Performance pagination / chunk loading button */}
              {hiddenCount > 0 && (
                <div className="text-center pb-2">
                  <button
                    onClick={() => setVisibleCount(prev => prev + PAGE_CHUNK)}
                    className="px-3.5 py-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800/40 rounded-xl transition-colors inline-flex items-center gap-1.5"
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    <span>Carregar comentários anteriores ({hiddenCount} restantes)</span>
                  </button>
                </div>
              )}

              {visibleComments.map(c => {
                const isCommentAuthor = user?.id === c.authorId || user?.role === 'admin';
                const isSpoilerShielded = c.isSpoiler && !revealedSpoilers.has(c.id);
                const parentComment = c.parentCommentId 
                  ? comments.find(p => p.id === c.parentCommentId) 
                  : undefined;

                return (
                  <div key={c.id} className="flex items-start gap-3 text-xs group">
                    
                    {/* Author Avatar with profile link and fallback */}
                    <button
                      onClick={() => {
                        onOpenProfile(c.author.username);
                        onClose();
                      }}
                      className="shrink-0 hover:scale-105 transition-transform"
                      title={`Ver perfil de ${c.author.displayName} (@${c.author.username})`}
                    >
                      <img
                        src={c.author.avatarUrl || getDefaultAvatar(c.author.username)}
                        alt={c.author.displayName}
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src = getDefaultAvatar(c.author.username);
                        }}
                        className="w-8 h-8 rounded-full object-cover border border-white/10"
                        referrerPolicy="no-referrer"
                      />
                    </button>

                    {/* Comment Bubble & Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                        
                        {/* Author Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => {
                                onOpenProfile(c.author.username);
                                onClose();
                              }}
                              className="font-semibold text-white hover:text-indigo-300 transition-colors text-left"
                            >
                              {c.author.displayName}
                            </button>
                            
                            {c.author.username && (
                              <button
                                onClick={() => {
                                  onOpenProfile(c.author.username);
                                  onClose();
                                }}
                                className="text-[11px] text-slate-400 hover:text-indigo-300 transition-colors"
                              >
                                @{c.author.username}
                              </button>
                            )}

                            {c.author.primaryBadge && (
                              <BadgeIcon badge={c.author.primaryBadge} size="sm" />
                            )}
                          </div>

                          <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                            {formatDate(c.createdAt)}
                          </span>
                        </div>

                        {/* Reply indicator reference if present */}
                        {parentComment && (
                          <div className="text-[10px] text-indigo-400/90 flex items-center gap-1 pt-0.5">
                            <Reply className="w-2.5 h-2.5" />
                            <span>Em resposta a @{parentComment.author.username}</span>
                          </div>
                        )}

                        {/* Comment Content or Spoiler Shield */}
                        {isSpoilerShielded ? (
                          <div className="my-1.5 p-2 rounded-lg bg-violet-950/40 border border-violet-800/40 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-violet-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-violet-400" />
                              <span>Comentário com spoiler</span>
                            </span>
                            <button
                              onClick={() => toggleRevealSpoiler(c.id)}
                              className="text-[11px] font-medium text-white bg-violet-600/60 hover:bg-violet-600 px-2 py-0.5 rounded transition-colors"
                            >
                              Ver
                            </button>
                          </div>
                        ) : (
                          <div className="text-slate-200 leading-relaxed whitespace-pre-line text-xs break-words">
                            {c.content}
                            {c.isSpoiler && (
                              <button
                                onClick={() => toggleRevealSpoiler(c.id)}
                                className="block mt-1 text-[10px] text-violet-400 hover:text-violet-300"
                              >
                                Ocultar spoiler
                              </button>
                            )}
                          </div>
                        )}

                      </div>

                      {/* Actions under comment */}
                      <div className="flex items-center gap-4 mt-1 px-1 text-[11px] text-slate-400">
                        {/* Like button */}
                        <button
                          onClick={() => handleLikeComment(c.id)}
                          className={`flex items-center gap-1 hover:text-rose-400 transition-colors ${
                            c.isLiked ? 'text-rose-400 font-medium' : ''
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${c.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span className="tabular-nums">{c.likesCount}</span>
                        </button>

                        {/* Reply button */}
                        <button
                          onClick={() => handleStartReply(c)}
                          className="hover:text-indigo-300 transition-colors flex items-center gap-1"
                        >
                          <Reply className="w-3 h-3" />
                          <span>Responder</span>
                        </button>

                        {/* Delete button (author/admin only) */}
                        {isCommentAuthor && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="hover:text-rose-400 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Excluir</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* FIXED BOTTOM COMMENT INPUT BAR */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#090C15] shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {isAuthenticated && user ? (
            <form onSubmit={handleAddComment} className="space-y-2">
              
              {/* Replying banner */}
              {replyTarget && (
                <div className="flex items-center justify-between text-[11px] text-indigo-300 bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-800/40">
                  <span className="truncate">
                    Respondendo a <strong className="text-white">@{replyTarget.author.username}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyTarget(null)}
                    className="text-slate-400 hover:text-white ml-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                
                {/* Authenticated User Real Avatar with fallback */}
                <img
                  src={user.avatarUrl || getDefaultAvatar(user.username)}
                  alt={user.displayName}
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src = getDefaultAvatar(user.username);
                  }}
                  className="w-8 h-8 rounded-full object-cover border border-indigo-500/30 shrink-0"
                  referrerPolicy="no-referrer"
                />

                {/* Input box */}
                <input
                  ref={inputRef}
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder={
                    replyTarget 
                      ? `Responder para @${replyTarget.author.username}...` 
                      : `Comentar como ${user.displayName}...`
                  }
                  enterKeyHint="send"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#141B2D] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />

                {/* Send button with 44x44px mobile touch target */}
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="min-h-[44px] min-w-[44px] p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
                  title="Enviar comentário"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Spoiler tag toggle */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={isSpoiler}
                    onChange={e => setIsSpoiler(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-indigo-600 text-xs"
                  />
                  <span>Aviso de spoiler</span>
                </label>
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  Pressione Enter para enviar
                </span>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-3 p-2">
              <div className="text-xs text-slate-400">
                Participe da conversa com sua conta da comunidade.
              </div>
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                Entrar para Comentar
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
