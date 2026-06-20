const STATUS_STYLES = {
  done: 'border-emerald-700 bg-emerald-500/10 text-emerald-400',
  completed: 'border-emerald-700 bg-emerald-500/10 text-emerald-400',
  in_progress: 'border-amber-700 bg-amber-500/10 text-amber-400',
  blocked: 'border-red-700 bg-red-500/10 text-red-400',
  todo: 'border-slate-700 bg-slate-800/50 text-slate-400',
};

export default function TaskCard({ task, onClick }) {
  const statusKey = (task.status || 'todo').toLowerCase().replace(/\s+/g, '_');
  const statusClass = STATUS_STYLES[statusKey] || STATUS_STYLES.todo;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-slate-800 bg-slate-900 p-4 text-left shadow-sm transition-colors hover:border-slate-700 hover:bg-slate-900/70"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-slate-100">
          {task.title || `Task #${task.id}`}
        </h4>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}
        >
          {task.status || 'todo'}
        </span>
      </div>
      {task.description && (
        <p className="mb-3 line-clamp-2 text-xs text-slate-400">
          {task.description}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {task.type && <span>Type: {task.type}</span>}
        {task.source && <span>Source: {task.source}</span>}
        {task.assignee && <span>Assignee: {task.assignee}</span>}
      </div>
    </button>
  );
}
