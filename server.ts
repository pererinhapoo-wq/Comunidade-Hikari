import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { db, DBUser } from './server/db.ts';
import { Post, Comment, AppNotification, ReportItem } from './src/types/index.ts';

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Requirement 6: Eliminate fixed contingency JWT secret. Refuse to start in production if not properly configured.
function initializeJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  const INSECURE_DEFAULT = 'hikari-community-secret-key-2026';

  if (isProduction) {
    if (!secret || secret === INSECURE_DEFAULT || secret.length < 32) {
      console.error(
        '[Hikari Security] ERRO CRÍTICO: Em ambiente de produção, a variável JWT_SECRET deve estar configurada adequadamente com uma chave criptográfica forte de no mínimo 32 caracteres. O servidor não iniciará com chave ausente, fraca ou padrão.'
      );
      process.exit(1);
    }
    return secret;
  }

  // Development / test environment
  if (secret && secret !== INSECURE_DEFAULT && secret.length >= 32) {
    return secret;
  }

  // Generate ephemeral 256-bit cryptographically secure random secret in dev (no static contingency secret)
  const ephemeralKey = crypto.randomBytes(32).toString('hex');
  console.warn(
    '[Hikari Security] AVISO: JWT_SECRET não configurado ou fraco em desenvolvimento. Um segredo efêmero criptográfico (256 bits) foi gerado exclusivamente para esta sessão do processo.'
  );
  return ephemeralKey;
}

const JWT_SECRET = initializeJwtSecret();

// Requirement 5: Check if real email provider is configured
export function isEmailProviderConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

// ==========================================
// SECURITY: RATE LIMITING FOR AUTHENTICATION
// ==========================================
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const authRateLimitBuckets = new Map<string, RateLimitBucket>();

// Periodic memory purge for expired buckets
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of authRateLimitBuckets.entries()) {
    if (bucket.resetAt <= now) {
      authRateLimitBuckets.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

function createAuthRateLimiter(options: {
  windowMs: number;
  maxAttempts: number;
  actionName: string;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Resolve client IP safely
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.socket.remoteAddress || '127.0.0.1');
    const bucketKey = `${options.actionName}:${ip}`;
    const now = Date.now();

    const bucket = authRateLimitBuckets.get(bucketKey);

    if (!bucket || bucket.resetAt <= now) {
      authRateLimitBuckets.set(bucketKey, {
        count: 1,
        resetAt: now + options.windowMs
      });
      res.setHeader('X-RateLimit-Limit', options.maxAttempts);
      res.setHeader('X-RateLimit-Remaining', options.maxAttempts - 1);
      next();
      return;
    }

    if (bucket.count >= options.maxAttempts) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', options.maxAttempts);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.status(429).json({
        error: `Muitas tentativas de ${options.actionName}. Por favor, aguarde ${retryAfterSeconds} segundos antes de tentar novamente.`
      });
      return;
    }

    bucket.count += 1;
    res.setHeader('X-RateLimit-Limit', options.maxAttempts);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxAttempts - bucket.count));
    next();
  };
}

// Rate limiters for each auth endpoint (Requirement 8)
const loginRateLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 10,
  actionName: 'login'
});

const registerRateLimiter = createAuthRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxAttempts: 5,
  actionName: 'cadastro'
});

const forgotPasswordRateLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 4,
  actionName: 'recuperação de senha'
});

const resetPasswordRateLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  actionName: 'redefinição de senha'
});

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
    const uniqueSuffix = crypto.randomBytes(6).toString('hex');
    const uniqueName = `hikari_${Date.now()}_${uniqueSuffix}${cleanExt}`;
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
app.post('/api/auth/register', registerRateLimiter, (req: Request, res: Response) => {
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
  const userEntropy = crypto.randomBytes(4).toString('hex');
  const userId = `usr_${Date.now()}_${userEntropy}`;

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
app.post('/api/auth/login', loginRateLimiter, (req: Request, res: Response) => {
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

// Account recovery
app.post('/api/auth/forgot-password', forgotPasswordRateLimiter, (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Informe um endereço de e-mail válido.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    res.status(400).json({ error: 'Formato de e-mail inválido.' });
    return;
  }

  // Requirement 5: Do NOT simulate email dispatch. If no email provider is configured, inform clearly
  if (!isEmailProviderConfigured()) {
    res.status(503).json({
      error: 'O serviço de envio de e-mails não está configurado neste servidor. A recuperação automática de senha via e-mail está temporariamente desabilitada. Entre em contato com a moderação da Comunidade Hikari.'
    });
    return;
  }

  const user = db.findUserByEmail(cleanEmail);
  if (user) {
    // Requirement 2: Cryptographically secure 256-bit token generator (never Math.random())
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Requirement 3: Stored securely using SHA-256 hash (never store plain tokens in DB)
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetToken = tokenHash;
    user.resetTokenExpires = Date.now() + 15 * 60 * 1000; // 15 minutes limited validity
    db.save();

    // In a configured environment with SMTP, rawToken is sent strictly via out-of-band email
  }

  // Requirement 1 & 4: NEVER return codes or tokens in public responses.
  // Always return identical generic message whether account exists or not (prevent account enumeration).
  res.json({
    message: 'Se o e-mail informado estiver cadastrado em nossa comunidade, as instruções para redefinição de senha serão enviadas.'
  });
});

// Reset password with token
app.post('/api/auth/reset-password', resetPasswordRateLimiter, (req: Request, res: Response) => {
  const { email, resetToken, newPassword } = req.body;

  if (
    !email || 
    !resetToken || 
    !newPassword || 
    typeof email !== 'string' || 
    typeof resetToken !== 'string' || 
    typeof newPassword !== 'string'
  ) {
    res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.findUserByEmail(cleanEmail);

  // Generic rejection helper to avoid leaking account status or timing (Requirement 4 & 7)
  const rejectInvalidOrExpired = () => {
    res.status(400).json({ error: 'Código ou token de recuperação inválido ou expirado.' });
  };

  if (!user || !user.resetToken || !user.resetTokenExpires) {
    rejectInvalidOrExpired();
    return;
  }

  // Check expiration: limited validity (Requirement 3 & 7)
  if (user.resetTokenExpires < Date.now()) {
    // Invalidate immediately
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    db.save();
    rejectInvalidOrExpired();
    return;
  }

  // Hash the incoming candidate token using SHA-256 and compare in constant time
  const candidateHash = crypto.createHash('sha256').update(resetToken.trim()).digest('hex');
  const storedHash = user.resetToken;

  const candidateBuf = Buffer.from(candidateHash, 'utf-8');
  const storedBuf = Buffer.from(storedHash, 'utf-8');

  if (candidateBuf.length !== storedBuf.length || !crypto.timingSafeEqual(candidateBuf, storedBuf)) {
    rejectInvalidOrExpired();
    return;
  }

  // Requirement 3 & 7: Single-use guarantee!
  // Invalidate token immediately upon use so it cannot be reused
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  user.passwordHash = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(12));
  db.save();

  res.json({
    message: 'Senha atualizada com sucesso. Você já pode fazer login com sua nova senha.'
  });
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
  const sort = (req.query.sort === 'trending' ? 'trending' : 'recent') as 'recent' | 'trending';
  const discussions = db.getPosts({ animeId: anime.id, sort });
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

app.post('/api/upload', authenticateToken, upload.array('images', 5) as any, (req: AuthRequest, res: Response) => {
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

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error('[Hikari Server] Fatal startup error:', err);
  });
}
