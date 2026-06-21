import { useEffect, useState } from 'react';
import { Menu, Play, Loader2, CheckCircle2, XCircle, Activity, AlertTriangle } from 'lucide-react';
import { getApiErrorMessage, runPipeline, getLatestPipelineRun } from '../../services/api';

export default function Header({ onMenuClick }) {
  const [status, setStatus] = useState('idle'); // idle | loading | success | warning | error
  const [notice, setNotice] = useState(null);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);

  useEffect(() => {
    const checkPipelineStatus = async () => {
      try {
        const res = await getLatestPipelineRun();
        const runInfo = res.data?.latest_run || null;
        if (runInfo) {
          const rawStatus = runInfo.status || 'idle';
          const startedAtStr = runInfo.started_at;
          const startedAt = startedAtStr ? new Date(startedAtStr.endsWith('Z') ? startedAtStr : startedAtStr + 'Z') : null;
          const now = new Date();
          const isStale = rawStatus === 'running' && startedAt && (now - startedAt > 2 * 60 * 1000);
          
          if (isStale) {
            setIsPipelineRunning(false);
          } else {
            setIsPipelineRunning(rawStatus === 'running');
          }
        } else {
          setIsPipelineRunning(false);
        }
      } catch (err) {
        console.error("Failed to fetch latest pipeline status in Header", err);
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
      const res = await runPipeline();
      const diagnostics = res.data?.llm_diagnostics || [];
      const warning = diagnostics.find((item) => item.level === 'warning');
      if (warning) {
        setStatus('warning');
        setNotice(warning.message);
      } else {
        setStatus('success');
        setNotice('Pipeline completed successfully.');
      }
    } catch (err) {
      setStatus('error');
      setNotice(getApiErrorMessage(err));
    } finally {
      setTimeout(() => {
        setStatus('idle');
        setNotice(null);
      }, 7000);
    }
  };

  const NoticeIcon = status === 'error' ? XCircle : status === 'warning' ? AlertTriangle : CheckCircle2;
  const noticeClass =
    status === 'error'
      ? 'border-red-500/30 bg-red-950/90 text-red-100'
      : status === 'warning'
        ? 'border-amber-500/30 bg-amber-950/90 text-amber-100'
        : 'border-emerald-500/30 bg-emerald-950/90 text-emerald-100';

  return (
    <>
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-4 py-3.5 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-900/80 hover:text-white md:hidden transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <Activity className="h-5 w-5 text-violet-500 animate-pulse" />
          <h1 className="text-base font-bold text-slate-100 md:text-lg tracking-tight">
            Dashboard
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-900/60 border border-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
            <span className="status-dot status-dot--live" />
            Live System
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {status === 'success' && notice && (
          <span className="hidden max-w-sm items-center gap-1.5 truncate text-sm text-emerald-400 animate-scale-in sm:flex">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{notice}</span>
          </span>
        )}
        {status === 'warning' && notice && (
          <span className="hidden max-w-md items-center gap-1.5 truncate text-sm text-amber-300 animate-scale-in md:flex">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="truncate">{notice}</span>
          </span>
        )}
        {status === 'error' && notice && (
          <span className="hidden max-w-md items-center gap-1.5 truncate text-sm text-red-400 animate-scale-in md:flex">
            <XCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">{notice}</span>
          </span>
        )}
        <button
          onClick={handleRunPipeline}
          disabled={status === 'loading' || isPipelineRunning}
          className="btn-gradient relative overflow-hidden inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 transition-all cursor-pointer"
        >
          {status === 'loading' || isPipelineRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Orchestrating...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>Run Pipeline</span>
            </>
          )}
        </button>
      </div>
    </header>
    {notice && status !== 'loading' && (
      <div className={`fixed right-4 top-20 z-50 flex max-w-[calc(100vw-2rem)] items-start gap-2 rounded-xl border px-4 py-3 text-xs shadow-2xl backdrop-blur-xl sm:max-w-md ${noticeClass}`}>
        <NoticeIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="leading-relaxed">{notice}</span>
      </div>
    )}
    </>
  );
}
