import { Users, ListChecks, Clock, Coffee, Sparkles, ShieldAlert } from 'lucide-react';

const SLOT_CONFIG = {
  meeting:  { color: '#fbbf24', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  label: 'MEETING',     icon: Users },
  buffer:   { color: '#34d399', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)',   label: 'RECOVERY BREAK', icon: Coffee },
  task:     { color: '#38bdf8', bg: 'rgba(0,210,255,0.08)', border: 'rgba(0,210,255,0.25)',  label: 'DEEP FOCUS',  icon: ListChecks },
  focus:    { color: '#38bdf8', bg: 'rgba(0,210,255,0.08)', border: 'rgba(0,210,255,0.25)',  label: 'DEEP FOCUS',  icon: ListChecks },
  work:     { color: '#38bdf8', bg: 'rgba(0,210,255,0.08)', border: 'rgba(0,210,255,0.25)',  label: 'FOCUS BLOCK', icon: ListChecks },
};

export default function TimeSlot({ slot }) {
  const typeLower = (slot.slot_type || slot.type || 'task').toLowerCase();
  const cfg = SLOT_CONFIG[typeLower] || SLOT_CONFIG.task;
  const SlotIcon = cfg.icon;
  const tags = slot.tags || (slot.priority_level ? [slot.priority_level] : []);

  return (
    <div
      className="cockpit-card relative overflow-hidden transition-all duration-150 hover:-translate-y-0.5 shadow-md bg-[#0f172a] border border-[#1e293b]"
      style={{
        borderLeft: `3px solid ${cfg.color}`,
      }}
    >
      <div className="flex items-start gap-3 p-3.5">
        {/* Type icon box */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className="flex h-8 w-8 items-center justify-center rounded"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            <SlotIcon className="h-4 w-4" style={{ color: cfg.color }} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span
              className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono tracking-wider uppercase font-semibold"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
            >
              {cfg.label}
            </span>
            {slot.dnd_active && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono tracking-wider uppercase font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/40"
              >
                <ShieldAlert className="h-2.5 w-2.5" />
                DND SHIELD
              </span>
            )}
          </div>

          {/* Title */}
          <p className="text-xs font-semibold leading-snug text-slate-100">
            {slot.title || slot.label || 'Untitled Block'}
          </p>

          {/* Description */}
          {slot.description && (
            <p className="text-[11px] mt-1 leading-relaxed text-slate-400">
              {slot.description}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.2 rounded text-[9px] font-mono tracking-wider uppercase text-slate-400 bg-[#090d16] border border-[#1e293b]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Agent reason */}
          {slot.agent_reason && (
            <div
              className="flex items-start gap-1.5 mt-2.5 p-2 rounded bg-[#090d16] border border-[#1e293b]"
            >
              <Sparkles className="h-3 w-3 shrink-0 mt-0.5 text-cyan-400 opacity-80" />
              <p className="font-mono text-[9px] text-cyan-200 leading-relaxed">
                OPTIMIZER_INSIGHT: {slot.agent_reason}
              </p>
            </div>
          )}
        </div>

        {/* Time Box */}
        <div className="shrink-0 text-right">
          <div className="flex items-center gap-1 rounded px-2 py-0.5 bg-[#090d16] border border-[#1e293b] font-mono text-xs text-slate-200 tabular-nums">
            <Clock className="h-3 w-3 text-cyan-400" />
            <span className="font-semibold">
              {slot.start_time || slot.time || '—'}
            </span>
          </div>
          {slot.end_time && (
            <p className="font-mono text-[9px] text-slate-500 mt-1 tabular-nums text-right">
              until {slot.end_time}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
