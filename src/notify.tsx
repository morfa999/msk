import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CloseIcon } from './components/Icons';

export type NotifyType = 'success' | 'error' | 'info';

interface NotifyItem { id: number; type: NotifyType; message: string; }

interface NotifyContextValue {
  notify: (message: string, type?: NotifyType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const NotifyContext = createContext<NotifyContextValue | null>(null);

const CheckSvg = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const AlertSvg = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
const XSvg = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotifyItem[]>([]);

  const remove = useCallback((id: number) => setItems(p => p.filter(i => i.id !== id)), []);

  const notify = useCallback((message: string, type: NotifyType = 'info') => {
    const id = Date.now() + Math.random();
    setItems(p => [...p, { id, type, message }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const value: NotifyContextValue = {
    notify,
    success: m => notify(m, 'success'),
    error: m => notify(m, 'error'),
    info: m => notify(m, 'info'),
  };

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex flex-col-reverse items-end gap-2">
        {items.map(item => (
          <div key={item.id} className="pointer-events-auto flex items-center gap-2.5 bg-white border border-[#E5E5E5] shadow-xl shadow-black/8 rounded-xl px-3 py-2.5 max-w-sm" style={{ animation: 'notify-up 0.3s ease-out' }}>
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.type === 'success' ? 'bg-emerald-500 text-white' : item.type === 'error' ? 'bg-red-500 text-white' : 'bg-[#E5E5E5] text-[#6B6B6B]'}`}>
              {item.type === 'success' ? <CheckSvg /> : item.type === 'error' ? <XSvg /> : <AlertSvg />}
            </div>
            <span className="text-[12px] font-medium text-[#0A0A0A] leading-snug">{item.message}</span>
            <button onClick={() => remove(item.id)} className="shrink-0 p-1 text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors"><CloseIcon size={12} /></button>
          </div>
        ))}
      </div>
      <style>{`@keyframes notify-up { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </NotifyContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotifyContext);
  if (!ctx) throw new Error('useNotify must be used within NotifyProvider');
  return ctx;
}
