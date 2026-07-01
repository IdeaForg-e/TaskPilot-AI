export default function LoadingSpinner({ label, size = 'md' }) {
  const sz = size === 'sm' ? 'h-8 w-8' : 'h-14 w-14';
  const inner = size === 'sm' ? 'h-5 w-5' : 'h-8 w-8';
  const core = size === 'sm' ? 'h-2 w-2' : 'h-3 w-3';

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className={`relative flex ${sz} items-center justify-center`}>
        {/* Outer ring */}
        <div
          className={`absolute inset-0 rounded-full border-2 animate-spin`}
          style={{
            borderTopColor: 'var(--primary)',
            borderRightColor: 'rgba(142,205,255,0.3)',
            borderBottomColor: 'rgba(142,205,255,0.1)',
            borderLeftColor: 'transparent',
            animationDuration: '1s',
          }}
        />
        {/* Inner ring */}
        <div
          className={`absolute ${inner} rounded-full border-2 animate-spin`}
          style={{
            borderTopColor: 'rgba(142,205,255,0.5)',
            borderRightColor: 'transparent',
            borderBottomColor: 'var(--primary)',
            borderLeftColor: 'rgba(142,205,255,0.3)',
            animationDuration: '0.7s',
            animationDirection: 'reverse',
          }}
        />
        {/* Core */}
        <div
          className={`${core} rounded-full animate-ping`}
          style={{ background: 'var(--primary)', opacity: 0.5 }}
        />
      </div>
      {label && (
        <span
          className="font-body text-sm animate-pulse"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
