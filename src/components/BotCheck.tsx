import { useState, useEffect, useRef } from 'react';

interface Props { onVerify: (token: string) => void; }

export default function BotCheck({ onVerify }: Props) {
  const [state, setState] = useState<'idle' | 'checking' | 'verify' | 'done' | 'failed'>('idle');
  const [pulse, setPulse] = useState(0);
  const interactionsRef = useRef(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (state !== 'checking' && state !== 'verify') return;
    const start = Date.now();
    let frame: number;
    const animate = () => { setPulse(0.35 + 0.25 * Math.sin((Date.now() - start) / 1000 * 5)); frame = requestAnimationFrame(animate); };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [state]);

  const collectSignals = (): Record<string, unknown> => ({
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages?.join(',') || '',
    platform: (navigator as any).platform || 'unknown',
    screenW: screen.width, screenH: screen.height,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    cpuCores: navigator.hardwareConcurrency || 1,
    deviceMemory: (navigator as any).deviceMemory || 'unknown',
    touchPoints: navigator.maxTouchPoints || 0,
    vendor: (navigator as any).vendor || 'unknown',
    online: navigator.onLine,
    interactions: interactionsRef.current,
    timeOnPage: Date.now() - startTimeRef.current,
    webdriver: !!(navigator as any).webdriver,
    hasWebGL: (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch { return false; } })(),
    hasFonts: document.fonts?.size > 0,
  });

  const isBot = (s: Record<string, unknown>): boolean => {
    if ((s as any).webdriver) return true;
    if ((s as any).timeOnPage < 300) return true;
    // On mobile (touch > 0) we don't require mouse interactions
    const isMobile = (s as any).touchPoints > 0;
    if (!isMobile && (s as any).interactions < 1) return true;
    if (!(s as any).hasWebGL && !(s as any).hasFonts) return true;
    return false;
  };

  const startCheck = () => {
    if (state !== 'idle' && state !== 'failed') return;
    setState('checking');
    startTimeRef.current = Date.now();
    interactionsRef.current = 0;

    const onMove = () => { interactionsRef.current++; };
    const onTouch = () => { interactionsRef.current++; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchstart', onTouch);
    document.addEventListener('scroll', onMove);

    setTimeout(() => {
      const s = collectSignals();
      if (isBot(s)) {
        setState('verify');
        setTimeout(() => {
          const s2 = collectSignals();
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('touchstart', onTouch);
          document.removeEventListener('scroll', onMove);
          if (isBot(s2)) { setState('failed'); }
          else { setState('done'); onVerify('bok_' + Date.now().toString(36)); }
        }, 2500);
      } else {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchstart', onTouch);
        document.removeEventListener('scroll', onMove);
        setState('done');
        onVerify('bok_' + Date.now().toString(36));
      }
    }, 1200 + Math.random() * 800);
  };

  return (
    <div className="flex items-center gap-3 mt-1">
      <button onClick={startCheck} disabled={state === 'checking' || state === 'verify' || state === 'done'} type="button"
        className={`relative flex-shrink-0 h-8 w-8 rounded-lg border-2 flex items-center justify-center transition-all ${
          state === 'done' ? 'border-[#0A0A0A] bg-white' : state === 'failed' ? 'border-red-400 bg-white cursor-pointer' :
          state === 'checking' || state === 'verify' ? 'border-[#D4D4D4] bg-white cursor-wait' : 'border-[#D4D4D4] bg-white hover:border-[#0A0A0A] cursor-pointer'
        }`}>
        {state === 'done' ? (
          <svg className="h-3.5 w-3.5 text-[#0A0A0A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
        ) : state === 'failed' ? (
          <svg className="h-3.5 w-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
        ) : (state === 'checking' || state === 'verify') ? (
          <div className="absolute rounded-full bg-[#D4D4D4]/50 transition-all" style={{ width: `${16 + pulse * 28}px`, height: `${16 + pulse * 28}px` }} />
        ) : null}
      </button>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-[#0A0A0A]">
          {state === 'idle' ? 'Подтвердите' : state === 'checking' ? 'Проверка...' : state === 'verify' ? 'Доп. проверка...' : state === 'done' ? 'Проверено' : 'Повторите'}
        </p>
        <p className="text-[10px] text-[#B0B0B0]">
          {state === 'idle' ? 'Нажмите для проверки' : state === 'failed' ? 'Нажмите ещё раз' : state === 'done' ? 'Вы не бот' : 'Анализ сигналов...'}
        </p>
      </div>
    </div>
  );
}
