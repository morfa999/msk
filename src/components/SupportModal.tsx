import React, { useState } from 'react';
import { CloseIcon } from './Icons';
import { useNotify } from '../notify';

interface Props { isOpen: boolean; onClose: () => void; isLoggedIn: boolean; onOpenAuth: () => void; }

const SupportModal: React.FC<Props> = ({ isOpen, onClose, isLoggedIn, onOpenAuth }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { success, error: notifyErr } = useNotify();

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!isLoggedIn) { notifyErr('Войдите в аккаунт, чтобы отправить репорт'); onOpenAuth(); return; }
    if (!message.trim()) { notifyErr('Введите сообщение'); return; }
    setSending(true);
    try {
      const tk = document.cookie.match(/(?:^|; )ks_token=([^;]*)/)?.[1];
      const h: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tk) h['Authorization'] = `Bearer ${decodeURIComponent(tk)}`;
      const r = await fetch('/api/reports', { method: 'POST', headers: h, body: JSON.stringify({ message: message.trim() }) });
      const data = await r.json();
      if (data?.ok) { success('Репорт отправлен'); setMessage(''); onClose(); }
      else notifyErr(data?.error || 'Ошибка отправки');
    } catch { notifyErr('Ошибка сети'); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-black/8 animate-scale-in p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors"><CloseIcon size={18} /></button>
        <h2 className="text-lg font-bold text-[#0A0A0A] mb-1">Тех.поддержка</h2>
        <p className="text-[12px] text-[#999] mb-4">{isLoggedIn ? 'Опишите проблему — администратор прочитает и ответит' : 'Войдите, чтобы отправить репорт'}</p>
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Что сломалось? Что не так?" rows={6}
          className="w-full px-4 py-3 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#0A0A0A] transition-all resize-none" />
        <button onClick={handleSend} disabled={sending || !message.trim()} className="w-full mt-3 py-3 bg-[#0A0A0A] text-white text-[13px] font-semibold rounded-xl hover:bg-[#1A1A1A] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">{sending ? 'Отправка...' : isLoggedIn ? 'Отправить репорт' : 'Войти и отправить'}</button>
      </div>
    </div>
  );
};

export default SupportModal;
