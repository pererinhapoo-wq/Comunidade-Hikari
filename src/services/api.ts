import { Post, Comment, AppNotification, Badge, Anime, UserProfile } from '../types';

const TOKEN_KEY = 'hikari_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Erro HTTP ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: { email: string; username: string; displayName: string; password: string }) =>
    request<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  login: (payload: { login: string; password: string }) =>
    request<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getCurrentUser: () => request<{ user: UserProfile }>('/api/auth/me'),

  forgotPassword: (email: string) =>
    request<{ message: string; demoToken?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  resetPassword: (payload: { email: string; resetToken: string; newPassword: string }) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Users & Profiles
  getUserProfile: (username: string) =>
    request<{ profile: UserProfile }>(`/api/users/${encodeURIComponent(username)}`),

  updateProfile: (payload: { displayName?: string; bio?: string; avatarUrl?: string; bannerUrl?: string }) =>
    request<{ profile: UserProfile }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  equipPrimaryBadge: (badgeId: string) =>
    request<{ profile: UserProfile }>('/api/users/primary-badge', {
      method: 'PUT',
      body: JSON.stringify({ badgeId })
    }),

  toggleFollow: (userId: string) =>
    request<{ isFollowing: boolean; followersCount: number }>(`/api/users/${userId}/follow`, {
      method: 'POST'
    }),

  toggleBlock: (userId: string) =>
    request<{ isBlocked: boolean }>(`/api/users/${userId}/block`, {
      method: 'POST'
    }),

  // Posts
  getPosts: (params?: {
    category?: string;
    animeId?: string;
    tag?: string;
    search?: string;
    authorId?: string;
    feedType?: 'all' | 'following' | 'saved';
    sort?: 'recent' | 'trending';
  }) => {
    const url = new URL('/api/posts', window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });
    }
    return request<{ posts: Post[] }>(url.pathname + url.search);
  },

  getPost: (id: string) => request<{ post: Post }>(`/api/posts/${id}`),

  createPost: (payload: {
    content: string;
    images?: string[];
    category?: string;
    animeId?: string;
    animeTitle?: string;
    episodeNumber?: number;
    tags?: string[];
    isSpoiler?: boolean;
    spoilerWarning?: string;
    pollQuestion?: string;
    pollOptions?: string[];
  }) =>
    request<{ post: Post }>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updatePost: (id: string, payload: Partial<Post>) =>
    request<{ post: Post }>(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deletePost: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/posts/${id}`, {
      method: 'DELETE'
    }),

  toggleLikePost: (id: string) =>
    request<{ isLiked: boolean; likesCount: number }>(`/api/posts/${id}/like`, {
      method: 'POST'
    }),

  toggleBookmarkPost: (id: string) =>
    request<{ isBookmarked: boolean }>(`/api/posts/${id}/bookmark`, {
      method: 'POST'
    }),

  votePoll: (postId: string, optionId: string) =>
    request<{ poll: Post['poll'] }>(`/api/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId })
    }),

  // Comments
  getComments: (postId: string) =>
    request<{ comments: Comment[] }>(`/api/posts/${postId}/comments`),

  createComment: (postId: string, payload: { content: string; isSpoiler?: boolean; parentCommentId?: string }) =>
    request<{ comment: Comment }>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  deleteComment: (id: string) =>
    request<{ success: boolean }>(`/api/comments/${id}`, {
      method: 'DELETE'
    }),

  toggleLikeComment: (id: string) =>
    request<{ isLiked: boolean; likesCount: number }>(`/api/comments/${id}/like`, {
      method: 'POST'
    }),

  // Badges
  getBadges: () => request<{ badges: Badge[] }>('/api/badges'),

  claimBadge: (badgeId: string) =>
    request<{ success: boolean; badge: Badge; profile: UserProfile }>('/api/badges/claim', {
      method: 'POST',
      body: JSON.stringify({ badgeId })
    }),

  // Notifications
  getNotifications: () =>
    request<{ notifications: AppNotification[]; unreadCount: number }>('/api/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'PUT'
    }),

  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/api/notifications/read-all', {
      method: 'PUT'
    }),

  // Animes
  getAnimes: () => request<{ animes: Anime[] }>('/api/animes'),

  getAnime: (id: string) => request<{ anime: Anime; discussions: Post[] }>(`/api/animes/${id}`),

  // Moderation / Reports
  createReport: (payload: {
    targetType: 'post' | 'comment' | 'user';
    targetId: string;
    reason: string;
    details?: string;
  }) =>
    request<{ success: boolean; message: string }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Image upload
  uploadImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha no upload de imagem');
    }
    return data.urls as string[];
  },

  // Future Hikari Integration Bridge Inspection
  getHikariMemberPreview: (username: string) =>
    request<Record<string, unknown>>(`/api/integrations/hikari/profile/${encodeURIComponent(username)}`)
};
