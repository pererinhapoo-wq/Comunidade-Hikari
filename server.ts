import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { db, DBUser } from './server/db.ts';
import { Post, Comment, AppNotification, ReportItem } from './src/types/index.ts';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'hikari-community-secret-key-2026';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads folder exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded images statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer storage configuration with strict mime validation
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    const uniqueName = `hikari_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${cleanExt}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato inválido. Apenas JPG, PNG, WEBP ou GIF são aceitos.'));
    }
  }
});

// Auth Helper Middleware
export interface AuthRequest extends Request {
  user?: DBUser;
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Autenticação necessária' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = db.findUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado ou sessão expirada' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(403).json({ error: 'Sessão inválida ou expirada' });
  }
}

function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = db.findUserById(decoded.userId);
      if (user) req.user = user;
    } catch {
      // ignore
    }
  }
  next();
}

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, username, displayName, password } = req.body;

  if (!email || !username || !displayName || !password) {
    res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    return;
  }

  // Validate nick: 3-20 chars, letters, numbers, underscores
  const cleanNick = username.trim().toLowerCase().replace(/^@/, '');
  const nickRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!nickRegex.test(cleanNick)) {
    res.status(400).json({ error: 'O @nick deve conter de 3 a 20 caracteres (letras, números ou sublinhados).' });
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    res.status(400).json({ error: 'Formato de e-mail inválido.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres.' });
    return;
  }

  // Check unique username
  if (db.findUserByUsername(cleanNick)) {
    res.status(409).json({ error: `O @nick "${cleanNick}" já está em uso por outro membro.` });
    return;
  }

  // Check unique email
  if (db.findUserByEmail(email)) {
    res.status(409).json({ error: 'Este e-mail já está cadastrado na comunidade.' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanNick}`;

  const newUser: DBUser = {
    id: userId,
    email: email.trim().toLowerCase(),
    username: cleanNick,
    displayName: displayName.trim(),
    passwordHash,
    bio: 'Novo membro da Comunidade Hikari.',
    avatarUrl: defaultAvatar,
    bannerUrl: '/src/assets/images/hikari_hero_banner_1792424735133.jpg',
    primaryBadgeId: 'badge_pioneiro_hikari',
    badges: [
      {
        badgeId: 'badge_pioneiro_hikari',
        acquiredAt: new Date().toISOString(),
        reason: 'Membro Pioneiro da Comunidade'
      }
    ],
    followers: [],
    following: ['usr_admin'], // follows official curatorship by default
    blockedUsers: [],
    role: 'member',
    createdAt: new Date().toISOString()
  };

  db.createUser(newUser);

  // Grant auto-follow notification to admin
  db.createNotification({
    id: `notif_${Date.now()}`,
    recipientId: 'usr_admin',
    senderId: newUser.id,
    sender: {
      username: newUser.username,
      displayName: newUser.displayName,
      avatarUrl: newUser.avatarUrl
    },
    type: 'follow',
    title: 'Novo Membro',
    message: `${newUser.displayName} (@${newUser.username}) ingressou na Comunidade Hikari!`,
    read: false,
    createdAt: new Date().toISOString()
  });

  const token = generateToken(newUser.id);
  res.status(201).json({
    token,
    user: db.toPublicProfile(newUser, newUser.id)
  });
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { login, password } = req.body;

  if (!login || !password) {
    res.status(400).json({ error: 'Informe e-mail ou @nick e a senha.' });
    return;
  }

  const clean = login.trim();
  const user = clean.includes('@')
    ? db.findUserByEmail(clean)
    : db.findUserByUsername(clean);

  if (!user) {
    res.status(401).json({ error: 'Credenciais incorretas. Verifique seu @nick ou e-mail.' });
    return;
  }

  const matches = bcrypt.compareSync(password, user.passwordHash);
  if (!matches) {
    res.status(401).json({ error: 'Senha incorreta. Tente novamente.' });
    return;
  }

  const token = generateToken(user.id);
  res.json({
    token,
    user: db.toPublicProfile(user, user.id)
  });
});

// Current User Me
app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }
  res.json({ user: db.toPublicProfile(req.user, req.user.id) });
});

// Account recovery simulation / link
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Informe o e-mail cadastrado.' });
    return;
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    // For security, do not expose whether email exists
    res.json({ message: 'Se o e-mail estiver cadastrado, as instruções de redefinição foram processadas.' });
    return;
  }

  const resetToken = Math.random().toString(36).substring(2, 10).toUpperCase();
  user.resetToken = resetToken;
  user.resetTokenExpires = Date.now() + 1000 * 60 * 30; // 30 minutes
  db.save();

  res.json({
    message: 'Código de recuperação gerado com sucesso.',
    demoToken: resetToken // provided for smooth local demo testing
  });
});

// Reset password with token
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, resetToken, newPassword } = req.body;
  if (!email || !resetToken || !newPassword) {
    res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    return;
  }

  const user = db.findUserByEmail(email);
  if (!user || user.resetToken !== resetToken.trim() || !user.resetTokenExpires || user.resetTokenExpires < Date.now()) {
    res.status(400).json({ error: 'Código de recuperação inválido ou expirado.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
    return;
  }

  user.passwordHash = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  db.save();

  res.json({ message: 'Senha atualizada com sucesso. Você já pode fazer login.' });
});

// ==========================================
// 2. USER & PROFILE ROUTES
// ==========================================

// Get public profile by @nick
app.get('/api/users/:username', optionalAuth, (req: AuthRequest, res: Response) => {
  const user = db.findUserByUsername(req.params.username);
  if (!user) {
    res.status(404).json({ error: 'Membro não encontrado' });
    return;
  }
  res.json({ profile: db.toPublicProfile(user, req.user?.id) });
});

// Update Profile
app.put('/api/users/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { displayName, bio, avatarUrl, bannerUrl } = req.body;

  const updates: Partial<DBUser> = {};
  if (displayName && typeof displayName === 'string' && displayName.trim().length <= 40) {
    updates.displayName = displayName.trim();
  }
  if (typeof bio === 'string' && bio.length <= 300) {
    updates.bio = bio.trim();
  }
  if (avatarUrl && typeof avatarUrl === 'string') {
    updates.avatarUrl = avatarUrl;
  }
  if (bannerUrl && typeof bannerUrl === 'string') {
    updates.bannerUrl = bannerUrl;
  }

  const updated = db.updateUser(req.user.id, updates);
  if (!updated) {
    res.status(500).json({ error: 'Erro ao salvar perfil' });
    return;
  }

  res.json({ profile: db.toPublicProfile(updated, req.user.id) });
});

// Equip primary badge
app.put('/api/users/primary-badge', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { badgeId } = req.body;

  // Validate member owns this badge
  const userBadges = req.user.badges || [];
  const hasBadge = userBadges.some(b => b.badgeId === badgeId);

  if (!hasBadge) {
    res.status(403).json({ error: 'Você só pode equipar emblemas que já conquistou.' });
    return;
  }

  const updated = db.updateUser(req.user.id, { primaryBadgeId: badgeId });
  res.json({ profile: db.toPublicProfile(updated!, req.user.id) });
});

// Follow / Unfollow member
app.post('/api/users/:id/follow', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const currentUserId = req.user.id;
  const targetId = req.params.id;

  if (targetId === currentUserId) {
    res.status(400).json({ error: 'Não é possível seguir a si mesmo.' });
    return;
  }

  const target = db.findUserById(targetId);
  if (!target) {
    res.status(404).json({ error: 'Membro não encontrado' });
    return;
  }

  const isFollowing = (target.followers || []).includes(currentUserId);
  if (isFollowing) {
    target.followers = (target.followers || []).filter(id => id !== currentUserId);
    req.user.following = (req.user.following || []).filter(id => id !== targetId);
  } else {
    if (!target.followers) target.followers = [];
    if (!req.user.following) req.user.following = [];
    target.followers.push(currentUserId);
    req.user.following.push(targetId);

    // Create notification
    db.createNotification({
      id: `notif_${Date.now()}`,
      recipientId: target.id,
      senderId: req.user.id,
      sender: {
        username: req.user.username,
        displayName: req.user.displayName,
        avatarUrl: req.user.avatarUrl
      },
      type: 'follow',
      title: 'Novo Seguidor',
      message: `${req.user.displayName} começou a seguir você!`,
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  db.save();
  res.json({
    isFollowing: !isFollowing,
    followersCount: target.followers.length
  });
});

// Block / Unblock member
app.post('/api/users/:id/block', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const targetId = req.params.id;

  if (targetId === req.user.id) {
    res.status(400).json({ error: 'Ação inválida.' });
    return;
  }

  if (!req.user.blockedUsers) req.user.blockedUsers = [];
  const isBlocked = req.user.blockedUsers.includes(targetId);

  if (isBlocked) {
    req.user.blockedUsers = req.user.blockedUsers.filter(id => id !== targetId);
  } else {
    req.user.blockedUsers.push(targetId);
  }

  db.save();
  res.json({ isBlocked: !isBlocked });
});

// ==========================================
// 3. POSTS & DISCUSSIONS ROUTES
// ==========================================

// Get feed / list posts
app.get('/api/posts', optionalAuth, (req: AuthRequest, res: Response) => {
  const { category, animeId, tag, search, authorId, feedType, sort } = req.query;

  const currentUserId = req.user?.id;
  const posts = db.getPosts({
    category: category as string,
    animeId: animeId as string,
    tag: tag as string,
    search: search as string,
    authorId: authorId as string,
    followingOnlyForUserId: feedType === 'following' ? currentUserId : undefined,
    savedOnlyForUserId: feedType === 'saved' ? currentUserId : undefined,
    sort: (sort === 'trending' ? 'trending' : 'recent') as 'recent' | 'trending'
  }, currentUserId);

  res.json({ posts });
});

// Get single post
app.get('/api/posts/:id', optionalAuth, (req: AuthRequest, res: Response) => {
  const post = db.findPostById(req.params.id, req.user?.id);
  if (!post) {
    res.status(404).json({ error: 'Publicação não encontrada.' });
    return;
  }
  res.json({ post });
});

// Create post
app.post('/api/posts', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;

  const {
    content,
    images = [],
    category = 'geral',
    animeId,
    animeTitle,
    episodeNumber,
    tags = [],
    isSpoiler = false,
    spoilerWarning,
    pollQuestion,
    pollOptions = []
  } = req.body;

  if ((!content || !content.trim()) && (!images || images.length === 0)) {
    res.status(400).json({ error: 'A publicação precisa conter texto ou pelo menos uma imagem.' });
    return;
  }

  if (images && images.length > 5) {
    res.status(400).json({ error: 'Limite máximo de 5 imagens por publicação.' });
    return;
  }

  let pollData = undefined;
  if (pollQuestion && pollOptions.length >= 2) {
    pollData = {
      question: pollQuestion.trim(),
      options: pollOptions.map((optText: string, i: number) => ({
        id: `opt_${i + 1}`,
        text: optText.trim(),
        votes: []
      })),
      totalVotes: 0
    };
  }

  const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const authorBadge = req.user.primaryBadgeId ? db.findBadgeById(req.user.primaryBadgeId) : undefined;

  const newPost: Post = {
    id: postId,
    authorId: req.user.id,
    author: {
      id: req.user.id,
      username: req.user.username,
      displayName: req.user.displayName,
      avatarUrl: req.user.avatarUrl,
      primaryBadge: authorBadge,
      role: req.user.role
    },
    content: (content || '').trim(),
    images: Array.isArray(images) ? images : [],
    animeId: animeId || undefined,
    animeTitle: animeTitle || undefined,
    episodeNumber: episodeNumber ? Number(episodeNumber) : undefined,
    category: category,
    tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
    isSpoiler: Boolean(isSpoiler),
    spoilerWarning: isSpoiler ? (spoilerWarning || 'Contém revelações do enredo / spoiler') : undefined,
    likes: [],
    likesCount: 0,
    bookmarks: [],
    commentsCount: 0,
    poll: pollData,
    createdAt: new Date().toISOString()
  };

  db.createPost(newPost);

  // Check if member unlocked badge (e.g. 1st post)
  const userPosts = db.getPosts({ authorId: req.user.id });
  if (userPosts.length >= 3 && !req.user.badges?.some(b => b.badgeId === 'badge_critico_aclamado')) {
    db.awardBadge(req.user.id, 'badge_critico_aclamado', 'Publicou 3 ou mais discussões na Comunidade Hikari');
  }

  res.status(201).json({ post: newPost });
});

// Update post (Author only)
app.put('/api/posts/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const post = db.findPostById(req.params.id);

  if (!post) {
    res.status(404).json({ error: 'Publicação não encontrada' });
    return;
  }

  if (post.authorId !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Você não tem permissão para editar esta publicação.' });
    return;
  }

  const { content, tags, isSpoiler, spoilerWarning } = req.body;
  const updates: Partial<Post> = {
    updatedAt: new Date().toISOString()
  };

  if (content !== undefined) updates.content = content.trim();
  if (tags !== undefined) updates.tags = tags;
  if (isSpoiler !== undefined) updates.isSpoiler = Boolean(isSpoiler);
  if (spoilerWarning !== undefined) updates.spoilerWarning = spoilerWarning;

  const updated = db.updatePost(req.params.id, updates);
  res.json({ post: updated });
});

// Delete post (Author or Admin only)
app.delete('/api/posts/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const post = db.findPostById(req.params.id);

  if (!post) {
    res.status(404).json({ error: 'Publicação não encontrada' });
    return;
  }

  if (post.authorId !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Sem permissão para excluir esta publicação.' });
    return;
  }

  db.deletePost(req.params.id);
  res.json({ success: true, message: 'Publicação excluída com sucesso.' });
});

// Like / Unlike post
app.post('/api/posts/:id/like', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const currentUserId = req.user.id;
  const currentUser = req.user;
  const post = db.findPostById(req.params.id);

  if (!post) {
    res.status(404).json({ error: 'Publicação não encontrada' });
    return;
  }

  const hasLiked = post.likes.includes(currentUserId);
  if (hasLiked) {
    post.likes = post.likes.filter(id => id !== currentUserId);
  } else {
    post.likes.push(currentUserId);

    // Notify author if not self
    if (post.authorId !== currentUserId) {
      db.createNotification({
        id: `notif_${Date.now()}`,
        recipientId: post.authorId,
        senderId: currentUserId,
        sender: {
          username: currentUser.username,
          displayName: currentUser.displayName,
          avatarUrl: currentUser.avatarUrl
        },
        type: 'like',
        title: 'Curtida recebida',
        message: `${currentUser.displayName} curtiu sua publicação.`,
        postId: post.id,
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  }

  db.save();
  res.json({
    isLiked: !hasLiked,
    likesCount: post.likes.length
  });
});

// Bookmark / Unbookmark post
app.post('/api/posts/:id/bookmark', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const currentUserId = req.user.id;
  const post = db.findPostById(req.params.id);

  if (!post) {
    res.status(404).json({ error: 'Publicação não encontrada' });
    return;
  }

  const isBookmarked = post.bookmarks.includes(currentUserId);
  if (isBookmarked) {
    post.bookmarks = post.bookmarks.filter(id => id !== currentUserId);
  } else {
    post.bookmarks.push(currentUserId);
  }

  db.save();
  res.json({ isBookmarked: !isBookmarked });
});

// Poll voting
app.post('/api/posts/:id/vote', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { optionId } = req.body;
  const post = db.findPostById(req.params.id);

  if (!post || !post.poll) {
    res.status(400).json({ error: 'Enquete não disponível nesta publicação.' });
    return;
  }

  const option = post.poll.options.find(o => o.id === optionId);
  if (!option) {
    res.status(400).json({ error: 'Opção inválida.' });
    return;
  }

  // Remove existing vote by user in any option
  post.poll.options.forEach(opt => {
    opt.votes = opt.votes.filter(id => id !== req.user!.id);
  });

  // Add new vote
  option.votes.push(req.user.id);
  post.poll.totalVotes = post.poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);

  db.save();
  res.json({
    poll: {
      ...post.poll,
      userVotedOptionId: optionId
    }
  });
});

// ==========================================
// 4. COMMENTS ROUTES
// ==========================================

// Get comments for post
app.get('/api/posts/:postId/comments', optionalAuth, (req: AuthRequest, res: Response) => {
  const comments = db.getComments(req.params.postId, req.user?.id);
  res.json({ comments });
});

// Add comment
app.post('/api/posts/:postId/comments', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { content, isSpoiler = false, parentCommentId } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({ error: 'O comentário não pode ficar vazio.' });
    return;
  }

  const post = db.findPostById(req.params.postId);
  if (!post) {
    res.status(404).json({ error: 'Publicação não encontrada.' });
    return;
  }

  const commentId = `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const authorBadge = req.user.primaryBadgeId ? db.findBadgeById(req.user.primaryBadgeId) : undefined;

  const newComment: Comment = {
    id: commentId,
    postId: post.id,
    authorId: req.user.id,
    author: {
      id: req.user.id,
      username: req.user.username,
      displayName: req.user.displayName,
      avatarUrl: req.user.avatarUrl,
      primaryBadge: authorBadge
    },
    content: content.trim(),
    parentCommentId: parentCommentId || undefined,
    likes: [],
    likesCount: 0,
    isSpoiler: Boolean(isSpoiler),
    createdAt: new Date().toISOString()
  };

  db.createComment(newComment);

  // Notify post author
  if (post.authorId !== req.user.id) {
    db.createNotification({
      id: `notif_${Date.now()}`,
      recipientId: post.authorId,
      senderId: req.user.id,
      sender: {
        username: req.user.username,
        displayName: req.user.displayName,
        avatarUrl: req.user.avatarUrl
      },
      type: 'comment',
      title: 'Novo comentário',
      message: `${req.user.displayName} comentou na sua publicação: "${content.slice(0, 50)}..."`,
      postId: post.id,
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  res.status(201).json({ comment: newComment });
});

// Delete comment
app.delete('/api/comments/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const comment = db.findCommentById(req.params.id);

  if (!comment) {
    res.status(404).json({ error: 'Comentário não encontrado' });
    return;
  }

  if (comment.authorId !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Sem autorização para excluir este comentário.' });
    return;
  }

  db.deleteComment(req.params.id);
  res.json({ success: true });
});

// Like comment
app.post('/api/comments/:id/like', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const currentUserId = req.user.id;
  const comment = db.findCommentById(req.params.id);

  if (!comment) {
    res.status(404).json({ error: 'Comentário não encontrado' });
    return;
  }

  const hasLiked = comment.likes.includes(currentUserId);
  if (hasLiked) {
    comment.likes = comment.likes.filter(id => id !== currentUserId);
  } else {
    comment.likes.push(currentUserId);
  }

  db.save();
  res.json({
    isLiked: !hasLiked,
    likesCount: comment.likes.length
  });
});

// ==========================================
// 5. BADGES & COLLECTIBLES ROUTES
// ==========================================

// Get all badges catalog
app.get('/api/badges', (_req: Request, res: Response) => {
  res.json({ badges: db.getBadges() });
});

// Claim / Test unlock badge
app.post('/api/badges/claim', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { badgeId } = req.body;

  const success = db.awardBadge(req.user.id, badgeId, 'Conquista ativada na Comunidade Hikari');
  if (!success) {
    res.status(400).json({ error: 'Emblema já conquistado ou requisitos não cumpridos.' });
    return;
  }

  const updatedUser = db.findUserById(req.user.id);
  res.json({
    success: true,
    badge: db.findBadgeById(badgeId),
    profile: db.toPublicProfile(updatedUser!, req.user.id)
  });
});

// ==========================================
// 6. NOTIFICATIONS ROUTES
// ==========================================

// Get user notifications
app.get('/api/notifications', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const notifications = db.getNotifications(req.user.id);
  const unreadCount = notifications.filter(n => !n.read).length;
  res.json({ notifications, unreadCount });
});

// Mark one read
app.put('/api/notifications/:id/read', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  db.markNotificationAsRead(req.params.id, req.user.id);
  res.json({ success: true });
});

// Mark all read
app.put('/api/notifications/read-all', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  db.markAllNotificationsAsRead(req.user.id);
  res.json({ success: true });
});

// ==========================================
// 7. ANIMES & EPISODES CATALOG
// ==========================================

app.get('/api/animes', (_req: Request, res: Response) => {
  res.json({ animes: db.getAnimes() });
});

app.get('/api/animes/:id', (req: Request, res: Response) => {
  const anime = db.findAnimeById(req.params.id);
  if (!anime) {
    res.status(404).json({ error: 'Anime não encontrado' });
    return;
  }
  const discussions = db.getPosts({ animeId: anime.id });
  res.json({ anime, discussions });
});

// ==========================================
// 8. MODERATION & REPORTS
// ==========================================

app.post('/api/reports', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { targetType, targetId, reason, details } = req.body;

  if (!targetType || !targetId || !reason) {
    res.status(400).json({ error: 'Dados da denúncia incompletos.' });
    return;
  }

  const newReport: ReportItem = {
    id: `rep_${Date.now()}`,
    reporterId: req.user.id,
    targetType,
    targetId,
    reason,
    details: (details || '').trim(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.createReport(newReport);
  res.status(201).json({ success: true, message: 'Denúncia recebida para análise da moderação Hikari.' });
});

// ==========================================
// 9. FILE UPLOAD ROUTE
// ==========================================

app.post('/api/upload', authenticateToken, upload.array('images', 5), (req: AuthRequest, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    return;
  }

  const urls = files.map(file => `/uploads/${file.filename}`);
  res.json({ urls });
});

// ==========================================
// 10. FUTURE HIKARI INTEGRATION BRIDGE API
// ==========================================
// Prepared architectural schema for future Hikari episode comments integration
app.get('/api/integrations/hikari/profile/:username', (req: Request, res: Response) => {
  const user = db.findUserByUsername(req.params.username);
  if (!user) {
    res.status(404).json({
      error: 'HikariMemberNotFound',
      message: 'Membro não cadastrado na Comunidade Hikari'
    });
    return;
  }

  const publicProfile = db.toPublicProfile(user);
  res.json({
    hikariIntegrationVersion: '1.0.0',
    memberId: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    primaryBadge: publicProfile.primaryBadge,
    badgesCount: user.badges.length,
    communityProfileUrl: `/perfil/${user.username}`,
    isVerifiedCommunityMember: true
  });
});

// ==========================================
// DEV / PROD SERVER BOOTSTRAP
// ==========================================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hikari Server] Running on http://0.0.0.0:${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  });
}

startServer().catch(err => {
  console.error('[Hikari Server] Fatal startup error:', err);
});
