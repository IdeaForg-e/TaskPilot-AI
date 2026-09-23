import { Link } from 'react-router-dom';
import { Clock, PlusCircle, CheckCircle } from 'lucide-react';
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
  const diffSec = Math.floor((now - date) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60)   return 'Just now';
  if (diffMin < 60)   return `${diffMin}m ago`;
  if (diffHr < 24)    return `${diffHr}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const SOURCE_TAGS = {
  jira: { bg: 'rgba(0,210,255,0.08)', color: '#38bdf8', border: 'rgba(0,210,255,0.2)' },
  github: { bg: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: 'rgba(255,255,255,0.12)' },
  slack: { bg: 'rgba(245,158,11,0.08)', color: '#fbbf24', border: 'rgba(245,158,11,0.2)' },
  email: { bg: 'rgba(239,68,68,0.08)', color: '#f87171', border: 'rgba(239,68,68,0.2)' },
  calendar: { bg: 'rgba(16,185,129,0.08)', color: '#34d399', border: 'rgba(16,185,129,0.2)' },
  meetings: { bg: 'rgba(99,102,241,0.08)', color: '#818cf8', border: 'rgba(99,102,241,0.2)' },
  incidents: { bg: 'rgba(249,115,22,0.08)', color: '#fb923c', border: 'rgba(249,115,22,0.2)' },
};

export default function RecentActivity({ tasks = [] }) {
  const recent = [...tasks]
    .sort((a, b) => parseUTCDate(b.created_at) - parseUTCDate(a.created_at))
    .slice(0, 5);

  return (
    <div className="cockpit-card p-5 bg-[#0f172a] border border-[#1e293b] shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e293b]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white tracking-wide uppercase font-mono">
              Ingested Activity & Signals
            </h3>
            <p className="font-mono text-[9px] text-slate-400 tracking-wider uppercase mt-0.5">
              Latest Parsed Event Stream
            </p>
          </div>
        </div>

        <Link
          to="/tasks"
          className="font-mono text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 group"
        >
          VIEW_ALL
          <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>

      {recent.length === 0 ? (
        <EmptyState message="No recent activity recorded across data streams." />
      ) : (
        <div className="overflow-x-auto">
          {/* Table header */}
          <div className="grid grid-cols-[2.5fr_1fr_1.2fr_1fr] gap-4 px-3 pb-2 mb-1 border-b border-[#1e293b]">
            {['Signal / Task Name', 'Status', 'Assignee / Platform', 'Timeline'].map((h) => (
              <span
                key={h}
                className="font-mono text-[9px] tracking-wider uppercase text-slate-400 font-semibold"
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#1e293b]/60">
            {recent.map((task, idx) => {
              const sourceLabel = (task.source || 'manual').toLowerCase();
              const sourceStyle = SOURCE_TAGS[sourceLabel] || {
                bg: 'rgba(255,255,255,0.04)',
                color: '#cbd5e1',
                border: 'rgba(255,255,255,0.08)',
              };
              const statusKey = (task.status || 'new').toLowerCase();
              const isDone = statusKey === 'completed' || statusKey === 'done';

              return (
                <div
                  key={task.id || idx}
                  className="grid grid-cols-[2.5fr_1fr_1.2fr_1fr] gap-4 items-center px-3 py-2.5 rounded transition-all duration-150 hover:bg-[#162032] group"
                >
                  {/* Name & Type */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded shrink-0 bg-[#090d16] border border-[#1e293b]">
                      {isDone ? (
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <PlusCircle className="h-3 w-3 text-cyan-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                        {task.title || `Task #${task.id}`}
                      </p>
                      <p className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">
                        {task.type || sourceLabel}
                      </p>
                    </div>
                  </div>

                  {/* Status chip */}
                  <div>
                    <span
                      className={`inline-flex items-center px-2 py-0.2 rounded text-[9px] font-mono tracking-wider uppercase font-semibold ${
                        isDone
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40'
                      }`}
                    >
                      {isDone ? 'COMPLETED' : 'ACTIVE'}
                    </span>
                  </div>

                  {/* Assignee / Platform */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="px-2 py-0.2 rounded text-[9px] font-mono uppercase font-medium tracking-wider truncate"
                      style={{
                        background: sourceStyle.bg,
                        color: sourceStyle.color,
                        border: `1px solid ${sourceStyle.border}`,
                      }}
                    >
                      {task.assignee || sourceLabel}
                    </span>
                  </div>

                  {/* Timeline */}
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                    {getRelativeTimeString(task.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
