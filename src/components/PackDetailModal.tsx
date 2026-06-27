import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon, PlayIcon, PauseIcon, WaveformIcon } from './Icons';
import { Pack, UserSound } from '../store/useStore';
import { useNotify } from '../notify';

interface Props {
  pack: Pack | null;
  packSounds: UserSound[];
  isOpen: boolean;
  onClose: () => void;
}

const PackDetailModal: React.FC<Props> = ({ pack, packSounds, isOpen, onClose }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { info } = useNotify();

  useEffect(() => {
    if (!isOpen) { audioRef.current?.pause(); setPlayingId(null); }
  }, [isOpen]);

  if (!isOpen || !pack) return null;

  const togglePlay = (sound: UserSound) => {
    if (playingId === sound.id) { audioRef.current?.pause(); setPlayingId(null); return; }
    audioRef.current?.pause();
    if (!sound.fileData) { info('Предпросмотр недоступен'); return; }
    const a = new Audio(sound.fileData); audioRef.current = a;
    a.play().catch(() => info('Предпросмотр недоступен'));
    a.addEventListener('ended', () => { setPlayingId(null); });
    setPlayingId(sound.id);
  };

  const handleDownloadAll = () => {
    info(`Пак "${pack.title}" скоро будет доступен для скачивания в ZIP`);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#FAFAFA] overflow-y-auto animate-fade-in">
      <div className="sticky top-0 z-10 bg-white border-b border-[#EBEBEB]">
        <div className="max-w-4xl mx-auto px-6 h-[56px] flex items-center justify-between">
          <h1 className="text-[15px] font-bold text-[#0A0A0A] truncate">{pack.title}</h1>
          <button onClick={onClose} className="p-2 text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors"><CloseIcon size={20} /></button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Centered card */}
        <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#F3F3F3] flex items-center justify-center">
              <WaveformIcon size={18} className="text-[#0A0A0A]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0A0A0A]">{pack.title}</h2>
              <p className="text-[11px] text-[#999]">{pack.soundCount} звуков · {pack.authorName} · {pack.isFree ? 'Бесплатный' : 'Premium'}</p>
            </div>
          </div>
          <button onClick={handleDownloadAll} className="w-full mt-3 py-2.5 bg-[#0A0A0A] text-white text-[13px] font-semibold rounded-xl hover:bg-[#1A1A1A] transition-all">
            Скачать весь пак (ZIP)
          </button>
        </div>

        {/* Sounds list */}
        <div className="space-y-1.5">
          <h3 className="text-[12px] font-semibold text-[#999] uppercase tracking-wider mb-2">Звуки пака</h3>
          {packSounds.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[#EBEBEB] rounded-xl">
              <p className="text-[12px] text-[#B0B0B0]">Звуки пака</p>
            </div>
          ) : (
            packSounds.map(sound => (
              <div key={sound.id} className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 transition-all ${playingId === sound.id ? 'border-[#0A0A0A]/20 shadow-sm' : 'border-[#EBEBEB]'}`}>
                <button onClick={() => togglePlay(sound)}
                  className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all ${playingId === sound.id ? 'bg-[#0A0A0A] text-white' : 'bg-[#F3F3F3] text-[#0A0A0A] hover:bg-[#E8E8E8]'}`}>
                  {playingId === sound.id ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#0A0A0A] truncate">{sound.title}</div>
                  <div className="text-[10px] text-[#999]">{sound.category} · {sound.duration}</div>
                </div>
                <span className="text-[10px] text-[#B0B0B0]">Только превью</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PackDetailModal;
