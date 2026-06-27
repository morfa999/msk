import { useState, useCallback, useEffect, useRef } from 'react';

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

// Token stored only in memory — survives page navigations via cookie fallback
let authToken: string | null = null;

// Read token from cookie on load
function readTokenCookie(): string | null {
  const m = document.cookie.match(/(?:^|; )ks_token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function writeTokenCookie(token: string | null) {
  if (token) {
    document.cookie = `ks_token=${encodeURIComponent(token)}; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax`;
  } else {
    document.cookie = 'ks_token=; path=/; max-age=0';
  }
}

async function api(path: string, body?: unknown) {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const res = await fetch(`/api${path}`, body !== undefined ? { method: 'POST', headers, body: JSON.stringify(body) } : { headers });
    return await res.json();
  } catch { return null; }
}

export function useStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allSounds, setAllSounds] = useState<UserSound[]>([]);
  const [allPacks, setAllPacks] = useState<Pack[]>([]);
  const [stats, setStats] = useState({ totalSounds: 0, totalDownloads: 0 });
  const [loaded, setLoaded] = useState(false);
  const initRef = useRef(false);

  // On mount: restore session from cookie, load data
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const saved = readTokenCookie();
    if (saved) authToken = saved;

    const load = async () => {
      // Try restore session
      if (authToken) {
        const me = await api('/me');
        if (me?.ok && me.user) setCurrentUser(me.user);
        else { authToken = null; writeTokenCookie(null); }
      }
      // Load public data
      const [sounds, packs, st] = await Promise.all([api('/sounds'), api('/packs'), api('/stats')]);
      if (Array.isArray(sounds)) setAllSounds(sounds);
      if (Array.isArray(packs)) setAllPacks(packs);
      if (st?.totalSounds !== undefined) setStats(st);
      setLoaded(true);
    };
    load();
  }, []);

  const totalSounds = stats.totalSounds || allSounds.length;
  const totalDownloads = stats.totalDownloads || 0;

  const refreshData = useCallback(async () => {
    const [sounds, packs, st] = await Promise.all([api('/sounds'), api('/packs'), api('/stats')]);
    if (Array.isArray(sounds)) setAllSounds(sounds);
    if (Array.isArray(packs)) setAllPacks(packs);
    if (st?.totalSounds !== undefined) setStats(st);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const res = await api('/register', { name, email, password });
    if (!res) return { ok: false, error: 'Ошибка сети' };
    if (res.ok) {
      authToken = res.token;
      writeTokenCookie(res.token);
      setCurrentUser(res.user);
    }
    return { ok: res.ok, error: res.error };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const res = await api('/login', { email, password });
    if (!res) return { ok: false, error: 'Ошибка сети' };
    if (res.ok) {
      authToken = res.token;
      writeTokenCookie(res.token);
      setCurrentUser(res.user);
    }
    return { ok: res.ok, error: res.error };
  }, []);

  const logout = useCallback(async () => {
    await api('/logout', {});
    authToken = null;
    writeTokenCookie(null);
    setCurrentUser(null);
  }, []);

  const updateName = useCallback(async (name: string) => {
    if (!currentUser) return;
    const res = await api('/user/update-name', { name });
    if (res?.ok && res.user) setCurrentUser(res.user);
  }, [currentUser]);

  const setSubscription = useCallback(async (sub: 'none' | 'hd' | 'ultra') => {
    if (!currentUser) return;
    const res = await api('/user/subscribe', { plan: sub });
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
    const sound = allSounds.find(s => s.id === soundId);
    if (!sound) return;
    const check = canDownload(sound);
    if (!check.ok) return;
    await api(`/sounds/${soundId}/download`, {});
    setAllSounds(prev => prev.map(s => s.id === soundId ? { ...s, downloads: s.downloads + 1 } : s));
    if (!sound.isFree && currentUser) setCurrentUser(u => u ? { ...u, monthlyDownloads: u.monthlyDownloads + 1 } : null);
    if (sound.fileData && sound.fileName) {
      const link = document.createElement('a');
      link.href = sound.fileData;
      link.download = sound.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [allSounds, canDownload, currentUser]);

  const addSound = useCallback(async (data: { title: string; category: string; tags: string[]; isFree: boolean; duration: string; durationSeconds: number; fileData?: string; fileName?: string }) => {
    if (!currentUser) return;
    await api('/sounds', data);
    await refreshData();
  }, [currentUser, refreshData]);

  const addPack = useCallback(async (data: { title: string; soundCount: number; category: string; isFree: boolean }) => {
    if (!currentUser) return;
    await api('/packs', data);
    await refreshData();
  }, [currentUser, refreshData]);

  const deleteSound = useCallback(async (_soundId: string) => {}, []);
  const deletePack = useCallback(async (_packId: string) => {}, []);

  return { currentUser, allSounds, allPacks, totalSounds, totalDownloads, loaded, register, login, logout, updateName, setSubscription, canDownload, downloadSound, addSound, addPack, deleteSound, deletePack };
}
