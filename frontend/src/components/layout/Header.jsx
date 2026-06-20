import { useState } from 'react';
import { Menu, Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { runPipeline } from '../../services/api';

export default function Header({ onMenuClick }) {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  const handleRunPipeline = async () => {
    setStatus('loading');
    try {
      await runPipeline();
      setStatus('success');
    } catch (err) {
      setStatus('error');
    } finally {
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-slate-100 md:text-lg">
          TaskPilot AI
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {status === 'success' && (
          <span className="hidden items-center gap-1.5 text-sm text-emerald-400 sm:flex">
            <CheckCircle2 className="h-4 w-4" />
            Pipeline started
          </span>
        )}
        {status === 'error' && (
          <span className="hidden items-center gap-1.5 text-sm text-red-400 sm:flex">
            <XCircle className="h-4 w-4" />
            Failed to start pipeline
          </span>
        )}
        <button
          onClick={handleRunPipeline}
          disabled={status === 'loading'}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Run Pipeline
        </button>
      </div>
    </header>
  );
}
