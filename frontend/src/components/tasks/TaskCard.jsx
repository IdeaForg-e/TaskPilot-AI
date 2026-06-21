import { Tag, User, Layers, GitMerge, EyeOff } from 'lucide-react';

const STATUS_STYLES = {
  done: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]',
  completed: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]',
  in_progress: 'border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.1)]',
  blocked: 'border-red-500/20 bg-red-500/10 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.1)]',
  todo: 'border-slate-800 bg-slate-900/40 text-slate-400',
};

export default function TaskCard({ task, onClick, selected }) {
  const statusKey = (task.status || 'todo').toLowerCase().replace(/\s+/g, '_');
  const statusClass = STATUS_STYLES[statusKey] || STATUS_STYLES.todo;
  const platforms = task.source_platforms || (task.source ? [task.source] : []);

  return (
    <button
      onClick={onClick}
      className={`glass-card w-full p-5 text-left shadow-md group relative overflow-hidden transition-all duration-300 ${
        selected
          ? 'border-violet-500/50 bg-violet-950/20 shadow-[0_0_15px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/20'
          : 'glass-card-hover border-slate-900/60'
      }`}
    >
      {/* Background highlight on card hover */}
      <div className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-indigo-500/5 blur-xl group-hover:bg-indigo-500/10 transition-colors" />

      <div className="mb-3 flex items-start justify-between gap-3">
        <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-200 transition-colors line-clamp-2">
          {task.title || `Task #${task.id}`}
        </h4>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusClass}`}
        >
          {task.status || 'todo'}
        </span>
      </div>

      {task.description && (
        <p className="mb-4 line-clamp-2 text-xs text-slate-400/90 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        {task.is_hidden && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-300">
            <EyeOff className="h-3 w-3" />
            Hidden Work
          </span>
        )}
        {(task.source_count || 0) > 1 && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cyan-300">
            <GitMerge className="h-3 w-3" />
            {task.source_count} Signals Merged
          </span>
        )}
        {platforms.slice(0, 4).map((platform) => (
          <span
            key={platform}
            className="rounded-lg border border-slate-700/60 bg-slate-950/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400"
          >
            {platform}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3.5 border-t border-slate-900 pt-3.5 text-[10px] font-semibold text-slate-500">
        {task.type && (
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3 text-slate-650" />
            <span className="text-slate-400">{task.type}</span>
          </span>
        )}
        {platforms.length > 0 && (
          <span className="flex items-center gap-1">
            <Tag className="h-3 w-3 text-slate-650" />
            <span className="inline-flex items-center rounded bg-slate-900 px-1 py-0.2 text-[9px] font-bold text-slate-400 uppercase">
              {platforms.join(' + ')}
            </span>
          </span>
        )}
        {task.assignee && (
          <span className="flex items-center gap-1 ml-auto">
            <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-[8px] font-bold text-white uppercase">
              {task.assignee.substring(0, 2)}
            </div>
            <span className="text-slate-400">{task.assignee}</span>
          </span>
        )}
      </div>
    </button>
  );
}
