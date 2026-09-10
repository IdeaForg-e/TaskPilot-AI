import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  ShieldCheck,
  ArrowUpNarrowWide,
  CalendarClock,
  MessageSquare,
  X,
  Settings,
  HelpCircle,
  Cpu,
  Sparkles,
  Activity,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',         label: 'Command Center', icon: LayoutDashboard },
  { to: '/tasks',    label: 'Task Directory',  icon: ListTodo },
  { to: '/quality',  label: 'Quality Assurance', icon: ShieldCheck },
  { to: '/priority', label: 'Leaderboard',    icon: ArrowUpNarrowWide },
  { to: '/planner',  label: 'AI Planner',     icon: CalendarClock },
  { to: '/chat',     label: 'Copilot Chat',   icon: MessageSquare },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(8,11,17,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed z-50 inset-y-0 left-0 w-[230px] flex flex-col justify-between
          transition-transform duration-300 ease-out
          md:sticky md:top-0 md:h-screen md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'var(--surface-container-low)',
          borderRight: '1px solid var(--outline-variant)',
        }}
      >
        {/* Top Section */}
        <div className="flex flex-col gap-0">
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between px-5 pt-6 pb-6">
            <Link to="/" className="flex items-center gap-3 group" onClick={onClose}>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  boxShadow: '0 0 16px rgba(56,189,248,0.35)',
                }}
              >
                <Cpu className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <p
                  className="font-headline text-sm font-bold tracking-tight leading-none"
                  style={{ color: 'var(--on-surface)' }}
                >
                  TaskPilot AI
                </p>
                <span
                  className="inline-flex items-center gap-1 font-mono text-[0.625rem] text-slate-400 mt-1 leading-none tracking-wider uppercase"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Chief of Staff
                </span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 md:hidden transition-colors hover:bg-white/5"
              style={{ color: 'var(--outline)' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 px-3">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={onClose}
                  className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all duration-150"
                  style={
                    active
                      ? {
                          background: 'rgba(56,189,248,0.1)',
                          color: 'var(--primary)',
                          borderLeft: '2.5px solid var(--primary)',
                          fontWeight: 600,
                        }
                      : {
                          color: 'var(--on-surface-variant)',
                          borderLeft: '2.5px solid transparent',
                          fontWeight: 500,
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.color = 'var(--on-surface)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = '';
                      e.currentTarget.style.color = 'var(--on-surface-variant)';
                    }
                  }}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span className="font-headline tracking-tight">{label}</span>
                  {active && (
                    <span
                      className="ml-auto h-1.5 w-1.5 rounded-full"
                      style={{ background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-3 p-4">
          {/* System status pill */}
          <div
            className="rounded-xl p-3 border text-xs"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'var(--outline-variant)',
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-sky-400" />
                Agents Active
              </span>
              <span className="font-mono text-[10px] text-emerald-400 font-semibold">8/8 Nominal</span>
            </div>
            <p className="text-[11px] text-slate-400 font-body leading-tight">
              Sequential pipeline & chat copilot live
            </p>
          </div>

          {/* Bottom links */}
          <div className="flex flex-col gap-0.5 pt-1">
            {[
              { label: 'Settings', icon: Settings, to: '/settings' },
              { label: 'Support',  icon: HelpCircle, to: '/support' },
            ].map(({ label, icon: Icon, to }) => (
              <Link
                key={label}
                to={to}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-colors hover:bg-white/5"
                style={{ color: 'var(--outline)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--on-surface)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--outline)'; }}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="font-headline" style={{ fontWeight: 500 }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
