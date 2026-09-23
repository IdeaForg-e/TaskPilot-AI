export default function QualityScore({ score = 0 }) {
  const clamped = Math.max(0, Math.min(100, score));
  const good = clamped >= 50;

  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full"
        style={{ background: '#dad7cb' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${clamped}%`,
            background: good
              ? 'linear-gradient(90deg, #2e7d55, #0284c7)'
              : 'linear-gradient(90deg, #b91c1c, #f97316)',
            boxShadow: good
              ? '0 0 6px rgba(46,125,85,0.25)'
              : '0 0 6px rgba(185,28,28,0.25)',
          }}
        />
      </div>
      <span
        className="font-headline text-sm font-semibold w-10 text-right shrink-0"
        style={{ color: good ? '#2e7d55' : '#b91c1c' }}
      >
        {clamped}%
      </span>
    </div>
  );
}
