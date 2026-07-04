import PriorityCard from './PriorityCard';
import EmptyState from '../common/EmptyState';

export default function PriorityList({ tasks = [] }) {
  if (tasks.length === 0) {
    return <EmptyState message="No ranked tasks available. Run the pipeline first." />;
  }

  // Rank 1 featured, then 3-column grid for ranks 2-4, then table for the rest
  const [topTask, ...rest] = tasks;
  const gridTasks = rest.slice(0, 3);
  const tableTasks = rest.slice(3);

  return (
    <div className="space-y-4">
      {/* Featured #1 */}
      <div className="animate-fade-in-up stagger-1">
        <PriorityCard task={topTask} rank={1} />
      </div>

      {/* Grid #2–4 */}
      {gridTasks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up stagger-2">
          {gridTasks.map((task, i) => (
            <PriorityCard key={task.id} task={task} rank={i + 2} />
          ))}
        </div>
      )}

      {/* Table for remaining */}
      {tableTasks.length > 0 && (
        <div className="glass-card overflow-hidden animate-fade-in-up stagger-3">
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            <h3 className="font-headline text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
              Remaining Backlog Priority Rankings
            </h3>
            <div className="flex items-center gap-2">
              <button className="btn-ghost text-[0.6rem] py-1 px-2 rounded-lg">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </button>
              <button className="btn-ghost text-[0.6rem] py-1 px-2 rounded-lg">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>
            </div>
          </div>

          {/* Column headers */}
          <div
            className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-4 px-5 py-2.5"
            style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}
          >
            {['Task Details', 'Complexity', 'Urgency Score', 'Status', 'Action'].map((h) => (
              <span key={h} className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {tableTasks.map((task, i) => {
            const score = task.priority_score || 0;
            const bars = Math.round((score / 10) * 5);
            const statusColor = score >= 8.0 ? '#ef4444' : score >= 6.0 ? '#f59e0b' : '#89929b';

            return (
              <div
                key={task.id}
                className="hairline-row grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-4 items-center px-5 py-3.5 cursor-default"
              >
                {/* Task details */}
                <div className="min-w-0">
                  <p className="font-body text-xs font-semibold truncate" style={{ color: 'var(--on-surface)' }}>
                    {task.title || `Task #${task.id}`}
                  </p>
                  <p className="font-body mt-0.5" style={{ color: 'var(--outline)', fontSize: '0.6rem' }}>
                    {task.type || task.source || 'General'}
                  </p>
                </div>

                {/* Complexity bars */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, b) => (
                    <div
                      key={b}
                      className="h-1.5 w-4 rounded-sm transition-all"
                      style={{
                        background: b < bars
                          ? (bars >= 4 ? 'var(--primary)' : bars >= 3 ? '#f59e0b' : 'var(--outline)')
                          : 'rgba(255,255,255,0.06)',
                      }}
                    />
                  ))}
                </div>

                {/* Score */}
                <span className="font-headline text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                  {score} / 10
                </span>

                {/* Status */}
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor }} />
                  <span className="font-body text-xs capitalize" style={{ color: 'var(--on-surface-variant)' }}>
                    {task.status || 'Pending'}
                  </span>
                </div>

                {/* Action */}
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                  style={{ border: '0.5px solid rgba(255,255,255,0.08)' }}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--outline)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
