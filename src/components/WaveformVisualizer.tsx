import React, { useRef, useCallback } from 'react';

interface WaveformVisualizerProps {
  waveform: number[];
  progress: number;
  isPlaying?: boolean;
  onSeek: (progress: number) => void;
  height?: number;
  barWidth?: number;
  barGap?: number;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  waveform, progress, onSeek, height = 48, barWidth = 2, barGap = 1.5,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalBars = waveform.length;
  const totalWidth = totalBars * (barWidth + barGap) - barGap;

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  }, [onSeek]);

  return (
    <div ref={containerRef} className="cursor-pointer group relative select-none" onClick={handleClick} style={{ height, width: '100%' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${totalWidth} ${height}`} preserveAspectRatio="none" className="block">
        {waveform.map((value, i) => {
          const barHeight = Math.max(2, value * height * 0.88);
          const x = i * (barWidth + barGap);
          const y = (height - barHeight) / 2;
          const isPast = (i / totalBars) <= progress;
          return <rect key={i} x={x} y={y} width={barWidth} height={barHeight} rx={barWidth / 2} fill={isPast ? '#0A0A0A' : '#DCDCDC'} className="transition-[fill] duration-[30ms]" />;
        })}
      </svg>
    </div>
  );
};

export default WaveformVisualizer;
