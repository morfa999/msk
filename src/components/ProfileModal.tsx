import React, { useState } from 'react';
import { CloseIcon } from './Icons';
import { User } from '../store/useStore';

interface ProfileModalProps { isOpen: boolean; onClose: () => void; user: User; onUpdateName: (name: string) => void; onLogout: () => void; }

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUpdateName, onLogout }) => {
  const [newName, setNewName] = useState(user.name);
  const [saved, setSaved] = useState(false);
  if (!isOpen) return null;
  const initial = user.name.charAt(0).toUpperCase();
  const subLabel = user.subscription === 'ultra' ? 'Sound Ultra' : user.subscription === 'hd' ? 'Sound HD' : 'Без подписки';
  const handleSave = () => { if (newName.trim() && newName.trim() !== user.name) { onUpdateName(newName.trim()); setSaved(true); setTimeout(() => setSaved(false), 2000); } };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl shadow-black/8 animate-scale-in p-7">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors"><CloseIcon size={18} /></button>
        <h2 className="text-lg font-bold text-[#0A0A0A] mb-5">Профиль</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0" style={{ backgroundColor: user.avatarColor }}>{initial}</div>
          <div>
            <div className="text-[14px] font-semibold text-[#0A0A0A]">{user.name}</div>
            <div className="text-[12px] text-[#999]">{user.email}</div>
            <div className="text-[11px] text-[#B0B0B0] mt-0.5">{subLabel}</div>
          </div>
        </div>
        <div className="mb-5">
          <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1.5 block">Изменить ник</label>
          <div className="flex gap-2">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 px-4 py-2.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-all" />
            <button onClick={handleSave} className="px-4 py-2.5 bg-[#0A0A0A] text-white text-[12px] font-semibold rounded-xl hover:bg-[#1A1A1A] transition-all shrink-0">{saved ? 'Сохранено' : 'Сохранить'}</button>
          </div>
        </div>
        {user.subscription !== 'none' && (
          <div className="mb-5 p-4 bg-[#F8F8F8] rounded-xl border border-[#EBEBEB]">
            <div className="text-[12px] font-bold text-[#0A0A0A] mb-1">{subLabel}</div>
            {user.subscription === 'hd' && <ul className="text-[11px] text-[#6B6B6B] space-y-1"><li>• Скачивание premium звуков</li><li>• WAV + MP3 форматы</li><li>• Приоритетные новинки</li></ul>}
            {user.subscription === 'ultra' && <ul className="text-[11px] text-[#6B6B6B] space-y-1"><li>• Безлимитное скачивание</li><li>• WAV + MP3 + FLAC форматы</li><li>• Эксклюзивные звуки</li><li>• Ранний доступ к паками</li><li>• Приоритетная поддержка</li></ul>}
          </div>
        )}
        <button onClick={() => { onLogout(); onClose(); }} className="w-full py-2.5 border border-[#E5E5E5] text-[#6B6B6B] text-[13px] font-medium rounded-xl hover:bg-[#F5F5F5] hover:text-[#0A0A0A] transition-all">Выйти</button>
      </div>
    </div>
  );
};

export default ProfileModal;
