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

const SOURCE_COLORS = {
  jira: '#8ecdff', github: '#c0c7d2', slack: '#f59e0b',
  email: '#ef4444', calendar: '#4caf8e', meetings: '#a78bfa', incidents: '#f97316',
};

export default function RecentActivity({ tasks = [] }) {
  const recent = [...tasks]
    .sort((a, b) => parseUTCDate(b.created_at) - parseUTCDate(a.created_at))
    .slice(0, 5);

  return (
    <div className="glass-card p-5 shadow-lg relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: 'rgba(142,205,255,0.1)' }}
          >
            <Clock className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
          </div>
          <h3 className="font-headline text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
            Recent Assessment Reports
          </h3>
        </div>
        <span
          className="font-body text-xs font-semibold cursor-pointer transition-colors"
          style={{ color: 'var(--primary)' }}
        >
          View All
        </span>
      </div>

      {recent.length === 0 ? (
        <EmptyState message="No recent system activity recorded yet." />
      ) : (
        <>
          {/* Table header */}
          <div
            className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-3 pb-2 mb-1"
            style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            {['Report Name', 'Status', 'Assigned To', 'Timeline'].map((h) => (
              <span
                key={h}
                className="label-caps"
                style={{ color: 'var(--outline)', fontSize: '0.55rem' }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {recent.map((task, idx) => {
            const sourceLabel = task.source || 'manual';
            const sourceColor = SOURCE_COLORS[sourceLabel.toLowerCase()] || 'var(--outline)';
            const statusKey = (task.status || 'new').toLowerCase();
            const isNew = statusKey === 'open' || statusKey === 'todo' || statusKey === 'new';

            return (
              <div
                key={task.id || idx}
                className="hairline-row grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center px-3 py-3 rounded-xl cursor-default transition-all"
              >
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.07)' }}
                  >
                    {isNew
                      ? <PlusCircle className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
                      : <CheckCircle className="h-3.5 w-3.5" style={{ color: '#4caf8e' }} />
                    }
                  </div>
                  <div className="min-w-0">
                    <p
                      className="font-body text-xs font-semibold truncate"
                      style={{ color: 'var(--on-surface)' }}
                    >
                      {task.title || `Task #${task.id}`}
                    </p>
                    <p
                      className="label-caps mt-0.5"
                      style={{ color: 'var(--outline)', fontSize: '0.5rem' }}
                    >
                      {task.type || sourceLabel}
                    </p>
                  </div>
                </div>

                {/* Status chip */}
                <span
                  className="chip text-[0.55rem] py-0.5 w-fit"
                  style={
                    isNew
                      ? { background: 'rgba(142,205,255,0.1)', color: 'var(--primary)', border: '0.5px solid rgba(142,205,255,0.2)' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'var(--outline)', border: '0.5px solid rgba(255,255,255,0.07)' }
                  }
                >
                  {isNew ? 'New' : 'Archived'}
                </span>

                {/* Assignee */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 font-body text-[0.5rem] font-bold text-white uppercase"
                    style={{ background: sourceColor }}
                  >
                    {(task.assignee || sourceLabel).substring(0, 2)}
                  </div>
                  <span
                    className="font-body text-xs truncate"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    {task.assignee || sourceLabel}
                  </span>
                </div>

                {/* Timeline */}
                <span
                  className="font-body text-xs"
                  style={{ color: 'var(--outline)' }}
                >
                  {getRelativeTimeString(task.created_at)}
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
