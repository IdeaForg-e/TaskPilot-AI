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
    <div className="space-y-5 animate-fade-in-up">
      {/* Recommendations / overflow */}
      {(plan?.recommendations?.length > 0 || plan?.overflow_tasks?.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {plan?.recommendations?.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="font-headline text-xs font-semibold mb-3" style={{ color: 'var(--primary)' }}>
                Planning Agent Recommendations
              </h3>
              <ul className="space-y-2">
                {plan.recommendations.map((item, idx) => (
                  <li key={idx} className="flex gap-2 font-body text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--primary)' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {plan?.overflow_tasks?.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="font-headline text-xs font-semibold mb-3" style={{ color: '#f59e0b' }}>
                Overflow / Deferred Work
              </h3>
              <ul className="space-y-2">
                {plan.overflow_tasks.slice(0, 5).map((item, idx) => (
                  <li key={idx} className="font-body text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                    <span className="font-semibold" style={{ color: 'var(--on-surface)' }}>{item.title}</span>
                    <span className="block text-[0.6rem] mt-0.5" style={{ color: 'var(--outline)' }}>{item.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Top priorities */}
      {topTasks.length > 0 && (
        <div className="animate-fade-in-up stagger-1">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400/20" />
            <span className="font-mono text-[10px] tracking-wider uppercase text-slate-300 font-semibold">
              HIGH-PRIORITY FOCUS AGENDA
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {topTasks.map((task, idx) => (
              <button
                key={task.id || idx}
                onClick={() => onSelectTask(task)}
                className="glass-card p-5 relative overflow-hidden text-left w-full cursor-pointer hover:border-cyan-400/40 hover:-translate-y-0.5 transition-all duration-200 block shadow-lg group"
                style={{
                  background: 'linear-gradient(135deg, rgba(142,205,255,0.06) 0%, rgba(15,23,42,0.6) 100%)',
                  border: '0.5px solid rgba(142,205,255,0.18)',
                }}
              >
                <div
                  className="absolute right-0 top-0 h-10 w-10 bg-cyan-400/10 blur-xl group-hover:bg-cyan-400/25 transition-all"
                />
                <span className="font-mono text-[9px] uppercase tracking-wider text-cyan-400 font-bold block mb-2">
                  AGENDA FOCUS #{idx + 1}
                </span>
                <p className="font-headline text-sm font-semibold leading-snug text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {task.title}
                </p>
                {task.priority_score !== undefined && (
                  <p className="font-mono text-[10px] text-cyan-300 font-semibold mt-2.5 tabular-nums">
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
        <div className="animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span className="font-mono text-[10px] tracking-wider uppercase text-slate-300 font-semibold">
              DAILY SCHEDULE TIMELINE
            </span>
          </div>
          <div className="space-y-3">
            {slots.map((slot, i) => (
              <TimeSlot key={slot.id || i} slot={slot} />
            ))}
          </div>
        </div>
      )}

      {/* Remaining tasks */}
      {remainingTasks.length > 0 && (
        <div className="animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid className="h-4 w-4 text-slate-400" />
            <span className="font-mono text-[10px] tracking-wider uppercase text-slate-400 font-semibold">
              BACKLOG QUEUE
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {remainingTasks.map((task, idx) => (
              <button
                key={task.id || idx}
                onClick={() => onSelectTask(task)}
                className="glass-card p-3.5 flex items-center gap-2.5 text-left w-full cursor-pointer hover:border-cyan-400/30 hover:bg-white/[0.04] transition-all duration-200 block shadow-md group"
              >
                <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-cyan-400 opacity-60 group-hover:opacity-100" />
                <span className="font-body text-xs text-slate-300 truncate group-hover:text-cyan-200">
                  {task.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom telemetry stats */}
      <div className="grid grid-cols-3 gap-3.5 animate-fade-in-up stagger-4">
        {[
          { label: 'Deep Focus Units', value: String(topTasks.length + slots.filter(s => s.slot_type === 'task').length).padStart(2, '0') },
          { label: 'Cognitive Load',   value: slots.length > 6 ? 'High' : slots.length > 3 ? 'Medium' : 'Nominal' },
          { label: 'Saved by AI',      value: `${Math.round(slots.length * 0.4 + 1)}h` },
        ].map(({ label, value }) => (
          <div key={label} className="glass-card p-4 text-center shadow-lg">
            <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">{label}</p>
            <p className="font-headline text-xl font-bold text-slate-100 tabular-nums">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
