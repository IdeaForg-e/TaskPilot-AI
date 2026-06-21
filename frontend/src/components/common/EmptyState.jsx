import { Inbox } from 'lucide-react';

export default function EmptyState({ message, icon: Icon = Inbox }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-4 p-12 text-center max-w-md mx-auto w-full animate-scale-in">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-violet-500/10 to-cyan-500/10 border border-slate-800/80 shadow-inner">
        <Icon className="h-6 w-6 text-indigo-400 animate-float" />
      </div>
      <p className="text-sm font-medium leading-relaxed text-slate-400">
        {message || 'No items or data found.'}
      </p>
    </div>
  );
}
