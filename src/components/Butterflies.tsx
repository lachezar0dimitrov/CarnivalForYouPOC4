import { useEffect, useState } from 'react';

type ButterflyData = {
  id: number;
  top: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
  path: number;
  flapDuration: number;
};

const colors = ['#d4af37', '#5b8c6e', '#f0d985', '#e7c44d', '#c0392b'];

export default function Butterflies({ count = 5 }: { count?: number }) {
  const [butterflies, setButterflies] = useState<ButterflyData[]>([]);

  useEffect(() => {
    const arr: ButterflyData[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      top: 10 + Math.random() * 70,
      left: Math.random() * 85,
      size: 16 + Math.random() * 18,
      duration: 20 + Math.random() * 25,
      delay: Math.random() * 18,
      color: colors[i % colors.length],
      path: Math.floor(Math.random() * 3),
      flapDuration: 0.5 + Math.random() * 0.5,
    }));
    setButterflies(arr);
  }, [count]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {butterflies.map((b) => (
        <div
          key={b.id}
          className="butterfly-drift"
          style={{
            top: `${b.top}%`,
            left: `${b.left}%`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            animationName: `butterflyPath${b.path}`,
          }}
        >
          <svg
            width={b.size}
            height={b.size}
            viewBox="0 0 40 40"
            className="butterfly-flap"
            style={{ animationDuration: `${b.flapDuration}s` }}
          >
            <path
              d="M20 20 Q12 8 6 14 Q4 22 12 24 Q18 23 20 20 Q22 23 28 24 Q36 22 34 14 Q28 8 20 20 Z"
              fill={b.color}
              opacity="0.4"
            />
            <line
              x1="20"
              y1="16"
              x2="20"
              y2="28"
              stroke={b.color}
              strokeWidth="1"
              opacity="0.5"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
