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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-scale-in cursor-pointer"
      style={{ background: 'rgba(44,51,43,0.35)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 md:p-7 shadow-2xl flex flex-col justify-between cursor-default"
        style={{
          background: '#f7f6f2',
          border: '1px solid #dad7cb',
          boxShadow: '0 20px 50px -10px rgba(44,51,43,0.2)',
        }}
      >
        <div>
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b border-[#dad7cb] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-xl bg-[#0284c7]/10 flex items-center justify-center border border-[#0284c7]/25">
                <Layers className="h-3.5 w-3.5 text-[#0284c7]" />
              </div>
              <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#0284c7]">
                TASK_TELEMETRY // INSPECTOR
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-[#788275] hover:bg-[#e7e5dc] hover:text-[#2c332b] transition-colors cursor-pointer border border-transparent hover:border-[#dad7cb] active:scale-95"
              title="Close Panel"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {loading && <LoadingSpinner label="Querying pipeline datastore..." />}
          {error && <ErrorMessage message={error} onRetry={loadDetail} />}

          {!loading && !error && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#2c332b] leading-tight">
                  {data.title || `Task #${data.id}`}
                </h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {data.is_hidden && (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-amber-600/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                      <EyeOff className="h-3 w-3" />
                      Hidden Work
                    </span>
                  )}
                  {(data.source_count || 0) > 1 && (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-[#0284c7]/20 bg-[#0284c7]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#0284c7]">
                      <GitMerge className="h-3 w-3" />
                      {data.source_count} Signals Fused
                    </span>
                  )}
                  {platforms.map((platform) => (
                    <span key={platform} className="rounded-lg border border-[#dad7cb] bg-[#efeee9] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#525d50]">
                      {platform}
                    </span>
                  ))}
                </div>
                {data.description && (
                  <p className="mt-2 text-xs text-[#525d50] leading-relaxed bg-[#efeee9] border border-[#dad7cb] p-3.5 rounded-xl">
                    {data.description}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#788275]">Attributes</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-[#efeee9] border border-[#dad7cb] p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#788275]">
                      <Shield className="h-3.5 w-3.5 text-[#788275]" />
                      <span>Status</span>
                    </div>
                    <dd className="mt-1 text-xs font-bold text-[#2c332b] capitalize">{data.status || 'todo'}</dd>
                  </div>

                  <div className="rounded-xl bg-[#efeee9] border border-[#dad7cb] p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#788275]">
                      <Layers className="h-3.5 w-3.5 text-[#788275]" />
                      <span>Type</span>
                    </div>
                    <dd className="mt-1 text-xs font-bold text-[#2c332b] capitalize">{data.type || '—'}</dd>
                  </div>

                  <div className="rounded-xl bg-[#efeee9] border border-[#dad7cb] p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#788275]">
                      <Tag className="h-3.5 w-3.5 text-[#788275]" />
                      <span>Source Stream</span>
                    </div>
                    <dd className="mt-1 text-xs font-bold text-[#2c332b] uppercase">{platforms.join(' + ') || data.source || 'manual'}</dd>
                  </div>

                  <div className="rounded-xl bg-[#efeee9] border border-[#dad7cb] p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#788275]">
                      <User className="h-3.5 w-3.5 text-[#788275]" />
                      <span>Assignee</span>
                    </div>
                    <dd className="mt-1 text-xs font-bold text-[#2c332b] flex items-center gap-1.5">
                      <span>{data.assignee || '—'}</span>
                      {assigneeTasksCount > 3 && (
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title={`Overloaded Queue (${assigneeTasksCount} active tasks)`} />
                      )}
                    </dd>
                    {assigneeTasksCount > 3 && (
                      <span className="text-[8px] font-bold uppercase tracking-wider text-rose-600 mt-1 block">Overloaded ({assigneeTasksCount} tasks)</span>
                    )}
                  </div>
                </div>

                {data.agent_summary && (
                  <div className="rounded-xl bg-[#0284c7]/5 border border-[#0284c7]/20 p-3.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#0284c7]">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Agent Summary
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#525d50]">{data.agent_summary}</p>
                  </div>
                )}

                {priority && (
                  <div className="rounded-xl bg-[#efeee9] border border-[#dad7cb] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#dad7cb] pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6c6e36]">
                        <BarChart3 className="h-4 w-4" />
                        <span>Priority Breakdown</span>
                      </div>
                      <span className="rounded-full bg-[#6c6e36]/10 border border-[#6c6e36]/20 px-2 py-0.5 text-[10px] font-bold text-[#6c6e36]">
                        Rank #{priority.rank} (Score: {priority.overall_score})
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-[#525d50]">
                      <div className="flex justify-between border-b border-[#dad7cb] pb-1">
                        <span>Severity Score:</span>
                        <span className="font-bold text-[#2c332b]">{priority.severity_score !== null ? priority.severity_score : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#dad7cb] pb-1">
                        <span>Deadline:</span>
                        <span className="font-bold text-[#2c332b]">{priority.deadline_score !== null ? priority.deadline_score : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#dad7cb] pb-1">
                        <span>Prod Impact:</span>
                        <span className="font-bold text-[#2c332b]">{priority.production_impact_score !== null ? priority.production_impact_score : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#dad7cb] pb-1">
                        <span>Cust Impact:</span>
                        <span className="font-bold text-[#2c332b]">{priority.customer_impact_score !== null ? priority.customer_impact_score : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#dad7cb] pb-1">
                        <span>Dependency:</span>
                        <span className="font-bold text-[#2c332b]">{priority.dependency_score !== null ? priority.dependency_score : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#dad7cb] pb-1">
                        <span>Blocker Score:</span>
                        <span className="font-bold text-[#2c332b]">{priority.blocker_score !== null ? priority.blocker_score : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Business Impact:</span>
                        <span className="font-bold text-[#2c332b]">{priority.business_impact_score !== null ? priority.business_impact_score : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quality Factor:</span>
                        <span className="font-bold text-[#2c332b]">{priority.quality_factor_score !== null ? priority.quality_factor_score : '—'}</span>
                      </div>
                    </div>
                    
                    <p className="text-[11px] leading-relaxed text-[#525d50] bg-[#efeee9] p-2.5 rounded-lg border border-[#dad7cb] mt-2">
                      <span className="font-bold text-[#6c6e36]">Score Signal Reason: </span>
                      {priority.explanation}
                    </p>
                  </div>
                )}

                {quality && (
                  <div className="rounded-xl bg-[#efeee9] border border-[#dad7cb] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#dad7cb] pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2e7d55]">
                        <Shield className="h-4 w-4" />
                        <span>Quality Breakdown</span>
                      </div>
                      <span className="rounded-full bg-[#2e7d55]/10 border border-[#2e7d55]/20 px-2 py-0.5 text-[10px] font-bold text-[#2e7d55]">
                        {quality.overall_score}% ({quality.actionability})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-[#525d50] border-b border-[#dad7cb] pb-3">
                      <div className="flex justify-between border-b border-[#dad7cb] pb-1">
                        <span>Clear Title:</span>
                        <span className="font-bold text-[#2c332b]">{quality.clear_title_score !== null ? `${quality.clear_title_score}%` : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#dad7cb] pb-1">
                        <span>Severity Info:</span>
                        <span className="font-bold text-[#2c332b]">{quality.severity_score !== null ? `${quality.severity_score}%` : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#dad7cb] pb-1">
                        <span>Repro Steps:</span>
                        <span className="font-bold text-[#2c332b]">{quality.reproduction_steps_score !== null ? `${quality.reproduction_steps_score}%` : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#dad7cb] pb-1">
                        <span>Logs / Traces:</span>
                        <span className="font-bold text-[#2c332b]">{quality.error_logs_score !== null ? `${quality.error_logs_score}%` : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Environment:</span>
                        <span className="font-bold text-[#2c332b]">{quality.environment_score !== null ? `${quality.environment_score}%` : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected Behavior:</span>
                        <span className="font-bold text-[#2c332b]">{quality.expected_behavior_score !== null ? `${quality.expected_behavior_score}%` : '—'}</span>
                      </div>
                    </div>

                    {quality.missing_info && quality.missing_info.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">Missing Information Checklist</span>
                        <ul className="list-disc pl-4 text-[10px] leading-relaxed text-[#525d50]">
                          {quality.missing_info.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {quality.clarification_questions && quality.clarification_questions.length > 0 && (
                      <div className="space-y-1 bg-amber-50 border border-amber-200/60 p-2.5 rounded-lg">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Clarification Questions</span>
                        <ul className="list-decimal pl-4 text-[10px] leading-relaxed text-[#525d50]">
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
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#788275]">
                      <Link2 className="h-3.5 w-3.5" />
                      Source Evidence / Duplicate Context
                    </div>
                    <div className="space-y-2">
                      {contextLinks.map((ctx, i) => (
                        <div key={i} className="rounded-xl border border-[#dad7cb] bg-[#efeee9] p-3">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="rounded bg-[#0284c7]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#0284c7]">{ctx.source}</span>
                            <span className="text-[9px] font-bold uppercase text-[#788275]">{ctx.link_type}</span>
                          </div>
                          <p className="text-xs font-semibold text-[#2c332b]">{ctx.title || 'Untitled source event'}</p>
                          {ctx.content && <p className="mt-1 text-[11px] leading-relaxed text-[#525d50]">{ctx.content}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3.5 pt-2">
                  {data.confidence !== undefined && (
                    <div className="flex items-center justify-between text-xs py-2.5 border-b border-[#dad7cb]">
                      <span className="text-[#788275]">Extraction Confidence</span>
                      <span className="font-bold text-[#0284c7] bg-[#0284c7]/10 border border-[#0284c7]/20 px-2 py-0.5 rounded-md text-[10px]">
                        {(data.confidence * 100).toFixed(0)}% Match
                      </span>
                    </div>
                  )}
                  {data.created_at && (
                    <div className="flex items-center justify-between text-xs py-2.5 border-b border-[#dad7cb]">
                      <span className="text-[#788275]">Extracted On</span>
                      <span className="font-semibold text-[#2c332b]">
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
        <div className="border-t border-[#dad7cb] pt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-[#efeee9] border border-[#dad7cb] hover:bg-[#e7e5dc] py-2.5 text-xs font-bold text-[#2c332b] transition-all cursor-pointer text-center"
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
