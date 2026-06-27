import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import SearchBar from './components/SearchBar';
import CategoryFilter from './components/CategoryFilter';
import SortSelect from './components/SortSelect';
import SoundCard from './components/SoundCard';
import ListSoundCard from './components/ListSoundCard';
import PackDetailModal from './components/PackDetailModal';
import SoundDetailPage from './components/SoundDetailPage';
import Pagination from './components/Pagination';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import AddModal from './components/AddModal';
import ProfileModal from './components/ProfileModal';
import PremiumModal from './components/PremiumModal';
import DownloadModal from './components/DownloadModal';
import CookieBanner from './components/CookieBanner';
import AdminPanel from './components/AdminPanel';
import { FilterIcon, GridIcon, ListIcon, WaveformIcon } from './components/Icons';
import { categories, sortOptions, SoundCategory } from './data/sounds';
import { useStore, UserSound, Pack } from './store/useStore';
import { useNotify } from './notify';

type ViewMode = 'grid' | 'list';
type TabMode = 'sounds' | 'packs';
const TWELVE_HOURS = 12 * 60 * 60 * 1000;
const PAGE_SIZE = 10;

const App: React.FC = () => {
  const store = useStore();
  const { success: notifySuccess, info: notifyInfo } = useNotify();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [activeTab, setActiveTab] = useState<TabMode>('sounds');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SoundCategory>('All');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showOnlyFree, setShowOnlyFree] = useState(false);
  const [soundsPage, setSoundsPage] = useState(1);
  const [packsPage, setPacksPage] = useState(1);

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [addOpen, setAddOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadSound, setDownloadSound] = useState<UserSound | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);

  const [viewProfileUserId, setViewProfileUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  // Share / public route
  const [sharedSoundId, setSharedSoundId] = useState<string | null>(null);

  // Pack detail modal
  const [openPack, setOpenPack] = useState<Pack | null>(null);

  const openAuth = useCallback((mode: 'login' | 'register') => { setAuthMode(mode); setAuthOpen(true); }, []);
  const handleGoHome = useCallback(() => {
    setActiveTab('sounds'); setSearchQuery(''); setSelectedCategory('All'); setSortBy('newest'); setShowOnlyFree(false);
    setSoundsPage(1); setPacksPage(1);
    setSharedSoundId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Detect share route on mount + on hash change
  useEffect(() => {
    const checkRoute = () => {
      const match = window.location.pathname.match(/^\/sound\/([a-z0-9]+)$/i);
      if (match) setSharedSoundId(match[1]);
      else setSharedSoundId(null);
    };
    checkRoute();
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  const openOwnProfile = useCallback(() => {
    if (!store.currentUser) return;
    setViewProfileUserId(store.currentUser.id); setIsOwnProfile(true); setProfileOpen(true);
  }, [store.currentUser]);

  const openUserProfile = useCallback((userId: string) => {
    if (store.currentUser && store.currentUser.id === userId) { openOwnProfile(); return; }
    // Don't open profile for KITSTUDIO admin account
    setViewProfileUserId(userId); setIsOwnProfile(false); setProfileOpen(true);
  }, [store.currentUser, openOwnProfile]);

  const handleAuthorClick = useCallback((authorId: string) => {
    openUserProfile(authorId);
  }, [openUserProfile]);

  const isAdmin = !!store.currentUser?.isAdmin;
  const allSounds = store.allSounds;

  const soundsWithNewFlag = useMemo(() => {
    const now = Date.now();
    return allSounds.map(s => ({ ...s, isNew: (now - new Date(s.dateAdded).getTime()) < TWELVE_HOURS }));
  }, [allSounds]);

  const categoryCounts = useMemo(() => {
    const c: Record<SoundCategory, number> = { All: soundsWithNewFlag.length, Drums: 0, Melodies: 0, '808s': 0, FX: 0, Vocals: 0, Loops: 0, 'Готовые биты': 0 };
    soundsWithNewFlag.forEach(s => { const cat = s.category as SoundCategory; if (cat in c && cat !== 'All') c[cat]++; });
    return c;
  }, [soundsWithNewFlag]);

  const filteredSounds = useMemo(() => {
    let r = [...soundsWithNewFlag];
    if (selectedCategory !== 'All') r = r.filter(s => s.category === selectedCategory);
    if (showOnlyFree) r = r.filter(s => s.isFree);
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase().trim(); r = r.filter(s => s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q)) || s.authorName.toLowerCase().includes(q)); }
    switch (sortBy) { case 'newest': r.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()); break; case 'downloads': r.sort((a, b) => b.downloads - a.downloads); break; case 'name': r.sort((a, b) => a.title.localeCompare(b.title)); break; }
    return r;
  }, [soundsWithNewFlag, selectedCategory, searchQuery, sortBy, showOnlyFree]);

  useEffect(() => { setSoundsPage(1); }, [selectedCategory, searchQuery, sortBy, showOnlyFree]);
  useEffect(() => { setPacksPage(1); }, [searchQuery]);

  const paginatedSounds = useMemo(() => {
    const start = (soundsPage - 1) * PAGE_SIZE;
    return filteredSounds.slice(start, start + PAGE_SIZE);
  }, [filteredSounds, soundsPage]);
  const soundsTotalPages = Math.max(1, Math.ceil(filteredSounds.length / PAGE_SIZE));

  const paginatedPacks = useMemo(() => {
    const start = (packsPage - 1) * PAGE_SIZE;
    return store.allPacks.slice(start, start + PAGE_SIZE);
  }, [store.allPacks, packsPage]);
  const packsTotalPages = Math.max(1, Math.ceil(store.allPacks.length / PAGE_SIZE));

  const packSounds = useCallback((authorId: string): UserSound[] => {
    return allSounds.filter(s => s.authorId === authorId);
  }, [allSounds]);

  useEffect(() => {
    if (!playingId) { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } setPlayProgress(0); setCurrentTime(0); return; }
    const sound = allSounds.find(s => s.id === playingId);
    if (!sound || !sound.fileData) { setPlayingId(null); return; }
    const audio = new Audio(sound.fileData); audioRef.current = audio;
    audio.play().catch(() => setPlayingId(null));
    const up = () => { if (audio.duration) { setPlayProgress(audio.currentTime / audio.duration); setCurrentTime(audio.currentTime); } };
    const end = () => { setPlayingId(null); setPlayProgress(0); setCurrentTime(0); };
    audio.addEventListener('timeupdate', up); audio.addEventListener('ended', end);
    return () => { audio.removeEventListener('timeupdate', up); audio.removeEventListener('ended', end); audio.pause(); };
  }, [playingId, allSounds]);

  const togglePlay = useCallback((id: string) => { setPlayingId(p => p === id ? null : id); if (playingId !== id) { setPlayProgress(0); setCurrentTime(0); } }, [playingId]);
  const handleSeek = useCallback((p: number) => { if (audioRef.current?.duration) { audioRef.current.currentTime = p * audioRef.current.duration; setPlayProgress(p); setCurrentTime(audioRef.current.currentTime); } }, []);
  const handleDownloadClick = useCallback((s: UserSound) => { setDownloadSound(s); setDownloadOpen(true); }, []);
  const handleDownload = useCallback((id: string, _f: string) => { store.downloadSound(id); notifySuccess('Скачивание началось'); }, [store, notifySuccess]);

  const handleAddSound = useCallback(async (data: Parameters<typeof store.addSound>[0]) => {
    const result = await store.addSound(data);
    if (result.pending) notifyInfo('Звук отправлен на модерацию');
    else notifySuccess('Звук добавлен');
  }, [store, notifySuccess, notifyInfo]);

  const pluralize = (n: number) => { if (n % 10 === 1 && n % 100 !== 11) return 'звук'; if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'звука'; return 'звуков'; };

  // If shared sound route, render full-screen dedicated page
  if (sharedSoundId) {
    return <SoundDetailPage soundId={sharedSoundId} onGoHome={handleGoHome} />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header onOpenAuth={openAuth} user={store.currentUser} onOpenProfile={openOwnProfile}
        onOpenAddSound={() => { if (!store.currentUser) { openAuth('register'); return; } setAddOpen(true); }}
        onOpenAdmin={() => setAdminOpen(true)}
        activeTab={activeTab} onTabChange={setActiveTab} onGoHome={handleGoHome} />
      <Hero totalSounds={store.totalSounds} totalDownloads={store.totalDownloads} totalPacks={store.allPacks.length} />
      <main className="max-w-7xl mx-auto px-6 pb-8">
        {activeTab === 'sounds' ? (
          <>
            <div className="mb-6"><h2 className="text-[22px] font-bold text-[#0A0A0A] mb-1 tracking-tight">Каталог звуков</h2><p className="text-[13px] text-[#B0B0B0] font-medium">{filteredSounds.length} {pluralize(filteredSounds.length)} доступно</p></div>
            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
                <div className="flex items-center gap-2 sm:ml-auto">
                  <button onClick={() => setShowOnlyFree(!showOnlyFree)} className={`inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-[13px] font-medium transition-all ${showOnlyFree ? 'bg-[#0A0A0A] text-white' : 'bg-white border border-[#E5E5E5] text-[#6B6B6B] hover:border-[#D4D4D4] hover:text-[#0A0A0A]'}`}><FilterIcon size={13} />Бесплатные</button>
                  <SortSelect options={sortOptions} selected={sortBy} onChange={setSortBy} />
                  <div className="hidden sm:flex items-center border border-[#E5E5E5] rounded-xl overflow-hidden">
                    <button onClick={() => setViewMode('grid')} className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-[#0A0A0A] text-white' : 'bg-white text-[#B0B0B0] hover:text-[#0A0A0A]'}`}><GridIcon size={14} /></button>
                    <button onClick={() => setViewMode('list')} className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-[#0A0A0A] text-white' : 'bg-white text-[#B0B0B0] hover:text-[#0A0A0A]'}`}><ListIcon size={14} /></button>
                  </div>
                </div>
              </div>
              <CategoryFilter categories={categories} selected={selectedCategory} onChange={setSelectedCategory} counts={categoryCounts} />
            </div>
            {filteredSounds.length === 0 ? (
              <div className="text-center py-16"><div className="w-14 h-14 mx-auto mb-4 bg-[#F3F3F3] rounded-2xl flex items-center justify-center"><WaveformIcon size={24} className="text-[#B0B0B0]" /></div><h3 className="text-base font-semibold text-[#0A0A0A] mb-1">{allSounds.length === 0 ? 'Пока нет звуков' : 'Ничего не найдено'}</h3><p className="text-[13px] text-[#B0B0B0]">{allSounds.length === 0 ? 'Добавьте первый звук' : 'Попробуйте изменить параметры поиска'}</p></div>
            ) : viewMode === 'grid' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {paginatedSounds.map((s, i) => <SoundCard key={s.id} sound={s} isPlaying={playingId === s.id} playProgress={playingId === s.id ? playProgress : 0} currentTime={playingId === s.id ? currentTime : 0} onTogglePlay={() => togglePlay(s.id)} onSeek={handleSeek} onDownloadClick={() => handleDownloadClick(s)} onPremiumClick={() => setPremiumOpen(true)} onAuthorClick={handleAuthorClick} animationDelay={i * 40} />)}
                </div>
                <Pagination page={soundsPage} totalPages={soundsTotalPages} onChange={setSoundsPage} />
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  {paginatedSounds.map((s, i) => <ListSoundCard key={s.id} sound={s} isPlaying={playingId === s.id} playProgress={playingId === s.id ? playProgress : 0} currentTime={playingId === s.id ? currentTime : 0} onTogglePlay={() => togglePlay(s.id)} onSeek={handleSeek} onDownloadClick={() => handleDownloadClick(s)} onPremiumClick={() => setPremiumOpen(true)} onAuthorClick={handleAuthorClick} animationDelay={i * 25} />)}
                </div>
                <Pagination page={soundsPage} totalPages={soundsTotalPages} onChange={setSoundsPage} />
              </>
            )}
          </>
        ) : (
          <>
            <div className="mb-6"><h2 className="text-[22px] font-bold text-[#0A0A0A] mb-1 tracking-tight">Паки</h2><p className="text-[13px] text-[#B0B0B0] font-medium">{store.allPacks.length} паков доступно</p></div>
            {store.allPacks.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 mx-auto mb-4 bg-[#F3F3F3] rounded-2xl flex items-center justify-center"><WaveformIcon size={24} className="text-[#B0B0B0]" /></div>
                <h3 className="text-base font-semibold text-[#0A0A0A] mb-1">Пока нет паков</h3>
                <p className="text-[13px] text-[#B0B0B0]">Добавьте первый пак</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {paginatedPacks.map((pack, i) => (
                    <button key={pack.id} onClick={() => setOpenPack(pack)} className="group bg-white border border-[#EBEBEB] rounded-2xl p-5 hover:border-[#D4D4D4] hover:shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition-all text-left w-full opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'forwards' }}>
                      <div className="w-10 h-10 rounded-xl bg-[#F3F3F3] flex items-center justify-center mb-3.5"><WaveformIcon size={18} className="text-[#0A0A0A]" /></div>
                      <h3 className="text-[14px] font-semibold text-[#0A0A0A] mb-2">{pack.title}</h3>
                      <div className="flex items-center gap-2 mb-3 text-[11px]">
                        <span className="text-[#B0B0B0]">{pack.soundCount} звуков</span>
                        <span className="text-[#D0D0D0]">·</span>
                        <span className="text-[#B0B0B0] truncate">{pack.authorName}</span>
                      </div>
                      <div className="text-[11px] text-[#0A0A0A] font-medium">Открыть →</div>
                    </button>
                  ))}
                </div>
                <Pagination page={packsPage} totalPages={packsTotalPages} onChange={setPacksPage} />
              </>
            )}
          </>
        )}
      </main>
      <Footer />
      <CookieBanner />
      <AuthModal isOpen={authOpen} mode={authMode} onClose={() => setAuthOpen(false)} onSwitchMode={() => setAuthMode(m => m === 'login' ? 'register' : 'login')} onRegister={store.register} onLogin={store.login} />
      <AddModal isOpen={addOpen} onClose={() => setAddOpen(false)} onAddSound={handleAddSound} onAddPack={store.addPack} />
      {store.currentUser && profileOpen && (
        <ProfileModal isOpen={profileOpen} onClose={() => { setProfileOpen(false); setViewProfileUserId(null); }}
          user={store.currentUser} onUpdateName={store.updateName} onUpdateAvatar={store.updateAvatar} onLogout={store.logout}
          allSounds={allSounds} isOwnProfile={isOwnProfile} viewUserId={viewProfileUserId} />
      )}
      <PremiumModal isOpen={premiumOpen} onClose={() => setPremiumOpen(false)} currentSub={store.currentUser?.subscription || 'none'} onSubscribe={plan => store.setSubscription(plan)} isLoggedIn={!!store.currentUser} onOpenAuth={() => { setPremiumOpen(false); openAuth('register'); }} />
      <DownloadModal isOpen={downloadOpen} onClose={() => { setDownloadOpen(false); setDownloadSound(null); }} sound={downloadSound} user={store.currentUser} onDownload={handleDownload} onOpenPremium={() => { setDownloadOpen(false); setPremiumOpen(true); }} onOpenAuth={() => { setDownloadOpen(false); openAuth('register'); }} />
      {isAdmin && <AdminPanel isOpen={adminOpen} onClose={() => setAdminOpen(false)} onRefresh={store.refreshData} />}
      {openPack && <PackDetailModal pack={openPack} packSounds={packSounds(openPack.authorId)} isOpen={!!openPack} onClose={() => setOpenPack(null)} />}
    </div>
  );
};

export default App;
