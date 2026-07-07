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
        className="glass-card glass-card-hover p-6 relative overflow-hidden text-left w-full cursor-pointer transition-all block duration-300"
        style={{ background: 'rgba(239,68,68,0.03)' }}
      >
        {/* Rank badge */}
        <div
          className="absolute top-4 right-6 font-headline text-6xl font-light select-none pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.04)' }}
        >
          1
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          {/* Alert icon */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: urgency.bg, border: `0.5px solid ${urgency.border}` }}
          >
            <AlertTriangle className="h-6 w-6" style={{ color: urgency.color }} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Badge + ID */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className="chip text-[0.55rem] py-0.5"
                style={{ background: urgency.bg, color: urgency.color, border: `0.5px solid ${urgency.border}` }}
              >
                {urgency.label}
              </span>
              <span className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                ID: WF-{String(task.id || '0001').substring(0, 6).toUpperCase()}
              </span>
            </div>

            <h3
              className="font-headline text-xl font-semibold leading-snug mb-3"
              style={{ color: 'var(--on-surface)' }}
            >
              #{rank}. {task.title || `Task #${task.id}`}
            </h3>

            <p
              className="font-body text-sm leading-relaxed mb-5 max-w-2xl"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              {explanation}
            </p>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-6">
              {(() => {
                const isUnassigned = !task.assignee || task.assignee === 'null' || task.assignee === 'None' || task.assignee === 'undefined';
                const name = isUnassigned ? 'Unassigned' : task.assignee;
                const initials = isUnassigned ? 'UN' : task.assignee.substring(0, 2);
                return (
                  <div>
                    <p className="label-caps mb-1" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                      Assigned Lead
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[0.5rem] font-bold uppercase ${isUnassigned ? 'text-slate-400 bg-slate-800 border border-slate-700/50' : 'text-white'}`}
                        style={isUnassigned ? {} : { background: SOURCE_COLORS[platforms[0]] || 'var(--primary-container)' }}
                      >
                        {initials}
                      </div>
                      <span className="font-body text-sm font-semibold" style={{ color: isUnassigned ? 'var(--outline)' : 'var(--on-surface)' }}>
                        {name}
                      </span>
                    </div>
                  </div>
                );
              })()}
              <div>
                <p className="label-caps mb-1" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                  Priority Score
                </p>
                <span className="font-headline text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                  {task.priority_score ?? '—'} / 10
                </span>
              </div>
              {platforms.length > 0 && (
                <div>
                  <p className="label-caps mb-1" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                    Sources
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {platforms.slice(0, 3).map((p) => {
                      const ps = getPlatformStyle(p);
                      return (
                        <span
                          key={p}
                          className="chip text-[0.5rem] py-0"
                          style={{ background: ps.bg, color: ps.color, border: `0.5px solid ${ps.border}` }}
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
