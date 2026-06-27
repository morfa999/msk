import React, { useState, useEffect, useRef } from 'react';
import { WaveformIcon, PlayIcon, PauseIcon, DownloadIcon } from './Icons';
interface Props { soundId: string; onGoHome: () => void; }

const ADMIN_EMAIL = 'energoferon41@gmail.com';

const SoundDetailPage: React.FC<Props> = ({ soundId, onGoHome }) => {
  const [sound, setSound] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchSound = async () => {
      try {
        const r = await fetch(`/api/sounds`);
        const all = await r.json();
        const found = Array.isArray(all) ? all.find((s: any) => s.id === soundId) : null;
        if (found) {
          setSound(found);
          // Fetch author profile
          const r2 = await fetch(`/api/user/${found.authorId}/profile`);
          const data = await r2.json();
          if (data?.ok) setAuthor(data.user);
        }
      } catch {} finally { setLoading(false); }
    };
    fetchSound();
  }, [soundId]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const togglePlay = () => {
    if (!sound?.fileData) return;
    if (playing) { audioRef.current?.pause(); setPlaying(false); return; }
    audioRef.current?.pause();
    const a = new Audio(sound.fileData); audioRef.current = a;
    a.play().catch(() => {});
    a.addEventListener('timeupdate', () => { if (a.duration) setProgress(a.currentTime / a.duration); });
    a.addEventListener('ended', () => { setPlaying(false); setProgress(0); });
    setPlaying(true);
  };

  const handleDownload = () => {
    if (!sound?.fileData || !sound?.fileName) return;
    const link = document.createElement('a');
    link.href = sound.fileData;
    link.download = sound.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Count download
    fetch(`/api/sounds/${sound.id}/download`, { method: 'POST' }).catch(() => {});
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-[14px] text-[#999]">Загрузка...</div>
      </div>
    );
  }

  if (!sound) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="sticky top-0 z-10 bg-white border-b border-[#EBEBEB]">
          <div className="max-w-4xl mx-auto px-6 h-[56px] flex items-center">
            <button onClick={onGoHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/images/logov.png" alt="Logo" className="h-6 w-auto" />
              <span className="text-[15px] font-extrabold text-[#0A0A0A]">KITSTUDIO</span>
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center py-32 text-center">
          <div>
            <WaveformIcon size={32} className="text-[#D0D0D0] mx-auto mb-3" />
            <h2 className="text-base font-semibold text-[#0A0A0A] mb-1">Звук не найден</h2>
            <p className="text-[12px] text-[#B0B0B0]">Возможно, он был удалён</p>
          </div>
        </div>
      </div>
    );
  }

  const isFree = sound.isFree;
  const isAdmin = author?.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#EBEBEB]">
        <div className="max-w-4xl mx-auto px-6 h-[56px] flex items-center">
          <button onClick={onGoHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/images/logov.png" alt="Logo" className="h-6 w-auto" />
            <span className="text-[15px] font-extrabold text-[#0A0A0A]">KITSTUDIO</span>
          </button>
        </div>
      </div>

      {/* Single centered card */}
      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-[#0A0A0A] mb-1">{sound.title}</h1>
              <p className="text-[12px] text-[#999]">{sound.category}</p>
              <p className="text-[11px] text-[#B0B0B0] mt-1">от {sound.authorName}{isAdmin && <span className="ml-2 text-[9px] bg-[#0A0A0A] text-white px-1.5 py-0.5 rounded">ADMIN</span>}</p>
            </div>
            {isFree ? <span className="text-[9px] bg-[#22C55E]/10 text-[#22C55E] px-2 py-0.5 rounded font-bold uppercase">Free</span> : <span className="text-[9px] bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded font-bold uppercase">PRO</span>}
          </div>

          {/* Waveform-style bar */}
          <div className="bg-[#F8F8F8] rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={togglePlay} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${playing ? 'bg-[#0A0A0A] text-white' : 'bg-[#0A0A0A] text-white hover:bg-[#1A1A1A]'}`}>
                {playing ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
              </button>
              <div className="flex-1">
                <div className="text-[12px] text-[#999] mb-1">{playing ? `${fmtTime(progress * (sound.durationSeconds || 0))} / ${sound.duration}` : sound.duration}</div>
                <div className="flex items-center gap-0.5 h-6">
                  {sound.waveform?.slice(0, 80).map((v: number, i: number) => {
                    const played = (i / 80) <= progress;
                    return <div key={i} className={`flex-1 rounded-full ${played ? 'bg-[#0A0A0A]' : 'bg-[#D0D0D0]'}`} style={{ height: `${Math.max(2, v * 24)}px` }} />;
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Action */}
          {isFree ? (
            <button onClick={handleDownload} className="w-full py-3 bg-[#0A0A0A] text-white text-[13px] font-semibold rounded-xl hover:bg-[#1A1A1A] transition-all inline-flex items-center justify-center gap-2">
              <DownloadIcon size={14} />Скачать
            </button>
          ) : (
            <button className="w-full py-3 bg-[#0A0A0A] text-white text-[13px] font-semibold rounded-xl hover:bg-[#1A1A1A] transition-all">Купить и скачать</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoundDetailPage;
