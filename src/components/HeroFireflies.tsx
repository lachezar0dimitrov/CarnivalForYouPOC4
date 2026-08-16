import { useEffect, useState } from 'react';

type Firefly = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  hue: 'gold' | 'green';
};

// Hero-scoped firefly overlay: gold + green glowing sparks drifting across the hero.
// Scoped to the hero section (absolute within it) — pointer-events disabled.
export default function HeroFireflies({ count = 30 }: { count?: number }) {
  const [flies, setFlies] = useState<Firefly[]>([]);

  useEffect(() => {
    const arr: Firefly[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: 20 + Math.random() * 70,
      size: 2 + Math.random() * 6,
      delay: Math.random() * 8,
      duration: 7 + Math.random() * 9,
      hue: Math.random() > 0.55 ? 'gold' : 'green',
    }));
    setFlies(arr);
  }, [count]);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      aria-hidden="true"
    >
      {flies.map((f) => (
        <span
          key={f.id}
          className="hero-firefly animate-floatY"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: `${f.size}px`,
            height: `${f.size}px`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
            background:
              f.hue === 'gold'
                ? 'radial-gradient(circle, #f7e9b8 0%, #d4af37 45%, rgba(212,175,55,0) 70%)'
                : 'radial-gradient(circle, #bfe6c8 0%, #5b8c6e 45%, rgba(91,140,110,0) 70%)',
            boxShadow:
              f.hue === 'gold'
                ? '0 0 8px rgba(212,175,55,0.6)'
                : '0 0 8px rgba(91,140,110,0.6)',
          }}
        />
      ))}
    </div>
  );
}
