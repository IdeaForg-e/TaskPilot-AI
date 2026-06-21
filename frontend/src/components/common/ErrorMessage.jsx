import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-4 border-red-500/20 bg-red-950/10 p-10 text-center max-w-md mx-auto w-full animate-scale-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="h-6 w-6 text-red-400 animate-pulse" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-red-200">System Error</h4>
        <p className="mt-1 text-xs text-red-300/80 leading-relaxed">
          {message || 'Something went wrong. Please check connection and logs.'}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/30 hover:bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry Connection
        </button>
      )}
    </div>
  );
}
