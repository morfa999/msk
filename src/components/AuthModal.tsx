import React, { useState } from 'react';
import { CloseIcon } from './Icons';
import { useNotify } from '../notify';
import BotCheck from './BotCheck';

interface AuthModalProps {
  isOpen: boolean; mode: 'login' | 'register'; onClose: () => void; onSwitchMode: () => void;
  onRegister: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onLogin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, mode, onClose, onSwitchMode, onRegister, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [botToken, setBotToken] = useState<string | null>(null);
  const { success, error: notifyError } = useNotify();

  if (!isOpen) return null;
  const isLogin = mode === 'login';

  const handleSubmit = async () => {
    if (!isLogin && !botToken) { notifyError('Пройдите проверку на бота'); return; }
    setLoading(true);
    const res = isLogin ? await onLogin(email, password) : await onRegister(name, email, password);
    setLoading(false);
    if (res.ok) {
      success(isLogin ? 'Вы вошли в аккаунт' : 'Аккаунт создан');
      setEmail(''); setPassword(''); setName(''); setBotToken(null); onClose();
    } else {
      notifyError(res.error || 'Произошла ошибка');
    }
  };

  const handleSwitch = () => { setBotToken(null); onSwitchMode(); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl shadow-black/8 animate-scale-in p-7" onKeyDown={e => e.key === 'Enter' && !loading && handleSubmit()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors"><CloseIcon size={18} /></button>
        <div className="flex items-center gap-2 mb-6">
          <img src="/images/logov.png" alt="Logo" className="h-5 w-auto" />
          <span className="text-[15px] font-bold tracking-tight text-[#0A0A0A]">KITSTUDIO</span>
        </div>
        <h2 className="text-xl font-bold text-[#0A0A0A] mb-1">{isLogin ? 'С возвращением' : 'Создать аккаунт'}</h2>
        <p className="text-[13px] text-[#999] mb-5">{isLogin ? 'Войдите, чтобы скачивать звуки' : 'Зарегистрируйтесь для доступа к библиотеке'}</p>
        <div className="space-y-3">
          {!isLogin && <input type="text" placeholder="Имя" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-all" />}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-all" />
          <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-all" />
          {!isLogin && <BotCheck onVerify={setBotToken} />}
        </div>
        <button onClick={handleSubmit} disabled={loading || (!isLogin && !botToken)} className="w-full mt-5 py-3 bg-[#0A0A0A] text-white text-[13px] font-semibold rounded-xl hover:bg-[#1A1A1A] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">{loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}</button>
        <div className="mt-4 text-center"><button onClick={handleSwitch} className="text-[12px] text-[#999] hover:text-[#0A0A0A] transition-colors">{isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войти'}</button></div>
      </div>
    </div>
  );
};

export default AuthModal;
