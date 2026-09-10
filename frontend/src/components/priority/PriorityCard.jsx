import { AlertTriangle, ShieldAlert, Zap, Network, Users, Clock } from 'lucide-react';
import EmptyState from '../common/EmptyState';

const SOURCE_COLORS = {
  jira: '#8ecdff', github: '#c0c7d2', slack: '#f59e0b',
  email: '#ef4444', calendar: '#4caf8e', meetings: '#a78bfa', incidents: '#f97316',
};

const getPlatformStyle = (platform) => {
  const map = {
    jira:      { bg: 'rgba(142,205,255,0.1)',  color: '#8ecdff',  border: 'rgba(142,205,255,0.2)' },
    github:    { bg: 'rgba(192,199,210,0.1)',  color: '#c0c7d2',  border: 'rgba(192,199,210,0.2)' },
    slack:     { bg: 'rgba(245,158,11,0.1)',   color: '#f59e0b',  border: 'rgba(245,158,11,0.2)' },
    email:     { bg: 'rgba(239,68,68,0.1)',    color: '#ef4444',  border: 'rgba(239,68,68,0.2)' },
    calendar:  { bg: 'rgba(76,175,142,0.1)',   color: '#4caf8e',  border: 'rgba(76,175,142,0.2)' },
    meetings:  { bg: 'rgba(167,139,250,0.1)',  color: '#a78bfa',  border: 'rgba(167,139,250,0.2)' },
    incidents: { bg: 'rgba(249,115,22,0.1)',   color: '#f97316',  border: 'rgba(249,115,22,0.2)' },
  };
  return map[platform?.toLowerCase()] || { bg: 'rgba(255,255,255,0.05)', color: 'var(--outline)', border: 'rgba(255,255,255,0.08)' };
};

const URGENCY_LEVEL = {
  p0_critical:  { label: 'Critical Alert', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)' },
  critical:     { label: 'Critical Alert', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)' },
  p1_high:      { label: 'High Urgency',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  high:         { label: 'High Urgency',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  optimization: { label: 'Optimization',   color: '#8ecdff', bg: 'rgba(142,205,255,0.1)', border: 'rgba(142,205,255,0.25)' },
  medium:       { label: 'Optimization',   color: '#8ecdff', bg: 'rgba(142,205,255,0.1)', border: 'rgba(142,205,255,0.25)' },
};

function getUrgencyLevel(task, rank) {
  const score = task.priority_score || 0;
  if (rank === 1 || score >= 85) return URGENCY_LEVEL.critical;
  if (score >= 70) return URGENCY_LEVEL.high;
  return URGENCY_LEVEL.optimization;
}

export default function PriorityCard({ task, rank, onClick }) {
  const explanation = task.explanation || task.reason || 'No prioritization reasoning provided.';
  const platforms = task.platforms || (task.source ? [task.source] : []);
  const urgency = getUrgencyLevel(task, rank);

  // Featured card for rank #1
  if (rank === 1) {
    return (
      <button
        onClick={onClick}
        className="glass-card p-6 md:p-8 relative overflow-hidden text-left w-full cursor-pointer transition-all duration-300 block shadow-2xl border-rose-500/30 hover:border-rose-500/50 hover:-translate-y-0.5"
        style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(15,23,42,0.8) 100%)',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7), 0 0 30px rgba(239,68,68,0.1)',
        }}
      >
        {/* Large stylized watermark */}
        <div
          className="absolute -top-2 right-6 font-mono text-8xl font-black select-none pointer-events-none opacity-5 text-white"
        >
          #01
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start gap-6 relative z-10">
          {/* Beacon icon */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
          >
            <AlertTriangle className="h-7 w-7 text-rose-400 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header chip row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(239,68,68,0.2)]">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
                {urgency.label}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                SIGNAL_ID: WF-{String(task.id || '0001').substring(0, 6).toUpperCase()}
              </span>
            </div>

            <h3 className="font-headline text-xl md:text-2xl font-bold leading-snug mb-3 text-white tracking-tight">
              #{rank}. {task.title || `Task #${task.id}`}
            </h3>

            <p className="font-body text-xs md:text-sm leading-relaxed mb-6 max-w-3xl text-slate-300 bg-slate-950/40 p-4 rounded-xl border border-white/5">
              {explanation}
            </p>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/5">
              {(() => {
                const isUnassigned =
                  !task.assignee ||
                  task.assignee === 'null' ||
                  task.assignee === 'None' ||
                  task.assignee === 'undefined';
                const name = isUnassigned ? 'Unassigned' : task.assignee;
                const initials = isUnassigned ? 'UN' : task.assignee.substring(0, 2);
                return (
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                      ASSIGNED LEAD
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center font-mono text-[9px] font-bold uppercase ${
                          isUnassigned
                            ? 'text-slate-500 bg-slate-800 border border-slate-700/60'
                            : 'text-slate-900 bg-cyan-300'
                        }`}
                      >
                        {initials}
                      </div>
                      <span className="font-body text-xs font-semibold text-slate-200">
                        {name}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  PRIORITY SCORE
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline text-lg font-bold text-cyan-300 tabular-nums">
                    {task.priority_score ?? '—'}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">/ 10.0</span>
                </div>
              </div>

              {platforms.length > 0 && (
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                    FUSED PLATFORMS
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {platforms.slice(0, 4).map((p) => {
                      const ps = getPlatformStyle(p);
                      return (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded-md text-[9px] font-mono tracking-wider uppercase font-semibold"
                          style={{
                            background: ps.bg,
                            color: ps.color,
                            border: `0.5px solid ${ps.border}`,
                          }}
                        >
                          {p}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Regular cards (rank 2+)
  return (
    <button
      onClick={onClick}
      className="glass-card glass-card-hover p-4 relative overflow-hidden text-left w-full cursor-pointer block transition-all duration-300"
    >
      {/* Rank watermark */}
      <div
        className="absolute top-3 right-4 font-headline text-4xl font-light select-none pointer-events-none"
        style={{ color: 'rgba(255,255,255,0.04)' }}
      >
        {rank < 10 ? `0${rank}` : rank}
      </div>

      {/* Badge */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: urgency.bg, border: `0.5px solid ${urgency.border}` }}
        >
          {rank === 2 || rank === 3
            ? <Zap className="h-4 w-4" style={{ color: urgency.color }} />
            : <ShieldAlert className="h-4 w-4" style={{ color: urgency.color }} />
          }
        </div>
        <div className="min-w-0 flex-1">
          <span
            className="chip text-[0.5rem] py-0 mb-1"
            style={{ background: urgency.bg, color: urgency.color, border: `0.5px solid ${urgency.border}` }}
          >
            {urgency.label}
          </span>
          <h4
            className="font-headline text-sm font-semibold leading-snug"
            style={{ color: 'var(--on-surface)' }}
          >
            #{rank}. {task.title || `Task #${task.id}`}
          </h4>
        </div>
      </div>

      <p
        className="font-body text-xs leading-relaxed line-clamp-3 mb-3"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        {explanation}
      </p>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2">
          {(() => {
            const isUnassigned = !task.assignee || task.assignee === 'null' || task.assignee === 'None' || task.assignee === 'undefined';
            const name = isUnassigned ? 'Unassigned' : task.assignee;
            const initials = isUnassigned ? 'UN' : task.assignee.substring(0, 2);
            return (
              <>
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[0.45rem] font-bold uppercase ${isUnassigned ? 'text-slate-400 bg-slate-800 border border-slate-700/50' : 'text-white'}`}
                  style={isUnassigned ? {} : { background: 'var(--primary-container)' }}
                >
                  {initials}
                </div>
                <span className="font-body text-[0.65rem]" style={{ color: 'var(--outline)' }}>
                  {name}
                </span>
              </>
            );
          })()}
        </div>
        <div className="flex items-center gap-3">
          <span
            className="font-headline text-sm font-semibold"
            style={{ color: 'var(--primary)' }}
          >
            {task.priority_score ?? '—'}
          </span>
          <span className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.5rem' }}>/ 10</span>
        </div>
      </div>
    </button>
  );
}
