import { useEffect, useState } from 'react';

type Firefly = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
};

// Floating glowing "firefly" sparks for the magical atmosphere.
// Purely decorative — pointer-events disabled in CSS.
export default function Fireflies({ count = 28 }: { count?: number }) {
  const [flies, setFlies] = useState<Firefly[]>([]);

  useEffect(() => {
    const arr: Firefly[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 5,
      delay: Math.random() * 9,
      duration: 6 + Math.random() * 8,
      drift: 20 + Math.random() * 50,
    }));
    setFlies(arr);
  }, [count]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {flies.map((f) => (
        <span
          key={f.id}
          className="firefly animate-twinkle"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: `${f.size}px`,
            height: `${f.size}px`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
