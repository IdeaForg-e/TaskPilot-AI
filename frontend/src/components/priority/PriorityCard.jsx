export default function PriorityCard({ task, rank }) {
  const explanation = task.explanation || task.reason || 'No explanation provided';

  return (
    <div className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-sm font-semibold text-indigo-400">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-slate-100">
            {task.title || `Task #${task.id}`}
          </h4>
          <span className="rounded-full border border-indigo-700 bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400">
            Score: {task.priority_score ?? '—'}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">{explanation}</p>
      </div>
    </div>
  );
}
