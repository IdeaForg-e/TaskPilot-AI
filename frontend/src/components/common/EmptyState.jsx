import { Inbox } from 'lucide-react';

export default function EmptyState({ message, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-10 text-center">
      <Icon className="h-7 w-7 text-slate-600" />
      <p className="text-sm text-slate-400">{message || 'Nothing here yet.'}</p>
    </div>
  );
}
