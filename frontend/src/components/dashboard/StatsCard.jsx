export default function StatsCard({ label, value, icon: Icon, accent = 'blue' }) {
  const accentMap = {
    blue:    { icon: 'rgba(142,205,255,0.12)', iconColor: '#8ecdff', border: 'rgba(142,205,255,0.15)' },
    indigo:  { icon: 'rgba(142,205,255,0.12)', iconColor: '#8ecdff', border: 'rgba(142,205,255,0.15)' },
    emerald: { icon: 'rgba(76,175,142,0.12)',  iconColor: '#4caf8e', border: 'rgba(76,175,142,0.15)' },
    amber:   { icon: 'rgba(245,158,11,0.12)',  iconColor: '#f59e0b', border: 'rgba(245,158,11,0.15)' },
    red:     { icon: 'rgba(239,68,68,0.12)',   iconColor: '#ef4444', border: 'rgba(239,68,68,0.15)' },
  };

  const a = accentMap[accent] || accentMap.blue;

  return (
    <div
      className="glass-card glass-card-hover relative overflow-hidden p-5 group cursor-default"
    >
      {/* Subtle corner glow */}
      <div
        className="absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-60"
        style={{ background: `radial-gradient(circle, ${a.iconColor}30, transparent)` }}
      />

      <div className="flex items-center justify-between mb-4">
        <span
          className="label-caps"
          style={{ color: 'var(--outline)', fontSize: '0.6rem' }}
        >
          {label}
        </span>
        {Icon && (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
            style={{ background: a.icon, border: `0.5px solid ${a.border}` }}
          >
            <Icon className="h-4 w-4" style={{ color: a.iconColor }} />
          </span>
        )}
      </div>

      {typeof value === 'string' && value.length > 10 ? (
        <p
          className="font-headline text-sm font-semibold leading-snug"
          style={{
            color: 'var(--on-surface)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '2.5rem',
          }}
        >
          {value}
        </p>
      ) : (
        <p
          className="font-headline text-2xl font-semibold leading-none truncate"
          style={{ color: 'var(--on-surface)' }}
        >
          {value}
        </p>
      )}
    </div>
  );
}
