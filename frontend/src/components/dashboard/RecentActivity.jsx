import { Clock, PlusCircle, CheckCircle, Tag, User } from 'lucide-react';
import EmptyState from '../common/EmptyState';

function parseUTCDate(dateString) {
  if (!dateString) return new Date(0);
  if (dateString instanceof Date) return dateString;
  const str = String(dateString);
  return new Date(str.endsWith('Z') ? str : str + 'Z');
}

function getRelativeTimeString(dateString) {
  if (!dateString) return '—';
  const date = parseUTCDate(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function RecentActivity({ tasks = [] }) {
  const recent = [...tasks]
    .sort((a, b) => parseUTCDate(b.created_at) - parseUTCDate(a.created_at))
    .slice(0, 5);

  return (
    <div className="glass-card p-5 shadow-lg relative overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10">
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">System Activity Feed</h3>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">Last 5 active tasks</span>
      </div>

      {recent.length === 0 ? (
        <EmptyState message="No recent system activity recorded yet." />
      ) : (
        <div className="flow-root">
          <ul className="-mb-8">
            {recent.map((task, idx) => {
              const isLast = idx === recent.length - 1;
              const sourceLabel = task.source || 'Manual';
              const isAgentExtracted = sourceLabel.toLowerCase() !== 'manual';

              return (
                <li key={task.id || idx}>
                  <div className="relative pb-8">
                    {!isLast && (
                      <span
                        className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-800/80"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-slate-950 ${
                          isAgentExtracted 
                            ? 'bg-violet-500/15 text-violet-400' 
                            : 'bg-indigo-500/15 text-indigo-400'
                        }`}>
                          {isAgentExtracted ? (
                            <PlusCircle className="h-4.5 w-4.5" />
                          ) : (
                            <CheckCircle className="h-4.5 w-4.5" />
                          )}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-xs font-semibold text-slate-200">
                            {task.title || `Extracted task #${task.id}`}
                            <span className="font-normal text-slate-400"> via </span>
                            <span className="inline-flex items-center rounded-full bg-slate-900 border border-slate-850 px-1.5 py-0.2 text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                              {sourceLabel}
                            </span>
                          </p>
                          {task.description && (
                            <p className="mt-1 text-[11px] text-slate-500 truncate max-w-lg">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <div className="whitespace-nowrap text-right text-[10px] font-medium text-slate-500">
                          {getRelativeTimeString(task.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
