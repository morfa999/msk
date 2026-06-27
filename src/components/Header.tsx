import React from 'react';
import { WaveformIcon, PackageIcon } from './Icons';
import { User } from '../store/useStore';

const ADMIN_EMAIL = 'energoferon41@gmail.com';

const PlusIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const ShieldIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);

interface HeaderProps {
  onOpenAuth: (mode: 'login' | 'register') => void; user: User | null; onOpenProfile: () => void;
  onOpenAddSound: () => void; onOpenAdmin?: () => void;
  activeTab: 'sounds' | 'packs'; onTabChange: (tab: 'sounds' | 'packs') => void; onGoHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenAuth, user, onOpenProfile, onOpenAddSound, onOpenAdmin, activeTab, onTabChange, onGoHome }) => {
  const initial = user ? user.name.charAt(0).toUpperCase() : '';
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <header className="sticky top-0 z-50 bg-[#FAFAFA] border-b border-[#EBEBEB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[56px] flex items-center justify-between">
        <button onClick={onGoHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
          <img src="/images/logov.png" alt="Logo" className="h-6 w-auto" />
          <span className="text-[15px] sm:text-[16px] font-extrabold tracking-[-0.02em] text-[#0A0A0A]">KITSTUDIO</span>
        </button>
        <nav className="hidden md:flex items-center gap-6 h-full">
          <button onClick={() => onTabChange('sounds')} className={`relative flex items-center gap-1.5 h-full px-1 text-[13px] font-medium transition-all ${activeTab === 'sounds' ? 'text-[#0A0A0A]' : 'text-[#999] hover:text-[#6B6B6B]'}`}>
            <WaveformIcon size={14} />Звуки{activeTab === 'sounds' && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0A0A0A]" />}
          </button>
          <button onClick={() => onTabChange('packs')} className={`relative flex items-center gap-1.5 h-full px-1 text-[13px] font-medium transition-all ${activeTab === 'packs' ? 'text-[#0A0A0A]' : 'text-[#999] hover:text-[#6B6B6B]'}`}>
            <PackageIcon size={14} />Паки{activeTab === 'packs' && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0A0A0A]" />}
          </button>
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {user ? (
            <>
              {/* Add — icon on mobile, text on desktop */}
              <button onClick={onOpenAddSound} className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3.5 sm:py-2 text-[12px] font-semibold text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#F0F0F0] rounded-lg transition-all" title="Добавить">
                <PlusIcon size={14} />
                <span className="hidden sm:inline">Добавить</span>
              </button>
              {/* Admin — icon on mobile, text on desktop */}
              {isAdmin && onOpenAdmin && (
                <button onClick={onOpenAdmin} className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 text-[12px] font-semibold text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#F0F0F0] rounded-lg transition-all" title="Админ-панель">
                  <ShieldIcon size={13} />
                  <span className="hidden sm:inline">Админ</span>
                </button>
              )}
              <button onClick={onOpenProfile} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold transition-transform hover:scale-105 shrink-0" style={{ backgroundColor: user.avatarColor }}>{initial}</button>
            </>
          ) : (
            <>
              <button onClick={() => onOpenAuth('login')} className="hidden sm:flex px-4 py-2 text-[13px] font-medium text-[#525252] hover:text-[#0A0A0A] transition-colors rounded-lg hover:bg-[#F0F0F0]">Войти</button>
              <button onClick={() => onOpenAuth('register')} className="px-4 sm:px-5 py-2 bg-[#0A0A0A] text-white text-[12px] sm:text-[13px] font-semibold rounded-xl hover:bg-[#1A1A1A] transition-all active:scale-[0.97]">Начать</button>
            </>
          )}
        </div>
      </div>
      <div className="md:hidden border-t border-[#EBEBEB]">
        <div className="flex">
          <button onClick={() => onTabChange('sounds')} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-medium transition-all border-b-2 ${activeTab === 'sounds' ? 'text-[#0A0A0A] border-[#0A0A0A]' : 'text-[#999] border-transparent'}`}><WaveformIcon size={13} />Звуки</button>
          <button onClick={() => onTabChange('packs')} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-medium transition-all border-b-2 ${activeTab === 'packs' ? 'text-[#0A0A0A] border-[#0A0A0A]' : 'text-[#999] border-transparent'}`}><PackageIcon size={13} />Паки</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
