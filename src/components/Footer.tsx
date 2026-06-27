import React from 'react';

const DiscordIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
);
const TelegramIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
);

const resources = [
  { label: 'Туториалы', href: 'https://example.com/tutorials' },
  { label: 'Блог', href: 'https://example.com/blog' },
  { label: 'Лицензия', href: 'https://example.com/license' },
  { label: 'FAQ', href: 'https://example.com/faq' },
];
const company = [
  { label: 'О нас', href: 'https://example.com/about' },
  { label: 'Конфиденциальность', href: 'https://example.com/privacy' },
  { label: 'Условия', href: 'https://example.com/terms' },
];

const Footer: React.FC = () => (
  <footer className="border-t border-[#EBEBEB] bg-white mt-8">
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#BABABA] mb-3">Ресурсы</h4>
          <ul className="space-y-1.5">{resources.map(i => <li key={i.label}><a href={i.href} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors">{i.label}</a></li>)}</ul>
        </div>
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#BABABA] mb-3">Компания</h4>
          <ul className="space-y-1.5">{company.map(i => <li key={i.label}><a href={i.href} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors">{i.label}</a></li>)}</ul>
        </div>
      </div>
      <div className="pt-4 border-t border-[#F0F0F0] flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="text-[10px] text-[#C0C0C0] font-medium">&copy; 2026 KITSTUDIO. Все права защищены.</span>
        <div className="flex items-center gap-3">
          <a href="https://discord.gg/example" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#B0B0B0] hover:text-[#5865F2] transition-colors group"><DiscordIcon size={12} className="text-[#C0C0C0] group-hover:text-[#5865F2] transition-colors" />Discord</a>
          <a href="https://t.me/example" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#B0B0B0] hover:text-[#27A7E7] transition-colors group"><TelegramIcon size={12} className="text-[#C0C0C0] group-hover:text-[#27A7E7] transition-colors" />Telegram</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
