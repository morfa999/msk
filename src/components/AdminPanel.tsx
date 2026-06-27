import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CloseIcon, PlayIcon, PauseIcon } from './Icons';

interface AdminUser { id: string; name: string; email: string; avatarColor: string; subscription: string; createdAt: string; }
interface PendingSound { id: string; title: string; category: string; authorName: string; authorId: string; dateAdded: string; fileData?: string; fileName?: string; duration: string; isFree: boolean; tags: string[]; }
interface AdminSound { id: string; title: string; category: string; authorName: string; downloads: number; dateAdded: string; }

let authToken: string | null = null;
function readTk() { const m = document.cookie.match(/(?:^|; )ks_token=([^;]*)/); return m ? decodeURIComponent(m[1]) : null; }

async function adminApi(path: string, body?: unknown) {
  const tk = authToken || readTk();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (tk) headers['Authorization'] = `Bearer ${tk}`;
  const res = await fetch(`/api${path}`, body !== undefined ? { method: 'POST', headers, body: JSON.stringify(body) } : { headers });
  return res.json();
}

interface Props { isOpen: boolean; onClose: () => void; onRefresh: () => void; }

const AdminPanel: React.FC<Props> = ({ isOpen, onClose, onRefresh }) => {
  const [tab, setTab] = useState<'sounds' | 'pending' | 'users'>('sounds');
  const [sounds, setSounds] = useState<AdminSound[]>([]);
  const [pending, setPending] = useState<PendingSound[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(async () => {
    const [s, p, u] = await Promise.all([adminApi('/admin/sounds'), adminApi('/admin/pending'), adminApi('/admin/users')]);
    if (Array.isArray(s)) setSounds(s);
    if (Array.isArray(p)) setPending(p);
    if (Array.isArray(u)) setUsers(u);
  }, []);

  useEffect(() => { if (isOpen) load(); }, [isOpen, load]);

  const deleteSound = async (id: string) => {
    await adminApi('/admin/sounds/delete', { soundId: id });
    setSounds(p => p.filter(s => s.id !== id));
    onRefresh();
  };

  const approveSound = async (id: string) => {
    await adminApi('/admin/pending/approve', { soundId: id });
    setPending(p => p.filter(s => s.id !== id));
    onRefresh();
  };

  const rejectSound = async (id: string) => {
    await adminApi('/admin/pending/reject', { soundId: id });
    setPending(p => p.filter(s => s.id !== id));
  };

  const deleteUser = async (id: string) => {
    await adminApi('/admin/users/delete', { userId: id });
    setUsers(p => p.filter(u => u.id !== id));
  };

  const togglePlay = (fileData?: string, id?: string) => {
    if (playingId === id) { audioRef.current?.pause(); setPlayingId(null); return; }
    audioRef.current?.pause();
    if (!fileData) return;
    const a = new Audio(fileData); audioRef.current = a;
    a.play().catch(() => {}); a.onended = () => setPlayingId(null);
    setPlayingId(id || null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#FAFAFA] overflow-y-auto animate-fade-in">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[#0A0A0A]">Админ-панель</h1>
          <button onClick={onClose} className="p-2 text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors"><CloseIcon size={20} /></button>
        </div>

        <div className="flex gap-4 mb-6 border-b border-[#EBEBEB]">
          {(['sounds', 'pending', 'users'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`relative pb-3 text-[13px] font-medium transition-all ${tab === t ? 'text-[#0A0A0A]' : 'text-[#999] hover:text-[#6B6B6B]'}`}>
              {t === 'sounds' ? `Треки (${sounds.length})` : t === 'pending' ? `Запросы (${pending.length})` : `Аккаунты (${users.length})`}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0A0A0A] rounded-full" />}
            </button>
          ))}
        </div>

        {tab === 'sounds' && (
          <div className="space-y-1.5">
            {sounds.length === 0 ? <p className="text-[13px] text-[#999] py-8 text-center">Нет треков</p> : sounds.map(s => (
              <div key={s.id} className="flex items-center gap-3 bg-white border border-[#EBEBEB] rounded-xl px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#0A0A0A] truncate">{s.title}</div>
                  <div className="text-[10px] text-[#999]">{s.authorName} · {s.category} · {s.downloads} скач.</div>
                </div>
                <button onClick={() => deleteSound(s.id)} className="px-3 py-1 text-[10px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all">Удалить</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'pending' && (
          <div className="space-y-2">
            {pending.length === 0 ? <p className="text-[13px] text-[#999] py-8 text-center">Нет запросов на модерацию</p> : pending.map(s => (
              <div key={s.id} className="bg-white border border-[#EBEBEB] rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => togglePlay(s.fileData, s.id)} className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all ${playingId === s.id ? 'bg-[#0A0A0A] text-white' : 'bg-[#F3F3F3] text-[#0A0A0A] hover:bg-[#E8E8E8]'}`}>
                    {playingId === s.id ? <PauseIcon size={11} /> : <PlayIcon size={11} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[#0A0A0A] truncate">{s.title}</div>
                    <div className="text-[10px] text-[#999]">от {s.authorName} · {s.category} · {s.duration} · {s.isFree ? 'Free' : 'Premium'}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => approveSound(s.id)} className="px-3 py-1 text-[10px] font-semibold text-white bg-[#0A0A0A] rounded-lg hover:bg-[#1A1A1A] transition-all">Принять</button>
                    <button onClick={() => rejectSound(s.id)} className="px-3 py-1 text-[10px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all">Отказать</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-1.5">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 bg-white border border-[#EBEBEB] rounded-xl px-4 py-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ backgroundColor: u.avatarColor }}>{u.name.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#0A0A0A] truncate">{u.name}</div>
                  <div className="text-[10px] text-[#999]">{u.email} · {u.subscription === 'none' ? 'Free' : u.subscription}</div>
                </div>
                <button onClick={() => deleteUser(u.id)} className="px-3 py-1 text-[10px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all">Удалить</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
