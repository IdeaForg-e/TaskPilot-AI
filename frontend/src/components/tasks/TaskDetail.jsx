import { useEffect, useState } from 'react';
import { X, User, Tag, Shield, Layers, HelpCircle, GitMerge, EyeOff, BarChart3, Link2 } from 'lucide-react';
import { getTaskDetail, getApiErrorMessage } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

export default function TaskDetail({ task, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTaskDetail(task.id);
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
  }, [task.id]);

  const data = detail || task;
  const platforms = data.source_platforms || [];
  const contextLinks = data.context_links || [];
  const quality = data.quality;
  const priority = data.priority;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm animate-fade-in-up lg:static lg:z-0 lg:bg-transparent lg:backdrop-blur-none lg:w-96 lg:shrink-0 lg:animate-none">
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-slate-800 bg-slate-950/90 backdrop-blur-xl p-6 shadow-2xl flex flex-col justify-between animate-slide-in-right lg:h-auto lg:w-full lg:max-w-none lg:border lg:border-slate-800/80 lg:bg-slate-900/40 lg:backdrop-blur-md lg:rounded-2xl lg:p-5 lg:shadow-xl lg:sticky lg:top-24 lg:overflow-y-hidden lg:animate-none">
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
                    <dd className="mt-1 text-xs font-bold text-slate-200">{data.assignee || '—'}</dd>
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

                {(quality || priority) && (
                  <div className="grid grid-cols-2 gap-3">
                    {quality && (
                      <div className="rounded-xl bg-slate-900/35 border border-slate-900/50 p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                          <Shield className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Quality</span>
                        </div>
                        <dd className="mt-1 text-xs font-bold text-slate-200">{quality.overall_score}%</dd>
                        <p className="mt-1 text-[10px] text-slate-500 capitalize">{quality.actionability}</p>
                      </div>
                    )}
                    {priority && (
                      <div className="rounded-xl bg-slate-900/35 border border-slate-900/50 p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                          <BarChart3 className="h-3.5 w-3.5 text-violet-400" />
                          <span>Priority</span>
                        </div>
                        <dd className="mt-1 text-xs font-bold text-slate-200">#{priority.rank} / {priority.overall_score}</dd>
                        <p className="mt-1 text-[10px] text-slate-500">{priority.explanation}</p>
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
  );
}
