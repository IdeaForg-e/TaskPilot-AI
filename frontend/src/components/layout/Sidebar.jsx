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
  Plus,
  Cpu,
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
          style={{ background: 'rgba(17,19,24,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed z-50 inset-y-0 left-0 w-[220px] flex flex-col justify-between
          transition-transform duration-300 ease-out
          md:sticky md:top-0 md:h-screen md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'var(--surface-container-low)',
          borderRight: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Top Section */}
        <div className="flex flex-col gap-0">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 pt-6 pb-7">
            <Link to="/" className="flex items-center gap-3 group" onClick={onClose}>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                style={{
                  background: 'var(--primary-container)',
                  boxShadow: '0 4px 12px rgba(0,125,184,0.35)',
                }}
              >
                <Cpu className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <p
                  className="font-headline text-sm font-semibold leading-none"
                  style={{ color: 'var(--on-surface)' }}
                >
                  TaskPilot AI
                </p>
                <p
                  className="label-caps mt-0.5 leading-none"
                  style={{ color: 'var(--outline)', fontSize: '0.55rem' }}
                >
                  Engineering Suite
                </p>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 md:hidden transition-colors"
              style={{ color: 'var(--outline)' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-0.5 px-3">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={onClose}
                  className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200"
                  style={
                    active
                      ? {
                          background: 'rgba(0,125,184,0.12)',
                          color: 'var(--primary)',
                          borderLeft: '2px solid var(--primary)',
                        }
                      : {
                          color: 'var(--on-surface-variant)',
                          borderLeft: '2px solid transparent',
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(142,205,255,0.05)';
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
                  <Icon className="h-4 w-4 shrink-0" />
                  <span
                    className="font-body text-xs font-500 tracking-wide"
                    style={{ fontWeight: active ? 600 : 500 }}
                  >
                    {label}
                  </span>
                  {active && (
                    <span
                      className="ml-auto h-1.5 w-1.5 rounded-full"
                      style={{ background: 'var(--primary)', boxShadow: '0 0 6px var(--primary)' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-2 p-4">
         

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
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-colors"
                style={{ color: 'var(--outline)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--on-surface)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--outline)'; }}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="font-body" style={{ fontWeight: 500 }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
