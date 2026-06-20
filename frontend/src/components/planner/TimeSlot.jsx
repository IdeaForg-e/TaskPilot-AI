import { Users, ListChecks, HelpCircle, Clock } from 'lucide-react';

export default function TimeSlot({ slot }) {
  const typeLower = (slot.slot_type || slot.type || '').toLowerCase();
  const isMeeting = typeLower === 'meeting' || typeLower === 'buffer';
  const isFocus = typeLower === 'focus' || typeLower === 'work';

  const typeStyles = isMeeting
    ? 'border-l-amber-500 bg-amber-950/5'
    : isFocus
    ? 'border-l-violet-500 bg-violet-950/5'
    : 'border-l-slate-700 bg-slate-900/30';

  return (
    <div
      className={`glass-card glass-card-hover flex items-start gap-4 p-4 shadow-md border-l-4 ${typeStyles}`}
    >
      <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 w-24 shrink-0 bg-slate-950/40 px-2.5 py-1 rounded-lg border border-slate-900/60">
        <Clock className="h-3 w-3 text-slate-500" />
        <span>{slot.start_time || slot.time || '—'}</span>
      </span>
      
      <span className="mt-1 shrink-0">
        {isMeeting ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Users className="h-4 w-4 text-amber-400" />
          </div>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
            <ListChecks className="h-4 w-4 text-violet-400" />
          </div>
        )}
      </span>
      
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-100 leading-snug">{slot.title || slot.label || 'Untitled Block'}</p>
        {slot.description && (
          <p className="mt-1 text-xs text-slate-450 leading-relaxed">{slot.description}</p>
        )}
        {slot.agent_reason && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/40 px-2 py-1 text-[10px] font-semibold text-slate-500">
            <HelpCircle className="h-3 w-3 text-cyan-400" />
            {slot.agent_reason}
          </p>
        )}
      </div>
    </div>
  );
}
