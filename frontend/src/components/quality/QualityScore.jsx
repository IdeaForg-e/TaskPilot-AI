export default function QualityScore({ score = 0 }) {
  const clamped = Math.max(0, Math.min(100, score));
  const good = clamped >= 50;

  return (
    <div className="flex items-center gap-4">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-900 border border-slate-850">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            good 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
              : 'bg-gradient-to-r from-red-500 to-orange-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
          }`}
          style={{ 
            width: `${clamped}%`,
            animation: 'progressFill 1s cubic-bezier(0.4, 0, 0.2, 1) forwards' 
          }}
        />
      </div>
      <span
        className={`w-10 shrink-0 text-right text-xs font-bold ${
          good ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        {clamped}%
      </span>
    </div>
  );
}
