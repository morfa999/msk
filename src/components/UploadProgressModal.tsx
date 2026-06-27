import React from 'react';

interface Props {
  isOpen: boolean;
  progress: number; // 0-100
  title: string;
  filename: string;
  status: 'uploading' | 'saving' | 'done' | 'error';
  errorMessage?: string;
}

const UploadProgressModal: React.FC<Props> = ({ isOpen, progress, title, filename, status, errorMessage }) => {
  if (!isOpen) return null;

  const statusText = status === 'uploading' ? 'Загружаем файл...' : status === 'saving' ? 'Сохраняем в базу данных...' : status === 'done' ? 'Готово!' : 'Ошибка';
  const isError = status === 'error';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 animate-fade-in" />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl shadow-black/20 animate-scale-in p-6">
        <div className="text-center mb-4">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isError ? 'bg-red-100' : status === 'done' ? 'bg-emerald-100' : 'bg-[#0A0A0A]'}`}>
            {isError ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            ) : status === 'done' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            )}
          </div>
          <h3 className="text-[15px] font-bold text-[#0A0A0A] mb-1">{title}</h3>
          <p className="text-[11px] text-[#999] truncate">{filename}</p>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#6B6B6B]">{statusText}</span>
          <span className="text-[11px] font-bold text-[#0A0A0A] tabular-nums">{Math.round(progress)}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-200 ease-out ${isError ? 'bg-red-500' : 'bg-[#0A0A0A]'}`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
        {errorMessage && <p className="text-[11px] text-red-500 text-center mt-3">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default UploadProgressModal;
