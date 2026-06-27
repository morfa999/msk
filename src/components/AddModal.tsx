import React, { useState, useRef } from 'react';
import { CloseIcon, WaveformIcon } from './Icons';
import { soundCategories } from '../data/sounds';
import AudioEditor from './AudioEditor';
import UploadProgressModal from './UploadProgressModal';

interface AddModalProps {
  isOpen: boolean; onClose: () => void;
  onAddSound: (data: { title: string; category: string; tags: string[]; isFree: boolean; duration: string; durationSeconds: number; fileData?: string; fileName?: string; }) => void | Promise<unknown>;
}

const UploadIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);
const PencilIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
);
const TrashIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
);

interface AddModalFullProps extends AddModalProps { onUploadComplete?: () => void; }

const AddModal: React.FC<AddModalFullProps> = ({ isOpen, onClose, onUploadComplete }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(soundCategories[0]);
  const [tags, setTags] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState<string | undefined>();
  const [uploading] = useState(false);
  const [audioDuration, setAudioDuration] = useState('0:00');
  const [audioDurationSecs, setAudioDurationSecs] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload progress modal state
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState<'uploading' | 'saving' | 'done' | 'error'>('uploading');
  const [progressError, setProgressError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 50 * 1024 * 1024) { setError('Максимальный размер файла 50MB'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileData(ev.target?.result as string); setFileName(file.name);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
      const audio = new Audio(ev.target?.result as string);
      audio.onloadedmetadata = () => { const s = Math.floor(audio.duration); setAudioDuration(`${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`); setAudioDurationSecs(s); };
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => { setFileData(undefined); setFileName(''); setAudioDuration('0:00'); setAudioDurationSecs(0); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const handleEditorSave = (d: string, n: string) => {
    setFileData(d); setFileName(n); setShowEditor(false);
    const audio = new Audio(d);
    audio.onloadedmetadata = () => { const s = Math.floor(audio.duration); setAudioDuration(`${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`); setAudioDurationSecs(s); };
  };

  // Real upload via XHR with progress
  const uploadSound = (soundData: any) => {
    return new Promise<{ ok: boolean; pending: boolean; error?: string }>((resolve) => {
      const tk = document.cookie.match(/(?:^|; )ks_token=([^;]*)/)?.[1];
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/sounds', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      if (tk) xhr.setRequestHeader('Authorization', `Bearer ${decodeURIComponent(tk)}`);

      setProgressStatus('uploading');
      setProgress(0);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(Math.min(95, pct)); // reserve last 5% for server save
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status === 200 && data?.ok) {
            setProgressStatus('saving');
            setProgress(98);
            setTimeout(() => {
              setProgress(100);
              setProgressStatus('done');
              setTimeout(() => {
                setProgressOpen(false);
                resolve({ ok: true, pending: !!data.pending });
              }, 600);
            }, 400);
          } else {
            setProgressStatus('error');
            setProgressError(data?.error || 'Ошибка');
            setTimeout(() => { setProgressOpen(false); resolve({ ok: false, pending: false, error: data?.error }); }, 2500);
          }
        } catch {
          setProgressStatus('error');
          setProgressError('Некорректный ответ сервера');
          setTimeout(() => setProgressOpen(false), 2500);
        }
      };

      xhr.onerror = () => {
        setProgressStatus('error');
        setProgressError('Ошибка сети');
        setTimeout(() => setProgressOpen(false), 2500);
      };

      xhr.send(JSON.stringify(soundData));
    });
  };

  const handleSubmitSound = async () => {
    setError('');
    if (!title.trim()) { setError('Введите название'); return; }
    if (!fileData) { setError('Загрузите аудио файл'); return; }

    const soundData = {
      title: title.trim(), category, tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      isFree, duration: audioDuration, durationSeconds: audioDurationSecs, fileData, fileName,
    };

    setProgressOpen(true);
    setProgress(0);
    setProgressStatus('uploading');
    setProgressError('');

    const result = await uploadSound(soundData);

    if (result.ok) {
      setTitle(''); setTags(''); setIsFree(true); setFileName(''); setFileData(undefined); setAudioDuration('0:00'); setAudioDurationSecs(0); setError('');
      onUploadComplete?.();
      onClose();
    }
    // Error already shown in modal
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
        <div className="absolute inset-0 bg-black/20 animate-fade-in" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-black/8 animate-scale-in p-6 my-4">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors"><CloseIcon size={18} /></button>
          <h2 className="text-lg font-bold text-[#0A0A0A] mb-5">Добавить звук</h2>

          {error && <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-600 font-medium">{error}</div>}

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1.5 block">Аудио файл *</label>
              <input type="file" ref={fileInputRef} accept=".wav,.mp3,.flac,audio/*" onChange={handleFileChange} className="hidden" />
              {!fileName ? (
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full px-4 py-3 border-2 border-dashed border-[#E5E5E5] rounded-xl text-[13px] font-medium text-[#999] hover:border-[#D4D4D4] transition-all flex items-center justify-center gap-2">
                  <UploadIcon size={16} />{uploading ? 'Загрузка...' : 'Выбрать файл (WAV, MP3, FLAC)'}
                </button>
              ) : (
                <div className="relative px-4 py-3 border border-[#0A0A0A] bg-[#F8F8F8] rounded-xl">
                  <div className="flex items-center gap-2 pr-16">
                    <WaveformIcon size={14} className="text-[#0A0A0A] shrink-0" />
                    <span className="text-[13px] font-medium text-[#0A0A0A] truncate">{fileName}</span>
                    <span className="text-[11px] text-[#999] shrink-0">{audioDuration}</span>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={handleRemoveFile} className="p-1.5 text-[#999] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Удалить"><TrashIcon size={14} /></button>
                    <button onClick={() => setShowEditor(true)} className="p-1.5 text-[#999] hover:text-[#0A0A0A] hover:bg-[#EBEBEB] rounded-lg transition-all" title="Редактировать"><PencilIcon size={14} /></button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1 block">Название *</label>
              <input type="text" placeholder="Midnight Kick 01" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] placeholder:text-[#C0C0C0] focus:outline-none focus:border-[#0A0A0A] transition-all" />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1 block">Категория</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] transition-all">
                {soundCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1 block">Теги</label>
              <input type="text" placeholder="trap, hard, punchy" value={tags} onChange={e => setTags(e.target.value)} className="w-full px-4 py-2.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] placeholder:text-[#C0C0C0] focus:outline-none focus:border-[#0A0A0A] transition-all" />
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setIsFree(true)} className={`flex-1 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all ${isFree ? 'bg-[#0A0A0A] text-white' : 'bg-[#F3F3F3] text-[#6B6B6B]'}`}>Бесплатный</button>
              <button onClick={() => setIsFree(false)} className={`flex-1 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all ${!isFree ? 'bg-[#0A0A0A] text-white' : 'bg-[#F3F3F3] text-[#6B6B6B]'}`}>Premium</button>
            </div>

            <button onClick={handleSubmitSound} disabled={progressOpen} className="w-full mt-2 py-3 bg-[#0A0A0A] text-white text-[13px] font-semibold rounded-xl hover:bg-[#1A1A1A] transition-all active:scale-[0.98] disabled:opacity-50">{progressOpen ? 'Загружаем...' : 'Добавить звук'}</button>
          </div>
        </div>
      </div>

      {showEditor && fileData && <AudioEditor fileData={fileData} fileName={fileName} onSave={handleEditorSave} onClose={() => setShowEditor(false)} />}

      <UploadProgressModal
        isOpen={progressOpen}
        progress={progress}
        title="Загрузка звука"
        filename={fileName}
        status={progressStatus}
        errorMessage={progressError}
      />
    </>
  );
};

export default AddModal;
