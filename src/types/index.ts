export type BadgeRarity = 'comum' | 'raro' | 'epico' | 'lendario';
export type BadgeCategory = 'sazonal' | 'evento' | 'contribuicao' | 'apoio' | 'lendaria';

export interface Badge {
  id: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
  category: BadgeCategory;
  icon: string;
  glowColor: string;
  condition: string;
  season?: string;
  imageUrl?: string;
}

export interface EarnedBadge {
  badgeId: string;
  acquiredAt: string;
  reason: string;
}

export interface UserProfile {
  id: string;
  username: string; // @nick
  displayName: string;
  email?: string;
  bio: string;
  avatarUrl: string;
  bannerUrl?: string;
  primaryBadgeId?: string;
  primaryBadge?: Badge;
  badges: EarnedBadge[];
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  role: 'member' | 'moderator' | 'admin';
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
}

export type PostCategory = 
  | 'geral' 
  | 'episodio' 
  | 'teoria' 
  | 'debate' 
  | 'galeria' 
  | 'recomendacao' 
  | 'enquete';

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // userIds
}

export interface Poll {
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId?: string;
}

export interface Post {
  id: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    primaryBadge?: Badge;
    role: 'member' | 'moderator' | 'admin';
  };
  content: string;
  images: string[];
  animeId?: string;
  animeTitle?: string;
  episodeNumber?: number;
  category: PostCategory;
  tags: string[];
  isSpoiler: boolean;
  spoilerWarning?: string;
  likes: string[]; // userIds
  likesCount: number;
  isLiked?: boolean;
  bookmarks: string[]; // userIds
  isBookmarked?: boolean;
  commentsCount: number;
  poll?: Poll;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    primaryBadge?: Badge;
  };
  content: string;
  parentCommentId?: string;
  likes: string[];
  likesCount: number;
  isLiked?: boolean;
  isSpoiler: boolean;
  createdAt: string;
}

export type NotificationType = 'like' | 'comment' | 'reply' | 'follow' | 'badge' | 'mention';

export interface AppNotification {
  id: string;
  recipientId: string;
  senderId?: string;
  sender?: {
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  type: NotificationType;
  title: string;
  message: string;
  postId?: string;
  badgeId?: string;
  badge?: Badge;
  read: boolean;
  createdAt: string;
}

export interface Anime {
  id: string;
  title: string;
  japaneseTitle: string;
  synopsis: string;
  coverUrl: string;
  bannerUrl: string;
  episodesCount: number;
  genres: string[];
  score: string;
  discussionsCount: number;
  year: number;
  status: 'Em exibição' | 'Completo';
}

export interface ReportItem {
  id: string;
  reporterId: string;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  reason: 'spoiler_sem_aviso' | 'ofensa_odio' | 'conteudo_inapropriado' | 'spam' | 'outro';
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}
