import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  ShieldCheck,
  ArrowUpNarrowWide,
  CalendarClock,
  MessageSquare,
  X,
  Cpu,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/quality', label: 'Quality', icon: ShieldCheck },
  { to: '/priority', label: 'Priority', icon: ArrowUpNarrowWide },
  { to: '/planner', label: 'Planner', icon: CalendarClock },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed z-50 inset-y-0 left-0 w-64 transform border-r border-slate-800 bg-slate-950/80 backdrop-blur-xl p-4 transition-all duration-300 ease-out md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div>
          <div className="mb-8 flex items-center justify-between px-2 pt-2">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 text-white font-bold shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
                TP
              </span>
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                TaskPilot <span className="text-cyan-400">AI</span>
              </span>
            </Link>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/80 hover:text-white md:hidden transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <nav className="space-y-1.5">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white border-l-2 border-violet-500 shadow-inner'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-100 hover:translate-x-1'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 transition-colors ${active ? 'text-violet-400' : 'text-slate-400'}`} />
                  <span>{label}</span>
                  {active && (
                    <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Badge */}
        <div className="border-t border-slate-800/80 pt-4 px-2">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900/40 border border-slate-800/60 p-3">
            <Cpu className="h-5 w-5 text-cyan-400 animate-pulse" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">Orchestrator v1.0</p>
              <p className="text-[10px] text-slate-500 truncate">Multi-Agent Engine Active</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
