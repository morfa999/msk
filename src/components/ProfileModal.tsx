import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, WaveformIcon, GridIcon, ListIcon } from './Icons';
import { User, UserSound } from '../store/useStore';
import { ADMIN_EMAIL } from '../utils/admin';
import SoundCard from './SoundCard';
import ListSoundCard from './ListSoundCard';

interface ProfileModalProps {
  isOpen: boolean; onClose: () => void; user: User; onUpdateName: (name: string) => void; onUpdateAvatar?: (avatarUrl: string) => void;
  onLogout: () => void;
  allSounds?: UserSound[]; isOwnProfile?: boolean; viewUserId?: string | null;
  onDownloadClick?: (s: UserSound) => void;
  onAuthorClick?: (authorId: string) => void;
}

async function fetchUserProfile(userId: string) {
  try {
    const tk = document.cookie.match(/(?:^|; )ks_token=([^;]*)/)?.[1];
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (tk) h['Authorization'] = `Bearer ${decodeURIComponent(tk)}`;
    const r = await fetch(`/api/user/${userId}/profile`, { headers: h });
    return await r.json();
  } catch { return null; }
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUpdateName, onUpdateAvatar, onLogout, allSounds = [], isOwnProfile = true, viewUserId, onDownloadClick: propDownload, onAuthorClick: propAuthorClick }) => {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user.name);
  const [saved, setSaved] = useState(false);
  const [profileData, setProfileData] = useState<{ user: User; sounds: UserSound[] } | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && viewUserId && !isOwnProfile) {
      fetchUserProfile(viewUserId).then(d => { if (d?.ok) setProfileData(d); });
    }
  }, [isOpen, viewUserId, isOwnProfile]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  if (!isOpen) return null;

  const displayUser = isOwnProfile ? user : profileData?.user || user;
  const isDisplayAdmin = displayUser?.email === ADMIN_EMAIL;
  const roleLabel = isDisplayAdmin ? 'Директор' : (displayUser?.isAdmin ? 'Администратор' : '');
  const userSounds = isOwnProfile ? allSounds.filter(s => s.authorId === user.id) : profileData?.sounds || [];
  const isImageAvatar = displayUser.avatarColor?.startsWith('data:image') || displayUser.avatarColor?.startsWith('http');
  const initial = displayUser.name.charAt(0).toUpperCase();
  const subLabel = displayUser.subscription === 'ultra' ? 'Sound Ultra' : displayUser.subscription === 'hd' ? 'Sound HD' : 'Без подписки';
  const totalDownloads = userSounds.reduce((a, s) => a + (s.downloads || 0), 0);
  const totalPlays = userSounds.reduce((a, s) => a + (s.playCount || 0), 0);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (onUpdateAvatar) onUpdateAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const startEditName = () => {
    if (!isOwnProfile) return;
    setNameValue(displayUser.name);
    setEditingName(true);
  };

  const saveName = () => {
    if (nameValue.trim() && nameValue.trim() !== displayUser.name) {
      onUpdateName(nameValue.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
    setEditingName(false);
  };

  const handleNameKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') setEditingName(false);
  };

  const toBlobUrl = (dataUrl: string): string => {
    if (!dataUrl.startsWith('data:')) return dataUrl;
    try {
      const [meta, base64] = dataUrl.split(',');
      const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'audio/mpeg';
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return URL.createObjectURL(new Blob([bytes], { type: mime }));
    } catch { return dataUrl; }
  };

  const togglePlay = (s: UserSound) => {
    if (playingId === s.id) { audioRef.current?.pause(); setPlayingId(null); setPlayProgress(0); setCurrentTime(0); return; }
    audioRef.current?.pause();
    if (!s.fileData) return;
    const url = toBlobUrl(s.fileData);
    const a = new Audio(url); audioRef.current = a;
    a.play().catch(() => {});
    const up = () => { if (a.duration) { setPlayProgress(a.currentTime / a.duration); setCurrentTime(a.currentTime); } };
    const end = () => { URL.revokeObjectURL(url); setPlayingId(null); setPlayProgress(0); setCurrentTime(0); };
    a.addEventListener('timeupdate', up); a.addEventListener('ended', end);
    setPlayingId(s.id);
  };

  const handleSeek = (p: number) => {
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = p * audioRef.current.duration;
      setPlayProgress(p); setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onDownloadClick = propDownload || (() => {});
  const onAuthorClick = propAuthorClick || (() => {});

  return (
    <div className="fixed inset-0 z-[100] bg-[#FAFAFA] overflow-y-auto animate-fade-in">
      <div className="sticky top-0 z-10 bg-white border-b border-[#EBEBEB]">
        <div className="max-w-3xl mx-auto px-6 h-[56px] flex items-center justify-between">
          <h1 className="text-[15px] font-bold text-[#0A0A0A]">Профиль</h1>
          <button onClick={onClose} className="p-2 text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors"><CloseIcon size={20} /></button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          {isOwnProfile ? (
            <>
              <button onClick={() => avatarInputRef.current?.click()} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shrink-0 relative group cursor-pointer">
                {isImageAvatar ? (
                  <img src={displayUser.avatarColor} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold" style={{ backgroundColor: displayUser.avatarColor }}>{initial}</div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </button>
              <input type="file" ref={avatarInputRef} accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </>
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shrink-0">
              {isImageAvatar ? (
                <img src={displayUser.avatarColor} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold" style={{ backgroundColor: displayUser.avatarColor }}>{initial}</div>
              )}
            </div>
          )}

          {/* Name — underline ONLY under name, not under role badge */}
          <div className="min-w-0 flex-1">
            {isOwnProfile && editingName ? (
              <input
                type="text"
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={saveName}
                onKeyDown={handleNameKey}
                autoFocus
                className="text-xl sm:text-2xl font-bold text-[#0A0A0A] bg-transparent border-b-2 border-[#0A0A0A] outline-none w-full"
              />
            ) : (
              <button onClick={startEditName} className="text-left group inline-flex items-center gap-2 flex-wrap py-1">
                <h1 className="text-xl sm:text-2xl font-bold text-[#0A0A0A] border-b-2 border-transparent group-hover:border-[#0A0A0A] transition-colors inline-block">{displayUser.name}</h1>
                {roleLabel && <span className="text-[11px] bg-[#0A0A0A] text-white px-2 py-0.5 rounded font-bold">{roleLabel}</span>}
              </button>
            )}
            {saved && <span className="text-[11px] text-emerald-600 mt-1 inline-block">Сохранено ✓</span>}
            {isOwnProfile && <p className="text-[12px] text-[#999] mt-0.5">{displayUser.email}</p>}
            <p className="text-[11px] text-[#B0B0B0] mt-0.5">{subLabel}</p>
          </div>
        </div>

        {/* Stats */}
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

        {/* User tracks — use the SAME SoundCard/ListSoundCard as main page */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {userSounds.map(s => (
                <SoundCard key={s.id} sound={s} user={user} isPlaying={playingId === s.id} playProgress={playingId === s.id ? playProgress : 0} currentTime={playingId === s.id ? currentTime : 0}
                  onTogglePlay={() => togglePlay(s)} onSeek={handleSeek} onDownloadClick={() => onDownloadClick(s)} onAuthorClick={(aid) => onAuthorClick(aid)} />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {userSounds.map(s => (
                <ListSoundCard key={s.id} sound={s} user={user} isPlaying={playingId === s.id} playProgress={playingId === s.id ? playProgress : 0} currentTime={playingId === s.id ? currentTime : 0}
                  onTogglePlay={() => togglePlay(s)} onSeek={handleSeek} onDownloadClick={() => onDownloadClick(s)} onAuthorClick={(aid) => onAuthorClick(aid)} />
              ))}
            </div>
          )}
        </div>

        {isOwnProfile && (
          <button onClick={() => { onLogout(); onClose(); }} className="w-full py-2.5 border border-[#E5E5E5] text-[#6B6B6B] text-[13px] font-medium rounded-xl hover:bg-[#F5F5F5] hover:text-[#0A0A0A] transition-colors">Выйти</button>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
