import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Menu, Play, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Search, Bell, Sun, Moon,
} from 'lucide-react';
import { getApiErrorMessage, runPipeline, getLatestPipelineRun, getTasks, getPlan } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

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

    // 4. Next Upcoming Task from today's plan, or fallback to highest priority pending task
    let todayPlan = null;
    try {
      const planRes = await getPlan(getTodayStr());
      todayPlan = planRes.data || null;
    } catch (err) {
      // Fallback silent if today's plan is not generated yet
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
      ? 'border-red-500/30 bg-red-950/90 text-red-100'
      : status === 'warning'
        ? 'border-amber-500/30 bg-amber-950/90 text-amber-100'
        : 'border-emerald-500/30 bg-emerald-950/90 text-emerald-100';

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center gap-4 px-4 md:px-6 py-3 transition-colors"
        style={{
          background: '#e3bd90',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(108,110,54,0.2)',
        }}
      >
        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 md:hidden transition-colors hover:bg-black/5 active:scale-95"
          style={{ color: 'var(--outline)' }}
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-4.5 w-4.5 text-[#3b3b3b]" />
        </button>

        {/* Breadcrumb / Page Context */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-mono text-[10px] tracking-wider uppercase text-[#525252] hidden sm:block">
            OPS_CENTER
          </span>
          <span className="hidden sm:block text-[#6c6e36] text-xs">/</span>
          <div className="flex items-center gap-2">
            <span className="font-headline text-sm font-semibold text-[#3b3b3b] tracking-tight">
              {pageTitle}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold uppercase ${
                isPipelineRunning
                  ? 'bg-[#6c6e36]/15 text-[#6c6e36] border border-[#6c6e36]/30'
                  : 'bg-[#6c6e36]/10 text-[#6c6e36] border border-[#6c6e36]/20'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isPipelineRunning ? 'bg-[#6c6e36] animate-ping' : 'bg-[#6c6e36]'
                }`}
              />
              {isPipelineRunning ? 'Orchestrating' : 'Nominal'}
            </span>
          </div>
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-sm items-center gap-2.5 rounded-xl px-3.5 py-1.5 transition-all focus-within:border-[#6c6e36] focus-within:ring-1 focus-within:ring-[#6c6e36]"
          style={{
            background: '#f7ede1',
            border: '1px solid rgba(108,110,54,0.3)',
          }}
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search tasks, agents, signals..."
            className="w-full bg-transparent border-0 outline-none text-xs font-body text-slate-200 placeholder:text-slate-500"
          />
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-slate-400 bg-white/5 border border-white/10 rounded-md">
            ↵ Enter
          </kbd>
        </form>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Status message */}
          {status === 'success' && notice && (
            <span className="hidden md:flex items-center gap-1.5 text-xs animate-scale-in text-emerald-400 font-mono">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[200px]">{notice}</span>
            </span>
          )}
          {status === 'error' && notice && (
            <span className="hidden md:flex items-center gap-1.5 text-xs animate-scale-in text-rose-400 font-mono">
              <XCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[180px]">{notice}</span>
            </span>
          )}

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="rounded-xl p-2 transition-all relative cursor-pointer hover:bg-white/5 text-slate-400 hover:text-slate-100 active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '0.5px solid rgba(255,255,255,0.07)',
              }}
              title="System Alerts & Telemetry"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#080b11] animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 mt-2.5 w-84 rounded-2xl p-4 shadow-2xl z-50 animate-scale-in"
                style={{
                  background: 'rgba(12,16,24,0.96)',
                  backdropFilter: 'blur(32px)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 24px 48px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span className="font-headline text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Signals & Alerts
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    {notifications.length} active
                  </span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 font-body text-center py-6">
                      No anomalous signals detected. All subsystems nominal.
                    </p>
                  ) : (
                    notifications.map((n) => {
                      let badgeColor = '#ef4444';
                      let bgTint = 'rgba(239,68,68,0.08)';
                      let borderTint = 'rgba(239,68,68,0.2)';
                      if (n.type === 'warning') {
                        badgeColor = '#f59e0b';
                        bgTint = 'rgba(245,158,11,0.08)';
                        borderTint = 'rgba(245,158,11,0.2)';
                      } else if (n.type === 'success') {
                        badgeColor = '#4caf8e';
                        bgTint = 'rgba(76,175,142,0.08)';
                        borderTint = 'rgba(76,175,142,0.2)';
                      } else if (n.type === 'upcoming') {
                        badgeColor = '#8ecdff';
                        bgTint = 'rgba(142,205,255,0.08)';
                        borderTint = 'rgba(142,205,255,0.2)';
                      }

                      return (
                        <div
                          key={n.id}
                          className="rounded-xl p-3 flex gap-2.5 transition-all hover:translate-x-0.5"
                          style={{
                            background: bgTint,
                            border: `0.5px solid ${borderTint}`,
                          }}
                        >
                          <span
                            className="h-2 w-2 rounded-full mt-1.5 shrink-0 ring-4 ring-black/40"
                            style={{ background: badgeColor }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate font-headline">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-body">
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

          {/* Run Pipeline CTA */}
          <button
            onClick={handleRunPipeline}
            disabled={status === 'loading' || isPipelineRunning}
            className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-headline text-slate-900 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(142,205,255,0.25)] hover:shadow-[0_0_28px_rgba(142,205,255,0.4)]"
            style={{
              background: 'linear-gradient(135deg, #a5d8ff 0%, #70b8ff 50%, #4da3ff 100%)',
            }}
          >
            {status === 'loading' || isPipelineRunning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-900" />
                <span className="hidden sm:inline font-mono uppercase tracking-wider text-[11px]">
                  Orchestrating...
                </span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 fill-slate-900 text-slate-900" />
                <span className="hidden sm:inline tracking-tight">Run Pipeline</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Toast notification */}
      {notice && status !== 'loading' && (
        <div
          className={`fixed right-4 top-20 z-50 flex max-w-[calc(100vw-2rem)] items-start gap-2.5 rounded-2xl border px-4 py-3 text-xs shadow-2xl backdrop-blur-2xl sm:max-w-md animate-scale-in ${noticeClass}`}
          style={{
            boxShadow: '0 20px 40px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          <NoticeIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="leading-relaxed font-body text-slate-200">{notice}</span>
        </div>
      )}
    </>
  );
}
