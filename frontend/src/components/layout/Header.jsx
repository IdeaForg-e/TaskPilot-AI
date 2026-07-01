import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu, Play, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Search, Bell, Sun, Moon, LayoutGrid,
} from 'lucide-react';
import { getApiErrorMessage, runPipeline, getLatestPipelineRun } from '../../services/api';
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

  const [status, setStatus] = useState('idle'); // idle | loading | success | warning | error
  const [notice, setNotice] = useState(null);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [prevRunStatus, setPrevRunStatus] = useState(null);

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
        <div
          className="hidden md:flex flex-1 max-w-xs items-center gap-2 rounded-xl px-3.5 py-2"
          style={{
            background: 'rgba(0,0,0,0.2)',
            border: '0.5px solid rgba(255,255,255,0.07)',
          }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--outline)' }} />
          <span className="font-body text-xs" style={{ color: 'var(--outline)' }}>
            Search operations...
          </span>
        </div>

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
          <button
            className="rounded-xl p-2 transition-all relative"
            style={{
              color: 'var(--on-surface-variant)',
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(255,255,255,0.07)',
            }}
          >
            <Bell className="h-4 w-4" />
          </button>

          {/* Grid icon */}
          <button
            className="rounded-xl p-2 transition-all hidden sm:flex"
            style={{
              color: 'var(--on-surface-variant)',
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(255,255,255,0.07)',
            }}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>

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
