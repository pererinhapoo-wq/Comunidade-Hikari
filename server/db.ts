import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Badge, Anime, Post, Comment, AppNotification, ReportItem, UserProfile } from '../src/types';

export interface DBUser {
  id: string;
  email: string;
  username: string; // @nick
  displayName: string;
  passwordHash: string;
  bio: string;
  avatarUrl: string;
  bannerUrl?: string;
  primaryBadgeId?: string;
  badges: Array<{ badgeId: string; acquiredAt: string; reason: string }>;
  followers: string[];
  following: string[];
  blockedUsers: string[];
  role: 'member' | 'moderator' | 'admin';
  createdAt: string;
  resetToken?: string;
  resetTokenExpires?: number;
}

export interface DBSchema {
  users: DBUser[];
  posts: Post[];
  comments: Comment[];
  notifications: AppNotification[];
  badges: Badge[];
  animes: Anime[];
  reports: ReportItem[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'hikari.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'badge_hikari_supremo',
    name: 'Brasão Celestial Hikari',
    description: 'A mais alta condecoração da Comunidade Hikari, forjada com energia cósmica e essência estelar.',
    rarity: 'lendario',
    category: 'lendaria',
    icon: 'Sparkles',
    glowColor: '#A855F7',
    condition: 'Concedido a pilares da comunidade com contribuições lendárias e impacto duradouro.',
    imageUrl: '/src/assets/images/badge_celestial_crest_1792424737159.jpg'
  },
  {
    id: 'badge_estrela_guia',
    name: 'Estrela Guia de Frieren',
    description: 'Símbolo arcano da jornada mágica de um século, banhado pela luz da sabedoria élfica.',
    rarity: 'epico',
    category: 'sazonal',
    icon: 'Wand2',
    glowColor: '#10B981',
    condition: 'Publicar pelo menos 3 análises de enredo ou teorias sobre Frieren.',
    season: 'Temporada Outono 2026'
  },
  {
    id: 'badge_expansao_dominio',
    name: 'Mestre do Vazio Imensurável',
    description: 'Condensação de energia amaldiçoada pura em azul elétrico e infinito cósmico.',
    rarity: 'epico',
    category: 'evento',
    icon: 'Zap',
    glowColor: '#3B82F6',
    condition: 'Vencer ou liderar 5 debates de combate e poderes com votos da comunidade.'
  },
  {
    id: 'badge_monarca_sombras',
    name: 'Selo do Monarca das Sombras',
    description: 'Invocação abissal de pura autoridade imperial, ressoando com o despertar do rei.',
    rarity: 'lendario',
    category: 'lendaria',
    icon: 'Shield',
    glowColor: '#9333EA',
    condition: 'Colecionador de discussões épicas e membro de honra das Sombras.'
  },
  {
    id: 'badge_pioneiro_hikari',
    name: 'Chama Pioneira Hikari',
    description: 'Chama safira concedida aos membros pioneiros que inauguraram a nova era da Comunidade Hikari.',
    rarity: 'raro',
    category: 'apoio',
    icon: 'Flame',
    glowColor: '#06B6D4',
    condition: 'Conta criada durante a fase fundadora da Comunidade Hikari.'
  },
  {
    id: 'badge_critico_aclamado',
    name: 'Pena de Cristal Crítica',
    description: 'Prata polida concedida aos autores de resenhas detalhadas e análises cinematográficas.',
    rarity: 'raro',
    category: 'contribuicao',
    icon: 'Feather',
    glowColor: '#E2E8F0',
    condition: 'Ter resenhas com mais de 20 salvamentos por outros membros.'
  },
  {
    id: 'badge_guardiao_spoilers',
    name: 'Guardião da Lore',
    description: 'Selo de honra por manter debates civilizados e proteger novatos com marcação exemplar de spoilers.',
    rarity: 'comum',
    category: 'contribuicao',
    icon: 'ShieldCheck',
    glowColor: '#64748B',
    condition: 'Publicar discussões ativas com tags de spoiler devidamente configuradas.'
  },
  {
    id: 'badge_ilustrador_lendario',
    name: 'Prisma de Luz das Fanarts',
    description: 'Emblema iridescente para ilustradores e criadores visuais de alta qualidade.',
    rarity: 'epico',
    category: 'contribuicao',
    icon: 'Palette',
    glowColor: '#EC4899',
    condition: 'Publicar fanarts originais na galeria que recebam destaque da comunidade.'
  }
];

export const INITIAL_ANIMES: Anime[] = [
  {
    id: 'frieren',
    title: 'Frieren: Além do Fim da Jornada',
    japaneseTitle: '葬送のフリーレン (Sousou no Frieren)',
    synopsis: 'A maga elfa Frieren e seus corajosos companheiros aventureiros derrotaram o Rei Demônio e trouxeram paz à terra. Mas agora, décadas depois, Frieren empreende uma nova jornada para compreender a efemeridade humana.',
    coverUrl: '/src/assets/images/anime_frieren_journey_1792424735166.jpg',
    bannerUrl: '/src/assets/images/hikari_hero_banner_1792424735133.jpg',
    episodesCount: 28,
    genres: ['Fantasia', 'Aventura', 'Drama', 'Magia'],
    score: '9.38',
    discussionsCount: 142,
    year: 2024,
    status: 'Completo'
  },
  {
    id: 'jujutsu-kaisen',
    title: 'Jujutsu Kaisen: Batalha de Feiticeiros',
    japaneseTitle: '呪術廻戦 (Jujutsu Kaisen)',
    synopsis: 'Em um mundo onde sentimentos negativos humanos se transformam em Maldições mortais, Yuji Itadori engole o dedo do Rei das Maldições e ingressa na Escola Técnica de Jujutsu de Tóquio.',
    coverUrl: '/src/assets/images/anime_jujutsu_sorcerer_1792424736668.jpg',
    bannerUrl: '/src/assets/images/hikari_hero_banner_1792424735133.jpg',
    episodesCount: 47,
    genres: ['Ação', 'Sobrenatural', 'Fantasia Sombria'],
    score: '8.85',
    discussionsCount: 215,
    year: 2023,
    status: 'Em exibição'
  },
  {
    id: 'solo-leveling',
    title: 'Solo Leveling: Despertar das Sombras',
    japaneseTitle: '俺だけレベルアップな件 (Ore dake Level Up na Ken)',
    synopsis: 'Sung Jin-woo, conhecido como o caçador mais fraco da humanidade, recebe uma oportunidade única em uma masmorra dupla: uma interface misteriosa que lhe permite subir de nível infinitamente.',
    coverUrl: '/src/assets/images/anime_sololeveling_monarch_1792424736997.jpg',
    bannerUrl: '/src/assets/images/hikari_hero_banner_1792424735133.jpg',
    episodesCount: 24,
    genres: ['Ação', 'Fantasia', 'Aventura'],
    score: '8.54',
    discussionsCount: 178,
    year: 2024,
    status: 'Em exibição'
  },
  {
    id: 'attack-on-titan',
    title: 'Attack on Titan: Shingeki no Kyojin',
    japaneseTitle: '進撃の巨人 (Shingeki no Kyojin)',
    synopsis: 'A humanidade vive cercada por muralhas gigantescas para se proteger de titãs devoradores. Eren Yeager jura exterminar todos os titãs após a destruição de sua cidade natal.',
    coverUrl: '/src/assets/images/anime_sololeveling_monarch_1792424736997.jpg',
    bannerUrl: '/src/assets/images/hikari_hero_banner_1792424735133.jpg',
    episodesCount: 89,
    genres: ['Ação', 'Mistério', 'Drama Militar'],
    score: '9.08',
    discussionsCount: 320,
    year: 2023,
    status: 'Completo'
  }
];

function getInitialDatabase(): DBSchema {
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('hikari123', salt);

  const initialUsers: DBUser[] = [
    {
      id: 'usr_admin',
      email: 'admin@hikari.community',
      username: 'hikari_curador',
      displayName: 'Hikari Curadoria',
      passwordHash: defaultPasswordHash,
      bio: 'Equipe editorial e curadoria oficial da Comunidade Hikari. Apaixonados por narrativa, animação e lore de animes.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      bannerUrl: '/src/assets/images/hikari_hero_banner_1792424735133.jpg',
      primaryBadgeId: 'badge_hikari_supremo',
      badges: [
        { badgeId: 'badge_hikari_supremo', acquiredAt: '2026-01-01T00:00:00Z', reason: 'Curador Fundador' },
        { badgeId: 'badge_pioneiro_hikari', acquiredAt: '2026-01-01T00:00:00Z', reason: 'Membro Pioneiro' }
      ],
      followers: ['usr_fern', 'usr_satoru', 'usr_yuki'],
      following: ['usr_fern', 'usr_satoru'],
      blockedUsers: [],
      role: 'admin',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'usr_fern',
      email: 'fern@hikari.community',
      username: 'fern_arcana',
      displayName: 'Fern Zoltraak',
      passwordHash: defaultPasswordHash,
      bio: 'Estudiosa de grimórios élficos e magias cotidianas. Fã número um da mestre Frieren.',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      bannerUrl: '/src/assets/images/anime_frieren_journey_1792424735166.jpg',
      primaryBadgeId: 'badge_estrela_guia',
      badges: [
        { badgeId: 'badge_estrela_guia', acquiredAt: '2026-02-10T14:30:00Z', reason: 'Especialista em Frieren' },
        { badgeId: 'badge_guardiao_spoilers', acquiredAt: '2026-02-12T10:00:00Z', reason: 'Debates organizados' },
        { badgeId: 'badge_pioneiro_hikari', acquiredAt: '2026-01-05T00:00:00Z', reason: 'Membro Pioneiro' }
      ],
      followers: ['usr_admin', 'usr_satoru'],
      following: ['usr_admin'],
      blockedUsers: [],
      role: 'member',
      createdAt: '2026-01-05T12:00:00Z'
    },
    {
      id: 'usr_satoru',
      email: 'satoru@hikari.community',
      username: 'satoru_infinity',
      displayName: 'Gojo Satoru ✦',
      passwordHash: defaultPasswordHash,
      bio: 'Debatedor de powerscaling, limites de energia amaldiçoada e coreografias de ação em animes modernos.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      bannerUrl: '/src/assets/images/anime_jujutsu_sorcerer_1792424736668.jpg',
      primaryBadgeId: 'badge_expansao_dominio',
      badges: [
        { badgeId: 'badge_expansao_dominio', acquiredAt: '2026-02-15T18:00:00Z', reason: 'Mestre em Debates' },
        { badgeId: 'badge_pioneiro_hikari', acquiredAt: '2026-01-10T00:00:00Z', reason: 'Membro Pioneiro' }
      ],
      followers: ['usr_admin', 'usr_fern'],
      following: ['usr_admin', 'usr_fern'],
      blockedUsers: [],
      role: 'member',
      createdAt: '2026-01-10T16:00:00Z'
    },
    {
      id: 'usr_yuki',
      email: 'yuki@hikari.community',
      username: 'yuki_sakura',
      displayName: 'Yuki Ilustrações',
      passwordHash: defaultPasswordHash,
      bio: 'Criadora de fanarts digitais inspiradas em paisagens de Makoto Shinkai e estéticas de Ufotable.',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      bannerUrl: '/src/assets/images/anime_sololeveling_monarch_1792424736997.jpg',
      primaryBadgeId: 'badge_ilustrador_lendario',
      badges: [
        { badgeId: 'badge_ilustrador_lendario', acquiredAt: '2026-02-20T21:00:00Z', reason: 'Destaque na Galeria' },
        { badgeId: 'badge_pioneiro_hikari', acquiredAt: '2026-01-12T00:00:00Z', reason: 'Membro Pioneiro' }
      ],
      followers: ['usr_admin'],
      following: ['usr_admin'],
      blockedUsers: [],
      role: 'member',
      createdAt: '2026-01-12T09:00:00Z'
    }
  ];

  const initialPosts: Post[] = [
    {
      id: 'post_frieren_ep28',
      authorId: 'usr_fern',
      author: {
        id: 'usr_fern',
        username: 'fern_arcana',
        displayName: 'Fern Zoltraak',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        primaryBadge: INITIAL_BADGES.find(b => b.id === 'badge_estrela_guia'),
        role: 'member'
      },
      content: 'A sutileza da despedida entre Frieren e Himmel no episódio final da primeira temporada me fez chorar. Reparem como o enquadramento da flor Semiramis azul reflete o retorno ao início da viagem. O que acharam do ritmo da adaptação da Madhouse?',
      images: ['/src/assets/images/anime_frieren_journey_1792424735166.jpg'],
      animeId: 'frieren',
      animeTitle: 'Frieren: Além do Fim da Jornada',
      episodeNumber: 28,
      category: 'episodio',
      tags: ['Frieren', 'Episódio 28', 'Análise', 'Madhouse'],
      isSpoiler: true,
      spoilerWarning: 'Contém spoilers do desfecho do Exame de Mago de 1ª Classe (Ep. 28)',
      likes: ['usr_admin', 'usr_satoru', 'usr_yuki'],
      likesCount: 3,
      bookmarks: ['usr_admin'],
      commentsCount: 2,
      createdAt: '2026-10-18T19:30:00Z'
    },
    {
      id: 'post_debate_powerscaling',
      authorId: 'usr_satoru',
      author: {
        id: 'usr_satoru',
        username: 'satoru_infinity',
        displayName: 'Gojo Satoru ✦',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        primaryBadge: INITIAL_BADGES.find(b => b.id === 'badge_expansao_dominio'),
        role: 'member'
      },
      content: 'Debate de combate direto: Considerando os limites conceituais de Vazio Imensurável versus o Relicário Malevolente no arco de Shinjuku. Quem vocês consideram que tem a condição de vitória mais consistente em um cenário 1v1 puro sem fatores externos?',
      images: ['/src/assets/images/anime_jujutsu_sorcerer_1792424736668.jpg'],
      animeId: 'jujutsu-kaisen',
      animeTitle: 'Jujutsu Kaisen: Batalha de Feiticeiros',
      category: 'debate',
      tags: ['Debate', 'Powerscaling', 'Gojo', 'Sukuna', 'JJK'],
      isSpoiler: true,
      spoilerWarning: 'Discussão detalhada sobre Expansões de Domínio avançadas',
      likes: ['usr_admin', 'usr_fern'],
      likesCount: 2,
      bookmarks: ['usr_yuki'],
      commentsCount: 1,
      poll: {
        question: 'Quem possui a condição de vitória mais definitiva?',
        options: [
          { id: 'opt_1', text: 'Gojo Satoru (Infinito & Vazio Imensurável)', votes: ['usr_satoru', 'usr_fern'] },
          { id: 'opt_2', text: 'Ryomen Sukuna (Domínio Aberto & Cortes Conceituais)', votes: ['usr_admin'] },
          { id: 'opt_3', text: 'Empate Técnico / Depende das Condições Iniciais', votes: [] }
        ],
        totalVotes: 3
      },
      createdAt: '2026-10-19T02:15:00Z'
    },
    {
      id: 'post_fanart_monarch',
      authorId: 'usr_yuki',
      author: {
        id: 'usr_yuki',
        username: 'yuki_sakura',
        displayName: 'Yuki Ilustrações',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        primaryBadge: INITIAL_BADGES.find(b => b.id === 'badge_ilustrador_lendario'),
        role: 'member'
      },
      content: 'Finalizei esta ilustração dedicada ao Monarca das Sombras! Foram cerca de 18 horas de pintura digital buscando capturar a aura violeta e o manto imperial. Espero que gostem, sintam-se livres para usar como papel de parede!',
      images: ['/src/assets/images/anime_sololeveling_monarch_1792424736997.jpg'],
      animeId: 'solo-leveling',
      animeTitle: 'Solo Leveling: Despertar das Sombras',
      category: 'galeria',
      tags: ['Fanart', 'SoloLeveling', 'Jinwoo', 'Ilustração', 'Galeria'],
      isSpoiler: false,
      likes: ['usr_admin', 'usr_fern', 'usr_satoru'],
      likesCount: 3,
      bookmarks: ['usr_fern'],
      commentsCount: 1,
      createdAt: '2026-10-19T06:45:00Z'
    },
    {
      id: 'post_comunidade_boas_vindas',
      authorId: 'usr_admin',
      author: {
        id: 'usr_admin',
        username: 'hikari_curador',
        displayName: 'Hikari Curadoria',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        primaryBadge: INITIAL_BADGES.find(b => b.id === 'badge_hikari_supremo'),
        role: 'admin'
      },
      content: 'Boas-vindas oficiais à Comunidade Hikari! Este espaço foi arquitetado para fãs que buscam discussões aprofundadas, análises de episódios, teorias sólidas, artes da comunidade e emblemas colecionáveis sem ruídos de pontuações artificiais. Explore os tópicos, personalize seu perfil com seu @nick único e equipe seu emblema favorito!',
      images: ['/src/assets/images/hikari_hero_banner_1792424735133.jpg'],
      category: 'geral',
      tags: ['Hikari', 'Comunidade', 'BoasVindas', 'Emblemas'],
      isSpoiler: false,
      likes: ['usr_fern', 'usr_satoru', 'usr_yuki'],
      likesCount: 3,
      bookmarks: ['usr_fern', 'usr_satoru'],
      commentsCount: 2,
      createdAt: '2026-10-19T08:00:00Z'
    }
  ];

  const initialComments: Comment[] = [
    {
      id: 'cmt_1',
      postId: 'post_frieren_ep28',
      authorId: 'usr_admin',
      author: {
        id: 'usr_admin',
        username: 'hikari_curador',
        displayName: 'Hikari Curadoria',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        primaryBadge: INITIAL_BADGES.find(b => b.id === 'badge_hikari_supremo')
      },
      content: 'Excelente observação sobre a Semiramis. O contraste visual entre a longevidade dos elfos e a urgência mortal de Himmel é o coração dessa obra.',
      likes: ['usr_fern'],
      likesCount: 1,
      isSpoiler: false,
      createdAt: '2026-10-18T20:10:00Z'
    },
    {
      id: 'cmt_2',
      postId: 'post_frieren_ep28',
      authorId: 'usr_yuki',
      author: {
        id: 'usr_yuki',
        username: 'yuki_sakura',
        displayName: 'Yuki Ilustrações',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        primaryBadge: INITIAL_BADGES.find(b => b.id === 'badge_ilustrador_lendario')
      },
      content: 'A trilha sonora do Evan Call durante esses últimos minutos eleva tudo para outro patamar!',
      likes: ['usr_fern', 'usr_admin'],
      likesCount: 2,
      isSpoiler: false,
      createdAt: '2026-10-18T21:05:00Z'
    },
    {
      id: 'cmt_3',
      postId: 'post_fanart_monarch',
      authorId: 'usr_satoru',
      author: {
        id: 'usr_satoru',
        username: 'satoru_infinity',
        displayName: 'Gojo Satoru ✦',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        primaryBadge: INITIAL_BADGES.find(b => b.id === 'badge_expansao_dominio')
      },
      content: 'Trabalho insano na renderização da iluminação violeta da lâmina! Arte de alto nível.',
      likes: ['usr_yuki'],
      likesCount: 1,
      isSpoiler: false,
      createdAt: '2026-10-19T07:15:00Z'
    }
  ];

  const initialNotifications: AppNotification[] = [
    {
      id: 'notif_1',
      recipientId: 'usr_fern',
      senderId: 'usr_admin',
      sender: {
        username: 'hikari_curador',
        displayName: 'Hikari Curadoria',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
      },
      type: 'like',
      title: 'Curtida na publicação',
      message: 'curtiu sua publicação sobre Frieren Episódio 28',
      postId: 'post_frieren_ep28',
      read: false,
      createdAt: '2026-10-18T20:15:00Z'
    },
    {
      id: 'notif_2',
      recipientId: 'usr_fern',
      type: 'badge',
      title: 'Emblema Desbloqueado',
      message: 'Você conquistou o emblema Estrela Guia de Frieren!',
      badgeId: 'badge_estrela_guia',
      badge: INITIAL_BADGES.find(b => b.id === 'badge_estrela_guia'),
      read: true,
      createdAt: '2026-10-18T19:00:00Z'
    }
  ];

  return {
    users: initialUsers,
    posts: initialPosts,
    comments: initialComments,
    notifications: initialNotifications,
    badges: INITIAL_BADGES,
    animes: INITIAL_ANIMES,
    reports: []
  };
}

export class Database {
  public data: DBSchema;

  constructor() {
    this.data = this.load();
  }

  public findCommentById(id: string): Comment | undefined {
    return this.data.comments.find(c => c.id === id);
  }

  private load(): DBSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure badges and animes are populated if updated
        if (!parsed.badges || parsed.badges.length === 0) {
          parsed.badges = INITIAL_BADGES;
        }
        if (!parsed.animes || parsed.animes.length === 0) {
          parsed.animes = INITIAL_ANIMES;
        }
        return parsed;
      }
    } catch (err) {
      console.error('[DB] Failed to load db.json, generating initial database:', err);
    }

    const initial = getInitialDatabase();
    this.persistDirect(initial);
    return initial;
  }

  public save(): void {
    this.persistDirect(this.data);
  }

  private persistDirect(data: DBSchema): void {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('[DB] Atomic write error:', err);
    }
  }

  // --- Users & Profiles ---
  public findUserById(id: string): DBUser | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByUsername(username: string): DBUser | undefined {
    const clean = username.toLowerCase().trim().replace(/^@/, '');
    return this.data.users.find(u => u.username.toLowerCase() === clean);
  }

  public findUserByEmail(email: string): DBUser | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public createUser(user: DBUser): DBUser {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<DBUser>): DBUser | undefined {
    const user = this.findUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  public toPublicProfile(user: DBUser, currentUserId?: string): UserProfile {
    const primaryBadge = user.primaryBadgeId
      ? this.data.badges.find(b => b.id === user.primaryBadgeId)
      : undefined;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: currentUserId === user.id ? user.email : undefined,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl,
      primaryBadgeId: user.primaryBadgeId,
      primaryBadge,
      badges: user.badges || [],
      followersCount: user.followers ? user.followers.length : 0,
      followingCount: user.following ? user.following.length : 0,
      isFollowing: currentUserId ? (user.followers || []).includes(currentUserId) : false,
      role: user.role,
      createdAt: user.createdAt
    };
  }

  // --- Posts ---
  public getPosts(filter?: {
    category?: string;
    animeId?: string;
    authorId?: string;
    search?: string;
    tag?: string;
    isSpoiler?: boolean;
    followingOnlyForUserId?: string;
    savedOnlyForUserId?: string;
    sort?: 'recent' | 'trending';
  }, currentUserId?: string): Post[] {
    let list = [...this.data.posts];

    // Filter blocked users if logged in
    if (currentUserId) {
      const currentUser = this.findUserById(currentUserId);
      if (currentUser && currentUser.blockedUsers?.length) {
        list = list.filter(p => !currentUser.blockedUsers.includes(p.authorId));
      }
    }

    if (filter?.category && filter.category !== 'all') {
      list = list.filter(p => p.category === filter.category);
    }

    if (filter?.animeId) {
      list = list.filter(p => p.animeId === filter.animeId);
    }

    if (filter?.authorId) {
      list = list.filter(p => p.authorId === filter.authorId);
    }

    if (filter?.tag) {
      const targetTag = filter.tag.toLowerCase();
      list = list.filter(p => p.tags.some(t => t.toLowerCase() === targetTag));
    }

    if (filter?.savedOnlyForUserId) {
      list = list.filter(p => p.bookmarks.includes(filter.savedOnlyForUserId!));
    }

    if (filter?.followingOnlyForUserId) {
      const u = this.findUserById(filter.followingOnlyForUserId);
      const followingIds = u?.following || [];
      list = list.filter(p => followingIds.includes(p.authorId) || p.authorId === filter.followingOnlyForUserId);
    }

    if (filter?.search) {
      const s = filter.search.toLowerCase().trim();
      list = list.filter(p => 
        p.content.toLowerCase().includes(s) || 
        p.tags.some(t => t.toLowerCase().includes(s)) ||
        p.author.username.toLowerCase().includes(s) ||
        p.author.displayName.toLowerCase().includes(s) ||
        (p.animeTitle && p.animeTitle.toLowerCase().includes(s))
      );
    }

    // Sort order: Trending (real engagement score) or Recent (newest first)
    if (filter?.sort === 'trending') {
      list.sort((a, b) => {
        const commentsA = this.data.comments.filter(c => c.postId === a.id).length;
        const commentsB = this.data.comments.filter(c => c.postId === b.id).length;
        const scoreA = (a.likes.length * 2) + commentsA;
        const scoreB = (b.likes.length * 2) + commentsB;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      // Default: recent (newest first)
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Enrich with user specific liked/bookmarked
    return list.map(p => {
      const authorUser = this.findUserById(p.authorId);
      const primaryBadge = authorUser?.primaryBadgeId 
        ? this.data.badges.find(b => b.id === authorUser.primaryBadgeId)
        : undefined;

      const actualCommentsCount = this.data.comments.filter(c => c.postId === p.id).length;

      let pollData = p.poll;
      if (p.poll && currentUserId) {
        const userVotedOption = p.poll.options.find(opt => opt.votes.includes(currentUserId));
        pollData = {
          ...p.poll,
          userVotedOptionId: userVotedOption?.id
        };
      }

      return {
        ...p,
        author: {
          ...p.author,
          displayName: authorUser?.displayName || p.author.displayName,
          username: authorUser?.username || p.author.username,
          avatarUrl: authorUser?.avatarUrl || p.author.avatarUrl,
          primaryBadge
        },
        poll: pollData,
        commentsCount: actualCommentsCount,
        likesCount: p.likes.length,
        isLiked: currentUserId ? p.likes.includes(currentUserId) : false,
        isBookmarked: currentUserId ? p.bookmarks.includes(currentUserId) : false
      };
    });
  }

  public findPostById(id: string, currentUserId?: string): Post | undefined {
    const post = this.data.posts.find(p => p.id === id);
    if (!post) return undefined;
    const authorUser = this.findUserById(post.authorId);
    const primaryBadge = authorUser?.primaryBadgeId
      ? this.data.badges.find(b => b.id === authorUser.primaryBadgeId)
      : undefined;

    let pollData = post.poll;
    if (post.poll && currentUserId) {
      const userVotedOption = post.poll.options.find(opt => opt.votes.includes(currentUserId));
      pollData = {
        ...post.poll,
        userVotedOptionId: userVotedOption?.id
      };
    }

    return {
      ...post,
      author: {
        ...post.author,
        displayName: authorUser?.displayName || post.author.displayName,
        username: authorUser?.username || post.author.username,
        avatarUrl: authorUser?.avatarUrl || post.author.avatarUrl,
        primaryBadge
      },
      poll: pollData,
      likesCount: post.likes.length,
      isLiked: currentUserId ? post.likes.includes(currentUserId) : false,
      isBookmarked: currentUserId ? post.bookmarks.includes(currentUserId) : false
    };
  }

  public createPost(post: Post): Post {
    this.data.posts.unshift(post);
    this.save();
    return post;
  }

  public updatePost(id: string, updates: Partial<Post>): Post | undefined {
    const post = this.data.posts.find(p => p.id === id);
    if (!post) return undefined;
    Object.assign(post, updates);
    this.save();
    return post;
  }

  public deletePost(id: string): boolean {
    const idx = this.data.posts.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.posts.splice(idx, 1);
    // Remove related comments
    this.data.comments = this.data.comments.filter(c => c.postId !== id);
    this.save();
    return true;
  }

  // --- Comments ---
  public getComments(postId: string, currentUserId?: string): Comment[] {
    const comments = this.data.comments.filter(c => c.postId === postId);
    comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return comments.map(c => {
      const author = this.findUserById(c.authorId);
      const primaryBadge = author?.primaryBadgeId
        ? this.data.badges.find(b => b.id === author.primaryBadgeId)
        : undefined;

      return {
        ...c,
        author: {
          ...c.author,
          displayName: author?.displayName || c.author.displayName,
          username: author?.username || c.author.username,
          avatarUrl: author?.avatarUrl || c.author.avatarUrl,
          primaryBadge
        },
        likesCount: c.likes.length,
        isLiked: currentUserId ? c.likes.includes(currentUserId) : false
      };
    });
  }

  public createComment(comment: Comment): Comment {
    this.data.comments.push(comment);
    // Increment post comment counter
    const post = this.data.posts.find(p => p.id === comment.postId);
    if (post) {
      post.commentsCount = (post.commentsCount || 0) + 1;
    }
    this.save();
    return comment;
  }

  public deleteComment(id: string): boolean {
    const idx = this.data.comments.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const c = this.data.comments[idx];
    this.data.comments.splice(idx, 1);
    const post = this.data.posts.find(p => p.id === c.postId);
    if (post && post.commentsCount > 0) {
      post.commentsCount--;
    }
    this.save();
    return true;
  }

  // --- Badges ---
  public getBadges(): Badge[] {
    return this.data.badges;
  }

  public findBadgeById(id: string): Badge | undefined {
    return this.data.badges.find(b => b.id === id);
  }

  public awardBadge(userId: string, badgeId: string, reason: string): boolean {
    const user = this.findUserById(userId);
    const badge = this.findBadgeById(badgeId);
    if (!user || !badge) return false;

    if (!user.badges) user.badges = [];
    if (user.badges.some(b => b.badgeId === badgeId)) return false; // already has it

    user.badges.push({
      badgeId,
      acquiredAt: new Date().toISOString(),
      reason
    });

    if (!user.primaryBadgeId) {
      user.primaryBadgeId = badgeId;
    }

    // Create notification
    this.createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      recipientId: userId,
      type: 'badge',
      title: 'Emblema Desbloqueado!',
      message: `Você conquistou o emblema "${badge.name}"!`,
      badgeId,
      badge,
      read: false,
      createdAt: new Date().toISOString()
    });

    this.save();
    return true;
  }

  // --- Notifications ---
  public getNotifications(userId: string): AppNotification[] {
    const notifs = this.data.notifications.filter(n => n.recipientId === userId);
    notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return notifs.map(n => {
      let badge = n.badge;
      if (n.badgeId && !badge) {
        badge = this.findBadgeById(n.badgeId);
      }
      return { ...n, badge };
    });
  }

  public createNotification(notification: AppNotification): AppNotification {
    this.data.notifications.unshift(notification);
    // Keep max 50 notifications per user
    const userNotifs = this.data.notifications.filter(n => n.recipientId === notification.recipientId);
    if (userNotifs.length > 50) {
      const oldestId = userNotifs[userNotifs.length - 1].id;
      this.data.notifications = this.data.notifications.filter(n => n.id !== oldestId);
    }
    this.save();
    return notification;
  }

  public markNotificationAsRead(id: string, userId: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id && n.recipientId === userId);
    if (!notif) return false;
    notif.read = true;
    this.save();
    return true;
  }

  public markAllNotificationsAsRead(userId: string): void {
    this.data.notifications.forEach(n => {
      if (n.recipientId === userId) n.read = true;
    });
    this.save();
  }

  // --- Animes ---
  public getAnimes(): Anime[] {
    return this.data.animes;
  }

  public findAnimeById(id: string): Anime | undefined {
    return this.data.animes.find(a => a.id === id);
  }

  // --- Reports ---
  public createReport(report: ReportItem): ReportItem {
    this.data.reports.push(report);
    this.save();
    return report;
  }

  public getReports(): ReportItem[] {
    return this.data.reports;
  }

  public updateReport(id: string, status: 'resolved' | 'dismissed'): boolean {
    const report = this.data.reports.find(r => r.id === id);
    if (!report) return false;
    report.status = status;
    this.save();
    return true;
  }
}

export const db = new Database();
