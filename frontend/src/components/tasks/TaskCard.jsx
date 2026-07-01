import { Tag, Layers, GitMerge, EyeOff } from 'lucide-react';

const STATUS_CONFIG = {
  done:        { label: 'Done',        color: '#4caf8e', bg: 'rgba(76,175,142,0.1)',  border: 'rgba(76,175,142,0.2)' },
  completed:   { label: 'Completed',   color: '#4caf8e', bg: 'rgba(76,175,142,0.1)',  border: 'rgba(76,175,142,0.2)' },
  in_progress: { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  blocked:     { label: 'Blocked',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)' },
  open:        { label: 'Open',        color: 'var(--primary)', bg: 'rgba(142,205,255,0.08)', border: 'rgba(142,205,255,0.15)' },
  todo:        { label: 'Todo',        color: 'var(--outline)',  bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
};

export default function TaskCard({ task, onClick, selected }) {
  const statusKey = (task.status || 'todo').toLowerCase().replace(/\s+/g, '_');
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.todo;
  const platforms = task.source_platforms || (task.source ? [task.source] : []);

  return (
    <button
      onClick={onClick}
      className="glass-card w-full p-4 text-left group relative overflow-hidden transition-all duration-300"
      style={
        selected
          ? {
              borderColor: 'rgba(142,205,255,0.3)',
              background: 'rgba(142,205,255,0.04)',
              boxShadow: '0 0 0 0.5px rgba(142,205,255,0.2), 0 20px 40px rgba(0,0,0,0.4)',
            }
          : {}
      }
    >
      {/* Hover glow */}
      <div
        className="absolute -left-8 -bottom-8 h-20 w-20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(142,205,255,0.08), transparent)' }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4
          className="font-headline text-sm font-semibold leading-snug line-clamp-2 flex-1"
          style={{ color: 'var(--on-surface)' }}
        >
          {task.title || `Task #${task.id}`}
        </h4>
        <span
          className="chip shrink-0 text-[0.5rem] py-0.5"
          style={{ background: statusCfg.bg, color: statusCfg.color, border: `0.5px solid ${statusCfg.border}` }}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p
          className="font-body text-xs leading-relaxed line-clamp-2 mb-3"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          {task.description}
        </p>
      )}

      {/* Tags row */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {task.is_hidden && (
          <span
            className="chip text-[0.5rem] py-0"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '0.5px solid rgba(245,158,11,0.2)' }}
          >
            <EyeOff className="h-2.5 w-2.5" />
            Hidden
          </span>
        )}
        {(task.source_count || 0) > 1 && (
          <span
            className="chip text-[0.5rem] py-0"
            style={{ background: 'rgba(142,205,255,0.1)', color: 'var(--primary)', border: '0.5px solid rgba(142,205,255,0.2)' }}
          >
            <GitMerge className="h-2.5 w-2.5" />
            {task.source_count} Merged
          </span>
        )}
        {platforms.slice(0, 3).map((p) => (
          <span
            key={p}
            className="chip text-[0.5rem] py-0"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--outline)', border: '0.5px solid rgba(255,255,255,0.07)' }}
          >
            {p.toUpperCase()}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div
        className="flex flex-wrap items-center gap-3 pt-3"
        style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)' }}
      >
        {task.type && (
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" style={{ color: 'var(--outline)' }} />
            <span className="font-body text-[0.65rem]" style={{ color: 'var(--on-surface-variant)' }}>
              {task.type}
            </span>
          </span>
        )}
        {platforms.length > 0 && (
          <span className="flex items-center gap-1">
            <Tag className="h-3 w-3" style={{ color: 'var(--outline)' }} />
            <span className="font-body text-[0.65rem]" style={{ color: 'var(--on-surface-variant)' }}>
              {platforms.join(' + ')}
            </span>
          </span>
        )}
        {task.assignee && (
          <span className="flex items-center gap-1.5 ml-auto">
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center font-body text-[0.5rem] font-bold text-white uppercase"
              style={{ background: 'var(--primary-container)' }}
            >
              {task.assignee.substring(0, 2)}
            </div>
            <span className="font-body text-[0.65rem]" style={{ color: 'var(--on-surface-variant)' }}>
              {task.assignee}
            </span>
          </span>
        )}
      </div>
    </button>
  );
}
