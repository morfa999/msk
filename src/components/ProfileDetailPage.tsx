import React, { useState, useEffect } from 'react';
import { WaveformIcon, DownloadIcon, PlayIcon, PauseIcon } from './Icons';
const ADMIN_EMAIL = 'energoferon41@gmail.com';

interface Props { userId: string; onGoHome: () => void; }

async function api(path: string) {
  try {
    const tk = document.cookie.match(/(?:^|; )ks_token=([^;]*)/)?.[1];
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (tk) h['Authorization'] = `Bearer ${decodeURIComponent(tk)}`;
    const r = await fetch(`/api${path}`, { headers: h });
    return await r.json();
  } catch { return null; }
}

const ProfileDetailPage: React.FC<Props> = ({ userId, onGoHome }) => {
  const [user, setUser] = useState<any>(null);
  const [sounds, setSounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await api(`/user/${userId}/profile`);
      if (data?.ok) { setUser(data.user); setSounds(data.sounds || []); }
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="text-[14px] text-[#999]">Загрузка...</div></div>;
  if (!user || user.email === ADMIN_EMAIL) {
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
            <h2 className="text-base font-semibold text-[#0A0A0A] mb-1">Профиль не найден</h2>
            <p className="text-[12px] text-[#B0B0B0]">Возможно, аккаунт удалён</p>
          </div>
        </div>
      </div>
    );
  }

  const initial = user.name.charAt(0).toUpperCase();
  const togglePlay = (s: any) => {
    if (playingId === s.id) { setPlayingId(null); return; }
    setPlayingId(s.id);
    const a = new Audio(s.fileData); a.play().catch(() => {}); a.onended = () => setPlayingId(null);
  };

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

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shrink-0" style={{ backgroundColor: user.avatarColor }}>{initial}</div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0A0A0A]">{user.name}</h1>
            <p className="text-[12px] text-[#999] mt-1">{sounds.length} звуков · {sounds.reduce((a: number, s: any) => a + s.downloads, 0)} скачиваний</p>
          </div>
        </div>

        <h2 className="text-[15px] font-bold text-[#0A0A0A] mb-3">Треки {user.name}</h2>
        {sounds.length === 0 ? (
          <div className="text-center py-8 bg-white border border-[#EBEBEB] rounded-xl">
            <p className="text-[12px] text-[#B0B0B0]">Нет загруженных треков</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {sounds.map(s => (
              <div key={s.id} className="flex items-center gap-3 bg-white border border-[#EBEBEB] rounded-xl px-4 py-2.5">
                <button onClick={() => togglePlay(s)} className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all ${playingId === s.id ? 'bg-[#0A0A0A] text-white' : 'bg-[#F3F3F3] text-[#0A0A0A] hover:bg-[#E8E8E8]'}`}>
                  {playingId === s.id ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#0A0A0A] truncate">{s.title}</div>
                  <div className="text-[10px] text-[#999]">{s.category} · {s.duration}</div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#B0B0B0]">
                  <DownloadIcon size={10} />{s.downloads}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDetailPage;
