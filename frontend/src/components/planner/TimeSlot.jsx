import { Users, ListChecks, HelpCircle, Clock, Coffee, Sparkles } from 'lucide-react';

const SLOT_CONFIG = {
  meeting:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.15)',  label: 'Meeting',     icon: Users },
  buffer:   { color: '#4caf8e', bg: 'rgba(76,175,142,0.08)',  border: 'rgba(76,175,142,0.15)',   label: 'Recovery',    icon: Coffee },
  task:     { color: '#8ecdff', bg: 'rgba(142,205,255,0.06)', border: 'rgba(142,205,255,0.12)',  label: 'Deep Focus',  icon: ListChecks },
  focus:    { color: '#8ecdff', bg: 'rgba(142,205,255,0.06)', border: 'rgba(142,205,255,0.12)',  label: 'Deep Focus',  icon: ListChecks },
  work:     { color: '#8ecdff', bg: 'rgba(142,205,255,0.06)', border: 'rgba(142,205,255,0.12)',  label: 'Focus Block', icon: ListChecks },
};

export default function TimeSlot({ slot }) {
  const typeLower = (slot.slot_type || slot.type || 'task').toLowerCase();
  const cfg = SLOT_CONFIG[typeLower] || SLOT_CONFIG.task;
  const SlotIcon = cfg.icon;
  const tags = slot.tags || (slot.priority_level ? [slot.priority_level] : []);

  return (
    <div
      className="glass-card glass-card-hover relative overflow-hidden"
      style={{ borderLeft: `2px solid ${cfg.color}` }}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Type badge + icon */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: cfg.bg, border: `0.5px solid ${cfg.border}` }}
          >
            <SlotIcon className="h-4 w-4" style={{ color: cfg.color }} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className="chip text-[0.5rem] py-0"
              style={{ background: cfg.bg, color: cfg.color, border: `0.5px solid ${cfg.border}` }}
            >
              {cfg.label}
            </span>
            {slot.dnd_active && (
              <span
                className="chip text-[0.5rem] py-0"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '0.5px solid rgba(239,68,68,0.15)' }}
              >
                DND Active
              </span>
            )}
          </div>

          {/* Title */}
          <p
            className="font-headline text-sm font-semibold leading-snug"
            style={{ color: 'var(--on-surface)' }}
          >
            {slot.title || slot.label || 'Untitled Block'}
          </p>

          {/* Description */}
          {slot.description && (
            <p
              className="font-body text-xs mt-1.5 leading-relaxed"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              {slot.description}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="chip text-[0.5rem] py-0"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--outline)', border: '0.5px solid rgba(255,255,255,0.07)' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Agent reason */}
          {slot.agent_reason && (
            <div
              className="flex items-start gap-1.5 mt-2.5 p-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)' }}
            >
              <Sparkles className="h-3 w-3 shrink-0 mt-0.5" style={{ color: 'var(--primary)', opacity: 0.7 }} />
              <p className="font-body text-[0.65rem] italic leading-relaxed" style={{ color: 'var(--outline)' }}>
                {slot.agent_reason}
              </p>
            </div>
          )}
        </div>

        {/* Time */}
        <div className="shrink-0 text-right">
          <div
            className="flex items-center gap-1 rounded-lg px-2 py-1"
            style={{ background: 'rgba(0,0,0,0.2)', border: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            <Clock className="h-3 w-3" style={{ color: 'var(--outline)' }} />
            <span className="font-body text-[0.6rem] font-semibold" style={{ color: 'var(--on-surface-variant)' }}>
              {slot.start_time || slot.time || '—'}
            </span>
          </div>
          {slot.end_time && (
            <p className="font-body text-[0.55rem] mt-1 text-right" style={{ color: 'var(--outline)' }}>
              until {slot.end_time}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
