import React from 'react';
import { CloseIcon, DownloadIcon } from './Icons';
import { UserSound, User } from '../store/useStore';

interface DownloadModalProps { isOpen: boolean; onClose: () => void; sound: UserSound | null; user: User | null; onDownload: (soundId: string, format: string) => void; onOpenPremium: () => void; onOpenAuth: () => void; }

const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
);

const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, sound, user, onDownload, onOpenPremium, onOpenAuth }) => {
  if (!isOpen || !sound) return null;
  const sub = user?.subscription || 'none';
  const formats = [
    { id: 'mp3', name: 'MP3', size: '~3 MB', available: true },
    { id: 'wav', name: 'WAV', size: '~15 MB', available: sub === 'hd' || sub === 'ultra' },
    { id: 'flac', name: 'FLAC', size: '~25 MB', available: sub === 'ultra' },
  ];
  const handleClick = (f: { id: string; available: boolean }) => { if (!user) { onOpenAuth(); return; } if (!f.available) { onOpenPremium(); return; } onDownload(sound.id, f.id); onClose(); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl shadow-black/8 animate-scale-in p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors"><CloseIcon size={18} /></button>
        <h2 className="text-lg font-bold text-[#0A0A0A] mb-1">Скачать звук</h2>
        <p className="text-[12px] text-[#999] mb-5 truncate">{sound.title}</p>
        <div className="space-y-2">
          {formats.map((f) => (
            <button key={f.id} onClick={() => handleClick(f)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${f.available ? 'border-[#E5E5E5] hover:border-[#0A0A0A] hover:bg-[#FAFAFA]' : 'border-[#F0F0F0] bg-[#FAFAFA]'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[11px] ${f.available ? 'bg-[#0A0A0A] text-white' : 'bg-[#E5E5E5] text-[#999]'}`}>{f.name}</div>
                <div className="text-left"><div className="text-[11px] text-[#999]">{f.size}</div></div>
              </div>
              {f.available ? <DownloadIcon size={16} className="text-[#0A0A0A]" /> : <div className="flex items-center gap-1.5 text-[11px] text-[#999]"><LockIcon className="text-[#C0C0C0]" />{f.id === 'wav' ? 'HD' : 'Ultra'}</div>}
            </button>
          ))}
        </div>
        {sub === 'none' && (
          <div className="mt-4 p-3 bg-[#F8F8F8] rounded-xl">
            <p className="text-[11px] text-[#6B6B6B] mb-2">Получите доступ к WAV и FLAC форматам с подпиской</p>
            <button onClick={onOpenPremium} className="w-full py-2 bg-[#0A0A0A] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1A1A1A] transition-all">Выбрать подписку</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadModal;
