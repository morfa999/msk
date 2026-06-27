import React from 'react';
import { UserSound, User } from '../store/useStore';
import { PlayIcon, PauseIcon, DownloadIcon } from './Icons';
import WaveformVisualizer from './WaveformVisualizer';

interface ListSoundCardProps {
  sound: UserSound; isPlaying: boolean; playProgress: number; currentTime: number;
  user?: User | null; onTogglePlay: () => void; onSeek: (progress: number) => void;
  onDownloadClick: () => void; onPremiumClick?: () => void; onAuthorClick?: (authorId: string) => void;
}

const LockIcon: React.FC<{ size?: number; className?: string }> = ({ size = 11, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
);

const ListSoundCard: React.FC<ListSoundCardProps> = ({ sound, isPlaying, playProgress, currentTime, user, onTogglePlay, onSeek, onDownloadClick, onPremiumClick, onAuthorClick }) => {
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  const isPremium = !sound.isFree;
  const userSubscribed = !!user && (user.isAdmin || user.subscription === 'hd' || user.subscription === 'ultra');
  const canDownload = !isPremium || userSubscribed;

  return (
    <div className={`flex items-center gap-4 bg-white border rounded-xl px-4 py-3 ${isPlaying ? 'border-[#0A0A0A]/15' : 'border-[#EBEBEB] hover:border-[#D4D4D4]'}`}>
      <button onClick={onTogglePlay} disabled={!sound.fileData}
        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all ${!sound.fileData ? 'bg-[#F3F3F3] text-[#C0C0C0] cursor-not-allowed' : isPlaying ? 'bg-[#0A0A0A] text-white shadow-md shadow-black/10' : 'bg-[#F3F3F3] text-[#0A0A0A] hover:bg-[#E8E8E8]'}`}>
        {isPlaying ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
      </button>
      <div className="w-40 shrink-0 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[#0A0A0A] truncate">{sound.title}</span>
          {sound.isNew && <span className="shrink-0 px-1.5 py-0.5 bg-[#0A0A0A] text-white text-[8px] font-bold uppercase tracking-[0.08em] rounded-[3px]">New</span>}
          {isPremium && <span className="shrink-0 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-bold uppercase tracking-[0.08em] rounded-[3px]">PRO</span>}
        </div>
        <button onClick={() => onAuthorClick?.(sound.authorId)} className="text-[11px] text-[#0A0A0A] font-medium hover:underline truncate block">{sound.authorName}</button>
      </div>
      <div className="flex-1 min-w-0 hidden md:block">
        <WaveformVisualizer waveform={sound.waveform} progress={isPlaying ? playProgress : 0} onSeek={onSeek} height={30} />
      </div>
      <span className="text-[11px] text-[#B0B0B0] shrink-0 tabular-nums">{isPlaying ? fmtTime(currentTime) : sound.duration}</span>
      <span className="text-[10px] text-[#B0B0B0] tabular-nums shrink-0 hidden sm:inline font-medium">{sound.playCount ? (sound.playCount >= 1000 ? `${(sound.playCount / 1000).toFixed(1)}k` : sound.playCount) : 0}</span>
      {canDownload ? (
        <button onClick={onDownloadClick} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all bg-[#0A0A0A] text-white hover:bg-[#1A1A1A]"><DownloadIcon size={11} />Скачать</button>
      ) : (
        <button onClick={onPremiumClick} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all bg-[#E5E5E5] text-[#999] hover:bg-[#D4D4D4]"><LockIcon size={11} />Premium</button>
      )}
    </div>
  );
};

export default ListSoundCard;
