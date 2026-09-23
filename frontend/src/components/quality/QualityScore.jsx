export default function QualityScore({ score = 0 }) {
  const clamped = Math.max(0, Math.min(100, score));
  const good = clamped >= 50;

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#080d16] border border-[#1e293b]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${clamped}%`,
            background: good
              ? 'linear-gradient(90deg, #10b981, #00d2ff)'
              : 'linear-gradient(90deg, #ef4444, #f59e0b)',
            boxShadow: good
              ? '0 0 10px rgba(0,210,255,0.5)'
              : '0 0 10px rgba(239,68,68,0.5)',
          }}
        />
      </div>
      <span
        className={`font-mono text-xs font-bold w-12 text-right shrink-0 tabular-nums ${
          good ? 'text-emerald-400' : 'text-rose-400'
        }`}
      >
        {clamped}%
      </span>
    </div>
  );
}
