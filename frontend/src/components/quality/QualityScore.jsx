export default function QualityScore({ score = 0 }) {
  const clamped = Math.max(0, Math.min(100, score));
  const good = clamped >= 50;

  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${clamped}%`,
            background: good
              ? 'linear-gradient(90deg, #10b981, #06b6d4)'
              : 'linear-gradient(90deg, #ef4444, #f97316)',
            boxShadow: good
              ? '0 0 8px rgba(16,185,129,0.3)'
              : '0 0 8px rgba(239,68,68,0.3)',
            animation: 'progressFill 1s cubic-bezier(0.4,0,0.2,1) forwards',
          }}
        />
      </div>
      <span
        className="font-headline text-sm font-semibold w-10 text-right shrink-0"
        style={{ color: good ? '#4caf8e' : '#ef4444' }}
      >
        {clamped}%
      </span>
    </div>
  );
}
