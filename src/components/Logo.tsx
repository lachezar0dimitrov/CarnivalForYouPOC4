import { Sparkles } from 'lucide-react';

export default function Logo({
  onClick,
  large = false,
}: {
  onClick: () => void;
  // Header-only: bigger mark that pops out of the header bar. Footer keeps
  // the original compact size — it isn't height-constrained like the fixed
  // header bar and has body copy sitting right below it.
  large?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center overflow-visible py-1 ${large ? 'gap-2 sm:gap-2.5' : 'gap-1.5'}`}
      aria-label="CarnivalForYou — home"
    >
      <span className="relative hidden sm:block">
        <Sparkles
          size={large ? 22 : 16}
          className="text-gold-300 drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] transition-transform duration-500 group-hover:rotate-12"
        />
      </span>

      <span className={`logo-cursive text-2xl ${large ? 'sm:text-5xl' : 'sm:text-3xl'}`}>
        <span className="logo-cf">Carnival</span>
        <span className="logo-for">for</span>
        <span className="logo-you">You</span>
      </span>

      <span className="relative hidden sm:block">
        <Sparkles
          size={large ? 16 : 12}
          className="text-moss-400 drop-shadow-[0_0_5px_rgba(91,140,110,0.6)] transition-transform duration-500 group-hover:-rotate-12"
        />
      </span>
    </button>
  );
}
