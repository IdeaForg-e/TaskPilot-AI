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
  jira: { bg: 'rgba(142,205,255,0.1)', color: '#8ecdff', border: 'rgba(142,205,255,0.25)' },
  github: { bg: 'rgba(192,199,210,0.1)', color: '#c0c7d2', border: 'rgba(192,199,210,0.25)' },
  slack: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  email: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
  calendar: { bg: 'rgba(76,175,142,0.1)', color: '#4caf8e', border: 'rgba(76,175,142,0.25)' },
  meetings: { bg: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: 'rgba(167,139,250,0.25)' },
  incidents: { bg: 'rgba(249,115,22,0.1)', color: '#f97316', border: 'rgba(249,115,22,0.25)' },
};

export default function RecentActivity({ tasks = [] }) {
  const recent = [...tasks]
    .sort((a, b) => parseUTCDate(b.created_at) - parseUTCDate(a.created_at))
    .slice(0, 5);

  return (
    <div
      className="glass-card p-6 shadow-2xl relative overflow-hidden"
      style={{
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{
              background: 'rgba(142,205,255,0.08)',
              border: '0.5px solid rgba(142,205,255,0.2)',
            }}
          >
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-headline text-sm font-semibold text-slate-100 tracking-tight">
              Ingested Activity & Signals
            </h3>
            <p className="font-mono text-[10px] text-slate-400 tracking-wider uppercase mt-0.5">
              Latest Parsed Event Stream
            </p>
          </div>
        </div>

        <Link
          to="/tasks"
          className="font-mono text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 group"
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
          <div
            className="grid grid-cols-[2.5fr_1fr_1.2fr_1fr] gap-4 px-3.5 pb-2.5 mb-1"
            style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            {['Signal / Task Name', 'Status', 'Assignee / Platform', 'Timeline'].map((h) => (
              <span
                key={h}
                className="font-mono text-[10px] tracking-wider uppercase text-slate-400 font-semibold"
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-1">
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
                  className="grid grid-cols-[2.5fr_1fr_1.2fr_1fr] gap-4 items-center px-3.5 py-3 rounded-xl transition-all duration-200 hover:bg-white/[0.03] group border border-transparent hover:border-white/5"
                >
                  {/* Name & Type */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-xl shrink-0 transition-transform group-hover:scale-105"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '0.5px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {isDone ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <PlusCircle className="h-3.5 w-3.5 text-cyan-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                        {task.title || `Task #${task.id}`}
                      </p>
                      <p className="font-mono text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">
                        {task.type || sourceLabel}
                      </p>
                    </div>
                  </div>

                  {/* Status chip */}
                  <div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider uppercase font-semibold ${
                        isDone
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      }`}
                    >
                      {isDone ? 'COMPLETED' : 'ACTIVE'}
                    </span>
                  </div>

                  {/* Assignee / Platform */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-semibold tracking-wider truncate"
                      style={{
                        background: sourceStyle.bg,
                        color: sourceStyle.color,
                        border: `0.5px solid ${sourceStyle.border}`,
                      }}
                    >
                      {task.assignee || sourceLabel}
                    </span>
                  </div>

                  {/* Timeline */}
                  <span className="font-mono text-xs text-slate-400 tabular-nums">
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
