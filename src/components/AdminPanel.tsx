import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CloseIcon, PlayIcon, PauseIcon, SearchIcon } from './Icons';

interface AdminUser { id: string; name: string; email: string; avatarColor: string; subscription: string; createdAt: string; }
interface AdminSound { id: string; title: string; category: string; authorName: string; downloads: number; dateAdded: string; fileData?: string; }

let _authToken: string | null = null;
function readTk() { const m = document.cookie.match(/(?:^|; )ks_token=([^;]*)/); return m ? decodeURIComponent(m[1]) : null; }
async function aApi(path: string, body?: unknown) {
  const tk = _authToken || readTk(); if (!_authToken) _authToken = tk;
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (tk) h['Authorization'] = `Bearer ${tk}`;
  const r = await fetch(`/api${path}`, body !== undefined ? { method: 'POST', headers: h, body: JSON.stringify(body) } : { headers: h });
  return r.json();
}

interface Props { isOpen: boolean; onClose: () => void; onRefresh: () => void; }

const AdminPanel: React.FC<Props> = ({ isOpen, onClose, onRefresh }) => {
  const [tab, setTab] = useState<'sounds' | 'pending' | 'users'>('sounds');
  const [sounds, setSounds] = useState<AdminSound[]>([]);
  const [pending, setPending] = useState<AdminSound[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(async () => {
    const [s, p, u] = await Promise.all([aApi('/admin/sounds'), aApi('/admin/pending'), aApi('/admin/users')]);
    if (Array.isArray(s)) setSounds(s);
    if (Array.isArray(p)) setPending(p);
    if (Array.isArray(u)) setUsers(u);
  }, []);

  useEffect(() => { if (isOpen) { load(); setSearch(''); } }, [isOpen, load]);

  const del = async (id: string) => { await aApi('/admin/sounds/delete', { soundId: id }); setSounds(p => p.filter(s => s.id !== id)); onRefresh(); };
  const approve = async (id: string) => { await aApi('/admin/pending/approve', { soundId: id }); setPending(p => p.filter(s => s.id !== id)); onRefresh(); };
  const reject = async (id: string) => { await aApi('/admin/pending/reject', { soundId: id }); setPending(p => p.filter(s => s.id !== id)); };
  const delUser = async (id: string) => { await aApi('/admin/users/delete', { userId: id }); setUsers(p => p.filter(u => u.id !== id)); };

  const togglePlay = (fileData?: string, id?: string) => {
    if (playingId === id) { audioRef.current?.pause(); setPlayingId(null); return; }
    audioRef.current?.pause();
    if (!fileData) return;
    const a = new Audio(fileData); audioRef.current = a;
    a.play().catch(() => {}); a.onended = () => setPlayingId(null);
    setPlayingId(id || null);
  };

  const q = search.toLowerCase().trim();
  const filteredSounds = useMemo(() => !q ? sounds : sounds.filter(s => s.title.toLowerCase().includes(q) || s.authorName.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)), [sounds, q]);
  const filteredPending = useMemo(() => !q ? pending : pending.filter(s => s.title.toLowerCase().includes(q) || s.authorName.toLowerCase().includes(q)), [pending, q]);
  const filteredUsers = useMemo(() => !q ? users : users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)), [users, q]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#FAFAFA] overflow-y-auto animate-fade-in">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[#0A0A0A]">Админ-панель</h1>
          <button onClick={onClose} className="p-2 text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors"><CloseIcon size={20} /></button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0B0B0]"><SearchIcon size={15} /></div>
          <input type="text" placeholder="Поиск по трекам, пользователям..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#0A0A0A] transition-all" />
        </div>

        <div className="flex gap-4 mb-5 border-b border-[#EBEBEB]">
          {(['sounds', 'pending', 'users'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`relative pb-3 text-[13px] font-medium transition-all ${tab === t ? 'text-[#0A0A0A]' : 'text-[#999] hover:text-[#6B6B6B]'}`}>
              {t === 'sounds' ? `Треки (${filteredSounds.length})` : t === 'pending' ? `Запросы (${filteredPending.length})` : `Аккаунты (${filteredUsers.length})`}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0A0A0A] rounded-full" />}
            </button>
          ))}
        </div>

        {tab === 'sounds' && (
          <div className="space-y-1.5">
            {filteredSounds.length === 0 ? <p className="text-[13px] text-[#999] py-8 text-center">Нет треков</p> : filteredSounds.map(s => (
              <div key={s.id} className="flex items-center gap-3 bg-white border border-[#EBEBEB] rounded-xl px-4 py-2.5">
                <button onClick={() => togglePlay(s.fileData, s.id)} className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition-all ${playingId === s.id ? 'bg-[#0A0A0A] text-white' : 'bg-[#F3F3F3] text-[#0A0A0A] hover:bg-[#E8E8E8]'}`}>
                  {playingId === s.id ? <PauseIcon size={10} /> : <PlayIcon size={10} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#0A0A0A] truncate">{s.title}</div>
                  <div className="text-[10px] text-[#999]">{s.authorName} · {s.category} · {s.downloads} скач.</div>
                </div>
                <button onClick={() => del(s.id)} className="px-3 py-1 text-[10px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all shrink-0">Удалить</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'pending' && (
          <div className="space-y-2">
            {filteredPending.length === 0 ? <p className="text-[13px] text-[#999] py-8 text-center">Нет запросов</p> : filteredPending.map(s => (
              <div key={s.id} className="flex items-center gap-3 bg-white border border-[#EBEBEB] rounded-xl px-4 py-3">
                <button onClick={() => togglePlay(s.fileData, s.id)} className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all ${playingId === s.id ? 'bg-[#0A0A0A] text-white' : 'bg-[#F3F3F3] text-[#0A0A0A] hover:bg-[#E8E8E8]'}`}>
                  {playingId === s.id ? <PauseIcon size={11} /> : <PlayIcon size={11} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#0A0A0A] truncate">{s.title}</div>
                  <div className="text-[10px] text-[#999]">от {s.authorName} · {s.category}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => approve(s.id)} className="px-3 py-1 text-[10px] font-semibold text-white bg-[#0A0A0A] rounded-lg hover:bg-[#1A1A1A] transition-all">Принять</button>
                  <button onClick={() => reject(s.id)} className="px-3 py-1 text-[10px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all">Отказать</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-1.5">
            {filteredUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 bg-white border border-[#EBEBEB] rounded-xl px-4 py-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ backgroundColor: u.avatarColor }}>{u.name.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#0A0A0A] truncate">{u.name} {(u as any).isAdmin && <span className="text-[9px] bg-[#0A0A0A] text-white px-1.5 py-0.5 rounded ml-1">ADMIN</span>}</div>
                  <div className="text-[10px] text-[#999]">{u.email} · {u.subscription === 'none' ? 'Free' : u.subscription}</div>
                </div>
                {!(u as any).isAdmin && (
                  <button onClick={async () => { await aApi('/admin/users/set-admin', { userId: u.id, isAdmin: true }); load(); }} className="px-2.5 py-1 text-[10px] font-semibold text-[#0A0A0A] border border-[#E5E5E5] rounded-lg hover:bg-[#F5F5F5] transition-all shrink-0">Админ</button>
                )}
                <button onClick={() => delUser(u.id)} className="px-3 py-1 text-[10px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all shrink-0">Удалить</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
