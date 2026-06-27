import React from 'react';
import { SearchIcon, CloseIcon } from './Icons';

interface SearchBarProps { value: string; onChange: (value: string) => void; }

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => (
  <div className="relative w-full max-w-md">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B0B0B0] pointer-events-none"><SearchIcon size={17} /></div>
    <input type="text" placeholder="Поиск звуков, тегов, категорий..." value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full pl-11 pr-10 py-3 bg-white border border-[#E5E5E5] rounded-xl text-[13px] text-[#0A0A0A] placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-all" />
    {value && <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#B0B0B0] hover:text-[#0A0A0A] transition-colors"><CloseIcon size={15} /></button>}
  </div>
);

export default SearchBar;
