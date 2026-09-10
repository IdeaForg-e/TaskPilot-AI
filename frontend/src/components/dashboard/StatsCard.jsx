export default function StatsCard({ label, value, icon: Icon, accent = 'blue' }) {
  const accentMap = {
    blue: {
      iconBg: 'rgba(142,205,255,0.08)',
      iconColor: '#8ecdff',
      border: 'rgba(142,205,255,0.18)',
      glow: 'rgba(142,205,255,0.15)',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
    indigo: {
      iconBg: 'rgba(167,139,250,0.08)',
      iconColor: '#a78bfa',
      border: 'rgba(167,139,250,0.18)',
      glow: 'rgba(167,139,250,0.15)',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    emerald: {
      iconBg: 'rgba(76,175,142,0.08)',
      iconColor: '#4caf8e',
      border: 'rgba(76,175,142,0.18)',
      glow: 'rgba(76,175,142,0.15)',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    amber: {
      iconBg: 'rgba(245,158,11,0.08)',
      iconColor: '#f59e0b',
      border: 'rgba(245,158,11,0.18)',
      glow: 'rgba(245,158,11,0.15)',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    red: {
      iconBg: 'rgba(239,68,68,0.08)',
      iconColor: '#ef4444',
      border: 'rgba(239,68,68,0.18)',
      glow: 'rgba(239,68,68,0.15)',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
  };

  const a = accentMap[accent] || accentMap.blue;

  return (
    <div
      className="glass-card relative overflow-hidden p-5 group cursor-default transition-all duration-300 hover:-translate-y-0.5"
      style={{
        boxShadow: '0 12px 32px -10px rgba(0,0,0,0.5)',
      }}
    >
      {/* Dynamic corner radial glow */}
      <div
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-500 opacity-40 group-hover:opacity-90 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${a.glow}, transparent 70%)` }}
      />

      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between mb-3.5">
        <span className="font-mono text-[10px] tracking-wider uppercase text-slate-400 font-semibold">
          {label}
        </span>
        {Icon && (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
            style={{ background: a.iconBg, border: `0.5px solid ${a.border}` }}
          >
            <Icon className="h-4 w-4" style={{ color: a.iconColor }} />
          </span>
        )}
      </div>

      {/* Value Display */}
      {typeof value === 'string' && value.length > 12 ? (
        <p
          className="font-headline text-sm font-semibold leading-snug text-slate-100"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '2.5rem',
          }}
          title={value}
        >
          {value}
        </p>
      ) : (
        <div className="flex items-baseline gap-1.5">
          <p className="font-headline text-2xl font-bold tracking-tight text-white tabular-nums">
            {value}
          </p>
        </div>
      )}

      {/* Subtle bottom scanline accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${a.iconColor}, transparent)`,
        }}
      />
    </div>
  );
}
