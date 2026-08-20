import { useEffect, useState } from 'react';

type Snowflake = {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  opacity: number;
};

// Falling snow for the Christmas theme — unlike Fireflies/Butterflies (which
// sit at z-0, behind the header/content, only visible in .site-background's
// negative space), this renders last in App.tsx at a high z-index so it
// drifts over the entire site — header, hero banner, cards — like real
// snowfall, not just in the gaps.
// Purely decorative — pointer-events disabled in CSS, hidden on mobile
// via the .snowflake rule in index.css (matches Fireflies' own mobile
// performance behavior).
export default function Snowflakes({ count = 40 }: { count?: number }) {
  const [flakes, setFlakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    const arr: Snowflake[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 3 + Math.random() * 6,
      delay: Math.random() * 12,
      duration: 9 + Math.random() * 10,
      drift: (Math.random() - 0.5) * 120,
      opacity: 0.5 + Math.random() * 0.5,
    }));
    setFlakes(arr);
  }, [count]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[55] overflow-hidden"
      aria-hidden="true"
    >
      {flakes.map((f) => (
        <span
          key={f.id}
          className="snowflake animate-snowFall"
          style={{
            left: `${f.left}%`,
            width: `${f.size}px`,
            height: `${f.size}px`,
            opacity: f.opacity,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
            ['--drift' as string]: `${f.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
