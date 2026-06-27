import { useState, useEffect } from 'react';

interface CookieSettings { necessary: boolean; analytics: boolean; functional: boolean; }

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({ necessary: true, analytics: true, functional: true });

  useEffect(() => { if (!localStorage.getItem('cookie_consent')) setVisible(true); }, []);

  const save = (s: CookieSettings) => { localStorage.setItem('cookie_consent', JSON.stringify(s)); setVisible(false); setShowSettings(false); };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[150] max-w-sm w-[calc(100%-2rem)] sm:w-80">
      <div className="rounded-2xl bg-white shadow-2xl border border-[#E5E5E5] p-5">
        {!showSettings ? (
          <>
            <h3 className="text-[13px] font-bold text-[#0A0A0A] mb-1">Файлы Cookie</h3>
            <p className="text-[11px] text-[#999] mb-4 leading-relaxed">Мы используем файлы cookie для улучшения работы сайта. Принимая, вы соглашаетесь с их использованием.</p>
            <div className="flex gap-2">
              <button onClick={() => save({ necessary: true, analytics: true, functional: true })} className="flex-1 rounded-xl bg-[#0A0A0A] py-2 text-[11px] font-semibold text-white hover:bg-[#1A1A1A] transition-all">Принимаю</button>
              <button onClick={() => setShowSettings(true)} className="flex-1 rounded-xl border border-[#E5E5E5] py-2 text-[11px] font-semibold text-[#6B6B6B] hover:bg-[#F5F5F5] transition-all">Настроить</button>
              <button onClick={() => save({ necessary: true, analytics: false, functional: false })} className="flex-1 rounded-xl border border-[#E5E5E5] py-2 text-[11px] font-semibold text-[#B0B0B0] hover:bg-[#F5F5F5] transition-all">Отклонить</button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-[13px] font-bold text-[#0A0A0A] mb-3">Настройки Cookie</h3>
            <div className="space-y-2.5 mb-4">
              <label className="flex items-center justify-between text-[11px] text-[#6B6B6B]"><span>Обязательные</span><input type="checkbox" checked disabled className="accent-[#0A0A0A] opacity-50" /></label>
              <label className="flex items-center justify-between text-[11px] text-[#6B6B6B]"><span>Аналитика</span><input type="checkbox" checked={settings.analytics} onChange={e => setSettings({ ...settings, analytics: e.target.checked })} className="accent-[#0A0A0A]" /></label>
              <label className="flex items-center justify-between text-[11px] text-[#6B6B6B]"><span>Функциональные</span><input type="checkbox" checked={settings.functional} onChange={e => setSettings({ ...settings, functional: e.target.checked })} className="accent-[#0A0A0A]" /></label>
            </div>
            <div className="flex gap-2">
              <button onClick={() => save(settings)} className="flex-1 rounded-xl bg-[#0A0A0A] py-2 text-[11px] font-semibold text-white hover:bg-[#1A1A1A] transition-all">Сохранить</button>
              <button onClick={() => setShowSettings(false)} className="flex-1 rounded-xl border border-[#E5E5E5] py-2 text-[11px] font-semibold text-[#6B6B6B] hover:bg-[#F5F5F5] transition-all">Назад</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
