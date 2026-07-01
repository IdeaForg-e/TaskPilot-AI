import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div
      className="glass-card flex flex-col items-center justify-center gap-4 p-10 text-center max-w-md mx-auto w-full animate-scale-in"
      style={{ background: 'rgba(239,68,68,0.03)', borderColor: 'rgba(239,68,68,0.15)' }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)' }}
      >
        <AlertTriangle className="h-6 w-6 animate-pulse" style={{ color: '#ef4444' }} />
      </div>
      <div>
        <h4 className="font-headline text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
          System Error
        </h4>
        <p className="font-body text-xs mt-1 leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
          {message || 'Something went wrong. Please check connection and logs.'}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-ghost mt-1 text-xs px-5 py-2 rounded-xl"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry Connection
        </button>
      )}
    </div>
  );
}
