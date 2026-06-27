import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';

interface Broadcast { id: string; title: string; body: string; createdAt: string; read: boolean; }

interface Props { isOpen: boolean; onClose: () => void; onCountChange: (n: number) => void; }

async function api(path: string, body?: unknown) {
  const tk = document.cookie.match(/(?:^|; )ks_token=([^;]*)/)?.[1];
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (tk) h['Authorization'] = `Bearer ${decodeURIComponent(tk)}`;
  try {
    const r = await fetch(`/api${path}`, body !== undefined ? { method: 'POST', headers: h, body: JSON.stringify(body) } : { headers: h });
    return await r.json();
  } catch { return null; }
}

const NotificationsDropdown: React.FC<Props> = ({ isOpen, onClose, onCountChange }) => {
  const [items, setItems] = useState<Broadcast[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      const data = await api('/broadcasts');
      if (data?.broadcasts) {
        setItems(data.broadcasts);
        onCountChange(data.unread || 0);
      }
    };
    load();
  }, [isOpen, onCountChange]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  const markRead = async (id: string) => {
    await api('/broadcasts/mark-read', { broadcastId: id });
    setItems(prev => prev.map(it => it.id === id ? { ...it, read: true } : it));
    onCountChange(items.filter(it => !it.read && it.id !== id).length);
  };

  if (!isOpen) return null;

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#E5E5E5] rounded-xl shadow-xl shadow-black/8 z-50 animate-scale-in origin-top-right max-h-[420px] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-[#F0F0F0] px-4 py-3 flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-[#0A0A0A]">Уведомления</h3>
        <button onClick={onClose} className="p-1 text-[#B0B0B0] hover:text-[#0A0A0A]"><CloseIcon size={14} /></button>
      </div>
      <div className="p-2">
        {items.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-[#999]">Нет уведомлений</div>
        ) : items.map(it => (
          <button key={it.id} onClick={() => markRead(it.id)}
            className={`w-full text-left p-3 rounded-lg transition-colors mb-1 ${it.read ? 'bg-transparent hover:bg-[#FAFAFA]' : 'bg-[#F0F7FF] hover:bg-[#E8F0FE]'}`}>
            <div className="text-[13px] font-semibold text-[#0A0A0A] mb-1">{it.title}</div>
            <div className="text-[11px] text-[#6B6B6B] leading-relaxed line-clamp-2">{it.body}</div>
            <div className="text-[10px] text-[#B0B0B0] mt-1">{(() => { try { const d = new Date(it.createdAt); return isNaN(d.getTime()) ? '' : d.toLocaleString('ru'); } catch { return ''; } })()}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NotificationsDropdown;
