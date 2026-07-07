import { useEffect, useState } from 'react';
import { getRankedTasks, getApiErrorMessage } from '../services/api';
import PriorityList from '../components/priority/PriorityList';
import TaskDetail from '../components/tasks/TaskDetail';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { AlertTriangle, Sparkles } from 'lucide-react';

export default function Priority() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadTasks = async () => {
    setLoading(true); setError(null);
    try {
      const res = await getRankedTasks();
      setTasks(res.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  if (loading) return <LoadingSpinner label="Calculating workspace priorities..." />;
  if (error)   return <ErrorMessage message={error} onRetry={loadTasks} />;

  const highPriorityCount = tasks.filter((t) => (t.priority_score || 0) >= 8.0).length;
  const criticalCount     = tasks.filter((t) => (t.priority_score || 0) >= 9.0).length;

  return (
    <>
      <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            className="font-headline text-3xl font-light"
            style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}
          >
            Priority Leaderboard
          </h2>
          <p className="font-body text-sm mt-2 max-w-lg" style={{ color: 'var(--on-surface-variant)' }}>
            Intelligent triage system ranking tasks based on real-time urgency, impact, and engineering bandwidth.
          </p>
        </div>

        {/* Stat chips */}
        <div className="flex gap-3 shrink-0 flex-wrap">
          <div
            className="glass-card px-4 py-3 text-center"
            style={{ minWidth: '100px' }}
          >
            <p className="label-caps mb-1" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
              Active Items
            </p>
            <p className="font-headline text-2xl font-semibold" style={{ color: 'var(--on-surface)' }}>
              {tasks.length}
            </p>
          </div>
          <div
            className="glass-card px-4 py-3 text-center"
            style={{ minWidth: '100px', background: 'rgba(239,68,68,0.04)' }}
          >
            <p className="label-caps mb-1" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
              Critical
            </p>
            <p className="font-headline text-2xl font-semibold" style={{ color: '#ef4444' }}>
              {String(criticalCount).padStart(2, '0')}
            </p>
          </div>
        </div>
      </div>

      {/* Urgency distribution */}
      {tasks.length > 0 && (
        <div className="glass-card p-5 animate-fade-in-up stagger-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* System health score */}
            <div className="shrink-0">
              <p className="label-caps mb-1" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                System Health Score
              </p>
              <div className="flex items-end gap-1">
                <span className="font-headline text-4xl font-light" style={{ color: 'var(--on-surface)' }}>
                  {(tasks.reduce((s, t) => s + (t.priority_score || 0), 0) / Math.max(tasks.length, 1)).toFixed(1)}
                </span>
                <span className="font-body text-sm mb-1" style={{ color: 'var(--outline)' }}>/10</span>
              </div>
              <div className="mt-2 h-1 w-28 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((tasks.reduce((s, t) => s + (t.priority_score || 0), 0) / Math.max(tasks.length, 1)) * 10)}%`,
                    background: 'var(--primary)',
                    transition: 'width 1s ease',
                  }}
                />
              </div>
            </div>

            <div className="h-px sm:h-12 sm:w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

            {/* Distribution */}
            <div className="flex-1 min-w-0">
              <p className="label-caps mb-3" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                Urgency Distribution
              </p>
              {[
                { label: 'P0 - Critical', count: criticalCount,     color: '#ef4444' },
                { label: 'P1 - High',     count: highPriorityCount, color: '#f59e0b' },
                { label: 'P2 - Moderate', count: tasks.length - highPriorityCount, color: 'var(--outline)' },
              ].map(({ label, count, color }) => {
                const pct = tasks.length ? Math.round((count / tasks.length) * 100) : 0;
                return (
                  <div key={label} className="flex items-center gap-3 mb-2">
                    <span className="font-body text-xs w-24 shrink-0" style={{ color: 'var(--on-surface-variant)' }}>
                      {label}
                    </span>
                    <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <span className="font-headline text-sm font-semibold w-8 text-right" style={{ color }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="h-px sm:h-12 sm:w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

            {/* Alerts */}
            <div className="shrink-0 flex flex-col gap-2">
              {highPriorityCount > 0 && (
                <span className="chip chip-amber">
                  <AlertTriangle className="h-3 w-3" />
                  {highPriorityCount} High Urgency
                </span>
              )}
              {tasks.length > 0 && (
                <span className="chip chip-blue">
                  <Sparkles className="h-3 w-3" />
                  Rankings Complete
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <PriorityList tasks={tasks} onSelectTask={setSelectedTask} />
    </div>

    {/* Task Detail Modal Pop-up (Rendered outside the transform-animated container) */}
    {selectedTask && (
      <TaskDetail task={selectedTask} tasks={tasks} onClose={() => setSelectedTask(null)} />
    )}
  </>
);
}