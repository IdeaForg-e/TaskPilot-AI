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
      <div className="space-y-5 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#1e293b]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="font-mono text-[10px] tracking-widest uppercase text-rose-400 font-semibold">
                TRIAGE_ALGORITHM // LEADERBOARD
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Priority Leaderboard
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-lg">
              Multi-dimensional triage weighting deadline urgency, engineering complexity, stakeholder impact, and bandwidth.
            </p>
          </div>

          {/* Stat chips */}
          <div className="flex gap-2.5 shrink-0 flex-wrap">
            <div className="cockpit-card px-3.5 py-2 text-center min-w-[100px] bg-[#0f172a] border border-[#1e293b]">
              <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-medium mb-0.5">
                ACTIVE QUEUE
              </p>
              <p className="text-xl font-bold text-white font-mono tabular-nums">
                {tasks.length}
              </p>
            </div>
            <div className="cockpit-card px-3.5 py-2 text-center min-w-[100px] bg-rose-950/30 border border-rose-800/40">
              <p className="font-mono text-[9px] uppercase tracking-wider text-rose-400 font-medium mb-0.5">
                P0 CRITICAL
              </p>
              <p className="text-xl font-bold text-rose-400 font-mono tabular-nums">
                {String(criticalCount).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>

        {/* Urgency distribution */}
        {tasks.length > 0 && (
          <div className="cockpit-card p-5 bg-[#0f172a] border border-[#1e293b] shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* System health score */}
              <div className="shrink-0">
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1">
                  SYSTEM TRIAGE INDEX
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white font-mono tabular-nums">
                    {(tasks.reduce((s, t) => s + (t.priority_score || 0), 0) / Math.max(tasks.length, 1)).toFixed(1)}
                  </span>
                  <span className="font-mono text-xs text-slate-500">/ 10.0</span>
                </div>
                <div className="mt-2 h-1.5 w-32 rounded-full bg-[#080d16] border border-[#1e293b] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(0,210,255,0.5)] transition-all duration-700"
                    style={{
                      width: `${Math.round((tasks.reduce((s, t) => s + (t.priority_score || 0), 0) / Math.max(tasks.length, 1)) * 10)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="h-px lg:h-12 lg:w-px bg-[#1e293b]" />

              {/* Distribution */}
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2.5">
                  URGENCY SPECTRUM BREAKDOWN
                </p>
                {[
                  { label: 'P0 - Critical', count: criticalCount,     color: '#ef4444' },
                  { label: 'P1 - High',     count: highPriorityCount, color: '#f59e0b' },
                  { label: 'P2 - Moderate', count: Math.max(0, tasks.length - highPriorityCount), color: '#38bdf8' },
                ].map(({ label, count, color }) => {
                  const pct = tasks.length ? Math.round((count / tasks.length) * 100) : 0;
                  return (
                    <div key={label} className="flex items-center gap-3 mb-1.5 font-mono">
                      <span className="text-xs w-28 shrink-0 text-slate-300">
                        {label}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-[#080d16] border border-[#1e293b] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
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

              <div className="h-px lg:h-12 lg:w-px bg-[#1e293b]" />

              {/* Alerts */}
              <div className="shrink-0 flex flex-col gap-2">
                {highPriorityCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    {highPriorityCount} HIGH ESCALATIONS
                  </span>
                )}
                {tasks.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
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
  const urgencyColor = score >= 8.0 ? '#f87171' : score >= 6.0 ? '#fbbf24' : '#38bdf8';
  const urgencyBg = score >= 8.0 ? 'rgba(239,68,68,0.1)' : score >= 6.0 ? 'rgba(245,158,11,0.1)' : 'rgba(0,210,255,0.08)';
  const urgencyBorder = score >= 8.0 ? 'rgba(239,68,68,0.3)' : score >= 6.0 ? 'rgba(245,158,11,0.3)' : 'rgba(0,210,255,0.2)';
  const platforms = task.platforms || (task.source ? [task.source] : []);

  return createPortal(
    <div 
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-scale-in cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-y-auto rounded-lg p-6 shadow-2xl flex flex-col justify-between cursor-default bg-[#0f172a] border border-[#1e293b]"
      >
        <div>
          {/* Header row */}
          <div className="flex items-start gap-3.5 mb-4 pb-3.5 border-b border-[#1e293b]">
            <div 
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#090d16] border border-[#1e293b]"
            >
              <AlertTriangle className="h-5 w-5" style={{ color: urgencyColor }} />
            </div>
            
            <div className="flex-1 min-w-0 mt-0.5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className="px-2 py-0.2 rounded text-[9px] font-mono font-semibold uppercase tracking-wider"
                  style={{ background: urgencyBg, color: urgencyColor, border: `1px solid ${urgencyBorder}` }}
                >
                  {urgencyLabel}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                  ID: WF-{String(task.master_task_id || task.task_id || task.id || '0001').substring(0, 6).toUpperCase()}
                </span>
              </div>
            </div>
            
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white rounded p-1 cursor-pointer hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold leading-snug mb-3 text-white">
            #{rank > 0 ? rank : 1}. {task.title || `Task #${task.id}`}
          </h3>

          {/* Explanation Text */}
          <p className="text-xs text-slate-300 leading-relaxed mb-5 bg-[#090d16] border border-[#1e293b] p-3.5 rounded">
            {task.explanation || task.reason || 'No prioritization evaluation reasoning provided.'}
          </p>
        </div>

        {/* Footer info strip */}
        <div className="flex flex-wrap gap-x-6 gap-y-3 pt-3.5 border-t border-[#1e293b] text-xs">
          <div>
            <p className="font-mono text-[9px] uppercase text-slate-400 mb-1">ASSIGNED LEAD</p>
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-cyan-950/80 flex items-center justify-center border border-cyan-800/40 text-[9px] font-bold text-cyan-400 font-mono">
                {String(task.assignee || 'UN').substring(0, 2).toUpperCase()}
              </div>
              <span className="font-semibold text-slate-200">{task.assignee || 'Unassigned'}</span>
            </div>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase text-slate-400 mb-1">PRIORITY SCORE</p>
            <span className="font-mono font-bold text-cyan-400">{score} / 10</span>
          </div>

          {platforms.length > 0 && (
            <div>
              <p className="font-mono text-[9px] uppercase text-slate-400 mb-1">SOURCES</p>
              <div className="flex flex-wrap gap-1">
                {platforms.map(p => (
                  <span key={p} className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-[#090d16] text-slate-300 border border-[#1e293b]">
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