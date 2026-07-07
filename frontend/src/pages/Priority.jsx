import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getRankedTasks, getApiErrorMessage } from '../services/api';
import PriorityList from '../components/priority/PriorityList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { AlertTriangle, Sparkles, X } from 'lucide-react';

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

    {/* Custom Evaluation Explanation Modal Overlay */}
    {selectedTask && (
      <EvaluationModal 
        task={selectedTask} 
        rank={tasks.findIndex(t => t.id === selectedTask.id) + 1} 
        onClose={() => setSelectedTask(null)} 
      />
    )}
  </>
);
}

function EvaluationModal({ task, rank, onClose }) {
  const score = task.priority_score || task.overall_score || 0;
  const urgencyLabel = score >= 8.0 ? 'CRITICAL ALERT' : score >= 6.0 ? 'HIGH URGENCY' : 'MODERATE URGENCY';
  const urgencyColor = score >= 8.0 ? '#ef4444' : score >= 6.0 ? '#f59e0b' : 'var(--outline)';
  const urgencyBg = score >= 8.0 ? 'rgba(239,68,68,0.06)' : score >= 6.0 ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.04)';
  const urgencyBorder = score >= 8.0 ? 'rgba(239,68,68,0.15)' : score >= 6.0 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.08)';
  const platforms = task.platforms || (task.source ? [task.source] : []);

  return createPortal(
    <div 
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-scale-in cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-y-auto border border-slate-800 bg-slate-900/95 backdrop-blur-xl p-6 rounded-2xl shadow-2xl flex flex-col justify-between cursor-default animate-scale-in"
      >
        <div>
          {/* Header row */}
          <div className="flex items-start gap-4 mb-5 pb-4 border-b border-slate-800/80">
            <div 
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 border border-slate-800/60"
            >
              <AlertTriangle className="h-5 w-5" style={{ color: urgencyColor }} />
            </div>
            
            <div className="flex-1 min-w-0 mt-0.5">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span
                  className="chip text-[0.55rem] py-0.5 font-headline font-semibold"
                  style={{ background: urgencyBg, color: urgencyColor, border: `0.5px solid ${urgencyBorder}` }}
                >
                  {urgencyLabel}
                </span>
                <span className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                  ID: WF-{String(task.master_task_id || task.task_id || task.id || '0001').substring(0, 6).toUpperCase()}
                </span>
              </div>
            </div>
            
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white rounded-lg p-1.5 cursor-pointer hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Title */}
          <h3 className="font-headline text-xl font-bold leading-snug mb-4 text-white">
            #{rank > 0 ? rank : 1}. {task.title || `Task #${task.id}`}
          </h3>

          {/* Explanation Text */}
          <p className="font-body text-xs text-slate-300 leading-relaxed mb-6 bg-slate-950/40 border border-slate-950/80 p-4 rounded-xl">
            {task.explanation || task.reason || 'No prioritization evaluation reasoning provided.'}
          </p>
        </div>

        {/* Footer info strip */}
        <div className="flex flex-wrap gap-x-8 gap-y-4 pt-4 border-t border-slate-800/60 text-xs">
          <div>
            <p className="label-caps mb-1.5" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>ASSIGNED LEAD</p>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-[9px] font-bold text-primary">
                {String(task.assignee || 'UN').substring(0, 2).toUpperCase()}
              </div>
              <span className="font-headline font-semibold text-slate-200">{task.assignee || 'Unassigned'}</span>
            </div>
          </div>

          <div>
            <p className="label-caps mb-1.5" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>PRIORITY SCORE</p>
            <span className="font-headline font-semibold text-primary">{score} / 10</span>
          </div>

          {platforms.length > 0 && (
            <div>
              <p className="label-caps mb-1.5" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>SOURCES</p>
              <div className="flex flex-wrap gap-1">
                {platforms.map(p => (
                  <span key={p} className="chip text-[0.5rem] py-0" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--outline)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}