'use client';

export function Waveform({ active }: { active: boolean }) {
  if (!active) return null;
  
  return (
    <div className="flex items-center justify-center gap-1 h-5 px-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1 bg-indigo-500 rounded-full animate-pulse"
          style={{
            height: `${Math.max(4, Math.random() * 16)}px`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
}
