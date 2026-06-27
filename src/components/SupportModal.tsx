import React, { useState } from 'react';
import { CloseIcon } from './Icons';
import { useNotify } from '../notify';

interface Props { isOpen: boolean; onClose: () => void; }

const SupportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { success, error: notifyErr } = useNotify();

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!message.trim()) { notifyErr('Введите сообщение'); return; }
    setSending(true);
    try {
      const body: any = { message: message.trim(), name, email };
      const r = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await r.json();
      if (data?.ok) { success('Репорт отправлен'); setMessage(''); setName(''); setEmail(''); onClose(); }
      else notifyErr('Ошибка отправки');
    } catch { notifyErr('Ошибка сети'); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-black/8 animate-scale-in p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors"><CloseIcon size={18} /></button>
        <h2 className="text-lg font-bold text-[#0A0A0A] mb-1">Тех.поддержка</h2>
        <p className="text-[12px] text-[#999] mb-4">Опишите проблему — администратор прочитает и ответит</p>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1 block">Имя</label>
            <input type="text" placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#0A0A0A] transition-all" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1 block">Email</label>
            <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#0A0A0A] transition-all" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1 block">Сообщение *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Что сломалось? Что не так?" rows={5}
              className="w-full px-4 py-2.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#0A0A0A] transition-all resize-none" />
          </div>
        </div>
        <button onClick={handleSend} disabled={sending || !message.trim()} className="w-full py-3 bg-[#0A0A0A] text-white text-[13px] font-semibold rounded-xl hover:bg-[#1A1A1A] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">{sending ? 'Отправка...' : 'Отправить репорт'}</button>
      </div>
    </div>
  );
};

export default SupportModal;
