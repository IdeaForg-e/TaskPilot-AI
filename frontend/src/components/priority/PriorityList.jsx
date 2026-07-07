import { useState, useMemo } from 'react';
import PriorityCard from './PriorityCard';
import EmptyState from '../common/EmptyState';

export default function PriorityList({ tasks = [], onSelectTask, onRecalculate }) {
  const [sortAscending, setSortAscending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const scoreA = a.priority_score || 0;
      const scoreB = b.priority_score || 0;
      return sortAscending ? scoreA - scoreB : scoreB - scoreA;
    });
  }, [tasks, sortAscending]);

  const handleRecalculate = async () => {
    setShowMenu(false);
    if (onRecalculate) {
      await onRecalculate();
    }
  };

  const handleExport = () => {
    setShowMenu(false);
    const headers = ['Rank', 'Task Title', 'Type', 'Priority Score', 'Status'];
    const rows = sortedTasks.map((t, idx) => [
      idx + 1,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.type || t.source || 'General',
      t.priority_score || 0,
      t.status || 'open'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TaskPilot_Leaderboard_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (sortedTasks.length === 0) {
    return <EmptyState message="No ranked tasks available. Run the pipeline first." />;
  }

  // Rank 1 featured, then 3-column grid for ranks 2-4, then table for the rest
  const [topTask, ...rest] = sortedTasks;
  const gridTasks = rest.slice(0, 3);
  const tableTasks = rest.slice(3);

  return (
    <div className="space-y-4">
      {/* Featured #1 */}
      <div className="animate-fade-in-up stagger-1">
        <PriorityCard task={topTask} rank={sortedTasks.indexOf(topTask) + 1} onClick={() => onSelectTask(topTask)} />
      </div>

      {/* Grid #2–4 */}
      {gridTasks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up stagger-2">
          {gridTasks.map((task) => {
            const rank = sortedTasks.indexOf(task) + 1;
            return (
              <PriorityCard key={task.id} task={task} rank={rank} onClick={() => onSelectTask(task)} />
            );
          })}
        </div>
      )}

      {/* Table for remaining */}
      {tableTasks.length > 0 && (
        <div className="glass-card overflow-hidden animate-fade-in-up stagger-3">
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-3 relative"
            style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            <h3 className="font-headline text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
              Remaining Backlog Priority Rankings
            </h3>
            <div className="flex items-center gap-2 relative">
              {/* Sort direction toggle button */}
              <button 
                onClick={() => setSortAscending(prev => !prev)}
                className={`btn-ghost text-[0.6rem] py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                  sortAscending ? 'bg-primary/10 text-primary border border-primary/20' : 'text-outline hover:text-on-surface'
                }`}
                title={sortAscending ? "Sorted Ascending (Low to High)" : "Sorted Descending (High to Low)"}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </button>

              {/* More options dropdown trigger */}
              <button 
                onClick={() => setShowMenu(prev => !prev)}
                className={`btn-ghost text-[0.6rem] py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                  showMenu ? 'bg-primary/10 text-primary border border-primary/20' : 'text-outline hover:text-on-surface'
                }`}
                title="Options Menu"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>

              {/* Action Dropdown Menu overlay */}
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div 
                    className="absolute right-0 mt-8 w-44 rounded-xl border border-slate-800 bg-slate-950 p-1.5 shadow-2xl z-20 animate-scale-in"
                  >
                    <button
                      onClick={handleRecalculate}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-[10px] font-semibold text-slate-200 transition-colors cursor-pointer"
                    >
                      🔄 Recalculate Priorities
                    </button>
                    <button
                      onClick={handleExport}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-[10px] font-semibold text-slate-200 transition-colors cursor-pointer"
                    >
                      📥 Export CSV Report
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Column headers */}
          <div
            className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-4 px-5 py-2.5"
            style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}
          >
            {['Task Details', 'Complexity', 'Urgency Score', 'Status', 'View Evaluation'].map((h) => (
              <span key={h} className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {tableTasks.map((task) => {
            const score = task.priority_score || 0;
            const bars = Math.round((score / 10) * 5);
            const statusColor = score >= 8.0 ? '#ef4444' : score >= 6.0 ? '#f59e0b' : '#89929b';
            const rank = sortedTasks.indexOf(task) + 1;

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="hairline-row grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-4 items-center px-5 py-3.5 cursor-pointer hover:bg-white/2 transition-colors"
              >
                {/* Task details */}
                <div className="min-w-0">
                  <p className="font-body text-xs font-semibold truncate" style={{ color: 'var(--on-surface)' }}>
                    #{rank}. {task.title || `Task #${task.id}`}
                  </p>
                  <p className="font-body mt-0.5" style={{ color: 'var(--outline)', fontSize: '0.6rem' }}>
                    {task.type || task.source || 'General'}
                  </p>
                </div>

                {/* Complexity bars */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, b) => (
                    <div
                      key={b}
                      className="h-1.5 w-4 rounded-sm transition-all"
                      style={{
                        background: b < bars
                          ? (bars >= 4 ? 'var(--primary)' : bars >= 3 ? '#f59e0b' : 'var(--outline)')
                          : 'rgba(255,255,255,0.06)',
                      }}
                    />
                  ))}
                </div>

                {/* Score */}
                <span className="font-headline text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                  {score} / 10
                </span>

                {/* Status */}
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor }} />
                  <span className="font-body text-xs capitalize" style={{ color: 'var(--on-surface-variant)' }}>
                    {task.status || 'Pending'}
                  </span>
                </div>

                {/* Action */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTask(task);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/5 cursor-pointer"
                  style={{ border: '0.5px solid rgba(255,255,255,0.08)' }}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--outline)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
