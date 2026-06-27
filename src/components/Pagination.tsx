import React from 'react';

interface PaginationProps {
  page: number; totalPages: number; onChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
        className="px-3 py-1.5 text-[12px] font-medium bg-white border border-[#E5E5E5] rounded-lg hover:bg-[#F5F5F5] disabled:opacity-40 transition-all">← Назад</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
        <button key={n} onClick={() => onChange(n)}
          className={`min-w-[32px] h-8 px-2 text-[12px] font-bold rounded-lg transition-all ${n === page ? 'bg-[#0A0A0A] text-white' : 'bg-white border border-[#E5E5E5] text-[#6B6B6B] hover:bg-[#F5F5F5] hover:text-[#0A0A0A]'}`}>
          {n}
        </button>
      ))}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="px-3 py-1.5 text-[12px] font-medium bg-white border border-[#E5E5E5] rounded-lg hover:bg-[#F5F5F5] disabled:opacity-40 transition-all">Вперёд →</button>
    </div>
  );
};

export default Pagination;
