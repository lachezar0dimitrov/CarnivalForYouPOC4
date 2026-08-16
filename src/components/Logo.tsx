import { Sparkles } from 'lucide-react';

export default function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-1.5 overflow-visible py-1"
      aria-label="CarnivalForYou — home"
    >
      <span className="relative hidden sm:block">
        <Sparkles
          size={16}
          className="text-gold-300 drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] transition-transform duration-500 group-hover:rotate-12"
        />
      </span>

      <span className="logo-cursive text-2xl sm:text-3xl">
        <span className="logo-cf">Carnival</span>
        <span className="logo-for">for</span>
        <span className="logo-you">You</span>
      </span>

      <span className="relative hidden sm:block">
        <Sparkles
          size={12}
          className="text-moss-400 drop-shadow-[0_0_5px_rgba(91,140,110,0.6)] transition-transform duration-500 group-hover:-rotate-12"
        />
      </span>
    </button>
  );
}
