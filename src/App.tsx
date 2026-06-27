import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import SearchBar from './components/SearchBar';
import CategoryFilter from './components/CategoryFilter';
import SortSelect from './components/SortSelect';
import SoundCard from './components/SoundCard';
import ListSoundCard from './components/ListSoundCard';
import PacksSection from './components/PacksSection';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import AddModal from './components/AddModal';
import ProfileModal from './components/ProfileModal';
import PremiumModal from './components/PremiumModal';
import DownloadModal from './components/DownloadModal';
import CookieBanner from './components/CookieBanner';
import { FilterIcon, GridIcon, ListIcon, WaveformIcon } from './components/Icons';
import { categories, sortOptions, SoundCategory } from './data/sounds';
import { useStore, UserSound } from './store/useStore';
import { useNotify } from './notify';

type ViewMode = 'grid' | 'list';
type TabMode = 'sounds' | 'packs';
const TWELVE_HOURS = 12 * 60 * 60 * 1000;
const ADMIN_EMAIL = 'energoferon41@gmail.com';

const App: React.FC = () => {
  const store = useStore();
  const { success: notifySuccess } = useNotify();
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

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [addOpen, setAddOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadSound, setDownloadSound] = useState<UserSound | null>(null);

  const openAuth = useCallback((mode: 'login' | 'register') => { setAuthMode(mode); setAuthOpen(true); }, []);

  const handleGoHome = useCallback(() => {
    setActiveTab('sounds'); setSearchQuery(''); setSelectedCategory('All'); setSortBy('newest'); setShowOnlyFree(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isAdmin = store.currentUser?.email === ADMIN_EMAIL;
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
  const pluralize = (n: number) => { if (n % 10 === 1 && n % 100 !== 11) return 'звук'; if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'звука'; return 'звуков'; };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header onOpenAuth={openAuth} user={store.currentUser} onOpenProfile={() => setProfileOpen(true)}
        onOpenAddSound={() => { if (!store.currentUser) { openAuth('register'); return; } setAddOpen(true); }}
        activeTab={activeTab} onTabChange={setActiveTab} onGoHome={handleGoHome} />
      <Hero totalSounds={store.totalSounds} totalDownloads={store.totalDownloads} />
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
              <div className="text-center py-16"><div className="w-14 h-14 mx-auto mb-4 bg-[#F3F3F3] rounded-2xl flex items-center justify-center"><WaveformIcon size={24} className="text-[#B0B0B0]" /></div><h3 className="text-base font-semibold text-[#0A0A0A] mb-1">{allSounds.length === 0 ? 'Пока нет звуков' : 'Ничего не найдено'}</h3><p className="text-[13px] text-[#B0B0B0]">{allSounds.length === 0 ? 'Зарегистрируйтесь и добавьте первый звук' : 'Попробуйте изменить параметры поиска'}</p></div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredSounds.map((s, i) => <SoundCard key={s.id} sound={s} isPlaying={playingId === s.id} playProgress={playingId === s.id ? playProgress : 0} currentTime={playingId === s.id ? currentTime : 0} onTogglePlay={() => togglePlay(s.id)} onSeek={handleSeek} onDownloadClick={() => handleDownloadClick(s)} onPremiumClick={() => setPremiumOpen(true)} animationDelay={i * 40} />)}
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredSounds.map((s, i) => <ListSoundCard key={s.id} sound={s} isPlaying={playingId === s.id} playProgress={playingId === s.id ? playProgress : 0} currentTime={playingId === s.id ? currentTime : 0} onTogglePlay={() => togglePlay(s.id)} onSeek={handleSeek} onDownloadClick={() => handleDownloadClick(s)} onPremiumClick={() => setPremiumOpen(true)} animationDelay={i * 25} />)}
              </div>
            )}
          </>
        ) : (
          <PacksSection packs={store.allPacks} onPremiumClick={() => setPremiumOpen(true)} />
        )}
      </main>
      <Footer />
      <CookieBanner />
      <AuthModal isOpen={authOpen} mode={authMode} onClose={() => setAuthOpen(false)} onSwitchMode={() => setAuthMode(m => m === 'login' ? 'register' : 'login')} onRegister={store.register} onLogin={store.login} />
      {isAdmin && <AddModal isOpen={addOpen} onClose={() => setAddOpen(false)} onAddSound={store.addSound} onAddPack={store.addPack} />}
      {store.currentUser && <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} user={store.currentUser} onUpdateName={store.updateName} onLogout={store.logout} />}
      <PremiumModal isOpen={premiumOpen} onClose={() => setPremiumOpen(false)} currentSub={store.currentUser?.subscription || 'none'} onSubscribe={plan => store.setSubscription(plan)} isLoggedIn={!!store.currentUser} onOpenAuth={() => { setPremiumOpen(false); openAuth('register'); }} />
      <DownloadModal isOpen={downloadOpen} onClose={() => { setDownloadOpen(false); setDownloadSound(null); }} sound={downloadSound} user={store.currentUser} onDownload={handleDownload} onOpenPremium={() => { setDownloadOpen(false); setPremiumOpen(true); }} onOpenAuth={() => { setDownloadOpen(false); openAuth('register'); }} />
    </div>
  );
};

export default App;
