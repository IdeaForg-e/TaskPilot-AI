export default function StatsCard({ label, value, icon: Icon, accent = 'blue' }) {
  const accentMap = {
    blue: {
      iconBg: 'rgba(0,210,255,0.08)',
      iconColor: '#38bdf8',
      border: '#1e293b',
      activeBorder: 'hover:border-cyan-500/40',
      glow: 'rgba(0,210,255,0.15)',
    },
    indigo: {
      iconBg: 'rgba(99,102,241,0.08)',
      iconColor: '#818cf8',
      border: '#1e293b',
      activeBorder: 'hover:border-indigo-500/40',
      glow: 'rgba(99,102,241,0.15)',
    },
    emerald: {
      iconBg: 'rgba(16,185,129,0.08)',
      iconColor: '#34d399',
      border: '#1e293b',
      activeBorder: 'hover:border-emerald-500/40',
      glow: 'rgba(16,185,129,0.15)',
    },
    amber: {
      iconBg: 'rgba(245,158,11,0.08)',
      iconColor: '#fbbf24',
      border: '#1e293b',
      activeBorder: 'hover:border-amber-500/40',
      glow: 'rgba(245,158,11,0.15)',
    },
    red: {
      iconBg: 'rgba(239,68,68,0.08)',
      iconColor: '#f87171',
      border: '#1e293b',
      activeBorder: 'hover:border-rose-500/40',
      glow: 'rgba(239,68,68,0.15)',
    },
  };

  const a = accentMap[accent] || accentMap.blue;

  return (
    <div
      className={`cockpit-card relative overflow-hidden p-4 group cursor-default transition-all duration-200 bg-[#0f172a] border border-[#1e293b] ${a.activeBorder}`}
    >
      {/* Dynamic corner radial glow */}
      <div
        className="absolute -right-6 -top-6 h-20 w-20 rounded-full blur-xl transition-opacity duration-300 opacity-20 group-hover:opacity-70 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${a.glow}, transparent 70%)` }}
      />

      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-mono text-[10px] tracking-wider uppercase text-slate-400 font-medium">
          {label}
        </span>
        {Icon && (
          <span
            className="flex h-7 w-7 items-center justify-center rounded transition-all duration-200"
            style={{ background: a.iconBg }}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: a.iconColor }} />
          </span>
        )}
      </div>

      {/* Value Display */}
      {typeof value === 'string' && value.length > 15 ? (
        <p
          className="text-xs font-medium leading-snug text-slate-200"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '2.2rem',
          }}
          title={value}
        >
          {value}
        </p>
      ) : (
        <div className="flex items-baseline gap-1.5">
          <p className="text-xl md:text-2xl font-bold tracking-tight text-white tabular-nums">
            {value}
          </p>
        </div>
      )}
    </div>
  );
}
