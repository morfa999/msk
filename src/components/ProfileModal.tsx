import React, { useState, useEffect } from 'react';
import { CloseIcon, WaveformIcon, DownloadIcon } from './Icons';
import { User, UserSound } from '../store/useStore';

interface ProfileModalProps {
  isOpen: boolean; onClose: () => void; user: User; onUpdateName: (name: string) => void; onLogout: () => void;
  allSounds?: UserSound[]; isOwnProfile?: boolean; viewUserId?: string | null;
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

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUpdateName, onLogout, allSounds = [], isOwnProfile = true, viewUserId }) => {
  const [newName, setNewName] = useState(user.name);
  const [saved, setSaved] = useState(false);
  const [profileData, setProfileData] = useState<{ user: User; sounds: UserSound[] } | null>(null);

  useEffect(() => {
    if (isOpen && viewUserId && !isOwnProfile) {
      fetchUserProfile(viewUserId).then(d => { if (d?.ok) setProfileData(d); });
    }
  }, [isOpen, viewUserId, isOwnProfile]);

  if (!isOpen) return null;

  const displayUser = isOwnProfile ? user : profileData?.user || user;
  const userSounds = isOwnProfile ? allSounds.filter(s => s.authorId === user.id) : profileData?.sounds || [];
  const initial = displayUser.name.charAt(0).toUpperCase();
  const subLabel = displayUser.subscription === 'ultra' ? 'Sound Ultra' : displayUser.subscription === 'hd' ? 'Sound HD' : 'Без подписки';
  const totalDl = userSounds.reduce((a, s) => a + s.downloads, 0);

  const handleSave = () => {
    if (newName.trim() && newName.trim() !== user.name) { onUpdateName(newName.trim()); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#FAFAFA] overflow-y-auto animate-fade-in">
      {/* Banner */}
      <div className="h-32 sm:h-40 bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A] relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/60 hover:text-white bg-black/20 rounded-full transition-colors z-10"><CloseIcon size={18} /></button>
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-12 pb-12">
        {/* Avatar */}
        <div className="flex items-end gap-4 mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[#FAFAFA] flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shrink-0 shadow-lg" style={{ backgroundColor: displayUser.avatarColor }}>{initial}</div>
          <div className="pb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0A0A0A]">{displayUser.name}</h1>
            {isOwnProfile && <p className="text-[12px] text-[#999]">{displayUser.email}</p>}
            <p className="text-[11px] text-[#B0B0B0] mt-0.5">{subLabel}</p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 flex items-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-lg font-black text-[#0A0A0A]">{userSounds.length}</div>
            <div className="text-[10px] text-[#999] font-medium">Загрузок</div>
          </div>
          <div className="w-px h-8 bg-[#EBEBEB]" />
          <div className="text-center">
            <div className="text-lg font-black text-[#0A0A0A]">{totalDl}</div>
            <div className="text-[10px] text-[#999] font-medium">Скачиваний</div>
          </div>
        </div>

        {/* Edit name (own profile only) */}
        {isOwnProfile && (
          <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 mb-6">
            <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-2 block">Изменить ник</label>
            <div className="flex gap-2">
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="flex-1 px-4 py-2.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] transition-all" />
              <button onClick={handleSave} className="px-4 py-2.5 bg-[#0A0A0A] text-white text-[12px] font-semibold rounded-xl hover:bg-[#1A1A1A] transition-all shrink-0">{saved ? 'Сохранено ✓' : 'Сохранить'}</button>
            </div>
          </div>
        )}

        {/* User tracks */}
        <div className="mb-6">
          <h2 className="text-[15px] font-bold text-[#0A0A0A] mb-3">
            {isOwnProfile ? 'Мои треки' : `Треки ${displayUser.name}`}
          </h2>
          {userSounds.length === 0 ? (
            <div className="text-center py-8 bg-white border border-[#EBEBEB] rounded-xl">
              <WaveformIcon size={20} className="text-[#D0D0D0] mx-auto mb-2" />
              <p className="text-[12px] text-[#B0B0B0]">Нет загруженных треков</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {userSounds.map(s => (
                <div key={s.id} className="flex items-center gap-3 bg-white border border-[#EBEBEB] rounded-xl px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[#0A0A0A] truncate">{s.title}</div>
                    <div className="text-[10px] text-[#999]">{s.category} · {s.duration}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#B0B0B0]">
                    <DownloadIcon size={10} />
                    {s.downloads}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout (own profile only) */}
        {isOwnProfile && (
          <button onClick={() => { onLogout(); onClose(); }} className="w-full py-2.5 border border-[#E5E5E5] text-[#6B6B6B] text-[13px] font-medium rounded-xl hover:bg-[#F5F5F5] hover:text-[#0A0A0A] transition-all">Выйти</button>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
