import { Users, ListChecks } from 'lucide-react';

export default function TimeSlot({ slot }) {
  const isMeeting =
    (slot.type || '').toLowerCase() === 'meeting' ||
    (slot.type || '').toLowerCase() === 'buffer';

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 shadow-sm ${
        isMeeting
          ? 'border-amber-900/60 bg-amber-950/10'
          : 'border-slate-800 bg-slate-900'
      }`}
    >
      <span className="mt-0.5 w-20 shrink-0 text-xs font-medium text-slate-400">
        {slot.start_time || slot.time || '—'}
      </span>
      <span className="mt-0.5 shrink-0">
        {isMeeting ? (
          <Users className="h-4 w-4 text-amber-400" />
        ) : (
          <ListChecks className="h-4 w-4 text-indigo-400" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-100">{slot.title || slot.label || 'Untitled block'}</p>
        {slot.description && (
          <p className="mt-0.5 text-xs text-slate-400">{slot.description}</p>
        )}
      </div>
    </div>
  );
}
