import React, { useState, useEffect } from 'react';
import { UserProfile, Post, Badge } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BadgeIcon } from '../components/BadgeIcon';
import { PostCard } from '../components/PostCard';
import { BadgeDetailModal } from '../components/BadgeDetailModal';
import { 
  User, 
  Settings, 
  UserPlus, 
  UserCheck, 
  Award, 
  ShieldAlert, 
  MoreVertical, 
  Calendar, 
  FileText, 
  Check, 
  Edit3, 
  X, 
  Loader2,
  Sparkles,
  Camera
} from 'lucide-react';

interface ProfileViewProps {
  username: string;
  onOpenProfile: (username: string) => void;
  onOpenAnime: (animeId: string) => void;
  onOpenImageViewer: (images: string[], initialIndex: number) => void;
  onOpenReport: (targetType: 'user' | 'post' | 'comment', targetId: string) => void;
  allBadges: Badge[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  username,
  onOpenProfile,
  onOpenAnime,
  onOpenImageViewer,
  onOpenReport,
  allBadges
}) => {
  const { user: currentUser, isAuthenticated, openAuthModal, updateProfile, equipBadge } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'badges'>('posts');
  
  // Follow state
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [isFollowLoading, setIsFollowLoading] = useState<boolean>(false);

  // Edit Profile Modal
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [editAvatar, setEditAvatar] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Badge inspector modal
  const [inspectBadge, setInspectBadge] = useState<Badge | null>(null);

  const cleanUsername = username.replace(/^@/, '');
  const isOwnProfile = currentUser && currentUser.username.toLowerCase() === cleanUsername.toLowerCase();

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.getUserProfile(cleanUsername);
      setProfile(res.profile);
      setIsFollowing(!!res.profile.isFollowing);
      setFollowersCount(res.profile.followersCount);

      // Load user posts
      const postsRes = await api.getPosts({ authorId: res.profile.id });
      setPosts(postsRes.posts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [cleanUsername]);

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!profile) return;

    setIsFollowLoading(true);
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    setFollowersCount(prev => (nextFollowing ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await api.toggleFollow(profile.id);
      setIsFollowing(res.isFollowing);
      setFollowersCount(res.followersCount);
    } catch {
      setIsFollowing(!nextFollowing);
      setFollowersCount(prev => (!nextFollowing ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleOpenEdit = () => {
    if (!profile) return;
    setEditName(profile.displayName);
    setEditBio(profile.bio || '');
    setEditAvatar(profile.avatarUrl);
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        displayName: editName,
        bio: editBio,
        avatarUrl: editAvatar
      });
      setIsEditing(false);
      await loadProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEquipBadge = async (badgeId: string) => {
    try {
      await equipBadge(badgeId);
      await loadProfile();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Carregando perfil do membro...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-3">
        <User className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-base font-bold text-white">Membro não encontrado</h2>
        <p className="text-xs text-slate-400">
          O membro @{cleanUsername} não existe ou alterou suas credenciais públicas.
        </p>
      </div>
    );
  }

  const memberBadgesList = (profile.badges || []).map(b => {
    const fullBadge = allBadges.find(x => x.id === b.badgeId);
    return {
      ...fullBadge,
      ...b
    } as Badge & { acquiredAt: string; reason: string };
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* PROFILE HEADER CARD */}
      <div className="relative rounded-3xl overflow-hidden bg-[#0E1322] border border-white/10 shadow-2xl">
        
        {/* Banner */}
        <div className="h-36 sm:h-48 relative overflow-hidden bg-slate-900">
          <img
            src={profile.bannerUrl || "/src/assets/images/hikari_hero_banner_1792424735133.jpg"}
            alt="Banner de perfil"
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E1322] via-transparent to-transparent" />
        </div>

        {/* Profile Details Container */}
        <div className="px-6 pb-6 pt-0 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            
            {/* Avatar & Identifiers */}
            <div className="flex items-end gap-4">
              <div className="relative group">
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-24 sm:w-28 h-24 sm:h-28 rounded-2xl object-cover border-4 border-[#0E1322] shadow-xl bg-slate-900"
                  referrerPolicy="no-referrer"
                />
                {isOwnProfile && (
                  <button
                    onClick={handleOpenEdit}
                    className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    title="Alterar avatar"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-1 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white font-display">
                    {profile.displayName}
                  </h1>

                  {/* Equipped Primary Badge */}
                  {profile.primaryBadge && (
                    <BadgeIcon 
                      badge={profile.primaryBadge} 
                      size="md" 
                      interactive 
                      onClick={() => setInspectBadge(profile.primaryBadge!)} 
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-mono text-indigo-400">@{profile.username}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{profile.role}</span>
                </div>
              </div>
            </div>

            {/* Actions (Follow or Edit) */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isOwnProfile ? (
                <button
                  onClick={handleOpenEdit}
                  className="px-4 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Perfil</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleToggleFollow}
                    disabled={isFollowLoading}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                      isFollowing
                        ? 'bg-white/10 hover:bg-rose-950/40 hover:text-rose-300 text-slate-200 border border-white/10'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Seguindo</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Seguir</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onOpenReport('user', profile.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-white/5 transition-colors"
                    title="Denunciar perfil"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mb-4">
              {profile.bio}
            </p>
          )}

          {/* Metrics bar unboxed */}
          <div className="flex items-center gap-6 text-xs text-slate-400 border-t border-white/5 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tabular-nums">{followersCount}</span>
              <span>seguidores</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tabular-nums">{profile.followingCount}</span>
              <span>seguindo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tabular-nums">{posts.length}</span>
              <span>publicações</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-indigo-400 tabular-nums">{memberBadgesList.length}</span>
              <span>emblemas</span>
            </div>
          </div>

        </div>

      </div>

      {/* TABS SEGMENTED CONTROL */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors flex items-center gap-2 ${
            activeTab === 'posts'
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Publicações ({posts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors flex items-center gap-2 ${
            activeTab === 'badges'
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Coleção de Emblemas ({memberBadgesList.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: POSTS */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#0E1322] border border-white/5 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">
                Nenhuma publicação feita ainda
              </h3>
              <p className="text-xs text-slate-500">
                {isOwnProfile ? 'Compartilhe seus primeiros pensamentos ou fanarts com a comunidade!' : 'Este membro ainda não publicou discussões.'}
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
                onPostDeleted={postId => setPosts(prev => prev.filter(p => p.id !== postId))}
              />
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: BADGES COLLECTION */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Emblemas conquistados pelo membro</span>
            {isOwnProfile && (
              <span className="text-indigo-400 font-medium">
                Clique em qualquer emblema para equipá-lo como principal
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {memberBadgesList.map(badge => {
              const isEquipped = profile.primaryBadgeId === badge.id;

              return (
                <div
                  key={badge.id}
                  onClick={() => setInspectBadge(badge)}
                  className={`p-4 rounded-xl bg-[#0E1322] border transition-all cursor-pointer flex items-start gap-3 relative ${
                    isEquipped
                      ? 'border-indigo-500/80 bg-indigo-950/20 shadow-md shadow-indigo-950/40'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <BadgeIcon badge={badge} size="lg" />

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs text-white">
                        {badge.name}
                      </h4>
                      {isEquipped && (
                        <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-0.5">
                          <Check className="w-3 h-3" />
                          <span>Equipado</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {badge.description}
                    </p>

                    <div className="text-[10px] text-slate-500 pt-1">
                      {badge.reason}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0E1322] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-bold text-base text-white mb-4">
              Editar Perfil Público
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  maxLength={40}
                  className="w-full bg-[#141B2D] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Biografia
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  maxLength={300}
                  placeholder="Compartilhe seus animes favoritos..."
                  className="w-full bg-[#141B2D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Avatar Presets Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Escolha um Avatar Anime
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`
                  ].map((preset, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setEditAvatar(preset)}
                      className={`relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        editAvatar === preset ? 'border-indigo-500 scale-105' : 'border-white/10'
                      }`}
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Badge Modal */}
      <BadgeDetailModal
        badge={inspectBadge}
        isOpen={!!inspectBadge}
        onClose={() => setInspectBadge(null)}
        onBadgeEquipped={handleEquipBadge}
      />

    </div>
  );
};
