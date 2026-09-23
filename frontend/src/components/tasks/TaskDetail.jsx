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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-scale-in cursor-pointer"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg p-6 bg-[#0f172a] border border-[#1e293b] shadow-2xl flex flex-col justify-between cursor-default"
      >
        <div>
          {/* Header */}
          <div className="mb-5 flex items-center justify-between border-b border-[#1e293b] pb-3.5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-cyan-950/60 flex items-center justify-center border border-cyan-800/40">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                TASK_TELEMETRY // INSPECTOR
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {loading && <LoadingSpinner label="Querying pipeline datastore..." />}
          {error && <ErrorMessage message={error} onRetry={loadDetail} />}

          {!loading && !error && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  {data.title || `Task #${data.id}`}
                </h3>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {data.is_hidden && (
                    <span className="inline-flex items-center gap-1 rounded border border-amber-800/40 bg-amber-950/50 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wide text-amber-400">
                      <EyeOff className="h-3 w-3" />
                      Hidden Work
                    </span>
                  )}
                  {(data.source_count || 0) > 1 && (
                    <span className="inline-flex items-center gap-1 rounded border border-cyan-800/40 bg-cyan-950/50 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wide text-cyan-400">
                      <GitMerge className="h-3 w-3" />
                      {data.source_count} Signals Fused
                    </span>
                  )}
                  {platforms.map((platform) => (
                    <span key={platform} className="rounded border border-[#1e293b] bg-[#090d16] px-2 py-0.5 text-[9px] font-mono font-medium uppercase tracking-wide text-slate-300">
                      {platform}
                    </span>
                  ))}
                </div>
                {data.description && (
                  <p className="mt-2.5 text-xs text-slate-300 leading-relaxed bg-[#090d16] border border-[#1e293b] p-3 rounded">
                    {data.description}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Attributes</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded bg-[#090d16] border border-[#1e293b] p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium text-slate-400">
                      <Shield className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Status</span>
                    </div>
                    <dd className="mt-1 text-xs font-semibold text-white capitalize">{data.status || 'todo'}</dd>
                  </div>

                  <div className="rounded bg-[#090d16] border border-[#1e293b] p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium text-slate-400">
                      <Layers className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Type</span>
                    </div>
                    <dd className="mt-1 text-xs font-semibold text-white capitalize">{data.type || '—'}</dd>
                  </div>

                  <div className="rounded bg-[#090d16] border border-[#1e293b] p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium text-slate-400">
                      <Tag className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Source Stream</span>
                    </div>
                    <dd className="mt-1 text-xs font-semibold text-white uppercase">{platforms.join(' + ') || data.source || 'manual'}</dd>
                  </div>

                  <div className="rounded bg-[#090d16] border border-[#1e293b] p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium text-slate-400">
                      <User className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Assignee</span>
                    </div>
                    <dd className="mt-1 text-xs font-semibold text-white flex items-center gap-1.5">
                      <span>{data.assignee || '—'}</span>
                      {assigneeTasksCount > 3 && (
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title={`Overloaded Queue (${assigneeTasksCount} active tasks)`} />
                      )}
                    </dd>
                    {assigneeTasksCount > 3 && (
                      <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-rose-400 mt-1 block">Overloaded ({assigneeTasksCount} tasks)</span>
                    )}
                  </div>
                </div>

                {data.agent_summary && (
                  <div className="rounded bg-cyan-950/20 border border-cyan-800/30 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Agent Summary
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">{data.agent_summary}</p>
                  </div>
                )}

                {priority && (
                  <div className="rounded bg-[#090d16] border border-[#1e293b] p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
                        <BarChart3 className="h-4 w-4" />
                        <span>Priority Breakdown</span>
                      </div>
                      <span className="rounded bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                        Rank #{priority.rank} (Score: {priority.overall_score})
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-mono">
                      <div className="flex justify-between border-b border-[#1e293b]/60 pb-1">
                        <span>Severity Score:</span>
                        <span className="font-semibold text-slate-200">{priority.severity_score !== null ? priority.severity_score : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#1e293b]/60 pb-1">
                        <span>Deadline:</span>
                        <span className="font-semibold text-slate-200">{priority.deadline_score !== null ? priority.deadline_score : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#1e293b]/60 pb-1">
                        <span>Prod Impact:</span>
                        <span className="font-semibold text-slate-200">{priority.production_impact_score !== null ? priority.production_impact_score : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#1e293b]/60 pb-1">
                        <span>Cust Impact:</span>
                        <span className="font-semibold text-slate-200">{priority.customer_impact_score !== null ? priority.customer_impact_score : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#1e293b]/60 pb-1">
                        <span>Dependency:</span>
                        <span className="font-semibold text-slate-200">{priority.dependency_score !== null ? priority.dependency_score : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#1e293b]/60 pb-1">
                        <span>Blocker Score:</span>
                        <span className="font-semibold text-slate-200">{priority.blocker_score !== null ? priority.blocker_score : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Business Impact:</span>
                        <span className="font-semibold text-slate-200">{priority.business_impact_score !== null ? priority.business_impact_score : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quality Factor:</span>
                        <span className="font-semibold text-slate-200">{priority.quality_factor_score !== null ? priority.quality_factor_score : '—'}</span>
                      </div>
                    </div>
                    
                    <p className="text-[11px] leading-relaxed text-slate-300 bg-[#0d121d] p-2.5 rounded border border-[#1e293b] mt-2">
                      <span className="font-mono text-cyan-400 font-semibold">Signal Rationale: </span>
                      {priority.explanation}
                    </p>
                  </div>
                )}

                {quality && (
                  <div className="rounded bg-[#090d16] border border-[#1e293b] p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
                        <Shield className="h-4 w-4" />
                        <span>Quality Breakdown</span>
                      </div>
                      <span className="rounded bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                        {quality.overall_score}% ({quality.actionability})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-mono border-b border-[#1e293b] pb-2.5">
                      <div className="flex justify-between border-b border-[#1e293b]/60 pb-1">
                        <span>Clear Title:</span>
                        <span className="font-semibold text-slate-200">{quality.clear_title_score !== null ? `${quality.clear_title_score}%` : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#1e293b]/60 pb-1">
                        <span>Severity Info:</span>
                        <span className="font-semibold text-slate-200">{quality.severity_score !== null ? `${quality.severity_score}%` : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#1e293b]/60 pb-1">
                        <span>Repro Steps:</span>
                        <span className="font-semibold text-slate-200">{quality.reproduction_steps_score !== null ? `${quality.reproduction_steps_score}%` : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#1e293b]/60 pb-1">
                        <span>Logs / Traces:</span>
                        <span className="font-semibold text-slate-200">{quality.error_logs_score !== null ? `${quality.error_logs_score}%` : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Environment:</span>
                        <span className="font-semibold text-slate-200">{quality.environment_score !== null ? `${quality.environment_score}%` : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected Behavior:</span>
                        <span className="font-semibold text-slate-200">{quality.expected_behavior_score !== null ? `${quality.expected_behavior_score}%` : '—'}</span>
                      </div>
                    </div>

                    {quality.missing_info && quality.missing_info.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 block">Missing Information Checklist</span>
                        <ul className="list-disc pl-4 text-[11px] leading-relaxed text-slate-300">
                          {quality.missing_info.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {quality.clarification_questions && quality.clarification_questions.length > 0 && (
                      <div className="space-y-1 bg-amber-950/20 border border-amber-800/30 p-2.5 rounded">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block">Clarification Questions</span>
                        <ul className="list-decimal pl-4 text-[11px] leading-relaxed text-slate-300">
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
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      <Link2 className="h-3.5 w-3.5" />
                      Source Evidence / Context Links
                    </div>
                    <div className="space-y-2">
                      {contextLinks.map((ctx, i) => (
                        <div key={i} className="rounded border border-[#1e293b] bg-[#090d16] p-2.5">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="rounded bg-cyan-950/60 px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase text-cyan-400 border border-cyan-800/30">{ctx.source}</span>
                            <span className="text-[9px] font-mono uppercase text-slate-500">{ctx.link_type}</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-200">{ctx.title || 'Untitled source event'}</p>
                          {ctx.content && <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{ctx.content}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#1e293b] pt-4 mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded px-4 py-1.5 text-xs font-semibold text-white bg-[#1e293b] hover:bg-slate-700 transition-colors"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
