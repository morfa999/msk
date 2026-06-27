import React from 'react';

interface HeroProps { totalSounds: number; totalDownloads: number; totalPacks: number; }

const FORMATS = ['WAV', 'MP3', 'FLAC'];

const Hero: React.FC<HeroProps> = ({ totalSounds, totalDownloads, totalPacks }) => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0 opacity-[0.045]" style={{ backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />
    <div className="max-w-7xl mx-auto px-6 pt-10 pb-8 relative">
      <div className="max-w-2xl">
        <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-black tracking-[-0.035em] text-[#0A0A0A] leading-[1.05] mb-4 animate-fade-in-up">Мир звуков</h1>
        <div className="flex items-center gap-3 mb-4 animate-fade-in-up stagger-1">
          <p className="text-[clamp(1.2rem,3vw,1.8rem)] font-black tracking-[-0.02em] text-[#0A0A0A] leading-[1.2]">FL Studio</p>
          <img src="/images/flogo.png" alt="FL Studio" className="h-8 w-auto object-contain" />
        </div>
        <p className="text-[16px] text-[#6B6B6B] leading-[1.65] mb-6 max-w-lg animate-fade-in-up stagger-2">Коллекция высококачественных сэмплов, лупов и ваншотов. Готовы для использования в вашем следующем проекте.</p>
        <div className="flex items-center gap-5 sm:gap-8 animate-fade-in-up stagger-3">
          <div><div className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A0A0A]">{totalSounds}</div><div className="text-[12px] text-[#999] mt-0.5 font-medium">Звуков</div></div>
          <div className="w-px h-10 bg-[#E5E5E5]" />
          <div><div className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A0A0A]">{totalPacks}</div><div className="text-[12px] text-[#999] mt-0.5 font-medium">Паков</div></div>
          <div className="w-px h-10 bg-[#E5E5E5]" />
          <div><div className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A0A0A]">{totalDownloads}</div><div className="text-[12px] text-[#999] mt-0.5 font-medium">Скачиваний</div></div>
          <div className="w-px h-10 bg-[#E5E5E5]" />
          <div><div className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A0A0A]">{FORMATS.length}</div><div className="text-[12px] text-[#999] mt-0.5 font-medium">Форматов</div></div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-3 animate-fade-in-up stagger-4">
          {FORMATS.map(f => <span key={f} className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#999] bg-[#F0F0F0] rounded-md">{f}</span>)}
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
