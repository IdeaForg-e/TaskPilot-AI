import { Star, LayoutGrid, Clock, Sparkles } from 'lucide-react';
import TimeSlot from './TimeSlot';
import EmptyState from '../common/EmptyState';

export default function DailyPlanner({ plan }) {
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
            <Star className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
            <span className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.6rem' }}>
              High-Priority Focus Agenda
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {topTasks.map((task, idx) => (
              <div
                key={task.id || idx}
                className="glass-card p-4 relative overflow-hidden"
                style={{ background: 'rgba(142,205,255,0.04)', borderColor: 'rgba(142,205,255,0.12)' }}
              >
                <div
                  className="absolute right-0 top-0 h-8 w-8"
                  style={{ background: 'linear-gradient(225deg, rgba(142,205,255,0.08), transparent)' }}
                />
                <span className="label-caps block mb-2" style={{ color: 'var(--primary)', fontSize: '0.5rem' }}>
                  Agenda Focus #{idx + 1}
                </span>
                <p className="font-headline text-sm font-semibold leading-snug" style={{ color: 'var(--on-surface)' }}>
                  {task.title}
                </p>
                {task.priority_score !== undefined && (
                  <p className="font-body text-[0.65rem] mt-2" style={{ color: 'var(--primary)' }}>
                    Priority: {task.priority_score}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily schedule */}
      {slots.length > 0 && (
        <div className="animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
            <span className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.6rem' }}>
              Daily Schedule Timeline
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
            <LayoutGrid className="h-3.5 w-3.5" style={{ color: 'var(--outline)' }} />
            <span className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.6rem' }}>
              Pipeline Backlog Agenda
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {remainingTasks.map((task, idx) => (
              <div
                key={task.id || idx}
                className="glass-card p-3 glass-card-hover flex items-center gap-2.5"
              >
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }} />
                <span className="font-body text-xs truncate" style={{ color: 'var(--on-surface-variant)' }}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom stats */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in-up stagger-4">
        {[
          { label: 'Deep Focus Units', value: String(topTasks.length + slots.filter(s => s.slot_type === 'task').length).padStart(2, '0') },
          { label: 'Cognitive Load',   value: slots.length > 6 ? 'High' : slots.length > 3 ? 'Medium' : 'Low' },
          { label: 'Time Saved (AI)',  value: `${Math.round(slots.length * 0.4 + 1)}h` },
        ].map(({ label, value }) => (
          <div key={label} className="glass-card p-4 text-center">
            <p className="label-caps mb-2" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>{label}</p>
            <p className="font-headline text-xl font-semibold" style={{ color: 'var(--on-surface)' }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
