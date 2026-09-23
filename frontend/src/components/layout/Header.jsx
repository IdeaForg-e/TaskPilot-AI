import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Menu, Play, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Search, Bell, Sun, Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getApiErrorMessage, runPipeline, getLatestPipelineRun, getTasks, getPlan } from '../../services/api';

const PAGE_TITLES = {
  '/':         'Command Center',
  '/tasks':    'Task Directory',
  '/quality':  'Quality Assurance',
  '/priority': 'Leaderboard',
  '/planner':  'AI Planner',
  '/chat':     'Copilot Chat',
  '/settings': 'System Settings',
  '/support':  'Help & Support',
};

export default function Header({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState('idle'); // idle | loading | success | warning | error
  const [notice, setNotice] = useState(null);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [prevRunStatus, setPrevRunStatus] = useState(null);

  const [searchVal, setSearchVal] = useState(searchParams.get('q') || '');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Sync search input with URL search param
  useEffect(() => {
    setSearchVal(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/tasks?q=${encodeURIComponent(searchVal)}`);
  };

  const loadNotifications = async () => {
    let tasksList = [];
    let runInfo = null;

    try {
      const tasksRes = await getTasks();
      tasksList = tasksRes.data || [];
    } catch (err) {
      console.error('Header failed to fetch tasks:', err);
    }

    try {
      const runRes = await getLatestPipelineRun();
      runInfo = runRes.data || null;
    } catch (err) {
      console.error('Header failed to fetch latest run:', err);
    }

    const list = [];

    // 1. Pipeline Status notification
    if (runInfo?.latest_run) {
      list.push({
        id: 'pipeline',
        type: runInfo.latest_run.status === 'completed' ? 'success' : 'error',
        title: `Pipeline ${runInfo.latest_run.status === 'completed' ? 'Completed' : 'Failed'}`,
        desc: `Run ID: ${(runInfo.latest_run.run_id || runInfo.latest_run.id || '').substring(0, 8)}`,
      });
    }

    // 2. Overload warnings (tasks per assignee count > 5)
    const assigneeCounts = {};
    tasksList.forEach(t => {
      if (t.assignee && t.status !== 'completed') {
        assigneeCounts[t.assignee] = (assigneeCounts[t.assignee] || 0) + 1;
      }
    });
    Object.entries(assigneeCounts).forEach(([name, count]) => {
      if (count > 5) {
        list.push({
          id: `overload-${name}`,
          type: 'warning',
          title: `Developer Overload Alert`,
          desc: `${name} has ${count} active tasks in progress`,
        });
      }
    });

    // 3. P1 Critical Alerts (overall_score >= 8.5)
    tasksList.forEach(t => {
      if (t.urgency === 'critical' || t.urgency === 'high') {
        list.push({
          id: `p1-${t.id}`,
          type: 'critical',
          title: `P1 Critical Escalation`,
          desc: t.title,
        });
      }
    });

    // Helper to format today's date YYYY-MM-DD
    const getTodayStr = () => {
      const t = new Date();
      return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
    };

    // 4. Next Upcoming Task from today's plan
    let todayPlan = null;
    try {
      const planRes = await getPlan(getTodayStr());
      todayPlan = planRes.data || null;
    } catch (err) {
      // Fallback silent
    }

    let foundUpcoming = false;
    if (todayPlan) {
      const slots = todayPlan.time_slots || todayPlan.time_blocks || [];
      const taskSlots = slots.filter(s => s.slot_type === 'task' && s.task_id);
      
      if (taskSlots.length > 0) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();

        const parseTimeToMins = (timeStr) => {
          if (!timeStr) return 0;
          const [h, m] = timeStr.split(':').map(Number);
          return h * 60 + m;
        };

        const upcomingSlots = taskSlots.filter(s => {
          const startMins = parseTimeToMins(s.start_time);
          const taskObj = tasksList.find(t => t.id === s.task_id);
          const isCompleted = taskObj?.status === 'completed' || taskObj?.status === 'done';
          return startMins > currentMins && !isCompleted;
        });

        upcomingSlots.sort((a, b) => parseTimeToMins(a.start_time) - parseTimeToMins(b.start_time));

        if (upcomingSlots.length > 0) {
          const nextSlot = upcomingSlots[0];
          list.push({
            id: `next-task-${nextSlot.task_id}`,
            type: 'upcoming',
            title: `Next Scheduled Task Today`,
            desc: `[${nextSlot.start_time}] ${nextSlot.title}`,
          });
          foundUpcoming = true;
        } else {
          const ongoingSlots = taskSlots.filter(s => {
            const startMins = parseTimeToMins(s.start_time);
            const endMins = parseTimeToMins(s.end_time);
            const taskObj = tasksList.find(t => t.id === s.task_id);
            const isCompleted = taskObj?.status === 'completed' || taskObj?.status === 'done';
            return currentMins >= startMins && currentMins <= endMins && !isCompleted;
          });
          if (ongoingSlots.length > 0) {
            list.push({
              id: `next-task-${ongoingSlots[0].task_id}`,
              type: 'upcoming',
              title: `Current Active Task`,
              desc: `[${ongoingSlots[0].start_time} - ${ongoingSlots[0].end_time}] ${ongoingSlots[0].title}`,
            });
            foundUpcoming = true;
          }
        }
      }
    }

    if (!foundUpcoming && tasksList.length > 0) {
      const pendingTasks = [...tasksList]
        .filter(t => t.status !== 'completed' && t.status !== 'done')
        .sort((a, b) => {
          const scoreA = a.priority_score || (a.urgency === 'critical' ? 9.0 : a.urgency === 'high' ? 7.5 : 5.0);
          const scoreB = b.priority_score || (b.urgency === 'critical' ? 9.0 : b.urgency === 'high' ? 7.5 : 5.0);
          return scoreB - scoreA;
        });
      if (pendingTasks.length > 0) {
        list.push({
          id: `next-priority-task-${pendingTasks[0].id}`,
          type: 'upcoming',
          title: `Next Priority Backlog Task`,
          desc: pendingTasks[0].title,
        });
      }
    }

    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkPipelineStatus = async () => {
      try {
        const res = await getLatestPipelineRun();
        const runInfo = res.data?.latest_run || null;
        if (runInfo) {
          const rawStatus = runInfo.status || 'idle';
          const startedAtStr = runInfo.started_at;
          const startedAt = startedAtStr
            ? new Date(startedAtStr.endsWith('Z') ? startedAtStr : startedAtStr + 'Z')
            : null;
          const now = new Date();
          const isStale = rawStatus === 'running' && startedAt && (now - startedAt > 5 * 60 * 1000);

          const finalStatus = isStale ? 'failed' : rawStatus;
          const isRunning = finalStatus === 'running';
          setIsPipelineRunning(isRunning);

          setPrevRunStatus((prev) => {
            if (prev === 'running' && finalStatus === 'completed') {
              setStatus('success');
              setNotice('Pipeline execution completed successfully.');
              setTimeout(() => { setStatus('idle'); setNotice(null); }, 10000);
            } else if (prev === 'running' && finalStatus === 'failed') {
              setStatus('error');
              setNotice(isStale ? 'Pipeline run timed out.' : `Pipeline failed: ${runInfo.error || 'Unknown error'}`);
              setTimeout(() => { setStatus('idle'); setNotice(null); }, 10000);
            }
            return finalStatus;
          });
        } else {
          setIsPipelineRunning(false);
          setPrevRunStatus('idle');
        }
      } catch (err) {
        console.error('Failed to fetch pipeline status in Header', err);
      }
    };

    checkPipelineStatus();
    const interval = setInterval(checkPipelineStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRunPipeline = async () => {
    setStatus('loading');
    setNotice(null);
    try {
      await runPipeline();
      setPrevRunStatus('running');
      setIsPipelineRunning(true);
    } catch (err) {
      const errMsg = getApiErrorMessage(err);
      if (errMsg) {
        setStatus('error');
        setNotice(errMsg);
        setTimeout(() => { setStatus('idle'); setNotice(null); }, 7000);
      } else {
        setStatus('idle');
      }
    }
  };

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';

  const NoticeIcon = status === 'error' ? XCircle : status === 'warning' ? AlertTriangle : CheckCircle2;
  const noticeClass =
    status === 'error'
      ? 'border-rose-500/30 bg-rose-950/90 text-rose-200'
      : status === 'warning'
        ? 'border-amber-500/30 bg-amber-950/90 text-amber-200'
        : 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200';

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3 bg-[#0a0e17]/90 backdrop-blur-md border-b border-[#1e293b]">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="rounded-md p-1.5 md:hidden text-slate-400 hover:text-white hover:bg-slate-800/50"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[10px] tracking-wider uppercase text-slate-500 hidden sm:block">
              OPS_CENTER
            </span>
            <span className="hidden sm:block text-slate-600 text-xs">/</span>
            <span className="text-sm font-semibold text-white tracking-tight truncate">
              {pageTitle}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase font-semibold ${
                isPipelineRunning
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,210,255,0.2)]'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isPipelineRunning ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'
                }`}
              />
              {isPipelineRunning ? 'Orchestrating' : 'Nominal'}
            </span>
          </div>
        </div>

        {/* Center: Command Palette Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-sm items-center gap-2 rounded-md px-3 py-1.5 bg-[#0f172a] border border-[#1e293b] focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/40 transition-all"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search tasks, agents, signals..."
            className="w-full bg-transparent border-0 outline-none text-xs text-slate-200 placeholder:text-slate-500"
          />
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.2 text-[9px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded">
            ↵ Enter
          </kbd>
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Status badge notice */}
          {status === 'success' && notice && (
            <span className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-400 font-mono animate-fade-in-up">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[180px]">{notice}</span>
            </span>
          )}
          {status === 'error' && notice && (
            <span className="hidden lg:flex items-center gap-1.5 text-xs text-rose-400 font-mono animate-fade-in-up">
              <XCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[180px]">{notice}</span>
            </span>
          )}

          {/* Theme Switcher Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-md bg-[#0f172a] border border-[#1e293b] text-slate-300 hover:text-white hover:border-slate-700 transition-colors flex items-center justify-center group"
            title={theme === 'dark' ? 'Switch to White Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="h-4 w-4 text-sky-500 group-hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-md bg-[#0f172a] border border-[#1e293b] text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="System Alerts & Telemetry"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-[#0a0e17] animate-pulse" />
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-80 rounded-md p-3.5 bg-[#0f172a] border border-[#1e293b] shadow-2xl shadow-black/80 z-50 animate-scale-in"
              >
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#1e293b]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,210,255,0.8)]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                      Signals & Alerts
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {notifications.length} active
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6 font-mono">
                      All telemetry nominal. Zero alerts.
                    </p>
                  ) : (
                    notifications.map((n) => {
                      let badgeDot = 'bg-rose-500';
                      let containerBg = 'bg-rose-950/20 border-rose-900/30 text-rose-300';
                      if (n.type === 'warning') {
                        badgeDot = 'bg-amber-400';
                        containerBg = 'bg-amber-950/20 border-amber-900/30 text-amber-300';
                      } else if (n.type === 'success') {
                        badgeDot = 'bg-emerald-400';
                        containerBg = 'bg-emerald-950/20 border-emerald-900/30 text-emerald-300';
                      } else if (n.type === 'upcoming') {
                        badgeDot = 'bg-cyan-400';
                        containerBg = 'bg-cyan-950/20 border-cyan-900/30 text-cyan-300';
                      }

                      return (
                        <div
                          key={n.id}
                          className={`rounded-md p-2.5 flex items-start gap-2.5 border transition-all ${containerBg}`}
                        >
                          <span className={`h-2 w-2 rounded-full mt-1 shrink-0 ${badgeDot}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-100 truncate">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                              {n.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Run Pipeline Primary CTA */}
          <button
            onClick={handleRunPipeline}
            disabled={status === 'loading' || isPipelineRunning}
            className="btn-primary inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/30 shadow-md shadow-cyan-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {status === 'loading' || isPipelineRunning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                <span className="font-mono text-[11px] uppercase tracking-wider">
                  Orchestrating...
                </span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 fill-white text-white" />
                <span>Run Pipeline</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Global Toast Notice */}
      {notice && status !== 'loading' && (
        <div
          className={`fixed right-4 top-16 z-50 flex items-start gap-2.5 rounded-md border px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-xl sm:max-w-md animate-fade-in-up ${noticeClass}`}
        >
          <NoticeIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="leading-snug text-slate-100">{notice}</span>
        </div>
      )}
    </>
  );
}
