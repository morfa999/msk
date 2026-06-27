import { useState, useCallback, useEffect } from 'react';

export interface UserSound {
  id: string; title: string; category: string; bpm: number; key: string; duration: string; durationSeconds: number;
  tags: string[]; downloads: number; isFree: boolean; isNew: boolean; waveform: number[]; dateAdded: string;
  authorId: string; authorName: string; fileData?: string; fileName?: string;
}

export interface Pack {
  id: string; title: string; soundCount: number; category: string; isFree: boolean; downloads: number;
  authorId: string; authorName: string; dateAdded: string;
}

export interface User {
  id: string; name: string; email: string; avatarColor: string; subscription: 'none' | 'hd' | 'ultra';
  subscriptionEnd?: string; monthlyDownloads: number; createdAt: string;
}

const API = '/api';

async function api(path: string, body?: unknown) {
  try {
    const res = await fetch(`${API}${path}`, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
    return await res.json();
  } catch { return null; }
}

function loadLocal<T>(key: string, def: T): T { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : def; } catch { return def; } }
function saveLocal(key: string, val: unknown) { localStorage.setItem(key, JSON.stringify(val)); }

export function useStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadLocal('ks_user', null));
  const [allSounds, setAllSounds] = useState<UserSound[]>([]);
  const [allPacks, setAllPacks] = useState<Pack[]>([]);
  const [stats, setStats] = useState({ totalSounds: 0, totalDownloads: 0 });

  // Load data from API
  useEffect(() => {
    api('/sounds').then(d => { if (Array.isArray(d)) setAllSounds(d); });
    api('/packs').then(d => { if (Array.isArray(d)) setAllPacks(d); });
    api('/stats').then(d => { if (d) setStats(d); });
  }, []);

  useEffect(() => { if (currentUser) saveLocal('ks_user', currentUser); else localStorage.removeItem('ks_user'); }, [currentUser]);

  const totalSounds = stats.totalSounds || allSounds.length;
  const totalDownloads = stats.totalDownloads || 0;

  const register = useCallback(async (name: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const res = await api('/register', { name, email, password });
    if (!res) return { ok: false, error: 'Ошибка сети' };
    if (res.ok) setCurrentUser(res.user);
    return res;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const res = await api('/login', { email, password });
    if (!res) return { ok: false, error: 'Ошибка сети' };
    if (res.ok) setCurrentUser(res.user);
    return res;
  }, []);

  const logout = useCallback(() => { setCurrentUser(null); }, []);

  const updateName = useCallback(async (name: string) => {
    if (!currentUser) return;
    await api('/user/update-name', { userId: currentUser.id, name });
    setCurrentUser(u => u ? { ...u, name: name.trim() } : null);
  }, [currentUser]);

  const setSubscription = useCallback(async (sub: 'none' | 'hd' | 'ultra') => {
    if (!currentUser) return;
    const res = await api('/user/subscribe', { userId: currentUser.id, plan: sub });
    if (res?.ok && res.user) setCurrentUser(res.user);
  }, [currentUser]);

  const canDownload = useCallback((sound: UserSound): { ok: boolean; reason?: string } => {
    if (sound.isFree) return { ok: true };
    if (!currentUser) return { ok: false, reason: 'Войдите в аккаунт' };
    if (currentUser.subscription === 'none') return { ok: false, reason: 'Требуется подписка' };
    if (currentUser.subscription === 'hd' && currentUser.monthlyDownloads >= 50) return { ok: false, reason: 'Лимит исчерпан' };
    return { ok: true };
  }, [currentUser]);

  const downloadSound = useCallback(async (soundId: string) => {
    const sound = allSounds.find(s => s.id === soundId); if (!sound) return;
    const check = canDownload(sound); if (!check.ok) return;
    await api(`/sounds/${soundId}/download`, { userId: currentUser?.id });
    setAllSounds(prev => prev.map(s => s.id === soundId ? { ...s, downloads: s.downloads + 1 } : s));
    if (!sound.isFree && currentUser) setCurrentUser(u => u ? { ...u, monthlyDownloads: u.monthlyDownloads + 1 } : null);
    if (sound.fileData && sound.fileName) {
      const link = document.createElement('a'); link.href = sound.fileData; link.download = sound.fileName;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }
  }, [allSounds, canDownload, currentUser]);

  const addSound = useCallback(async (data: { title: string; category: string; tags: string[]; isFree: boolean; duration: string; durationSeconds: number; fileData?: string; fileName?: string }) => {
    if (!currentUser) return;
    await api('/sounds', { ...data, userId: currentUser.id, authorName: currentUser.name });
    // Reload
    const d = await api('/sounds'); if (Array.isArray(d)) setAllSounds(d);
    const s = await api('/stats'); if (s) setStats(s);
  }, [currentUser]);

  const addPack = useCallback(async (data: { title: string; soundCount: number; category: string; isFree: boolean }) => {
    if (!currentUser) return;
    await api('/packs', { ...data, userId: currentUser.id, authorName: currentUser.name });
    const d = await api('/packs'); if (Array.isArray(d)) setAllPacks(d);
  }, [currentUser]);

  const deleteSound = useCallback(async (_soundId: string) => {}, []);
  const deletePack = useCallback(async (_packId: string) => {}, []);

  return { currentUser, allSounds, allPacks, totalSounds, totalDownloads, register, login, logout, updateName, setSubscription, canDownload, downloadSound, addSound, addPack, deleteSound, deletePack };
}
