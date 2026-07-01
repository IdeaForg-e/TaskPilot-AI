import { Inbox } from 'lucide-react';

export default function EmptyState({ message, icon: Icon = Inbox }) {
  return (
    <div
      className="glass-card flex flex-col items-center justify-center gap-4 p-12 text-center max-w-md mx-auto w-full animate-scale-in"
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl animate-float"
        style={{
          background: 'rgba(142,205,255,0.06)',
          border: '0.5px solid rgba(142,205,255,0.12)',
        }}
      >
        <Icon className="h-6 w-6" style={{ color: 'var(--primary)' }} />
      </div>
      <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
        {message || 'No items or data found.'}
      </p>
    </div>
  );
}
