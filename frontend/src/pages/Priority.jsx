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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-rose-400 font-semibold">
              TRIAGE_ALGORITHM // LEADERBOARD
            </span>
          </div>
          <h2
            className="font-headline text-3xl font-light text-slate-100 tracking-tight"
          >
            Priority Leaderboard
          </h2>
          <p className="font-body text-xs text-slate-400 mt-1 max-w-lg">
            Multi-dimensional triage weighting deadline urgency, engineering complexity, stakeholder impact, and bandwidth.
          </p>
        </div>

        {/* Stat chips */}
        <div className="flex gap-3 shrink-0 flex-wrap">
          <div
            className="glass-card px-4 py-2.5 text-center min-w-[110px] shadow-lg"
          >
            <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
              ACTIVE QUEUE
            </p>
            <p className="font-headline text-2xl font-bold text-slate-100 tabular-nums">
              {tasks.length}
            </p>
          </div>
          <div
            className="glass-card px-4 py-2.5 text-center min-w-[110px] shadow-lg border-rose-500/30 bg-rose-500/5"
          >
            <p className="font-mono text-[9px] uppercase tracking-wider text-rose-400 font-semibold mb-0.5">
              P0 CRITICAL
            </p>
            <p className="font-headline text-2xl font-bold text-rose-400 tabular-nums">
              {String(criticalCount).padStart(2, '0')}
            </p>
          </div>
        </div>
      </div>

      {/* Urgency distribution */}
      {tasks.length > 0 && (
        <div
          className="glass-card p-6 animate-fade-in-up stagger-1 shadow-2xl relative overflow-hidden"
          style={{ boxShadow: '0 20px 40px -15px rgba(0,0,0,0.6)' }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* System health score */}
            <div className="shrink-0">
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                SYSTEM TRIAGE INDEX
              </p>
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-4xl font-bold text-white tabular-nums">
                  {(tasks.reduce((s, t) => s + (t.priority_score || 0), 0) / Math.max(tasks.length, 1)).toFixed(1)}
                </span>
                <span className="font-mono text-xs text-slate-500">/ 10.0</span>
              </div>
              <div className="mt-2.5 h-1.5 w-32 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(142,205,255,0.4)] transition-all duration-1000"
                  style={{
                    width: `${Math.round((tasks.reduce((s, t) => s + (t.priority_score || 0), 0) / Math.max(tasks.length, 1)) * 10)}%`,
                  }}
                />
              </div>
            </div>

            <div className="h-px lg:h-14 lg:w-px bg-white/8" />

            {/* Distribution */}
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3">
                URGENCY SPECTRUM BREAKDOWN
              </p>
              {[
                { label: 'P0 - Critical', count: criticalCount,     color: '#ef4444' },
                { label: 'P1 - High',     count: highPriorityCount, color: '#f59e0b' },
                { label: 'P2 - Moderate', count: Math.max(0, tasks.length - highPriorityCount), color: '#8ecdff' },
              ].map(({ label, count, color }) => {
                const pct = tasks.length ? Math.round((count / tasks.length) * 100) : 0;
                return (
                  <div key={label} className="flex items-center gap-3 mb-2 font-mono">
                    <span className="text-xs w-28 shrink-0 text-slate-300">
                      {label}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <span className="text-xs font-bold w-12 text-right tabular-nums" style={{ color }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="h-px lg:h-14 lg:w-px bg-white/8" />

            {/* Alerts */}
            <div className="shrink-0 flex flex-col gap-2">
              {highPriorityCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {highPriorityCount} HIGH ESCALATIONS
                </span>
              )}
              {tasks.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Sparkles className="h-3.5 w-3.5" />
                  TRIAGE NOMINAL
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-scale-in cursor-pointer"
      style={{ background: 'rgba(44,51,43,0.35)', backdropFilter: 'blur(8px)' }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-y-auto rounded-2xl p-6 shadow-xl flex flex-col justify-between cursor-default animate-scale-in"
        style={{ background: '#f7f6f2', border: '1px solid #dad7cb', boxShadow: '0 20px 50px -10px rgba(44,51,43,0.2)' }}
      >
        <div>
          {/* Header row */}
          <div className="flex items-start gap-4 mb-5 pb-4 border-b border-[#dad7cb]">
            <div 
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#efeee9] border border-[#dad7cb]"
            >
              <AlertTriangle className="h-5 w-5" style={{ color: urgencyColor }} />
            </div>
            
            <div className="flex-1 min-w-0 mt-0.5">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span
                  className="chip text-[0.55rem] py-0.5 font-headline font-semibold"
                  style={{ background: urgencyBg, color: urgencyColor, border: `1px solid ${urgencyBorder}` }}
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
              className="text-[#788275] hover:text-[#2c332b] rounded-lg p-1.5 cursor-pointer hover:bg-[#e7e5dc] transition-colors shrink-0"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Title */}
          <h3 className="font-headline text-xl font-bold leading-snug mb-4 text-[#2c332b]">
            #{rank > 0 ? rank : 1}. {task.title || `Task #${task.id}`}
          </h3>

          {/* Explanation Text */}
          <p className="font-body text-xs text-[#525d50] leading-relaxed mb-6 bg-[#efeee9] border border-[#dad7cb] p-4 rounded-xl">
            {task.explanation || task.reason || 'No prioritization evaluation reasoning provided.'}
          </p>
        </div>

        {/* Footer info strip */}
        <div className="flex flex-wrap gap-x-8 gap-y-4 pt-4 border-t border-[#dad7cb] text-xs">
          <div>
            <p className="label-caps mb-1.5" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>ASSIGNED LEAD</p>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-[9px] font-bold text-primary">
                {String(task.assignee || 'UN').substring(0, 2).toUpperCase()}
              </div>
              <span className="font-headline font-semibold text-[#2c332b]">{task.assignee || 'Unassigned'}</span>
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
                  <span key={p} className="chip text-[0.5rem] py-0" style={{ background: '#efeee9', color: '#525d50', border: '1px solid #dad7cb' }}>
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