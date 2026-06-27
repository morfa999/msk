import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, WaveformIcon, PlayIcon, PauseIcon, GridIcon, ListIcon } from './Icons';
import { User, UserSound } from '../store/useStore';

interface ProfileModalProps {
  isOpen: boolean; onClose: () => void; user: User; onUpdateName: (name: string) => void; onUpdateAvatar?: (color: string) => void;
  onLogout: () => void;
  allSounds?: UserSound[]; isOwnProfile?: boolean; viewUserId?: string | null;
}

const ADMIN_EMAIL = 'energoferon41@gmail.com';

async function fetchUserProfile(userId: string) {
  try {
    const tk = document.cookie.match(/(?:^|; )ks_token=([^;]*)/)?.[1];
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (tk) h['Authorization'] = `Bearer ${decodeURIComponent(tk)}`;
    const r = await fetch(`/api/user/${userId}/profile`, { headers: h });
    return await r.json();
  } catch { return null; }
}

// Predefined avatar images (built-in options)
// Each option is a SVG avatar with unique color + initial - uploaded by user as image
const AVATAR_OPTIONS = [
  { id: 'av_1', url: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#3B82F6"/><text x="50%" y="55%" font-size="28" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">A</text></svg>') },
  { id: 'av_2', url: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#10B981"/><text x="50%" y="55%" font-size="28" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">B</text></svg>') },
  { id: 'av_3', url: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#F97316"/><text x="50%" y="55%" font-size="28" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">C</text></svg>') },
  { id: 'av_4', url: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#8B5CF6"/><text x="50%" y="55%" font-size="28" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">D</text></svg>') },
  { id: 'av_5', url: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#EC4899"/><text x="50%" y="55%" font-size="28" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">E</text></svg>') },
  { id: 'av_6', url: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#06B6D4"/><text x="50%" y="55%" font-size="28" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">F</text></svg>') },
];

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUpdateName, onUpdateAvatar, onLogout, allSounds = [], isOwnProfile = true, viewUserId }) => {
  const [newName, setNewName] = useState(user.name);
  const [saved, setSaved] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [profileData, setProfileData] = useState<{ user: User; sounds: UserSound[] } | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen && viewUserId && !isOwnProfile) {
      fetchUserProfile(viewUserId).then(d => { if (d?.ok) setProfileData(d); });
    }
  }, [isOpen, viewUserId, isOwnProfile]);

  if (!isOpen) return null;

  const displayUser = isOwnProfile ? user : profileData?.user || user;
  const isDisplayAdmin = displayUser?.email === ADMIN_EMAIL;
  const roleLabel = isDisplayAdmin ? 'Директор' : (displayUser?.isAdmin ? 'Администратор' : '');
  const userSounds = isOwnProfile ? allSounds.filter(s => s.authorId === user.id) : profileData?.sounds || [];
  const initial = displayUser.name.charAt(0).toUpperCase();
  const subLabel = displayUser.subscription === 'ultra' ? 'Sound Ultra' : displayUser.subscription === 'hd' ? 'Sound HD' : 'Без подписки';
  const totalDownloads = userSounds.reduce((a, s) => a + (s.downloads || 0), 0);
  const totalPlays = userSounds.reduce((a, s) => a + (s.playCount || 0), 0);

  const handleSave = () => {
    if (newName.trim() && newName.trim() !== user.name) { onUpdateName(newName.trim()); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  const handleAvatarSelect = (color: string) => {
    if (onUpdateAvatar) onUpdateAvatar(color);
    setShowAvatarPicker(false);
  };

  const togglePlay = (s: UserSound) => {
    if (playingId === s.id) { audioRef.current?.pause(); setPlayingId(null); return; }
    audioRef.current?.pause();
    if (!s.fileData) return;
    const a = new Audio(s.fileData); audioRef.current = a;
    a.play().catch(() => {});
    a.addEventListener('ended', () => setPlayingId(null));
    setPlayingId(s.id);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#FAFAFA] overflow-y-auto animate-fade-in">
      <div className="sticky top-0 z-10 bg-white border-b border-[#EBEBEB]">
        <div className="max-w-3xl mx-auto px-6 h-[56px] flex items-center justify-between">
          <h1 className="text-[15px] font-bold text-[#0A0A0A]">Профиль</h1>
          <button onClick={onClose} className="p-2 text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors"><CloseIcon size={20} /></button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Avatar + name + role */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => isOwnProfile && setShowAvatarPicker(true)} disabled={!isOwnProfile}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shrink-0 transition-transform ${isOwnProfile ? 'hover:scale-105 cursor-pointer' : ''}`}
            style={{ backgroundColor: displayUser.avatarColor }}>
            {initial}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0A0A0A]">{displayUser.name}</h1>
              {roleLabel && <span className="text-[11px] bg-[#0A0A0A] text-white px-2 py-0.5 rounded font-bold">{roleLabel}</span>}
            </div>
            {isOwnProfile && <p className="text-[12px] text-[#999] mt-0.5">{displayUser.email}</p>}
            <p className="text-[11px] text-[#B0B0B0] mt-0.5">{subLabel}</p>
          </div>
        </div>

        {/* Avatar picker - shows gallery + custom upload */}
        {isOwnProfile && showAvatarPicker && (
          <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 mb-6">
            <p className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-3">Выбери аватарку</p>

            {/* Gallery of preset avatars */}
            <p className="text-[10px] text-[#B0B0B0] mb-2">Готовые</p>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {AVATAR_OPTIONS.map(av => (
                <button key={av.id} onClick={() => { handleAvatarSelect(av.url); }}
                  className="aspect-square rounded-full overflow-hidden border-2 border-transparent hover:border-[#0A0A0A] transition-all hover:scale-105">
                  <img src={av.url} alt={av.id} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <p className="text-[10px] text-[#B0B0B0] mb-2">Своё изображение</p>
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0]; if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => { handleAvatarSelect(ev.target?.result as string); };
              reader.readAsDataURL(file);
            }} className="hidden" id="avatar-upload" />
            <label htmlFor="avatar-upload" className="block w-full px-4 py-3 border-2 border-dashed border-[#E5E5E5] rounded-xl text-[13px] font-medium text-[#999] hover:border-[#D4D4D4] transition-all text-center cursor-pointer">
              Загрузить фото
            </label>
          </div>
        )}

        {/* Stats — listeners count + downloads */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 flex items-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-lg font-black text-[#0A0A0A]">{userSounds.length}</div>
            <div className="text-[10px] text-[#999] font-medium">Загрузок</div>
          </div>
          <div className="w-px h-8 bg-[#EBEBEB]" />
          <div className="text-center">
            <div className="text-lg font-black text-[#0A0A0A]">{totalPlays >= 1000 ? `${(totalPlays / 1000).toFixed(1)}k` : totalPlays}</div>
            <div className="text-[10px] text-[#999] font-medium">Прослушиваний</div>
          </div>
          <div className="w-px h-8 bg-[#EBEBEB]" />
          <div className="text-center">
            <div className="text-lg font-black text-[#0A0A0A]">{totalDownloads >= 1000 ? `${(totalDownloads / 1000).toFixed(1)}k` : totalDownloads}</div>
            <div className="text-[10px] text-[#999] font-medium">Скачиваний</div>
          </div>
        </div>

        {/* Edit name */}
        {isOwnProfile && (
          <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 mb-6">
            <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-2 block">Изменить ник</label>
            <div className="flex gap-2">
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="flex-1 px-4 py-2.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] transition-all" />
              <button onClick={handleSave} className="px-4 py-2.5 bg-[#0A0A0A] text-white text-[12px] font-semibold rounded-xl hover:bg-[#1A1A1A] transition-all shrink-0">{saved ? 'Сохранено ✓' : 'Сохранить'}</button>
            </div>
          </div>
        )}

        {/* User tracks - cards / list toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-[#0A0A0A]">{isOwnProfile ? 'Мои треки' : `Треки ${displayUser.name}`}</h2>
            <div className="flex border border-[#E5E5E5] rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('cards')} className={`p-1.5 ${viewMode === 'cards' ? 'bg-[#0A0A0A] text-white' : 'bg-white text-[#B0B0B0] hover:text-[#0A0A0A]'}`}><GridIcon size={12} /></button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 ${viewMode === 'list' ? 'bg-[#0A0A0A] text-white' : 'bg-white text-[#B0B0B0] hover:text-[#0A0A0A]'}`}><ListIcon size={12} /></button>
            </div>
          </div>
          {userSounds.length === 0 ? (
            <div className="text-center py-8 bg-white border border-[#EBEBEB] rounded-xl">
              <WaveformIcon size={20} className="text-[#D0D0D0] mx-auto mb-2" />
              <p className="text-[12px] text-[#B0B0B0]">Нет загруженных треков</p>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userSounds.map(s => (
                <div key={s.id} className="bg-white border border-[#EBEBEB] rounded-xl p-3 hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-semibold text-[#0A0A0A] truncate flex-1">{s.title}</span>
                    <button onClick={() => togglePlay(s)} className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition-all ${playingId === s.id ? 'bg-[#0A0A0A] text-white' : 'bg-[#F3F3F3] text-[#0A0A0A] hover:bg-[#E8E8E8]'}`}>
                      {playingId === s.id ? <PauseIcon size={10} /> : <PlayIcon size={10} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#999]">
                    <span>{s.category} · {s.duration}</span>
                    <span className="tabular-nums">{(s.playCount || 0) >= 1000 ? `${(s.playCount / 1000).toFixed(1)}k` : (s.playCount || 0)} просл.</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {userSounds.map(s => (
                <div key={s.id} className="flex items-center gap-3 bg-white border border-[#EBEBEB] rounded-xl px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-[#0A0A0A] truncate">{s.title}</div>
                    <div className="text-[10px] text-[#999]">{s.category} · {s.duration}</div>
                  </div>
                  <span className="text-[10px] text-[#B0B0B0] tabular-nums">{(s.playCount || 0) >= 1000 ? `${(s.playCount / 1000).toFixed(1)}k` : (s.playCount || 0)} просл.</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {isOwnProfile && (
          <button onClick={() => { onLogout(); onClose(); }} className="w-full py-2.5 border border-[#E5E5E5] text-[#6B6B6B] text-[13px] font-medium rounded-xl hover:bg-[#F5F5F5] hover:text-[#0A0A0A] transition-all">Выйти</button>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
