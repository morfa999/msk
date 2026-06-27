import React, { useState, useEffect } from 'react';
import { User } from '../store/useStore';
import NotificationsDropdown from './NotificationsDropdown';

import { ADMIN_EMAIL } from '../utils/admin';

const BellIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
);

interface HeaderProps {
  onOpenAuth: (mode: 'login' | 'register') => void; user: User | null; onOpenProfile: () => void;
  onOpenAddSound: () => void; onOpenAdmin?: () => void;
  onOpenSupport: () => void; onOpenSubscription: () => void;
  onGoHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenAuth, user, onOpenProfile, onOpenAddSound, onOpenAdmin, onOpenSupport, onOpenSubscription, onGoHome }) => {
  const initial = user ? user.name.charAt(0).toUpperCase() : '';
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const load = async () => {
      try {
        const tk = document.cookie.match(/(?:^|; )ks_token=([^;]*)/)?.[1];
        if (!tk) return;
        const r = await fetch('/api/broadcasts', { headers: { 'Authorization': `Bearer ${decodeURIComponent(tk)}` } });
        const data = await r.json();
        if (data?.unread !== undefined) setUnread(data.unread);
      } catch {}
    };
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [user]);

  // Center text button style with hover underline
  const centerBtn = "relative px-4 py-2 text-[12px] sm:text-[13px] font-semibold text-[#0A0A0A] transition-colors group whitespace-nowrap";

  return (
    <header className="sticky top-0 z-50 bg-[#FAFAFA] border-b border-[#EBEBEB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[56px] flex items-center justify-between">
        {/* LEFT — Logo */}
        <button onClick={onGoHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
          <img src="/images/logov.png" alt="Logo" className="h-6 w-auto" />
          <span className="text-[15px] sm:text-[16px] font-extrabold tracking-[-0.02em] text-[#0A0A0A]">KITSTUDIO</span>
        </button>

        {/* CENTER — Action buttons */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1">
          <button onClick={onOpenSubscription} className={`${centerBtn} inline-flex items-center gap-1.5`}>
            Подписка
            {user?.subscription === 'hd' && <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">HD</span>}
            {user?.subscription === 'ultra' && <span className="text-[9px] bg-gradient-to-r from-amber-400 to-orange-500 text-white px-1.5 py-0.5 rounded font-bold">ULTRA</span>}
            <span className="absolute bottom-1 left-4 right-4 h-[2px] bg-[#0A0A0A] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </button>

          <button onClick={onOpenSupport} className={`${centerBtn} hidden lg:inline-flex`}>
            Тех.поддержка
            <span className="absolute bottom-1 left-4 right-4 h-[2px] bg-[#0A0A0A] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </button>

          {user ? (
            <>
              <button onClick={onOpenAddSound} className={centerBtn}>
                Добавить
                <span className="absolute bottom-1 left-4 right-4 h-[2px] bg-[#0A0A0A] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </button>
              {isAdmin && onOpenAdmin && (
                <button onClick={onOpenAdmin} className={centerBtn}>
                  Админ
                  <span className="absolute bottom-1 left-4 right-4 h-[2px] bg-[#0A0A0A] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </button>
              )}
            </>
          ) : null}
        </div>

        {/* Mobile center buttons (smaller set) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex md:hidden items-center gap-1">
          {user ? (
            <button onClick={onOpenAddSound} className="px-3 py-1.5 text-[12px] font-semibold text-[#0A0A0A] bg-[#F0F0F0] rounded-lg">
              Добавить
            </button>
          ) : (
            <>
              <button onClick={onOpenSubscription} className="px-3 py-1.5 text-[12px] font-semibold text-[#0A0A0A]">Подписка</button>
              <button onClick={onOpenSupport} className="px-3 py-1.5 text-[12px] font-semibold text-[#0A0A0A]">Поддержка</button>
            </>
          )}
        </div>

        {/* RIGHT — Bell + Profile/Auth */}
        <div className="flex items-center gap-1.5 shrink-0">
          {user ? (
            <>
              <div className="relative">
                <button onClick={() => setNotifOpen(v => !v)} className="relative p-2 text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#F0F0F0] rounded-lg transition-all" title="Уведомления">
                  <BellIcon size={16} />
                  {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-yellow-400 text-black text-[10px] font-black rounded-full flex items-center justify-center border border-white">{unread}</span>}
                </button>
                <NotificationsDropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} onCountChange={setUnread} />
              </div>
              <button onClick={onOpenProfile} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold transition-transform hover:scale-105" style={{ backgroundColor: user.avatarColor }}>{initial}</button>
            </>
          ) : (
            <>
              <button onClick={() => onOpenAuth('login')} className="hidden sm:flex px-4 py-1.5 text-[13px] font-medium text-[#525252] hover:text-[#0A0A0A] transition-colors rounded-lg hover:bg-[#F0F0F0]">Войти</button>
              <button onClick={() => onOpenAuth('register')} className="px-4 sm:px-5 py-1.5 bg-[#0A0A0A] text-white text-[12px] sm:text-[13px] font-semibold rounded-xl hover:bg-[#1A1A1A] transition-all active:scale-[0.97]">Начать</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
