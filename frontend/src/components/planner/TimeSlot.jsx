import { Users, ListChecks, Clock, Coffee, Sparkles, ShieldAlert } from 'lucide-react';

const SLOT_CONFIG = {
  meeting:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  label: 'MEETING',     icon: Users },
  buffer:   { color: '#4caf8e', bg: 'rgba(76,175,142,0.08)',  border: 'rgba(76,175,142,0.25)',   label: 'RECOVERY BREAK', icon: Coffee },
  task:     { color: '#8ecdff', bg: 'rgba(142,205,255,0.08)', border: 'rgba(142,205,255,0.25)',  label: 'DEEP FOCUS',  icon: ListChecks },
  focus:    { color: '#8ecdff', bg: 'rgba(142,205,255,0.08)', border: 'rgba(142,205,255,0.25)',  label: 'DEEP FOCUS',  icon: ListChecks },
  work:     { color: '#8ecdff', bg: 'rgba(142,205,255,0.08)', border: 'rgba(142,205,255,0.25)',  label: 'FOCUS BLOCK', icon: ListChecks },
};

export default function TimeSlot({ slot }) {
  const typeLower = (slot.slot_type || slot.type || 'task').toLowerCase();
  const cfg = SLOT_CONFIG[typeLower] || SLOT_CONFIG.task;
  const SlotIcon = cfg.icon;
  const tags = slot.tags || (slot.priority_level ? [slot.priority_level] : []);

  return (
    <div
      className="glass-card relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
      style={{
        borderLeft: `3px solid ${cfg.color}`,
        boxShadow: '0 8px 24px -8px rgba(0,0,0,0.5)',
      }}
    >
      <div className="flex items-start gap-3.5 p-4 md:p-4.5">
        {/* Type icon box */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: cfg.bg, border: `0.5px solid ${cfg.border}` }}
          >
            <SlotIcon className="h-4.5 w-4.5" style={{ color: cfg.color }} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider uppercase font-semibold"
              style={{ background: cfg.bg, color: cfg.color, border: `0.5px solid ${cfg.border}` }}
            >
              {cfg.label}
            </span>
            {slot.dnd_active && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider uppercase font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25"
              >
                <ShieldAlert className="h-2.5 w-2.5" />
                DND AUTO-SHIELD
              </span>
            )}
          </div>

          {/* Title */}
          <p className="font-headline text-sm font-semibold leading-snug text-slate-100">
            {slot.title || slot.label || 'Untitled Block'}
          </p>

          {/* Description */}
          {slot.description && (
            <p className="font-body text-xs mt-1.5 leading-relaxed text-slate-400">
              {slot.description}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md text-[9px] font-mono tracking-wider uppercase text-slate-400 bg-white/5 border border-white/8"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Agent reason */}
          {slot.agent_reason && (
            <div
              className="flex items-start gap-2 mt-3 p-2.5 rounded-xl"
              style={{ background: 'rgba(15,23,42,0.6)', border: '0.5px solid rgba(142,205,255,0.12)' }}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-cyan-400 opacity-80" />
              <p className="font-mono text-[10px] text-cyan-200 leading-relaxed">
                OPTIMIZER_INSIGHT: {slot.agent_reason}
              </p>
            </div>
          )}
        </div>

        {/* Time Box */}
        <div className="shrink-0 text-right">
          <div
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1 bg-slate-900/80 border border-white/8 font-mono text-xs text-slate-200 tabular-nums shadow-inner"
          >
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-bold">
              {slot.start_time || slot.time || '—'}
            </span>
          </div>
          {slot.end_time && (
            <p className="font-mono text-[10px] text-slate-500 mt-1 tabular-nums text-right">
              until {slot.end_time}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
