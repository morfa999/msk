import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

export interface UserSound {
  id: string; title: string; category: string; bpm: number; key: string; duration: string; durationSeconds: number;
  tags: string[]; downloads: number; playCount: number; isFree: boolean; isNew: boolean; waveform: number[]; dateAdded: string;
  authorId: string; authorName: string; fileData?: string; fileName?: string;
}
export interface User {
  id: string; name: string; email: string; avatarColor: string; subscription: 'none' | 'hd' | 'ultra';
  subscriptionEnd?: string; monthlyDownloads: number; createdAt: string; isAdmin?: boolean;
}

let authToken: string | null = null;

function readTk(): string | null { const m = document.cookie.match(/(?:^|; )ks_token=([^;]*)/); return m ? decodeURIComponent(m[1]) : null; }
function writeTk(t: string | null) { if (t) document.cookie = `ks_token=${encodeURIComponent(t)}; path=/; max-age=${30*24*3600}; SameSite=Lax`; else document.cookie = 'ks_token=; path=/; max-age=0'; }

async function api(path: string, body?: unknown) {
  try {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) h['Authorization'] = `Bearer ${authToken}`;
    const r = await fetch(`/api${path}`, body !== undefined ? { method: 'POST', headers: h, body: JSON.stringify(body) } : { headers: h });
    return await r.json();
  } catch { return null; }
}

export function useStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allSounds, setAllSounds] = useState<UserSound[]>([]);
  const [stats, setStats] = useState({ totalSounds: 0, totalDownloads: 0 });
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return; initRef.current = true;
    const saved = readTk(); if (saved) authToken = saved;
    (async () => {
      if (authToken) { const me = await api('/me'); if (me?.ok) setCurrentUser(me.user); else { authToken = null; writeTk(null); } }
      const [s, st] = await Promise.all([api('/sounds'), api('/stats')]);
      if (Array.isArray(s)) setAllSounds(s);
      if (st?.totalSounds !== undefined) setStats(st);
    })();
  }, []);

  const isAdminUser = currentUser?.isAdmin || false;
  const totalSounds = stats.totalSounds || allSounds.length;
  const totalDownloads = stats.totalDownloads || 0;

  const refreshData = useCallback(async () => {
    const [s, st] = await Promise.all([api('/sounds'), api('/stats')]);
    if (Array.isArray(s)) setAllSounds(s);
    if (st?.totalSounds !== undefined) setStats(st);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const r = await api('/register', { name, email, password }); if (!r) return { ok: false, error: 'Ошибка сети' };
    if (r.ok) { authToken = r.token; writeTk(r.token); setCurrentUser(r.user); }
    return { ok: r.ok, error: r.error };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const r = await api('/login', { email, password }); if (!r) return { ok: false, error: 'Ошибка сети' };
    if (r.ok) { authToken = r.token; writeTk(r.token); setCurrentUser(r.user); }
    return { ok: r.ok, error: r.error };
  }, []);

  const logout = useCallback(async () => { await api('/logout', {}); authToken = null; writeTk(null); setCurrentUser(null); }, []);

  const updateName = useCallback(async (name: string) => {
    if (!currentUser) return; const r = await api('/user/update-name', { name }); if (r?.ok) setCurrentUser(r.user);
  }, [currentUser]);

  const updateAvatar = useCallback(async (avatarUrl: string) => {
    if (!currentUser) return; const r = await api('/user/update-avatar', { avatarUrl }); if (r?.ok) setCurrentUser(r.user);
  }, [currentUser]);

  const setSubscription = useCallback(async (sub: 'none' | 'hd' | 'ultra') => {
    if (!currentUser) return; const r = await api('/user/subscribe', { plan: sub }); if (r?.ok) setCurrentUser(r.user);
  }, [currentUser]);

  const canDownload = useCallback((sound: UserSound): { ok: boolean; reason?: string } => {
    if (isAdminUser) return { ok: true };
    if (sound.isFree) return { ok: true };
    if (!currentUser) return { ok: false, reason: 'Войдите в аккаунт' };
    if (currentUser.subscription === 'none') return { ok: false, reason: 'Требуется подписка' };
    if (currentUser.subscription === 'hd' && currentUser.monthlyDownloads >= 50) return { ok: false, reason: 'Лимит исчерпан' };
    return { ok: true };
  }, [currentUser, isAdminUser]);

  const downloadSound = useCallback(async (soundId: string) => {
    const sound = allSounds.find(s => s.id === soundId); if (!sound) return;
    const check = canDownload(sound); if (!check.ok) return;
    await api(`/sounds/${soundId}/download`, {});
    setAllSounds(prev => prev.map(s => s.id === soundId ? { ...s, downloads: s.downloads + 1 } : s));
    if (!sound.isFree && currentUser && !isAdminUser) setCurrentUser(u => u ? { ...u, monthlyDownloads: u.monthlyDownloads + 1 } : null);
    if (sound.fileData && sound.fileName) { const l = document.createElement('a'); l.href = sound.fileData; l.download = sound.fileName; document.body.appendChild(l); l.click(); document.body.removeChild(l); }
  }, [allSounds, canDownload, currentUser, isAdminUser]);

  const addSound = useCallback(async (data: { title: string; category: string; tags: string[]; isFree: boolean; duration: string; durationSeconds: number; fileData?: string; fileName?: string; }): Promise<{ pending: boolean }> => {
    if (!currentUser) return { pending: false };
    const r = await api('/sounds', data);
    if (r?.ok) await refreshData();
    return { pending: r?.pending || false };
  }, [currentUser, refreshData]);

  const trackPlay = useCallback(async (soundId: string, ratio: number = 1) => {
    try {
      await api(`/sounds/${soundId}/play`, { ratio });
       // Only increment locally if server accepted (ratio >= 0.8)
      if (ratio >= 0.8) {
        setAllSounds(prev => prev.map(s => s.id === soundId ? { ...s, playCount: (s.playCount || 0) + 1 } : s));
      }
    } catch {}
  }, []);

  // Memoize the returned object so consumers don't re-render on every parent render
  return useMemo(() => ({
    currentUser, allSounds, totalSounds, totalDownloads,
    register, login, logout, updateName, updateAvatar, setSubscription,
    canDownload, downloadSound, addSound, trackPlay, refreshData
  }), [currentUser, allSounds, totalSounds, totalDownloads]);
}
