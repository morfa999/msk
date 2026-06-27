import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CloseIcon, PlayIcon, PauseIcon, SearchIcon } from './Icons';

interface AdminUser { id: string; name: string; email: string; avatarColor: string; subscription: string; createdAt: string; isAdmin?: boolean; }
interface AdminSound { id: string; title: string; category: string; authorName: string; downloads: number; dateAdded: string; fileData?: string; }
interface AdminReport { id: string; user_name: string; user_email: string; message: string; status: string; created_at: string; }

import { ADMIN_EMAIL } from '../utils/admin';

function readTk() { const m = document.cookie.match(/(?:^|; )ks_token=([^;]*)/); return m ? decodeURIComponent(m[1]) : null; }
async function aApi(path: string, body?: unknown) {
  const tk = readTk();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (tk) h['Authorization'] = `Bearer ${tk}`;
  const r = await fetch(`/api${path}`, body !== undefined ? { method: 'POST', headers: h, body: JSON.stringify(body) } : { headers: h });
  return r.json();
}

interface Props { isOpen: boolean; onClose: () => void; onRefresh: () => void; }

const AdminPanel: React.FC<Props> = ({ isOpen, onClose, onRefresh }) => {
  const [tab, setTab] = useState<'sounds' | 'pending' | 'users' | 'reports' | 'broadcast'>('sounds');
  const [sounds, setSounds] = useState<AdminSound[]>([]);
  const [pending, setPending] = useState<AdminSound[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [bcTitle, setBcTitle] = useState('');
  const [bcBody, setBcBody] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, u, r] = await Promise.all([aApi('/admin/sounds'), aApi('/admin/pending'), aApi('/admin/users'), aApi('/admin/reports')]);
      if (Array.isArray(s)) setSounds(s);
      if (Array.isArray(p)) setPending(p);
      if (Array.isArray(u)) setUsers(u);
      if (Array.isArray(r)) setReports(r);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isOpen) { load(); setSearch(''); } return () => { audioRef.current?.pause(); }; }, [isOpen, load]);

  const del = async (id: string) => { if (!confirm('Удалить звук?')) return; await aApi('/admin/sounds/delete', { soundId: id }); setSounds(p => p.filter(s => s.id !== id)); onRefresh(); };
  const approve = async (id: string) => { await aApi('/admin/pending/approve', { soundId: id }); setPending(p => p.filter(s => s.id !== id)); onRefresh(); };
  const reject = async (id: string) => { if (!confirm('Отклонить заявку?')) return; await aApi('/admin/pending/reject', { soundId: id }); setPending(p => p.filter(s => s.id !== id)); };
  const delUser = async (id: string, email: string) => {
    if (email === ADMIN_EMAIL) { alert('Главный админ не может удалить себя'); return; }
    if (!confirm('Удалить аккаунт? Звуки останутся на сайте.')) return;
    await aApi('/admin/users/delete', { userId: id });
    setUsers(p => p.filter(u => u.id !== id));
    onRefresh();
  };
  const markReport = async (id: string) => { await aApi('/admin/reports/mark-read', { reportId: id }); setReports(r => r.filter(x => x.id !== id)); };
  const sendBroadcast = async () => {
    if (!bcTitle.trim() || !bcBody.trim()) return;
    await aApi('/admin/broadcasts', { title: bcTitle, body: bcBody });
    setBcTitle(''); setBcBody('');
    alert('Уведомление разослано всем пользователям');
  };
  const toggleAdmin = async (userId: string, grant: boolean) => { await aApi('/admin/users/set-admin', { userId, isAdmin: grant }); await load(); };

  const togglePlay = (fileData?: string, id?: string) => {
    if (playingId === id) { audioRef.current?.pause(); setPlayingId(null); return; }
    audioRef.current?.pause();
    if (!fileData) return;
    let url = fileData;
    if (url.startsWith('data:')) {
      try {
        const [meta, base64] = url.split(',');
        const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'audio/mpeg';
        const bin = atob(base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      } catch {}
    }
    const a = new Audio(url); audioRef.current = a;
    a.play().catch(() => {}); a.onended = () => { URL.revokeObjectURL(url); setPlayingId(null); };
    setPlayingId(id || null);
  };

  const q = search.toLowerCase().trim();
  const fS = useMemo(() => !q ? sounds : sounds.filter(s => s.title.toLowerCase().includes(q) || s.authorName.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)), [sounds, q]);
  const fP = useMemo(() => !q ? pending : pending.filter(s => s.title.toLowerCase().includes(q) || s.authorName.toLowerCase().includes(q)), [pending, q]);
  const fU = useMemo(() => !q ? users : users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)), [users, q]);
  const fR = useMemo(() => !q ? reports : reports.filter(r => r.message.toLowerCase().includes(q) || r.user_name.toLowerCase().includes(q)), [reports, q]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#FAFAFA] overflow-y-auto animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[#0A0A0A]">Админ-панель</h1>
          <button onClick={onClose} className="p-2 text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors"><CloseIcon size={20} /></button>
        </div>
        <div className="relative mb-5">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0B0B0]"><SearchIcon size={15} /></div>
          <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#0A0A0A] transition-all" />
        </div>
        <div className="flex gap-4 mb-5 border-b border-[#EBEBEB] overflow-x-auto">
          {([
            { id: 'sounds' as const, label: `Треки (${fS.length})` },
            { id: 'pending' as const, label: `Запросы (${fP.length})` },
            { id: 'users' as const, label: `Аккаунты (${fU.length})` },
            { id: 'reports' as const, label: `Репорты (${fR.length})` },
            { id: 'broadcast' as const, label: 'Оповещение' },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`relative pb-3 text-[13px] font-medium transition-all whitespace-nowrap ${tab === t.id ? 'text-[#0A0A0A]' : 'text-[#999] hover:text-[#6B6B6B]'}`}>
              {t.label}
              {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0A0A0A] rounded-full" />}
            </button>
          ))}
        </div>

        {loading ? <div className="text-center py-12 text-[13px] text-[#999]">Загрузка...</div> : (
          <>
            {tab === 'sounds' && (
              <div className="space-y-1.5">
                {fS.length === 0 ? <p className="text-[13px] text-[#999] py-8 text-center">Нет треков</p> : fS.map(s => (
                  <div key={s.id} className="flex items-center gap-2 sm:gap-3 bg-white border border-[#EBEBEB] rounded-xl px-3 sm:px-4 py-2.5">
                    <button onClick={() => togglePlay(s.fileData, s.id)} className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition-all ${playingId === s.id ? 'bg-[#0A0A0A] text-white' : 'bg-[#F3F3F3] text-[#0A0A0A] hover:bg-[#E8E8E8]'}`}>{playingId === s.id ? <PauseIcon size={10} /> : <PlayIcon size={10} />}</button>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] sm:text-[13px] font-medium text-[#0A0A0A] truncate">{s.title}</div>
                      <div className="text-[10px] text-[#999] truncate">{s.authorName} · {s.category} · {s.downloads} скач.</div>
                    </div>
                    <button onClick={() => del(s.id)} className="px-2 sm:px-3 py-1 text-[10px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all shrink-0">Удалить</button>
                  </div>
                ))}
              </div>
            )}

            {tab === 'pending' && (
              <div className="space-y-2">
                {fP.length === 0 ? <p className="text-[13px] text-[#999] py-8 text-center">Нет запросов</p> : fP.map(s => (
                  <div key={s.id} className="flex items-center gap-2 sm:gap-3 bg-white border border-[#EBEBEB] rounded-xl px-3 sm:px-4 py-3">
                    <button onClick={() => togglePlay(s.fileData, s.id)} className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all ${playingId === s.id ? 'bg-[#0A0A0A] text-white' : 'bg-[#F3F3F3] text-[#0A0A0A] hover:bg-[#E8E8E8]'}`}>{playingId === s.id ? <PauseIcon size={11} /> : <PlayIcon size={11} />}</button>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] sm:text-[13px] font-medium text-[#0A0A0A] truncate">{s.title}</div>
                      <div className="text-[10px] text-[#999] truncate">от {s.authorName} · {s.category}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => approve(s.id)} className="px-2 sm:px-3 py-1 text-[10px] font-semibold text-white bg-[#0A0A0A] rounded-lg hover:bg-[#1A1A1A] transition-all">Принять</button>
                      <button onClick={() => reject(s.id)} className="px-2 sm:px-3 py-1 text-[10px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all">Отказать</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'users' && (
              <div className="space-y-1.5">
                {fU.length === 0 ? <p className="text-[13px] text-[#999] py-8 text-center">Нет аккаунтов</p> : fU.map(u => (
                  <div key={u.id} className="flex items-center gap-2 sm:gap-3 bg-white border border-[#EBEBEB] rounded-xl px-3 sm:px-4 py-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ backgroundColor: u.avatarColor }}>{u.name.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] sm:text-[13px] font-medium text-[#0A0A0A] truncate">
                        {u.name}
                        {u.isAdmin && <span className="text-[9px] bg-[#0A0A0A] text-white px-1.5 py-0.5 rounded ml-1">{u.email === ADMIN_EMAIL ? 'ДИРЕКТОР' : 'ADMIN'}</span>}
                      </div>
                      <div className="text-[10px] text-[#999] truncate">{u.email} · {u.subscription === 'none' ? 'Free' : u.subscription}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!u.isAdmin ? (
                        <button onClick={() => toggleAdmin(u.id, true)} className="px-2 py-1 text-[9px] font-semibold text-[#6B6B6B] border border-[#E5E5E5] rounded-lg hover:bg-[#F5F5F5] transition-all">+Админ</button>
                      ) : (
                        u.email !== ADMIN_EMAIL && (
                          <button onClick={() => { if (confirm('Убрать админа у ' + u.name + '?')) toggleAdmin(u.id, false); }} className="px-2 py-1 text-[9px] font-semibold text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 transition-all">Убрать админа</button>
                        )
                      )}
                      {u.email !== ADMIN_EMAIL && <button onClick={() => delUser(u.id, u.email)} className="px-2 py-1 text-[10px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all">Удалить</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'reports' && (
              <div className="space-y-2">
                {fR.length === 0 ? <p className="text-[13px] text-[#999] py-8 text-center">Нет репортов</p> : fR.map(r => (
                  <div key={r.id} className="bg-white border border-[#EBEBEB] rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-[13px] font-semibold text-[#0A0A0A]">{r.user_name}</div>
                        <div className="text-[10px] text-[#999]">{r.user_email} · {(() => { try { const d = new Date(r.created_at); return isNaN(d.getTime()) ? '' : d.toLocaleString('ru'); } catch { return ''; } })()}</div>
                      </div>
                      <button onClick={() => markReport(r.id)} className="px-3 py-1 text-[10px] font-semibold text-white bg-[#0A0A0A] rounded-lg hover:bg-[#1A1A1A] transition-all shrink-0">Прочитано</button>
                    </div>
                    <p className="text-[12px] text-[#4B4B4B] leading-relaxed whitespace-pre-wrap">{r.message}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === 'broadcast' && (
              <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
                <h3 className="text-[14px] font-bold text-[#0A0A0A] mb-1">Разослать оповещение</h3>
                <p className="text-[11px] text-[#999] mb-4">Все зарегистрированные пользователи получат это уведомление.</p>
                <input type="text" placeholder="Заголовок" value={bcTitle} onChange={e => setBcTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] transition-all mb-2" />
                <textarea placeholder="Текст объявления..." value={bcBody} onChange={e => setBcBody(e.target.value)} rows={5}
                  className="w-full px-4 py-2.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] transition-all resize-none mb-3" />
                <button onClick={sendBroadcast} disabled={!bcTitle.trim() || !bcBody.trim()} className="w-full py-3 bg-[#0A0A0A] text-white text-[13px] font-semibold rounded-xl hover:bg-[#1A1A1A] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">Разослать</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
