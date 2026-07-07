import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Tag, Shield, Layers, HelpCircle, GitMerge, EyeOff, BarChart3, Link2 } from 'lucide-react';
import { getTaskDetail, getApiErrorMessage } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

export default function TaskDetail({ task, tasks = [], onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const taskId = task.master_task_id || task.task_id || task.id;



  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTaskDetail(taskId);
      setDetail(res.data || task);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const data = detail || task;
  const platforms = data.source_platforms || [];
  const contextLinks = data.context_links || [];
  const quality = data.quality;
  const priority = data.priority;

  // Compute workload for assignee (count active status tasks)
  const assigneeTasksCount = data.assignee ? tasks.filter(t => t.assignee === data.assignee && t.status !== 'completed').length : 0;

  return createPortal(
    <div 
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-scale-in cursor-pointer"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-800 bg-slate-900/95 backdrop-blur-xl p-6 rounded-2xl shadow-2xl flex flex-col justify-between cursor-default">
        <div>
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b border-slate-900 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                <Layers className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Task Telemetry</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {loading && <LoadingSpinner label="Querying pipeline datastore..." />}
          {error && <ErrorMessage message={error} onRetry={loadDetail} />}

          {!loading && !error && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">
                  {data.title || `Task #${data.id}`}
                </h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {data.is_hidden && (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-300">
                      <EyeOff className="h-3 w-3" />
                      Hidden Work
                    </span>
                  )}
                  {(data.source_count || 0) > 1 && (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cyan-300">
                      <GitMerge className="h-3 w-3" />
                      {data.source_count} Signals Fused
                    </span>
                  )}
                  {platforms.map((platform) => (
                    <span key={platform} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-300">
                      {platform}
                    </span>
                  ))}
                </div>
                {data.description && (
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed bg-slate-900/40 border border-slate-900 p-3.5 rounded-xl">
                    {data.description}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450">Attributes</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-slate-900/35 border border-slate-900/50 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                      <Shield className="h-3.5 w-3.5 text-slate-600" />
                      <span>Status</span>
                    </div>
                    <dd className="mt-1 text-xs font-bold text-slate-200 capitalize">{data.status || 'todo'}</dd>
                  </div>

                  <div className="rounded-xl bg-slate-900/35 border border-slate-900/50 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                      <Layers className="h-3.5 w-3.5 text-slate-600" />
                      <span>Type</span>
                    </div>
                    <dd className="mt-1 text-xs font-bold text-slate-200 capitalize">{data.type || '—'}</dd>
                  </div>

                  <div className="rounded-xl bg-slate-900/35 border border-slate-900/50 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                      <Tag className="h-3.5 w-3.5 text-slate-600" />
                      <span>Source Stream</span>
                    </div>
                    <dd className="mt-1 text-xs font-bold text-slate-200 uppercase">{platforms.join(' + ') || data.source || 'manual'}</dd>
                  </div>

                  <div className="rounded-xl bg-slate-900/35 border border-slate-900/50 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                      <User className="h-3.5 w-3.5 text-slate-600" />
                      <span>Assignee</span>
                    </div>
                    <dd className="mt-1 text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span>{data.assignee || '—'}</span>
                      {assigneeTasksCount > 3 && (
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title={`Overloaded Queue (${assigneeTasksCount} active tasks)`} />
                      )}
                    </dd>
                    {assigneeTasksCount > 3 && (
                      <span className="text-[8px] font-bold uppercase tracking-wider text-rose-400 mt-1 block">Overloaded ({assigneeTasksCount} tasks)</span>
                    )}
                  </div>
                </div>

                {data.agent_summary && (
                  <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/20 p-3.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Agent Summary
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-350">{data.agent_summary}</p>
                  </div>
                )}

                {priority && (
                  <div className="rounded-xl bg-slate-900/30 border border-slate-850 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-400">
                        <BarChart3 className="h-4 w-4" />
                        <span>Priority Breakdown</span>
                      </div>
                      <span className="rounded-full bg-violet-950/40 border border-violet-800/30 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                        Rank #{priority.rank} (Score: {priority.overall_score})
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-slate-400">
                      <div className="flex justify-between border-b border-slate-900/50 pb-1">
                        <span>Severity Score:</span>
                        <span className="font-bold text-slate-200">{priority.severity_score !== null ? priority.severity_score : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900/50 pb-1">
                        <span>Deadline:</span>
                        <span className="font-bold text-slate-200">{priority.deadline_score !== null ? priority.deadline_score : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900/50 pb-1">
                        <span>Prod Impact:</span>
                        <span className="font-bold text-slate-200">{priority.production_impact_score !== null ? priority.production_impact_score : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900/50 pb-1">
                        <span>Cust Impact:</span>
                        <span className="font-bold text-slate-200">{priority.customer_impact_score !== null ? priority.customer_impact_score : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900/50 pb-1">
                        <span>Dependency:</span>
                        <span className="font-bold text-slate-200">{priority.dependency_score !== null ? priority.dependency_score : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900/50 pb-1">
                        <span>Blocker Score:</span>
                        <span className="font-bold text-slate-200">{priority.blocker_score !== null ? priority.blocker_score : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Business Impact:</span>
                        <span className="font-bold text-slate-200">{priority.business_impact_score !== null ? priority.business_impact_score : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quality Factor:</span>
                        <span className="font-bold text-slate-200">{priority.quality_factor_score !== null ? priority.quality_factor_score : '—'}</span>
                      </div>
                    </div>
                    
                    <p className="text-[11px] leading-relaxed text-slate-400 bg-slate-950/20 p-2.5 rounded-lg border border-slate-900/50 mt-2">
                      <span className="font-bold text-violet-400">Score Signal Reason: </span>
                      {priority.explanation}
                    </p>
                  </div>
                )}

                {quality && (
                  <div className="rounded-xl bg-slate-900/30 border border-slate-850 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                        <Shield className="h-4 w-4" />
                        <span>Quality Breakdown</span>
                      </div>
                      <span className="rounded-full bg-emerald-950/40 border border-emerald-800/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        {quality.overall_score}% ({quality.actionability})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-slate-400 border-b border-slate-950 pb-3">
                      <div className="flex justify-between border-b border-slate-900/50 pb-1">
                        <span>Clear Title:</span>
                        <span className="font-bold text-slate-200">{quality.clear_title_score !== null ? `${quality.clear_title_score}%` : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900/50 pb-1">
                        <span>Severity Info:</span>
                        <span className="font-bold text-slate-200">{quality.severity_score !== null ? `${quality.severity_score}%` : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900/50 pb-1">
                        <span>Repro Steps:</span>
                        <span className="font-bold text-slate-200">{quality.reproduction_steps_score !== null ? `${quality.reproduction_steps_score}%` : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900/50 pb-1">
                        <span>Logs / Traces:</span>
                        <span className="font-bold text-slate-200">{quality.error_logs_score !== null ? `${quality.error_logs_score}%` : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Environment:</span>
                        <span className="font-bold text-slate-200">{quality.environment_score !== null ? `${quality.environment_score}%` : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected Behavior:</span>
                        <span className="font-bold text-slate-200">{quality.expected_behavior_score !== null ? `${quality.expected_behavior_score}%` : '—'}</span>
                      </div>
                    </div>

                    {quality.missing_info && quality.missing_info.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-450 block">Missing Information Checklist</span>
                        <ul className="list-disc pl-4 text-[10px] leading-relaxed text-slate-400">
                          {quality.missing_info.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {quality.clarification_questions && quality.clarification_questions.length > 0 && (
                      <div className="space-y-1 bg-amber-500/5 border border-amber-550/20 p-2.5 rounded-lg">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">Clarification Questions</span>
                        <ul className="list-decimal pl-4 text-[10px] leading-relaxed text-slate-400">
                          {quality.clarification_questions.map((question, i) => (
                            <li key={i}>{question}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {contextLinks.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Link2 className="h-3.5 w-3.5" />
                      Source Evidence / Duplicate Context
                    </div>
                    <div className="space-y-2">
                      {contextLinks.map((ctx, i) => (
                        <div key={i} className="rounded-xl border border-slate-850 bg-slate-900/35 p-3">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="rounded bg-slate-950 px-1.5 py-0.5 text-[9px] font-bold uppercase text-cyan-300">{ctx.source}</span>
                            <span className="text-[9px] font-bold uppercase text-slate-600">{ctx.link_type}</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-250">{ctx.title || 'Untitled source event'}</p>
                          {ctx.content && <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{ctx.content}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3.5 pt-2">
                  {data.confidence !== undefined && (
                    <div className="flex items-center justify-between text-xs py-2.5 border-b border-slate-900">
                      <span className="text-slate-500">Extraction Confidence</span>
                      <span className="font-bold text-cyan-400 bg-cyan-950/20 border border-cyan-800/20 px-2 py-0.5 rounded-md text-[10px]">
                        {(data.confidence * 100).toFixed(0)}% Match
                      </span>
                    </div>
                  )}
                  {data.created_at && (
                    <div className="flex items-center justify-between text-xs py-2.5 border-b border-slate-900">
                      <span className="text-slate-500">Extracted On</span>
                      <span className="font-semibold text-slate-350">
                        {new Date(data.created_at.endsWith('Z') ? data.created_at : data.created_at + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-900 pt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-900 border border-slate-800/80 hover:bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer text-center"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  ,
    document.body
  );
}
