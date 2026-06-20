export default function QualityScore({ score = 0 }) {
  const clamped = Math.max(0, Math.min(100, score));
  const good = clamped >= 50;

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${good ? 'bg-emerald-500' : 'bg-red-500'}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span
        className={`w-10 shrink-0 text-right text-sm font-medium ${
          good ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        {clamped}
      </span>
    </div>
  );
}
