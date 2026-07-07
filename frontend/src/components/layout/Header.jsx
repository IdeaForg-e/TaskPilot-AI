import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Menu, Play, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Search, Bell, Sun, Moon,
} from 'lucide-react';
import { getApiErrorMessage, runPipeline, getLatestPipelineRun, getTasks } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const PAGE_TITLES = {
  '/':         'Command Center',
  '/tasks':    'Task Directory',
  '/quality':  'Quality Assurance',
  '/priority': 'Leaderboard',
  '/planner':  'AI Planner',
  '/chat':     'Copilot Chat',
};

export default function Header({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState('idle'); // idle | loading | success | warning | error
  const [notice, setNotice] = useState(null);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [prevRunStatus, setPrevRunStatus] = useState(null);

  const [searchVal, setSearchVal] = useState(searchParams.get('q') || '');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Sync search input with URL search param
  useEffect(() => {
    setSearchVal(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/tasks?q=${encodeURIComponent(searchVal)}`);
  };

  const loadNotifications = async () => {
    try {
      const [tasksRes, runRes] = await Promise.all([
        getTasks(),
        getLatestPipelineRun()
      ]);
      const tasksList = tasksRes.data || [];
      const runInfo = runRes.data || null;

      const list = [];

      // 1. Pipeline Status notification
      if (runInfo?.latest_run) {
        list.push({
          id: 'pipeline',
          type: runInfo.latest_run.status === 'completed' ? 'success' : 'error',
          title: `Pipeline ${runInfo.latest_run.status === 'completed' ? 'Completed' : 'Failed'}`,
          desc: `Run ID: ${runInfo.latest_run.id.substring(0, 8)}`,
        });
      }

      // 2. Overload warnings (tasks per assignee count > 5)
      const assigneeCounts = {};
      tasksList.forEach(t => {
        if (t.assignee && t.status !== 'completed') {
          assigneeCounts[t.assignee] = (assigneeCounts[t.assignee] || 0) + 1;
        }
      });
      Object.entries(assigneeCounts).forEach(([name, count]) => {
        if (count > 5) {
          list.push({
            id: `overload-${name}`,
            type: 'warning',
            title: `Developer Overload Alert`,
            desc: `${name} has ${count} active tasks in progress`,
          });
        }
      });

      // 3. P1 Critical Alerts (overall_score >= 8.5)
      tasksList.forEach(t => {
        if (t.urgency === 'critical' || t.urgency === 'high') {
          list.push({
            id: `p1-${t.id}`,
            type: 'critical',
            title: `P1 Critical Escalation`,
            desc: t.title,
          });
        }
      });

      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications in Header', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkPipelineStatus = async () => {
      try {
        const res = await getLatestPipelineRun();
        const runInfo = res.data?.latest_run || null;
        if (runInfo) {
          const rawStatus = runInfo.status || 'idle';
          const startedAtStr = runInfo.started_at;
          const startedAt = startedAtStr
            ? new Date(startedAtStr.endsWith('Z') ? startedAtStr : startedAtStr + 'Z')
            : null;
          const now = new Date();
          const isStale = rawStatus === 'running' && startedAt && (now - startedAt > 5 * 60 * 1000);

          const finalStatus = isStale ? 'failed' : rawStatus;
          const isRunning = finalStatus === 'running';
          setIsPipelineRunning(isRunning);

          setPrevRunStatus((prev) => {
            if (prev === 'running' && finalStatus === 'completed') {
              setStatus('success');
              setNotice('Pipeline execution completed successfully.');
              setTimeout(() => { setStatus('idle'); setNotice(null); }, 10000);
            } else if (prev === 'running' && finalStatus === 'failed') {
              setStatus('error');
              setNotice(isStale ? 'Pipeline run timed out.' : `Pipeline failed: ${runInfo.error || 'Unknown error'}`);
              setTimeout(() => { setStatus('idle'); setNotice(null); }, 10000);
            }
            return finalStatus;
          });
        } else {
          setIsPipelineRunning(false);
          setPrevRunStatus('idle');
        }
      } catch (err) {
        console.error('Failed to fetch pipeline status in Header', err);
      }
    };

    checkPipelineStatus();
    const interval = setInterval(checkPipelineStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRunPipeline = async () => {
    setStatus('loading');
    setNotice(null);
    try {
      await runPipeline();
      setPrevRunStatus('running');
      setIsPipelineRunning(true);
    } catch (err) {
      const errMsg = getApiErrorMessage(err);
      if (errMsg) {
        setStatus('error');
        setNotice(errMsg);
        setTimeout(() => { setStatus('idle'); setNotice(null); }, 7000);
      } else {
        setStatus('idle');
      }
    }
  };

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';

  const NoticeIcon = status === 'error' ? XCircle : status === 'warning' ? AlertTriangle : CheckCircle2;
  const noticeClass =
    status === 'error'
      ? 'border-red-500/30 bg-red-950/90 text-red-100'
      : status === 'warning'
        ? 'border-amber-500/30 bg-amber-950/90 text-amber-100'
        : 'border-emerald-500/30 bg-emerald-950/90 text-emerald-100';

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center gap-4 px-4 md:px-6 py-3"
        style={{
          background: 'rgba(17,19,24,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 md:hidden transition-colors"
          style={{ color: 'var(--outline)' }}
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Breadcrumb / Page Context */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-body text-xs hidden sm:block" style={{ color: 'var(--outline)' }}>
            Current Workspace
          </span>
          <span className="hidden sm:block text-xs" style={{ color: 'var(--outline-variant)' }}>|</span>
          <div className="flex items-center gap-1.5">
            <span className="font-headline text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
              {pageTitle}
            </span>
            <span className="flex items-center gap-1 chip chip-green text-[0.6rem] py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4caf8e] animate-pulse" />
              {isPipelineRunning ? 'Running' : 'Active'}
            </span>
          </div>
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-xs items-center gap-2 rounded-xl px-3.5 py-1.5"
          style={{
            background: 'rgba(0,0,0,0.2)',
            border: '0.5px solid rgba(255,255,255,0.07)',
          }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--outline)' }} />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search operations..."
            className="w-full bg-transparent border-0 outline-none text-xs font-body"
            style={{ color: 'var(--on-surface)' }}
          />
        </form>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Status message */}
          {status === 'success' && notice && (
            <span className="hidden md:flex items-center gap-1.5 text-xs animate-scale-in" style={{ color: '#4caf8e' }}>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[200px]">{notice}</span>
            </span>
          )}
          {status === 'error' && notice && (
            <span className="hidden md:flex items-center gap-1.5 text-xs animate-scale-in text-red-400">
              <XCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[180px]">{notice}</span>
            </span>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-xl p-2 transition-all"
            style={{
              color: 'var(--on-surface-variant)',
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(255,255,255,0.07)',
            }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="rounded-xl p-2 transition-all relative cursor-pointer"
              style={{
                color: 'var(--on-surface-variant)',
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid rgba(255,255,255,0.07)',
              }}
              title="View Alerts"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ef4444] animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-80 rounded-2xl p-4 shadow-2xl z-50 animate-scale-in"
                style={{
                  background: 'rgba(17,19,24,0.95)',
                  backdropFilter: 'blur(30px)',
                  border: '0.5px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                  <span className="font-headline text-xs font-bold text-slate-200">Alerts & Notifications</span>
                  <span className="text-[10px] text-slate-500 font-body">{notifications.length} active</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 font-body text-center py-4">No active system alerts.</p>
                  ) : (
                    notifications.map((n) => {
                      let badgeColor = '#ef4444'; // critical
                      if (n.type === 'warning') badgeColor = '#f59e0b';
                      if (n.type === 'success') badgeColor = '#4caf8e';

                      return (
                        <div
                          key={n.id}
                          className="rounded-xl p-2.5 bg-white/2 hover:bg-white/5 border border-white/5 flex gap-2.5 transition-colors"
                        >
                          <span
                            className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                            style={{ background: badgeColor }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-200 truncate">{n.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{n.desc}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          

          {/* Run Pipeline CTA */}
          <button
            onClick={handleRunPipeline}
            disabled={status === 'loading' || isPipelineRunning}
            className="btn-primary text-xs px-4 py-2 rounded-xl"
          >
            {status === 'loading' || isPipelineRunning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="hidden sm:inline">Orchestrating...</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 fill-white" />
                <span className="hidden sm:inline">Run Pipeline</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Toast notification */}
      {notice && status !== 'loading' && (
        <div
          className={`fixed right-4 top-20 z-50 flex max-w-[calc(100vw-2rem)] items-start gap-2 rounded-xl border px-4 py-3 text-xs shadow-2xl backdrop-blur-xl sm:max-w-md ${noticeClass}`}
        >
          <NoticeIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="leading-relaxed">{notice}</span>
        </div>
      )}
    </>
  );
}
