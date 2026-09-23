import { AlertTriangle, ShieldAlert, Zap } from 'lucide-react';

const getPlatformStyle = (platform) => {
  const map = {
    jira:      { bg: 'rgba(0,210,255,0.08)', color: '#38bdf8', border: 'rgba(0,210,255,0.25)' },
    github:    { bg: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: 'rgba(255,255,255,0.15)' },
    slack:     { bg: 'rgba(245,158,11,0.08)',  color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
    email:     { bg: 'rgba(239,68,68,0.08)',   color: '#f87171', border: 'rgba(239,68,68,0.25)' },
    calendar:  { bg: 'rgba(16,185,129,0.08)',  color: '#34d399', border: 'rgba(16,185,129,0.25)' },
    meetings:  { bg: 'rgba(99,102,241,0.08)',  color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
    incidents: { bg: 'rgba(249,115,22,0.08)',  color: '#fb923c', border: 'rgba(249,115,22,0.25)' },
  };
  return map[platform?.toLowerCase()] || { bg: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: 'rgba(255,255,255,0.08)' };
};

const URGENCY_LEVEL = {
  p0_critical:  { label: 'Critical Alert', color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)' },
  critical:     { label: 'Critical Alert', color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)' },
  p1_high:      { label: 'High Urgency',   color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  high:         { label: 'High Urgency',   color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  optimization: { label: 'Optimization',   color: '#38bdf8', bg: 'rgba(0,210,255,0.1)',   border: 'rgba(0,210,255,0.25)' },
  medium:       { label: 'Optimization',   color: '#38bdf8', bg: 'rgba(0,210,255,0.1)',   border: 'rgba(0,210,255,0.25)' },
};

function getUrgencyLevel(task, rank) {
  const score = task.priority_score || 0;
  if (rank === 1 || score >= 8.5) return URGENCY_LEVEL.critical;
  if (score >= 7.0) return URGENCY_LEVEL.high;
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
        className="cockpit-card priority-featured-card p-5 md:p-6 relative overflow-hidden text-left w-full cursor-pointer transition-all duration-200 block shadow-2xl bg-gradient-to-br from-[#1c131d] via-[#111827] to-[#0a0e17] border border-rose-500/40 hover:border-rose-500 hover:-translate-y-0.5"
      >
        {/* Large stylized watermark */}
        <div className="absolute top-2 right-6 font-mono text-7xl font-black select-none pointer-events-none text-rose-500/10">
          #01
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start gap-5 relative z-10">
          {/* Beacon icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-950/60 border border-rose-500/50 shadow-[0_0_16px_rgba(239,68,68,0.35)]">
            <AlertTriangle className="h-6 w-6 text-rose-400 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header chip row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase font-bold bg-rose-950/60 text-rose-300 border border-rose-700/50">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
                {urgency.label}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                SIGNAL_ID: WF-{String(task.id || '0001').substring(0, 6).toUpperCase()}
              </span>
            </div>

            <h3 className="text-lg md:text-xl font-bold leading-snug mb-2 text-white tracking-tight">
              #{rank}. {task.title || `Task #${task.id}`}
            </h3>

            <p className="text-xs md:text-sm leading-relaxed mb-4 max-w-3xl text-slate-300 bg-[#090d16] p-3.5 rounded border border-[#1e293b]">
              {explanation}
            </p>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-[#1e293b]">
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
                    <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-medium mb-1">
                      ASSIGNED LEAD
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center font-mono text-[8px] font-bold uppercase ${
                          isUnassigned
                            ? 'text-slate-500 bg-slate-800 border border-slate-700'
                            : 'text-slate-900 bg-cyan-400'
                        }`}
                      >
                        {initials}
                      </div>
                      <span className="text-xs font-semibold text-slate-200">
                        {name}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-medium mb-1">
                  PRIORITY SCORE
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-cyan-400 font-mono tabular-nums">
                    {task.priority_score ?? '—'}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">/ 10.0</span>
                </div>
              </div>

              {platforms.length > 0 && (
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-medium mb-1">
                    FUSED PLATFORMS
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {platforms.slice(0, 4).map((p) => {
                      const ps = getPlatformStyle(p);
                      return (
                        <span
                          key={p}
                          className="px-1.5 py-0.2 rounded text-[9px] font-mono tracking-wider uppercase font-medium"
                          style={{
                            background: ps.bg,
                            color: ps.color,
                            border: `1px solid ${ps.border}`,
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
      className="cockpit-card p-4 relative overflow-hidden text-left w-full cursor-pointer block transition-all duration-150 bg-[#0f172a] border border-[#1e293b] hover:border-slate-600 hover:bg-[#162032]"
    >
      {/* Rank watermark */}
      <div className="absolute top-2 right-3 font-mono text-3xl font-black select-none pointer-events-none text-slate-700/30">
        {rank < 10 ? `0${rank}` : rank}
      </div>

      {/* Badge & Title */}
      <div className="flex items-start gap-2.5 mb-2">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
          style={{ background: urgency.bg, border: `1px solid ${urgency.border}` }}
        >
          {rank === 2 || rank === 3
            ? <Zap className="h-3.5 w-3.5" style={{ color: urgency.color }} />
            : <ShieldAlert className="h-3.5 w-3.5" style={{ color: urgency.color }} />
          }
        </div>
        <div className="min-w-0 flex-1">
          <span
            className="inline-block text-[9px] font-mono font-semibold tracking-wider uppercase px-1.5 py-0.2 rounded mb-1"
            style={{ background: urgency.bg, color: urgency.color, border: `1px solid ${urgency.border}` }}
          >
            {urgency.label}
          </span>
          <h4 className="text-xs font-semibold leading-snug text-white">
            #{rank}. {task.title || `Task #${task.id}`}
          </h4>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed line-clamp-2 mb-3 text-slate-400">
        {explanation}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#1e293b]/70">
        <div className="flex items-center gap-1.5">
          {(() => {
            const isUnassigned = !task.assignee || task.assignee === 'null' || task.assignee === 'None' || task.assignee === 'undefined';
            const name = isUnassigned ? 'Unassigned' : task.assignee;
            const initials = isUnassigned ? 'UN' : task.assignee.substring(0, 2);
            return (
              <>
                <div
                  className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[8px] font-mono font-bold uppercase ${isUnassigned ? 'text-slate-500 bg-slate-800 border border-slate-700' : 'text-slate-900 bg-cyan-400'}`}
                >
                  {initials}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {name}
                </span>
              </>
            );
          })()}
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs font-bold text-cyan-400">
            {task.priority_score ?? '—'}
          </span>
          <span className="font-mono text-[9px] text-slate-500">/ 10</span>
        </div>
      </div>
    </button>
  );
}
