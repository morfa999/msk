import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CloseIcon, PlayIcon, PauseIcon } from './Icons';

interface AudioEditorProps { fileData: string; fileName: string; onSave: (d: string, n: string) => void; onClose: () => void; }

const AudioEditor: React.FC<AudioEditorProps> = ({ fileData, fileName, onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playStartRef = useRef(0);
  const playOffsetRef = useRef(0);
  const rafRef = useRef(0);
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
  const [selStart, setSelStart] = useState<number | null>(null);
  const [selEnd, setSelEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [pitch, setPitch] = useState(0);
  const [isReversed, setIsReversed] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);

  const recalc = useCallback((buf: AudioBuffer) => {
    const ch = buf.getChannelData(0); const n = 800; const bs = Math.floor(ch.length / n);
    const r = new Float32Array(n);
    for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < bs; j++) s += Math.abs(ch[i * bs + j] || 0); r[i] = s / bs; }
    setWaveformData(r);
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const actx = new AudioContext(); audioCtxRef.current = actx;
        const resp = await fetch(fileData); const ab = await resp.arrayBuffer();
        const buf = await actx.decodeAudioData(ab);
        bufferRef.current = buf; setDuration(buf.duration); recalc(buf);
      } catch { /* */ }
      setIsLoading(false);
    })();
    return () => { stopPreview(); audioCtxRef.current?.close(); };
  }, [fileData, recalc]);

  const stopPreview = useCallback(() => {
    if (sourceRef.current) { try { sourceRef.current.stop(); } catch {} sourceRef.current = null; }
    cancelAnimationFrame(rafRef.current);
    setIsPreviewPlaying(false);
    setPreviewProgress(0);
  }, []);

  const togglePreview = useCallback(() => {
    if (isPreviewPlaying) { stopPreview(); return; }
    if (!bufferRef.current || !audioCtxRef.current) return;
    const actx = audioCtxRef.current;
    if (actx.state === 'suspended') actx.resume();
    const source = actx.createBufferSource();
    source.buffer = bufferRef.current;
    source.connect(actx.destination);
    source.onended = () => { stopPreview(); };
    playStartRef.current = actx.currentTime;
    playOffsetRef.current = 0;
    source.start(0);
    sourceRef.current = source;
    setIsPreviewPlaying(true);

    const tick = () => {
      if (!audioCtxRef.current || !bufferRef.current) return;
      const elapsed = audioCtxRef.current.currentTime - playStartRef.current;
      setPreviewProgress(Math.min(1, elapsed / bufferRef.current.duration));
      if (elapsed < bufferRef.current.duration) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [isPreviewPlaying, stopPreview]);

  useEffect(() => {
    if (!waveformData || !canvasRef.current) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); if (!ctx) return;
    const rect = canvas.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height, barW = w / waveformData.length;
    const maxV = Math.max(...Array.from(waveformData)) || 1;
    ctx.clearRect(0, 0, w, h);
    if (selStart !== null && selEnd !== null) {
      const s0 = Math.min(selStart, selEnd), s1 = Math.max(selStart, selEnd);
      ctx.fillStyle = 'rgba(239,68,68,0.12)'; ctx.fillRect(s0 * w, 0, (s1 - s0) * w, h);
      ctx.strokeStyle = 'rgba(239,68,68,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(s0 * w, 0); ctx.lineTo(s0 * w, h); ctx.moveTo(s1 * w, 0); ctx.lineTo(s1 * w, h); ctx.stroke(); ctx.setLineDash([]);
    }
    for (let i = 0; i < waveformData.length; i++) {
      const v = waveformData[i] / maxV, bh = Math.max(1, v * h * 0.85), x = i * barW, y = (h - bh) / 2;
      let sel = false;
      if (selStart !== null && selEnd !== null) { const s0 = Math.min(selStart, selEnd), s1 = Math.max(selStart, selEnd); sel = (i / waveformData.length) >= s0 && (i / waveformData.length) <= s1; }
      const prog = i / waveformData.length;
      const isPast = isPreviewPlaying && prog <= previewProgress;
      ctx.fillStyle = sel ? 'rgba(239,68,68,0.6)' : isPast ? '#0A0A0A' : '#C0C0C0';
      ctx.globalAlpha = sel ? 0.8 : isPast ? 0.8 : 0.5;
      ctx.beginPath(); ctx.roundRect(x, y, Math.max(1, barW - 0.5), bh, 0.5); ctx.fill();
    }
    // playhead
    if (isPreviewPlaying) {
      ctx.globalAlpha = 1; ctx.strokeStyle = '#0A0A0A'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(previewProgress * w, 0); ctx.lineTo(previewProgress * w, h); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [waveformData, selStart, selEnd, previewProgress, isPreviewPlaying]);

  const getP = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => { if (!canvasRef.current) return 0; const r = canvasRef.current.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); }, []);

  const delSel = useCallback(() => {
    if (selStart === null || selEnd === null || !bufferRef.current) return;
    stopPreview();
    const buf = bufferRef.current, s0 = Math.min(selStart, selEnd), s1 = Math.max(selStart, selEnd);
    if (s1 - s0 < 0.005) return;
    const ss = Math.floor(s0 * buf.length), se = Math.floor(s1 * buf.length), nl = buf.length - (se - ss);
    if (nl < 100) return;
    const actx = audioCtxRef.current || new AudioContext();
    const nb = actx.createBuffer(buf.numberOfChannels, nl, buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) { const od = buf.getChannelData(c), nd = nb.getChannelData(c); let w = 0; for (let i = 0; i < od.length; i++) { if (i < ss || i >= se) nd[w++] = od[i]; } }
    bufferRef.current = nb; setDuration(nb.duration); recalc(nb); setSelStart(null); setSelEnd(null);
  }, [selStart, selEnd, recalc, stopPreview]);

  const applyReverse = useCallback(() => {
    if (!bufferRef.current) return; stopPreview();
    const buf = bufferRef.current; const actx = audioCtxRef.current || new AudioContext();
    const nb = actx.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) { const od = buf.getChannelData(c), nd = nb.getChannelData(c); for (let i = 0; i < od.length; i++) nd[i] = od[od.length - 1 - i]; }
    bufferRef.current = nb; setIsReversed(!isReversed); recalc(nb);
  }, [isReversed, recalc, stopPreview]);

  const applyVolume = useCallback(() => {
    if (!bufferRef.current || volume === 100) return; stopPreview(); const g = volume / 100;
    for (let c = 0; c < bufferRef.current.numberOfChannels; c++) { const d = bufferRef.current.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = Math.max(-1, Math.min(1, d[i] * g)); }
    recalc(bufferRef.current);
  }, [volume, recalc, stopPreview]);

  const applyPitch = useCallback(() => {
    if (!bufferRef.current || pitch === 0) return; stopPreview();
    const buf = bufferRef.current; const actx = audioCtxRef.current || new AudioContext();
    const rate = Math.pow(2, pitch / 12), nl = Math.floor(buf.length / rate);
    const nb = actx.createBuffer(buf.numberOfChannels, nl, buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) { const od = buf.getChannelData(c), nd = nb.getChannelData(c); for (let i = 0; i < nl; i++) { const si = i * rate, idx = Math.floor(si), f = si - idx; nd[i] = (od[idx] || 0) + ((od[idx + 1] || 0) - (od[idx] || 0)) * f; } }
    bufferRef.current = nb; setDuration(nb.duration); recalc(nb); setPitch(0);
  }, [pitch, recalc, stopPreview]);

  const handleSave = useCallback(async () => {
    if (!bufferRef.current) return; stopPreview();
    if (volume !== 100) applyVolume();
    const buf = bufferRef.current, nc = buf.numberOfChannels, sr = buf.sampleRate, len = buf.length;
    const bps = 16, br = sr * nc * bps / 8, ba = nc * bps / 8, ds = len * ba, ts = 44 + ds;
    const ab = new ArrayBuffer(ts), v = new DataView(ab);
    const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); v.setUint32(4, ts - 8, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nc, true); v.setUint32(24, sr, true); v.setUint32(28, br, true); v.setUint16(32, ba, true); v.setUint16(34, bps, true); ws(36, 'data'); v.setUint32(40, ds, true);
    let o = 44; for (let i = 0; i < len; i++) for (let c = 0; c < nc; c++) { const s = Math.max(-1, Math.min(1, buf.getChannelData(c)[i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2; }
    const blob = new Blob([ab], { type: 'audio/wav' }), reader = new FileReader();
    reader.onload = () => onSave(reader.result as string, fileName.replace(/\.[^/.]+$/, '') + '_edited.wav');
    reader.readAsDataURL(blob);
  }, [fileName, onSave, volume, applyVolume, stopPreview]);

  const fmtT = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  const hasSel = selStart !== null && selEnd !== null && Math.abs(selEnd - selStart) > 0.005;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl shadow-black/10 animate-scale-in p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors"><CloseIcon size={18} /></button>
        <h3 className="text-[15px] font-bold text-[#0A0A0A] mb-1">Редактор звука</h3>
        <p className="text-[11px] text-[#999] mb-4 truncate">{fileName} · {fmtT(duration)}</p>
        {isLoading ? <div className="flex items-center justify-center h-32 text-[13px] text-[#999]">Загрузка аудио...</div> : (
          <>
            <div className="relative bg-[#F8F8F8] rounded-xl overflow-hidden border border-[#E5E5E5] mb-3">
              <canvas ref={canvasRef} className="w-full cursor-crosshair" style={{ height: 100 }}
                onMouseDown={(e) => { stopPreview(); setSelStart(getP(e)); setSelEnd(getP(e)); setIsDragging(true); }}
                onMouseMove={(e) => { if (isDragging) setSelEnd(getP(e)); }}
                onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)} />
            </div>
            {/* Preview play */}
            <div className="flex items-center gap-3 mb-4">
              <button onClick={togglePreview} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isPreviewPlaying ? 'bg-[#0A0A0A] text-white' : 'bg-[#F3F3F3] text-[#0A0A0A] hover:bg-[#E8E8E8]'}`}>
                {isPreviewPlaying ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
              </button>
              <span className="text-[11px] text-[#999] tabular-nums">{isPreviewPlaying ? fmtT(previewProgress * duration) : '0:00'} / {fmtT(duration)}</span>
              {hasSel && (
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={delSel} className="px-3 py-1.5 bg-red-500 text-white text-[11px] font-semibold rounded-lg hover:bg-red-600 transition-all">Удалить выделение</button>
                  <button onClick={() => { setSelStart(null); setSelEnd(null); }} className="px-3 py-1.5 text-[11px] font-medium text-[#6B6B6B] hover:text-[#0A0A0A]">Снять</button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[#F8F8F8] rounded-xl p-3">
                <label className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-2 block">Громкость: {volume}%</label>
                <input type="range" min="0" max="200" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full" />
                <button onClick={applyVolume} disabled={volume === 100} className="mt-2 w-full py-1.5 text-[10px] font-semibold bg-[#0A0A0A] text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1A1A1A] transition-all">Применить</button>
              </div>
              <div className="bg-[#F8F8F8] rounded-xl p-3">
                <label className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-2 block">Тональность: {pitch > 0 ? '+' : ''}{pitch}</label>
                <input type="range" min="-12" max="12" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="w-full" />
                <button onClick={applyPitch} disabled={pitch === 0} className="mt-2 w-full py-1.5 text-[10px] font-semibold bg-[#0A0A0A] text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1A1A1A] transition-all">Применить</button>
              </div>
              <div className="bg-[#F8F8F8] rounded-xl p-3">
                <label className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-2 block">Реверс</label>
                <p className="text-[10px] text-[#999] mb-2">{isReversed ? 'Реверсирован' : 'Оригинал'}</p>
                <button onClick={applyReverse} className="w-full py-1.5 text-[10px] font-semibold bg-[#0A0A0A] text-white rounded-lg hover:bg-[#1A1A1A] transition-all">Реверс</button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 text-[12px] font-medium text-[#6B6B6B] border border-[#E5E5E5] rounded-lg hover:bg-[#F5F5F5] transition-all">Отмена</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#0A0A0A] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1A1A1A] transition-all">Сохранить</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AudioEditor;
