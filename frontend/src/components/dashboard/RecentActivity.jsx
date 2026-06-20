import { Clock } from 'lucide-react';
import EmptyState from '../common/EmptyState';

export default function RecentActivity({ tasks = [] }) {
  const recent = [...tasks]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 6);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-indigo-400" />
        <h3 className="text-sm font-medium text-slate-200">Recent Activity</h3>
      </div>
      {recent.length === 0 ? (
        <EmptyState message="No recent task activity." />
      ) : (
        <ul className="divide-y divide-slate-800">
          {recent.map((task) => (
            <li key={task.id} className="flex items-center justify-between py-2.5">
              <span className="truncate text-sm text-slate-300">
                {task.title || `Task #${task.id}`}
              </span>
              <span className="ml-3 shrink-0 text-xs text-slate-500">
                {task.created_at
                  ? new Date(task.created_at).toLocaleDateString()
                  : '—'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
