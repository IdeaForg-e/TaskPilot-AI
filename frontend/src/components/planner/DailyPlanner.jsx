import { Star, LayoutGrid, Clock, Sparkles } from 'lucide-react';
import TimeSlot from './TimeSlot';
import EmptyState from '../common/EmptyState';

export default function DailyPlanner({ plan, onSelectTask }) {
  const topTasks = plan?.top_priority_tasks || plan?.top_tasks || [];
  const remainingTasks = plan?.remaining_tasks || [];
  const slots = (plan?.time_blocks || plan?.schedule || [])
    .slice()
    .sort((a, b) => (a.start_time || a.time || '').localeCompare(b.start_time || b.time || ''));

  const hasAnyData = topTasks.length > 0 || remainingTasks.length > 0 || slots.length > 0;
  if (!hasAnyData) return <EmptyState message="No planner agenda generated for this calendar date yet." />;

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Recommendations / overflow */}
      {(plan?.recommendations?.length > 0 || plan?.overflow_tasks?.length > 0) && (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          {plan?.recommendations?.length > 0 && (
            <div className="cockpit-card p-4 bg-[#0f172a] border border-[#1e293b]">
              <h3 className="text-xs font-semibold text-cyan-400 font-mono uppercase tracking-wider mb-2.5">
                Planning Agent Recommendations
              </h3>
              <ul className="space-y-2">
                {plan.recommendations.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-xs text-slate-300 leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {plan?.overflow_tasks?.length > 0 && (
            <div className="cockpit-card p-4 bg-[#0f172a] border border-[#1e293b]">
              <h3 className="text-xs font-semibold text-amber-400 font-mono uppercase tracking-wider mb-2.5">
                Overflow / Deferred Work
              </h3>
              <ul className="space-y-2">
                {plan.overflow_tasks.slice(0, 5).map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-medium text-white">{item.title}</span>
                    <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{item.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Top priorities */}
      {topTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400/20" />
            <span className="font-mono text-[10px] tracking-wider uppercase text-slate-300 font-semibold">
              HIGH-PRIORITY FOCUS AGENDA
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {topTasks.map((task, idx) => (
              <button
                key={task.id || idx}
                onClick={() => onSelectTask(task)}
                className="cockpit-card p-4 relative overflow-hidden text-left w-full cursor-pointer hover:border-cyan-400/40 hover:-translate-y-0.5 transition-all duration-150 block shadow-lg bg-[#0f172a] border border-[#1e293b] group"
              >
                <span className="font-mono text-[9px] uppercase tracking-wider text-cyan-400 font-bold block mb-1.5">
                  FOCUS #{idx + 1}
                </span>
                <p className="text-xs font-semibold leading-snug text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {task.title}
                </p>
                {task.priority_score !== undefined && (
                  <p className="font-mono text-[10px] text-cyan-300 font-semibold mt-2 tabular-nums">
                    SCORE: {task.priority_score} / 10
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Daily schedule */}
      {slots.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span className="font-mono text-[10px] tracking-wider uppercase text-slate-300 font-semibold">
              DAILY SCHEDULE TIMELINE
            </span>
          </div>
          <div className="space-y-2.5">
            {slots.map((slot, i) => (
              <TimeSlot key={slot.id || i} slot={slot} />
            ))}
          </div>
        </div>
      )}

      {/* Remaining tasks */}
      {remainingTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <LayoutGrid className="h-4 w-4 text-slate-400" />
            <span className="font-mono text-[10px] tracking-wider uppercase text-slate-400 font-semibold">
              BACKLOG QUEUE
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {remainingTasks.map((task, idx) => (
              <button
                key={task.id || idx}
                onClick={() => onSelectTask(task)}
                className="cockpit-card p-3 flex items-center gap-2 text-left w-full cursor-pointer hover:border-slate-600 hover:bg-[#162032] transition-all duration-150 block bg-[#0f172a] border border-[#1e293b] group"
              >
                <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-cyan-400 opacity-60 group-hover:opacity-100" />
                <span className="text-xs text-slate-300 truncate group-hover:text-cyan-200">
                  {task.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
