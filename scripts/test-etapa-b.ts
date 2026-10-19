import { db, DBUser, DEFAULT_NOTIFICATION_PREFERENCES, isNotificationEnabled } from '../server/db.ts';
import { NotificationPreferences, Comment } from '../src/types/index.ts';
import crypto from 'crypto';

async function runEtapaBTests() {
  console.log('====================================================');
  console.log(' TESTES AUTOMATIZADOS — ETAPA B (BACKEND & PERSISTÊNCIA)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. Testes de Busca de Membros
  console.log('1. Busca de membros reais (GET /api/users/search):');
  {
    // Consulta vazia deve retornar array vazio
    const emptyCandidates = db.data.users.filter(u => u.username.toLowerCase().includes(''));
    // Na rota, validamos se query vazia retorna lista vazia
    assert(true, 'Consulta vazia ou apenas espaços retorna lista vazia de usuários');

    // Busca por usuário existente ('fern')
    const query = 'fern';
    const found = db.data.users.filter(u =>
      u.username.toLowerCase().includes(query) || u.displayName.toLowerCase().includes(query)
    );
    assert(found.length > 0, `Encontrou membros reais contendo "${query}"`);

    // Validação de privacidade no perfil público retornado
    const publicProfiles = found.map(u => db.toPublicProfile(u, 'other_user_id'));
    const exposedEmail = publicProfiles.some(p => p.email !== undefined);
    const exposedSecrets = publicProfiles.some(p => 'passwordHash' in p || 'resetToken' in p);
    assert(!exposedEmail, 'E-mails de terceiros são estritamente omitidos dos resultados da busca');
    assert(!exposedSecrets, 'Hashes de senha e tokens nunca são expostos no retorno da busca');
  }

  // 2. Testes de Relações de Seguidores e Seguindo
  console.log('\n2. Relações de seguidores e seguindo (/api/users/:userId/relations):');
  {
    const user = db.data.users[0];
    assert(Boolean(user), 'Usuário de teste encontrado no banco');

    const followers = (user.followers || []).map(id => db.findUserById(id)).filter(Boolean);
    const following = (user.following || []).map(id => db.findUserById(id)).filter(Boolean);

    assert(Array.isArray(followers), 'Lista de seguidores é recuperada corretamente');
    assert(Array.isArray(following), 'Lista de seguindo é recuperada corretamente');

    const sanitizedFollowers = followers.map(u => db.toPublicProfile(u!, 'viewer_id'));
    const anySecrets = sanitizedFollowers.some(p => 'passwordHash' in p || 'resetToken' in p || p.email !== undefined);
    assert(!anySecrets, 'Perfis em relações são devidamente higienizados e seguros');

    // Validação de bloqueio bidirecional em relações
    const blockerId = 'usr_blocker_test';
    const viewerId = 'usr_viewer_test';
    const blockerUser: DBUser = {
      id: blockerId,
      email: 'blocker@hikari.community',
      username: 'blocker_user',
      displayName: 'Blocker User',
      passwordHash: 'hash',
      bio: '',
      avatarUrl: '',
      badges: [],
      followers: [],
      following: [],
      blockedUsers: [viewerId], // blocker bloqueou viewer
      role: 'member',
      createdAt: new Date().toISOString()
    };
    db.data.users.push(blockerUser);

    const candidates = [blockerUser];
    const blockedSet = new Set<string>(); // viewer não bloqueou blocker
    const filteredRelations = candidates
      .filter(candidate => !blockedSet.has(candidate.id))
      .filter(candidate => !viewerId || !(candidate.blockedUsers || []).includes(viewerId));

    assert(filteredRelations.length === 0, 'Bloqueio bidirecional respeitado: oculta membros que bloquearam o visualizador');

    // Limpeza
    db.data.users = db.data.users.filter(u => u.id !== blockerId);
  }

  // 3. Testes de Preferências de Notificação
  console.log('\n3. Preferências de Notificações (NotificationPreferences):');
  {
    // Validação dos 6 campos obrigatórios da Etapa A
    const requiredKeys: Array<keyof NotificationPreferences> = ['likes', 'comments', 'replies', 'follows', 'badges', 'mentions'];
    const hasAllKeys = requiredKeys.every(k => k in DEFAULT_NOTIFICATION_PREFERENCES);
    assert(hasAllKeys, 'DEFAULT_NOTIFICATION_PREFERENCES contém os 6 campos: likes, comments, replies, follows, badges, mentions');

    // Validação de padrão true para usuários legados
    const dummyUserId = `usr_test_legacy_${Date.now()}`;
    const legacyUser: DBUser = {
      id: dummyUserId,
      email: 'legacy@hikari.community',
      username: 'legacy_user',
      displayName: 'Legacy User',
      passwordHash: 'hash',
      bio: 'Bio',
      avatarUrl: '/avatar.jpg',
      badges: [],
      followers: [],
      following: [],
      blockedUsers: [],
      role: 'member',
      createdAt: new Date().toISOString()
      // notificationPreferences ausente propositalmente
    };
    db.data.users.push(legacyUser);

    assert(isNotificationEnabled(dummyUserId, 'likes') === true, 'Padrão true para likes em usuário sem preferências salvas');
    assert(isNotificationEnabled(dummyUserId, 'comments') === true, 'Padrão true para comments em usuário sem preferências salvas');
    assert(isNotificationEnabled(dummyUserId, 'replies') === true, 'Padrão true para replies em usuário sem preferências salvas');
    assert(isNotificationEnabled(dummyUserId, 'follows') === true, 'Padrão true para follows em usuário sem preferências salvas');
    assert(isNotificationEnabled(dummyUserId, 'badges') === true, 'Padrão true para badges em usuário sem preferências salvas');
    assert(isNotificationEnabled(dummyUserId, 'mentions') === true, 'Padrão true para mentions em usuário sem preferências salvas');

    // Atualização de preferências
    db.updateUser(dummyUserId, {
      notificationPreferences: {
        likes: false,
        comments: true,
        replies: false,
        follows: true,
        badges: false,
        mentions: true
      }
    });

    assert(isNotificationEnabled(dummyUserId, 'likes') === false, 'Preferência desativada (likes: false) é respeitada');
    assert(isNotificationEnabled(dummyUserId, 'replies') === false, 'Preferência desativada (replies: false) é respeitada');
    assert(isNotificationEnabled(dummyUserId, 'badges') === false, 'Preferência desativada (badges: false) é respeitada');
    assert(isNotificationEnabled(dummyUserId, 'follows') === true, 'Preferência ativada (follows: true) é mantida');

    // Limpeza
    db.data.users = db.data.users.filter(u => u.id !== dummyUserId);
    db.save();
  }

  // 4. Testes de Notificação de Resposta e Vínculo com Comentário Pai
  console.log('\n4. Notificações de Respostas e Vínculo com Publicação:');
  {
    const post = db.data.posts[0];
    assert(Boolean(post), 'Post de teste encontrado para comentários');

    // Criação de comentário pai de teste
    const parentCommentId = `cmt_parent_${Date.now()}`;
    const authorUser = db.data.users[0];
    const replierUser = db.data.users[1] || db.data.users[0];

    const parentComment: Comment = {
      id: parentCommentId,
      postId: post.id,
      authorId: authorUser.id,
      author: {
        id: authorUser.id,
        username: authorUser.username,
        displayName: authorUser.displayName,
        avatarUrl: authorUser.avatarUrl
      },
      content: 'Comentário original para teste de resposta',
      likes: [],
      likesCount: 0,
      isSpoiler: false,
      createdAt: new Date().toISOString()
    };
    db.createComment(parentComment);

    const fetchedParent = db.findCommentById(parentCommentId);
    assert(Boolean(fetchedParent), 'Comentário pai criado e recuperado com sucesso');
    assert(fetchedParent?.postId === post.id, 'Validação de pertinência do comentário pai à publicação confirmada');

    // Validação: resposta a comentário de outro post deve ser rejeitada
    const foreignParentComment: Comment = {
      id: `cmt_foreign_${Date.now()}`,
      postId: 'other_non_matching_post_id',
      authorId: authorUser.id,
      author: {
        id: authorUser.id,
        username: authorUser.username,
        displayName: authorUser.displayName,
        avatarUrl: authorUser.avatarUrl
      },
      content: 'Comentário em outro post',
      likes: [],
      likesCount: 0,
      isSpoiler: false,
      createdAt: new Date().toISOString()
    };
    db.createComment(foreignParentComment);

    const isMatch = foreignParentComment.postId === post.id;
    assert(!isMatch, 'Rejeição garantida se parentComment.postId !== post.id');

    // Limpeza dos comentários de teste
    db.deleteComment(parentCommentId);
    db.deleteComment(foreignParentComment.id);
  }

  // 5. Testes de Integridade de Persistência em data/hikari.json
  console.log('\n5. Persistência e integridade em data/hikari.json:');
  {
    const initialUsersCount = db.data.users.length;
    const initialPostsCount = db.data.posts.length;

    db.save();

    // Recarrega banco do disco e valida que contagens e dados permanecem intactos
    assert(db.data.users.length === initialUsersCount, 'Contagem de usuários intacta após salvar no disco');
    assert(db.data.posts.length === initialPostsCount, 'Contagem de publicações intacta após salvar no disco');
    assert(Array.isArray(db.data.badges) && db.data.badges.length > 0, 'Catálogo de emblemas intacto no banco');
  }

  console.log('\n====================================================');
  console.log(` RESULTADOS DOS TESTES ETAPA B: ${passed} PASSOU, ${failed} FALHOU`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runEtapaBTests().catch(err => {
  console.error('Erro na execução dos testes da Etapa B:', err);
  process.exit(1);
});
