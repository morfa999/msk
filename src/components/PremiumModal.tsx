import React from 'react';
import { CloseIcon } from './Icons';

interface PremiumModalProps { isOpen: boolean; onClose: () => void; currentSub: 'none' | 'hd' | 'ultra'; onSubscribe: (plan: 'hd' | 'ultra') => void; isLoggedIn: boolean; onOpenAuth: () => void; }

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>
);

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, currentSub, onSubscribe, isLoggedIn, onOpenAuth }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/20 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl shadow-black/8 animate-scale-in p-7 my-4">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors"><CloseIcon size={18} /></button>
        <h2 className="text-xl font-bold text-[#0A0A0A] mb-1">Premium подписки</h2>
        <p className="text-[13px] text-[#999] mb-6">Получите полный доступ к библиотеке звуков</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`relative p-5 rounded-2xl border-2 transition-all ${currentSub === 'hd' ? 'border-[#0A0A0A] bg-[#FAFAFA]' : 'border-[#EBEBEB] hover:border-[#D4D4D4]'}`}>
            {currentSub === 'hd' && <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider bg-[#0A0A0A] text-white px-2 py-0.5 rounded">Активна</span>}
            <div className="text-[15px] font-bold text-[#0A0A0A] mb-1">Sound HD</div>
            <div className="flex items-baseline gap-1 mb-4"><span className="text-3xl font-black text-[#0A0A0A]">299₽</span><span className="text-[12px] text-[#999]">/мес</span></div>
            <ul className="space-y-2 mb-5">
              {['Скачивание premium звуков','WAV + MP3 форматы','До 50 скачиваний в месяц','Приоритетные новинки','Без рекламы'].map(f=><li key={f} className="flex items-start gap-2 text-[12px] text-[#4B4B4B]"><CheckIcon className="text-[#0A0A0A] mt-0.5 shrink-0" />{f}</li>)}
            </ul>
            <button onClick={() => { if (!isLoggedIn) { onOpenAuth(); return; } onSubscribe('hd'); }} disabled={currentSub === 'hd'}
              className={`w-full py-2.5 rounded-xl text-[12px] font-semibold transition-all ${currentSub === 'hd' ? 'bg-[#F3F3F3] text-[#999] cursor-default' : 'bg-[#10B981] text-white hover:bg-[#059669] active:scale-[0.98]'}`}>
              {currentSub === 'hd' ? 'Текущий план' : 'Купить HD'}
            </button>
          </div>
          <div className={`relative p-5 rounded-2xl border-2 transition-all ${currentSub === 'ultra' ? 'border-[#0A0A0A] bg-[#FAFAFA]' : 'border-[#EBEBEB] hover:border-[#D4D4D4]'}`}>
            {currentSub !== 'ultra' && <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider bg-[#0A0A0A] text-white px-2 py-0.5 rounded">Популярный</span>}
            {currentSub === 'ultra' && <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider bg-[#0A0A0A] text-white px-2 py-0.5 rounded">Активна</span>}
            <div className="text-[15px] font-bold text-[#0A0A0A] mb-1">Sound Ultra</div>
            <div className="flex items-baseline gap-1 mb-4"><span className="text-3xl font-black text-[#0A0A0A]">599₽</span><span className="text-[12px] text-[#999]">/мес</span></div>
            <ul className="space-y-2 mb-5">
              {['Безлимитное скачивание','WAV + MP3 + FLAC форматы','Эксклюзивные звуки','Ранний доступ к новым пакам','Приоритетная поддержка','Без рекламы','Коммерческое использование'].map(f=><li key={f} className="flex items-start gap-2 text-[12px] text-[#4B4B4B]"><CheckIcon className="text-[#0A0A0A] mt-0.5 shrink-0" />{f}</li>)}
            </ul>
            <button onClick={() => { if (!isLoggedIn) { onOpenAuth(); return; } onSubscribe('ultra'); }} disabled={currentSub === 'ultra'}
              className={`w-full py-2.5 rounded-xl text-[12px] font-semibold transition-all ${currentSub === 'ultra' ? 'bg-[#F3F3F3] text-[#999] cursor-default' : 'bg-[#10B981] text-white hover:bg-[#059669] active:scale-[0.98]'}`}>
              {currentSub === 'ultra' ? 'Текущий план' : 'Купить Ultra'}
            </button>
          </div>
        </div>
        <div className="mt-5 text-center">
          <a href="https://example.com/subscription-policy" target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors underline">Правила политики подписки</a>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
