import React from 'react';
import { SoundCategory } from '../data/sounds';
import { WaveformIcon, DrumIcon, MusicIcon, BassIcon, FxIcon, MicIcon, RepeatIcon } from './Icons';

interface CategoryFilterProps {
  categories: SoundCategory[];
  selected: SoundCategory;
  onChange: (category: SoundCategory) => void;
  counts: Record<SoundCategory, number>;
}

const BeatsIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3" /></svg>
);

const categoryLabels: Record<SoundCategory, string> = { All: 'Все', Drums: 'Драмс', Melodies: 'Мелодии', '808s': '808', FX: 'FX', Vocals: 'Вокалы', Loops: 'Лупы', 'Готовые биты': 'Готовые биты' };
const categoryIcons: Record<SoundCategory, React.FC<{ size?: number; className?: string }>> = { All: WaveformIcon, Drums: DrumIcon, Melodies: MusicIcon, '808s': BassIcon, FX: FxIcon, Vocals: MicIcon, Loops: RepeatIcon, 'Готовые биты': BeatsIcon };

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selected, onChange, counts }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const Icon = categoryIcons[cat];
        const isActive = cat === selected;
        return (
          <button key={cat} onClick={() => onChange(cat)} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${isActive ? 'bg-[#0A0A0A] text-white shadow-sm' : 'bg-white border border-[#E5E5E5] text-[#6B6B6B] hover:border-[#D4D4D4] hover:text-[#0A0A0A]'}`}>
            <Icon size={14} />
            <span>{categoryLabels[cat]}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? 'bg-white/15 text-white/80' : 'bg-[#F5F5F5] text-[#B0B0B0]'}`}>{counts[cat]}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
