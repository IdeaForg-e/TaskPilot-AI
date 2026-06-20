import { Star } from 'lucide-react';
import TimeSlot from './TimeSlot';
import EmptyState from '../common/EmptyState';

export default function DailyPlanner({ plan }) {
  const topTasks = plan?.top_priority_tasks || plan?.top_tasks || [];
  const remainingTasks = plan?.remaining_tasks || [];
  const slots = (plan?.time_blocks || plan?.schedule || []).slice().sort((a, b) => {
    const ta = a.start_time || a.time || '';
    const tb = b.start_time || b.time || '';
    return ta.localeCompare(tb);
  });

  const hasAnyData =
    topTasks.length > 0 || remainingTasks.length > 0 || slots.length > 0;

  if (!hasAnyData) {
    return <EmptyState message="No plan generated for today yet." />;
  }

  return (
    <div className="space-y-6">
      {topTasks.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
            <Star className="h-4 w-4 text-amber-400" />
            Top Priority Today
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {topTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-indigo-700/60 bg-indigo-500/10 p-3 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-100">{task.title}</p>
                {task.priority_score !== undefined && (
                  <p className="mt-1 text-xs text-indigo-300">
                    Score: {task.priority_score}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {slots.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-slate-200">Schedule</h3>
          <div className="space-y-2">
            {slots.map((slot, i) => (
              <TimeSlot key={slot.id || i} slot={slot} />
            ))}
          </div>
        </div>
      )}

      {remainingTasks.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-slate-200">
            Remaining Tasks
          </h3>
          <ul className="space-y-2">
            {remainingTasks.map((task) => (
              <li
                key={task.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300 shadow-sm"
              >
                {task.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
