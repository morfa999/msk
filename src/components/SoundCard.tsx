import React from 'react';
import { UserSound, User } from '../store/useStore';
import { PlayIcon, PauseIcon, DownloadIcon, TagIcon } from './Icons';
import WaveformVisualizer from './WaveformVisualizer';

interface SoundCardProps {
  sound: UserSound; isPlaying: boolean; playProgress: number; currentTime: number;
  user?: User | null; onTogglePlay: () => void; onSeek: (progress: number) => void;
  onDownloadClick: () => void; onPremiumClick?: () => void; onAuthorClick?: (authorId: string) => void; animationDelay?: number;
}

const LockIcon: React.FC<{ size?: number; className?: string }> = ({ size = 12, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
);
const PlayCountIcon: React.FC<{ size?: number; className?: string }> = ({ size = 11, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3" /></svg>
);

const SoundCard: React.FC<SoundCardProps> = ({ sound, isPlaying, playProgress, currentTime, user, onTogglePlay, onSeek, onDownloadClick, onPremiumClick, onAuthorClick }) => {
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  const isPremium = !sound.isFree;
  const userSubscribed = !!user && (user.isAdmin || user.subscription === 'hd' || user.subscription === 'ultra');
  const canDownload = !isPremium || userSubscribed;
  const playCount = sound.playCount || 0;

  return (
    <div className={`bg-white border rounded-2xl p-5 ${isPlaying ? 'border-[#0A0A0A]/15' : 'border-[#EBEBEB] hover:border-[#D4D4D4]'}`}>
      <div className="flex items-start justify-between mb-3.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-[14px] font-semibold text-[#0A0A0A] truncate leading-tight">{sound.title}</h3>
            {sound.isNew && <span className="shrink-0 px-1.5 py-0.5 bg-[#0A0A0A] text-white text-[9px] font-bold uppercase tracking-[0.08em] rounded-[4px]">New</span>}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#B0B0B0]">
            <span className="inline-flex items-center px-2 py-0.5 bg-[#F5F5F5] rounded-md text-[#6B6B6B] font-medium">{sound.category}</span>
            <span className="text-[#D0D0D0]">·</span>
            <button onClick={() => onAuthorClick?.(sound.authorId)} className="text-[#0A0A0A] font-medium hover:underline truncate">{sound.authorName}</button>
          </div>
        </div>
      </div>
      <div className="mb-3.5 px-0.5">
        <WaveformVisualizer waveform={sound.waveform} progress={isPlaying ? playProgress : 0} onSeek={onSeek} height={42} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onTogglePlay} disabled={!sound.fileData}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-100 ${!sound.fileData ? 'bg-[#F3F3F3] text-[#C0C0C0] cursor-not-allowed' : isPlaying ? 'bg-[#0A0A0A] text-white' : 'bg-[#F3F3F3] text-[#0A0A0A] hover:bg-[#E8E8E8]'}`}>
            {isPlaying ? <PauseIcon size={13} /> : <PlayIcon size={13} />}
          </button>
          <span className="text-[11px] text-[#B0B0B0] tabular-nums">{isPlaying ? fmtTime(currentTime) : sound.duration}</span>
          <span className="text-[10px] text-[#B0B0B0] tabular-nums font-medium inline-flex items-center gap-1">
            <PlayCountIcon size={9} />{playCount > 0 ? (playCount >= 1000 ? `${(playCount / 1000).toFixed(1)}k` : playCount) : 0}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1">
            {sound.tags.slice(0, 2).map(tag => (
              <span key={tag} className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium text-[#B0B0B0] bg-[#FAFAFA] border border-[#F0F0F0] rounded-full"><TagIcon size={7} />{tag}</span>
            ))}
          </div>
          {canDownload ? (
            <button onClick={onDownloadClick} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold rounded-xl bg-[#0A0A0A] text-white hover:bg-[#1A1A1A]">
              <DownloadIcon size={12} />Скачать
            </button>
          ) : (
            <button onClick={onPremiumClick} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold rounded-xl bg-[#E5E5E5] text-[#999] hover:bg-[#D4D4D4]">
              <LockIcon size={12} />Premium
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoundCard;
