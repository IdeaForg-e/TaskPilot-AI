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
  Activity,
} from 'lucide-react';

import Logo from '../common/Logo';

const NAV_ITEMS = [
  { to: '/',         label: 'Command Center',    icon: LayoutDashboard, tag: 'OPS' },
  { to: '/tasks',    label: 'Task Directory',    icon: ListTodo,        tag: 'DATA' },
  { to: '/quality',  label: 'Quality Assurance', icon: ShieldCheck,     tag: 'GATE' },
  { to: '/priority', label: 'Leaderboard',       icon: ArrowUpNarrowWide, tag: 'RANK' },
  { to: '/planner',  label: 'AI Planner',        icon: CalendarClock,   tag: 'PLAN' },
  { to: '/chat',     label: 'Copilot Chat',      icon: MessageSquare,   tag: 'LLM' },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed z-50 inset-y-0 left-0 w-[240px] flex flex-col justify-between
          transition-transform duration-300 ease-out
          md:sticky md:top-0 md:h-screen md:translate-x-0
          bg-[#0a0e17] border-r border-[#1e293b]
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Top Section */}
        <div className="flex flex-col">
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-[#1e293b]/70">
            <Link to="/" className="flex items-center gap-3 group" onClick={onClose}>
              <div className="relative flex h-8 w-8 items-center justify-center transition-all group-hover:scale-105">
                <Logo size={32} />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0a0e17] animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  TaskPilot <span className="text-cyan-400 font-mono text-xs font-semibold px-1 py-0.2 bg-cyan-950/60 rounded border border-cyan-800/40">AI</span>
                </p>
                <p className="font-mono text-[9px] text-slate-400 tracking-wider uppercase">
                  CHIEF OF STAFF
                </p>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="rounded-md p-1 md:hidden text-slate-400 hover:text-white hover:bg-slate-800/50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Section */}
          <div className="px-3 pt-4">
            <p className="px-2 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-medium">
              Navigation
            </p>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map(({ to, label, icon: Icon, tag }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={`relative flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-all duration-150 ${
                      active
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,210,255,0.08)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>{label}</span>
                    </div>
                    <span
                      className={`font-mono text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                        active
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                          : 'bg-slate-800/60 text-slate-500'
                      }`}
                    >
                      {tag}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-3 p-4 border-t border-[#1e293b]/70">
          {/* Agent Status Pill */}
          <div className="rounded-md p-2.5 cockpit-card border border-[#1e293b]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-cyan-400" />
                Agents Active
              </span>
              <span className="font-mono text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                8/8 Nominal
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Pipeline & Chat Copilot online
            </p>
          </div>

          {/* System Links */}
          <div className="flex flex-col gap-0.5">
            {[
              { label: 'Settings', icon: Settings, to: '/settings' },
              { label: 'Support',  icon: HelpCircle, to: '/support' },
            ].map(({ label, icon: Icon, to }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={label}
                  to={to}
                  onClick={onClose}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? 'text-cyan-400 bg-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
