import { Star, LayoutGrid, CalendarRange, Clock } from 'lucide-react';
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
    return <EmptyState message="No planner agenda generated for this calendar date yet." />;
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {(plan?.recommendations?.length > 0 || plan?.overflow_tasks?.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {plan?.recommendations?.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">Planning Agent Recommendations</h3>
              <ul className="space-y-2">
                {plan.recommendations.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-350 flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {plan?.overflow_tasks?.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-300">Overflow / Deferred Work</h3>
              <ul className="space-y-2">
                {plan.overflow_tasks.slice(0, 5).map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-350">
                    <span className="font-bold text-slate-200">{item.title}</span>
                    <span className="block text-[10px] text-slate-500">{item.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Top Priorities Row */}
      {topTasks.length > 0 && (
        <div className="animate-fade-in-up stagger-1">
          <h3 className="mb-3.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Star className="h-4 w-4 text-amber-400 animate-spin duration-[4000ms]" />
            <span>High-Priority Focus Agenda</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {topTasks.map((task, idx) => (
              <div
                key={task.id || idx}
                className="glass-card bg-gradient-to-tr from-violet-600/10 to-indigo-600/5 border-violet-500/20 p-4.5 shadow-md hover:border-violet-500/40 transition-colors relative overflow-hidden group"
              >
                <div className="absolute right-0 top-0 h-10 w-10 bg-gradient-to-bl from-violet-500/10 to-transparent" />
                <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wide">Agenda Focus #{idx + 1}</span>
                <p className="text-sm font-bold text-slate-100 mt-1.5 leading-snug">{task.title}</p>
                {task.priority_score !== undefined && (
                  <p className="mt-2 text-[10px] font-bold text-indigo-400">
                    Priority Factor: {task.priority_score}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Schedule Column */}
      {slots.length > 0 && (
        <div className="animate-fade-in-up stagger-2">
          <h3 className="mb-4.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>Daily Schedule Timeline</span>
          </h3>
          
          <div className="relative border-l-2 border-slate-900 ml-3.5 pl-6 space-y-4">
            {slots.map((slot, i) => (
              <div key={slot.id || i} className="relative group">
                {/* Visual timeline circle node */}
                <span className="absolute -left-[31px] top-4.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-950 border-2 border-indigo-500/80 group-hover:border-cyan-450 transition-colors shadow-inner" />
                
                <TimeSlot slot={slot} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remaining Tasks Grid */}
      {remainingTasks.length > 0 && (
        <div className="animate-fade-in-up stagger-3">
          <h3 className="mb-3.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <LayoutGrid className="h-4 w-4 text-slate-500" />
            <span>Pipeline Backlog Agenda</span>
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {remainingTasks.map((task, idx) => (
              <div
                key={task.id || idx}
                className="glass-card p-4 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                  <span className="truncate">{task.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
