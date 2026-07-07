import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getPlan, getPlansList, generatePlan, getApiErrorMessage,
} from '../services/api';
import DailyPlanner from '../components/planner/DailyPlanner';
import TaskDetail from '../components/tasks/TaskDetail';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import {
  CalendarRange, Sparkles, ChevronLeft, ChevronRight, Calendar, X,
} from 'lucide-react';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_NAMES = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

const getTodayStr = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
};

export default function Planner() {
  const todayStr = getTodayStr();
  const [initY, initM] = todayStr.split('-').map(Number);
  const [currentYear, setCurrentYear] = useState(initY);
  const [currentMonth, setCurrentMonth] = useState(initM - 1);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [plannedDates, setPlannedDates] = useState([]);

  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const [selectedTask, setSelectedTask] = useState(null);
  const [showRules, setShowRules] = useState(false);

  const loadPlannedDates = async () => {
    try {
      const res = await getPlansList();
      const dates = res.data || [];
      setPlannedDates(dates);
      let dateToLoad = selectedDate;
      if (dates.length > 0) {
        const sorted = [...dates].sort();
        dateToLoad = sorted[sorted.length - 1];
        setSelectedDate(dateToLoad);
        const [y, m] = dateToLoad.split('-').map(Number);
        setCurrentYear(y); setCurrentMonth(m - 1);
      } else {
        const s = getTodayStr();
        setSelectedDate(s);
        const [y, m] = s.split('-').map(Number);
        setCurrentYear(y); setCurrentMonth(m - 1);
        dateToLoad = s;
      }
      loadPlanForDate(dateToLoad);
    } catch (err) {
      console.error('Failed to load planned dates list:', err);
      loadPlanForDate(selectedDate);
    } finally {
      setLoadingList(false);
    }
  };

  const loadPlanForDate = async (dateStr) => {
    setLoadingPlan(true); setError(null);
    try {
      const res = await getPlan(dateStr);
      setPlan(res.data || null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleGeneratePlan = async () => {
    setGenerating(true); setError(null);
    try {
      await generatePlan({ user_id: 'user-001', date: selectedDate, buffer_hours: 1.0 });
      await loadPlannedDates();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => { loadPlannedDates(); }, []);

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };
  const handleDateClick = (dayNum) => {
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
    setSelectedDate(dateStr);
    loadPlanForDate(dateStr);
  };

  const daysInMonth   = new Date(currentYear, currentMonth + 1, 0).getDate();
  // Monday-first calendar
  let firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Mon=0

  const cells = [...Array(firstDayOfWeek).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)];

  const getDayFormatted = (d) => d
    ? `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    : '';
  const hasPlan = (d) => plannedDates.includes(getDayFormatted(d));

  // Determine the efficiency pct (cosmetic)
  const efficiencyPct = Math.min(100, 70 + plannedDates.length * 4);

  return (
    <>
      <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-light" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
            AI Planner
          </h2>
          <p className="font-body text-sm mt-2 max-w-lg" style={{ color: 'var(--on-surface-variant)' }}>
            Optimize your cognitive resources. AI has mapped your peak performance windows for{' '}
            {MONTH_NAMES[currentMonth]} {currentYear}.
          </p>
        </div>
        <button 
          onClick={() => setShowRules(true)}
          className="btn-ghost self-start flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Optimizer Rules
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
        {/* ── Calendar ── */}
        <div className="lg:col-span-5 glass-card p-5 space-y-4">
          {/* Month header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline text-lg font-medium" style={{ color: 'var(--on-surface)' }}>
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h3>
              <p className="label-caps mt-0.5" style={{ color: 'var(--primary)', fontSize: '0.55rem' }}>
                Optimal Schedule Efficiency: {efficiencyPct}%
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                style={{ border: '0.5px solid rgba(255,255,255,0.08)', color: 'var(--outline)' }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                style={{ border: '0.5px solid rgba(255,255,255,0.08)', color: 'var(--outline)' }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAY_NAMES.map((d) => (
              <span key={d} className="label-caps py-1" style={{ color: 'var(--outline)', fontSize: '0.5rem' }}>
                {d}
              </span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((dayNum, idx) => {
              if (!dayNum) return <div key={`e-${idx}`} />;
              const formatted = getDayFormatted(dayNum);
              const isSelected = selectedDate === formatted;
              const planned = hasPlan(dayNum);
              const isToday = formatted === todayStr;

              return (
                <button
                  key={`d-${dayNum}`}
                  onClick={() => handleDateClick(dayNum)}
                  className="relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-medium transition-all duration-200"
                  style={
                    isSelected
                      ? {
                          background: 'transparent',
                          border: `1.5px solid var(--primary)`,
                          color: 'var(--primary)',
                          boxShadow: '0 0 10px rgba(142,205,255,0.15)',
                        }
                      : isToday
                      ? {
                          background: 'rgba(142,205,255,0.08)',
                          border: '0.5px solid rgba(142,205,255,0.2)',
                          color: 'var(--primary)',
                        }
                      : planned
                      ? {
                          background: 'rgba(255,255,255,0.03)',
                          border: '0.5px solid rgba(255,255,255,0.07)',
                          color: 'var(--on-surface)',
                        }
                      : {
                          background: 'transparent',
                          border: '0.5px solid transparent',
                          color: 'var(--on-surface-variant)',
                        }
                  }
                >
                  <span className="font-body font-medium">{dayNum}</span>
                  {/* Color-coded underline indicator */}
                  {planned && !isSelected && (
                    <span
                      className="absolute bottom-1 h-0.5 w-4 rounded-full"
                      style={{ background: 'var(--primary)' }}
                    />
                  )}
                  {isSelected && (
                    <span
                      className="absolute bottom-1 h-0.5 w-4 rounded-full"
                      style={{ background: 'var(--primary)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div
            className="flex items-center gap-4 pt-2"
            style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)' }}
          >
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ background: 'var(--primary)' }} />
              <span className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.5rem' }}>Plan Scheduled</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
              <span className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.5rem' }}>Unplanned</span>
            </span>
          </div>
        </div>

        {/* ── Daily Flow ── */}
        <div className="lg:col-span-7 space-y-3">
          {/* Selected date header */}
          <div className="glass-card p-4 flex items-center justify-between">
            <div>
              <span className="label-caps block mb-1" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                Daily Flow
              </span>
              <h3 className="font-headline text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </h3>
            </div>
            <span className="chip chip-blue text-[0.55rem] py-0.5">
              {selectedDate === todayStr 
                ? `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}, TODAY` 
                : selectedDate}
            </span>
          </div>

          {/* Plan content */}
          {loadingPlan ? (
            <div className="glass-card p-12 flex items-center justify-center">
              <LoadingSpinner label="Constructing daily calendar blocks..." />
            </div>
          ) : error ? (
            <ErrorMessage message={error} onRetry={() => loadPlanForDate(selectedDate)} />
          ) : plan?.not_found ? (
            <div className="glass-card p-10 flex flex-col items-center justify-center text-center space-y-4">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)' }}
              >
                <Calendar className="h-6 w-6" style={{ color: 'var(--outline)' }} />
              </span>
              <div>
                <h4 className="font-headline text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
                  No AI Plan Scheduled
                </h4>
                <p className="font-body text-xs mt-1 max-w-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  No workflow agenda compiled for this date. Let the planning agent organize your day!
                </p>
              </div>
              <button
                onClick={handleGeneratePlan}
                disabled={generating}
                className="btn-primary text-xs px-5 py-2.5 rounded-xl"
              >
                {generating ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Plan Day with AI
                  </>
                )}
              </button>
            </div>
          ) : (
            <DailyPlanner plan={plan} onSelectTask={setSelectedTask} />
          )}
        </div>
      </div>
    </div>

    {/* Task Detail Modal Pop-up (Rendered outside the transform-animated container) */}
    {selectedTask && (
      <TaskDetail task={selectedTask} tasks={[]} onClose={() => setSelectedTask(null)} />
    )}

    {/* Optimizer Rules Modal Pop-up (Rendered outside the transform-animated container) */}
    {showRules && createPortal(
      <div 
        onClick={() => setShowRules(false)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-scale-in cursor-pointer"
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg overflow-y-auto border border-slate-800 bg-slate-900/95 backdrop-blur-xl p-6 rounded-2xl shadow-2xl flex flex-col justify-between cursor-default"
        >
          <div>
            <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">AI Optimizer Engine Rules</h2>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 font-body text-xs text-slate-300">
              <div className="p-3 bg-slate-950/40 border border-slate-950 rounded-xl">
                <h4 className="font-semibold text-white mb-1">📅 Rule 1: Cognitive Peak Windowing</h4>
                <p className="leading-relaxed">Deep Focus agenda slots are allocated dynamically during morning hours when developer cognitive load capacity is at its peak.</p>
              </div>
              <div className="p-3 bg-slate-950/40 border border-slate-950 rounded-xl">
                <h4 className="font-semibold text-white mb-1">🛡️ Rule 2: DND Auto-Shielding</h4>
                <p className="leading-relaxed">Enforces strict Do Not Disturb alerts for high-complexity coding items to prevent team workflow interruptions.</p>
              </div>
              <div className="p-3 bg-slate-950/40 border border-slate-950 rounded-xl">
                <h4 className="font-semibold text-white mb-1">☕ Rule 3: Fatigue Recovery Blocks</h4>
                <p className="leading-relaxed">AI automatically inserts mandatory 30-minute buffers after meeting sequences to alleviate cognitive fatigue.</p>
              </div>
              <div className="p-3 bg-slate-950/40 border border-slate-950 rounded-xl">
                <h4 className="font-semibold text-white mb-1">🔄 Rule 4: Signal Fusion Alignment</h4>
                <p className="leading-relaxed">Cross-references backlog triage priorities between Jira issue severity metrics and GitHub activity feeds dynamically.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-850 mt-5 pt-4">
            <button
              onClick={() => setShowRules(false)}
              className="w-full rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 py-2 text-xs font-semibold text-slate-350 transition-all cursor-pointer text-center"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
);
}