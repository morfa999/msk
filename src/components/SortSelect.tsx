import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './Icons';

interface SortOption { label: string; value: string; }
interface SortSelectProps { options: readonly SortOption[]; selected: string; onChange: (value: string) => void; }

const SortSelect: React.FC<SortSelectProps> = ({ options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((o) => o.value === selected)?.label || '';

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-[13px] font-medium text-[#6B6B6B] hover:border-[#D4D4D4] hover:text-[#0A0A0A] transition-all">
        <span>{selectedLabel}</span>
        <ChevronDownIcon size={13} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#E5E5E5] rounded-xl shadow-xl shadow-black/5 py-1.5 z-30 animate-scale-in origin-top-right">
          {options.map((option) => (
            <button key={option.value} onClick={() => { onChange(option.value); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${selected === option.value ? 'bg-[#F5F5F5] text-[#0A0A0A] font-medium' : 'text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#0A0A0A]'}`}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SortSelect;
