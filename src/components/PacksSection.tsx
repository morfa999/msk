import React from 'react';
import { DownloadIcon, PackageIcon } from './Icons';
import { Pack } from '../store/useStore';
import { useNotify } from '../notify';

interface PacksSectionProps { packs: Pack[]; onPremiumClick: () => void; }

const LockIcon: React.FC<{ size?: number; className?: string }> = ({ size = 11, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
);

const PacksSection: React.FC<PacksSectionProps> = ({ packs, onPremiumClick }) => {
  const { info } = useNotify();
  const fmtDl = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

  const handleDownload = (pack: Pack) => {
    // TODO: implement real pack zip download when pack files stored
    info(`Пак "${pack.title}" будет доступен для скачивания`);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[22px] font-bold text-[#0A0A0A] mb-1 tracking-tight">Паки</h2>
        <p className="text-[13px] text-[#B0B0B0] font-medium">{packs.length} паков доступно</p>
      </div>
      {packs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 bg-[#F3F3F3] rounded-2xl flex items-center justify-center"><PackageIcon size={24} className="text-[#B0B0B0]" /></div>
          <h3 className="text-base font-semibold text-[#0A0A0A] mb-1">Пока нет паков</h3>
          <p className="text-[13px] text-[#B0B0B0]">Добавьте первый пак</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {packs.map((pack, i) => (
            <div key={pack.id} className="group bg-white border border-[#EBEBEB] rounded-2xl p-5 hover:border-[#D4D4D4] hover:shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition-all opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'forwards' }}>
              <div className="w-10 h-10 rounded-xl bg-[#F3F3F3] flex items-center justify-center mb-3.5"><PackageIcon size={18} className="text-[#0A0A0A]" /></div>
              <h3 className="text-[14px] font-semibold text-[#0A0A0A] mb-2">{pack.title}</h3>
              <div className="flex items-center gap-2 mb-3 text-[11px]">
                <span className="text-[#B0B0B0]">{pack.soundCount} звуков</span>
                {pack.downloads > 0 && <><span className="text-[#D0D0D0]">·</span><span className="text-[#B0B0B0]">{fmtDl(pack.downloads)}</span></>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#B0B0B0] truncate">{pack.authorName}</span>
                {pack.isFree ? (
                  <button onClick={() => handleDownload(pack)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all bg-[#0A0A0A] text-white hover:bg-[#1A1A1A]"><DownloadIcon size={11} />Скачать</button>
                ) : (
                  <button onClick={onPremiumClick} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all bg-[#E5E5E5] text-[#999] hover:bg-[#D4D4D4]"><LockIcon size={11} />Premium</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PacksSection;
