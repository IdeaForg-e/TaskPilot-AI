import { Tag, Layers, GitMerge, EyeOff } from 'lucide-react';

const STATUS_CONFIG = {
  done:        { label: 'DONE',        color: '#4caf8e', bg: 'rgba(76,175,142,0.1)',  border: 'rgba(76,175,142,0.3)' },
  completed:   { label: 'COMPLETED',   color: '#4caf8e', bg: 'rgba(76,175,142,0.1)',  border: 'rgba(76,175,142,0.3)' },
  in_progress: { label: 'IN PROGRESS', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  blocked:     { label: 'BLOCKED',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)' },
  open:        { label: 'OPEN',        color: '#8ecdff', bg: 'rgba(142,205,255,0.1)', border: 'rgba(142,205,255,0.3)' },
  todo:        { label: 'TODO',        color: '#94a3b8', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
};

const PLATFORM_COLORS = {
  jira:      { bg: 'rgba(142,205,255,0.08)', color: '#8ecdff', border: 'rgba(142,205,255,0.2)' },
  github:    { bg: 'rgba(192,199,210,0.08)', color: '#c0c7d2', border: 'rgba(192,199,210,0.2)' },
  slack:     { bg: 'rgba(245,158,11,0.08)',  color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  email:     { bg: 'rgba(239,68,68,0.08)',   color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  calendar:  { bg: 'rgba(76,175,142,0.08)',  color: '#4caf8e', border: 'rgba(76,175,142,0.2)' },
  meetings:  { bg: 'rgba(167,139,250,0.08)', color: '#a78bfa', border: 'rgba(167,139,250,0.2)' },
  incidents: { bg: 'rgba(249,115,22,0.08)',  color: '#f97316', border: 'rgba(249,115,22,0.2)' },
};

export default function TaskCard({ task, onClick, selected }) {
  const statusKey = (task.status || 'todo').toLowerCase().replace(/\s+/g, '_');
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.todo;
  const platforms = task.source_platforms || (task.source ? [task.source] : []);

  return (
    <button
      onClick={onClick}
      className={`glass-card w-full p-5 text-left group relative overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.99] ${
        selected
          ? 'border-cyan-400/50 bg-cyan-500/5 shadow-[0_0_24px_rgba(142,205,255,0.2)] ring-1 ring-cyan-400/30'
          : 'hover:-translate-y-0.5 hover:border-white/15'
      }`}
      style={{
        boxShadow: selected ? undefined : '0 12px 32px -10px rgba(0,0,0,0.5)',
      }}
    >
      {/* Dynamic corner ambient glow */}
      <div
        className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full blur-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(142,205,255,0.15), transparent 70%)' }}
      />

      {/* Header row: Title & Status badge */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <h4 className="font-headline text-sm font-semibold leading-snug line-clamp-2 flex-1 text-slate-100 group-hover:text-cyan-300 transition-colors">
          {task.title || `Task #${task.id}`}
        </h4>
        <span
          className="shrink-0 text-[9px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded-full"
          style={{
            background: statusCfg.bg,
            color: statusCfg.color,
            border: `0.5px solid ${statusCfg.border}`,
          }}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Description preview */}
      {task.description && (
        <p className="font-body text-xs leading-relaxed line-clamp-2 mb-3.5 text-slate-400">
          {task.description}
        </p>
      )}

      {/* Tags row: Hidden, Merged, Platforms */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {task.is_hidden && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono tracking-wider uppercase font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">
            <EyeOff className="h-2.5 w-2.5" />
            HIDDEN
          </span>
        )}
        {(task.source_count || 0) > 1 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono tracking-wider uppercase font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
            <GitMerge className="h-2.5 w-2.5" />
            {task.source_count} FUSED
          </span>
        )}
        {platforms.slice(0, 3).map((p) => {
          const pStyle = PLATFORM_COLORS[p.toLowerCase()] || {
            bg: 'rgba(255,255,255,0.04)',
            color: '#94a3b8',
            border: 'rgba(255,255,255,0.08)',
          };
          return (
            <span
              key={p}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-mono tracking-wider uppercase font-semibold"
              style={{
                background: pStyle.bg,
                color: pStyle.color,
                border: `0.5px solid ${pStyle.border}`,
              }}
            >
              {p}
            </span>
          );
        })}
      </div>

      {/* Footer: Type, Category, and Assignee */}
      <div
        className="flex flex-wrap items-center gap-3 pt-3"
        style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}
      >
        {task.type && (
          <span className="flex items-center gap-1.5 text-slate-400">
            <Layers className="h-3 w-3 text-slate-500" />
            <span className="font-mono text-[10px] tracking-wider uppercase">
              {task.type}
            </span>
          </span>
        )}

        {(() => {
          const isUnassigned =
            !task.assignee ||
            task.assignee === 'null' ||
            task.assignee === 'None' ||
            task.assignee === 'undefined';
          const name = isUnassigned ? 'Unassigned' : task.assignee;
          const initials = isUnassigned ? 'UN' : task.assignee.substring(0, 2);

          return (
            <div className="flex items-center gap-1.5 ml-auto">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold uppercase ${
                  isUnassigned
                    ? 'text-slate-500 bg-slate-800 border border-slate-700/60'
                    : 'text-slate-900 bg-cyan-300 font-bold'
                }`}
              >
                {initials}
              </div>
              <span
                className={`font-body text-xs truncate max-w-[120px] ${
                  isUnassigned ? 'text-slate-500' : 'text-slate-300'
                }`}
              >
                {name}
              </span>
            </div>
          );
        })()}
      </div>
    </button>
  );
}
