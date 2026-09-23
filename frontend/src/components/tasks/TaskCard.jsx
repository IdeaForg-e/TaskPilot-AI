import { Tag, Layers, GitMerge, EyeOff } from 'lucide-react';

const STATUS_CONFIG = {
  done:        { label: 'DONE',        color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)' },
  completed:   { label: 'COMPLETED',   color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)' },
  in_progress: { label: 'IN PROGRESS', color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  blocked:     { label: 'BLOCKED',     color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)' },
  open:        { label: 'OPEN',        color: '#38bdf8', bg: 'rgba(0,210,255,0.1)',   border: 'rgba(0,210,255,0.3)' },
  todo:        { label: 'TODO',        color: '#94a3b8', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
};

const PLATFORM_COLORS = {
  jira:      { bg: 'rgba(0,210,255,0.08)', color: '#38bdf8', border: 'rgba(0,210,255,0.25)' },
  github:    { bg: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: 'rgba(255,255,255,0.15)' },
  slack:     { bg: 'rgba(245,158,11,0.08)',  color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  email:     { bg: 'rgba(239,68,68,0.08)',   color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  calendar:  { bg: 'rgba(16,185,129,0.08)',  color: '#34d399', border: 'rgba(16,185,129,0.25)' },
  meetings:  { bg: 'rgba(99,102,241,0.08)',  color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  incidents: { bg: 'rgba(249,115,22,0.08)',  color: '#fb923c', border: 'rgba(249,115,22,0.25)' },
};

export default function TaskCard({ task, onClick, selected }) {
  const statusKey = (task.status || 'todo').toLowerCase().replace(/\s+/g, '_');
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.todo;
  const platforms = task.source_platforms || (task.source ? [task.source] : []);

  return (
    <button
      onClick={onClick}
      className={`cockpit-card w-full p-4 text-left group relative overflow-hidden transition-all duration-150 cursor-pointer active:scale-[0.99] bg-[#0f172a] border ${
        selected
          ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_16px_rgba(0,210,255,0.15)] ring-1 ring-cyan-400/40'
          : 'border-[#1e293b] hover:border-slate-600 hover:bg-[#162032]'
      }`}
    >
      {/* Header row: Title & Status badge */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-xs font-semibold leading-snug line-clamp-2 flex-1 text-slate-100 group-hover:text-cyan-300 transition-colors">
          {task.title || `Task #${task.id}`}
        </h4>
        <span
          className="shrink-0 text-[9px] font-mono font-semibold tracking-wider px-2 py-0.2 rounded"
          style={{
            background: statusCfg.bg,
            color: statusCfg.color,
            border: `1px solid ${statusCfg.border}`,
          }}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Description preview */}
      {task.description && (
        <p className="text-[11px] leading-relaxed line-clamp-2 mb-3 text-slate-400">
          {task.description}
        </p>
      )}

      {/* Tags row: Hidden, Merged, Platforms */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {task.is_hidden && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono tracking-wider uppercase font-semibold bg-amber-950/50 text-amber-400 border border-amber-800/40">
            <EyeOff className="h-2.5 w-2.5" />
            HIDDEN
          </span>
        )}
        {(task.source_count || 0) > 1 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono tracking-wider uppercase font-semibold bg-cyan-950/50 text-cyan-400 border border-cyan-800/40">
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
              className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono tracking-wider uppercase font-medium"
              style={{
                background: pStyle.bg,
                color: pStyle.color,
                border: `1px solid ${pStyle.border}`,
              }}
            >
              {p}
            </span>
          );
        })}
      </div>

      {/* Footer: Type, Assignee */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#1e293b]/70">
        <span className="flex items-center gap-1 text-slate-400">
          <Layers className="h-3 w-3 text-slate-500" />
          <span className="font-mono text-[9px] tracking-wider uppercase">
            {task.type || 'TASK'}
          </span>
        </span>

        {(() => {
          const isUnassigned =
            !task.assignee ||
            task.assignee === 'null' ||
            task.assignee === 'None' ||
            task.assignee === 'undefined';
          const name = isUnassigned ? 'Unassigned' : task.assignee;
          const initials = isUnassigned ? 'UN' : task.assignee.substring(0, 2);

          return (
            <div className="flex items-center gap-1.5">
              <div
                className={`h-4.5 w-4.5 rounded-full flex items-center justify-center font-mono text-[8px] font-bold uppercase ${
                  isUnassigned
                    ? 'text-slate-500 bg-slate-800 border border-slate-700'
                    : 'text-slate-900 bg-cyan-400'
                }`}
              >
                {initials}
              </div>
              <span className={`text-[11px] truncate max-w-[110px] ${isUnassigned ? 'text-slate-500' : 'text-slate-300 font-medium'}`}>
                {name}
              </span>
            </div>
          );
        })()}
      </div>
    </button>
  );
}
