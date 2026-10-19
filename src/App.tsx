import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { HomeFeed } from './views/HomeFeed';
import { AnimesView } from './views/AnimesView';
import { DebatesView } from './views/DebatesView';
import { GalleryView } from './views/GalleryView';
import { BadgesView } from './views/BadgesView';
import { NotificationsView } from './views/NotificationsView';
import { SavedView } from './views/SavedView';
import { ProfileView } from './views/ProfileView';
import { SearchView } from './views/SearchView';
import { CreatePostModal } from './components/CreatePostModal';
import { ImageViewerModal } from './components/ImageViewerModal';
import { ReportModal } from './components/ReportModal';
import { HikariBridgeModal } from './components/HikariBridgeModal';
import { AuthModal } from './components/AuthModal';
import { Anime, Badge, PostCategory } from './types';
import { api } from './services/api';

function MainApp() {
  const { user } = useAuth();
  
  // Navigation states
  const [activeTab, setActiveTab] = useState<ActiveTab>('inicio');
  const [selectedUsername, setSelectedUsername] = useState<string>('');
  const [selectedAnimeId, setSelectedAnimeId] = useState<string>('');

  // Global catalogs
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  // Modals
  const [isCreatePostOpen, setIsCreatePostOpen] = useState<boolean>(false);
  const [createPostCategory, setCreatePostCategory] = useState<PostCategory>('geral');
  const [createPostAnimeId, setCreatePostAnimeId] = useState<string>('');
  const [isHikariBridgeOpen, setIsHikariBridgeOpen] = useState<boolean>(false);
  
  // Image Viewer
  const [imageViewer, setImageViewer] = useState<{
    isOpen: boolean;
    images: string[];
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0
  });

  // Report Modal
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    targetType: 'post' | 'comment' | 'user';
    targetId: string;
  }>({
    isOpen: false,
    targetType: 'post',
    targetId: ''
  });

  useEffect(() => {
    // Load animes and badges catalog once
    const loadCatalogs = async () => {
      try {
        const [animesRes, badgesRes] = await Promise.all([
          api.getAnimes(),
          api.getBadges()
        ]);
        setAnimes(animesRes.animes || []);
        setBadges(badgesRes.badges || []);
      } catch (err) {
        console.error('[Hikari] Failed to load catalog metadata:', err);
      }
    };
    loadCatalogs();
  }, []);

  const handleSelectTab = (tab: ActiveTab, param?: string) => {
    setActiveTab(tab);
    if (tab === 'perfil') {
      setSelectedUsername(param || user?.username || 'hikari_curador');
    }
    if (tab === 'animes' && param) {
      setSelectedAnimeId(param);
    } else if (tab === 'animes' && !param) {
      setSelectedAnimeId('');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProfile = (username: string) => {
    setSelectedUsername(username);
    setActiveTab('perfil');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAnime = (animeId: string) => {
    setSelectedAnimeId(animeId);
    setActiveTab('animes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenImageViewer = (images: string[], initialIndex: number) => {
    setImageViewer({
      isOpen: true,
      images,
      initialIndex
    });
  };

  const handleOpenReport = (targetType: 'post' | 'comment' | 'user', targetId: string) => {
    setReportModal({
      isOpen: true,
      targetType,
      targetId
    });
  };

  const handleOpenCreatePost = (category: PostCategory = 'geral', animeId: string = '') => {
    setCreatePostCategory(category);
    setCreatePostAnimeId(animeId);
    setIsCreatePostOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#080A12] text-[#E2E8F0] pb-20 md:pb-12 flex flex-col font-sans">
      
      {/* Universal Top Bar & Bottom Mobile Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenCreatePost={() => handleOpenCreatePost('geral')}
        onOpenHikariBridge={() => setIsHikariBridgeOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 w-full animate-in fade-in duration-150">
        {activeTab === 'inicio' && (
          <HomeFeed
            onOpenProfile={handleOpenProfile}
            onOpenAnime={handleOpenAnime}
            onOpenImageViewer={handleOpenImageViewer}
            onOpenReport={handleOpenReport}
            onOpenCreatePost={() => handleOpenCreatePost('geral')}
            onOpenHikariBridge={() => setIsHikariBridgeOpen(true)}
            onSelectTab={handleSelectTab}
            animes={animes}
          />
        )}

        {activeTab === 'animes' && (
          <AnimesView
            animes={animes}
            selectedAnimeId={selectedAnimeId}
            onSelectAnime={handleOpenAnime}
            onBackToCatalog={() => setSelectedAnimeId('')}
            onOpenProfile={handleOpenProfile}
            onOpenImageViewer={handleOpenImageViewer}
            onOpenReport={handleOpenReport}
            onOpenCreatePostWithAnime={(animeId, ep) => handleOpenCreatePost('episodio', animeId)}
          />
        )}

        {activeTab === 'debates' && (
          <DebatesView
            onOpenProfile={handleOpenProfile}
            onOpenAnime={handleOpenAnime}
            onOpenImageViewer={handleOpenImageViewer}
            onOpenReport={handleOpenReport}
            onOpenCreatePostWithCategory={cat => handleOpenCreatePost(cat)}
            animes={animes}
          />
        )}

        {activeTab === 'galeria' && (
          <GalleryView
            onOpenProfile={handleOpenProfile}
            onOpenImageViewer={handleOpenImageViewer}
            onOpenCreatePostWithCategory={cat => handleOpenCreatePost(cat)}
            animes={animes}
          />
        )}

        {activeTab === 'emblemas' && (
          <BadgesView badges={badges} />
        )}

        {activeTab === 'notificacoes' && (
          <NotificationsView
            onOpenProfile={handleOpenProfile}
            onOpenPost={postId => handleSelectTab('inicio')}
            onSelectTab={handleSelectTab}
          />
        )}

        {activeTab === 'salvos' && (
          <SavedView
            onOpenProfile={handleOpenProfile}
            onOpenAnime={handleOpenAnime}
            onOpenImageViewer={handleOpenImageViewer}
            onOpenReport={handleOpenReport}
          />
        )}

        {activeTab === 'pesquisar' && (
          <SearchView
            onOpenProfile={handleOpenProfile}
            onOpenAnime={handleOpenAnime}
            onOpenImageViewer={handleOpenImageViewer}
            onOpenReport={handleOpenReport}
            animes={animes}
          />
        )}

        {activeTab === 'perfil' && (
          <ProfileView
            username={selectedUsername || user?.username || 'hikari_curador'}
            onOpenProfile={handleOpenProfile}
            onOpenAnime={handleOpenAnime}
            onOpenImageViewer={handleOpenImageViewer}
            onOpenReport={handleOpenReport}
            allBadges={badges}
          />
        )}
      </main>

      {/* Global Modals */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={() => {
          // Refresh feed if on home
          if (activeTab === 'inicio') {
            window.location.reload();
          } else {
            handleSelectTab('inicio');
          }
        }}
        animes={animes}
        defaultCategory={createPostCategory}
        defaultAnimeId={createPostAnimeId}
      />

      <ImageViewerModal
        isOpen={imageViewer.isOpen}
        onClose={() => setImageViewer(prev => ({ ...prev, isOpen: false }))}
        images={imageViewer.images}
        initialIndex={imageViewer.initialIndex}
      />

      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal(prev => ({ ...prev, isOpen: false }))}
        targetType={reportModal.targetType}
        targetId={reportModal.targetId}
      />

      <HikariBridgeModal
        isOpen={isHikariBridgeOpen}
        onClose={() => setIsHikariBridgeOpen(false)}
      />

      <AuthModal />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
