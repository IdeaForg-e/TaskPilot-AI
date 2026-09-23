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
  let firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Mon=0

  const cells = [...Array(firstDayOfWeek).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)];

  const getDayFormatted = (d) => d
    ? `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    : '';
  const hasPlan = (d) => plannedDates.includes(getDayFormatted(d));

  const efficiencyPct = Math.min(100, 70 + plannedDates.length * 4);

  return (
    <>
      <div className="space-y-5 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#1e293b]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,210,255,0.8)]" />
              <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-400 font-semibold">
                SCHEDULE_MATRIX // AI_OPTIMIZER
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              AI Planner
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-lg">
              Cognitive resource scheduling and buffer management mapped for {MONTH_NAMES[currentMonth]} {currentYear}.
            </p>
          </div>

          <button 
            onClick={() => setShowRules(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 hover:bg-cyan-900/40 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,210,255,0.15)] active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>OPTIMIZER RULES</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
          {/* ── Calendar ── */}
          <div className="lg:col-span-5 cockpit-card p-5 space-y-4 bg-[#0f172a] border border-[#1e293b] shadow-xl relative overflow-hidden">
            {/* Month header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div>
                <h3 className="text-sm font-bold text-white font-mono">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h3>
                <p className="font-mono text-[10px] text-cyan-400 uppercase tracking-wider mt-0.5 font-semibold">
                  SCHEDULE EFFICIENCY: {efficiencyPct}%
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="flex h-7 w-7 items-center justify-center rounded transition-all hover:bg-slate-800 text-slate-400 hover:text-white border border-[#1e293b]"
                  title="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="flex h-7 w-7 items-center justify-center rounded transition-all hover:bg-slate-800 text-slate-400 hover:text-white border border-[#1e293b]"
                  title="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Weekday labels */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {DAY_NAMES.map((d) => (
                <span key={d} className="font-mono text-[10px] uppercase text-slate-400 font-medium py-1">
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((dayNum, idx) => {
                if (!dayNum) return <div key={`e-${idx}`} className="aspect-square" />;
                const formatted = getDayFormatted(dayNum);
                const isSelected = selectedDate === formatted;
                const planned = hasPlan(dayNum);
                const isToday = formatted === todayStr;

                return (
                  <button
                    key={`d-${dayNum}`}
                    onClick={() => handleDateClick(dayNum)}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded text-xs font-mono transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,210,255,0.4)] font-bold'
                        : isToday
                        ? 'bg-slate-800 border border-cyan-500/40 text-cyan-400 font-semibold'
                        : planned
                        ? 'bg-[#090d16] border border-[#1e293b] text-slate-200 hover:border-slate-600'
                        : 'hover:bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    <span className="tabular-nums">{dayNum}</span>
                    {planned && (
                      <span
                        className={`absolute bottom-1 h-1 w-2.5 rounded-full ${
                          isSelected ? 'bg-cyan-400 shadow-[0_0_6px_#00d2ff]' : 'bg-cyan-500/60'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 pt-3 border-t border-[#1e293b] font-mono text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span className="text-slate-400 uppercase">SCHEDULED</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                <span className="text-slate-500 uppercase">UNPLANNED</span>
              </span>
            </div>
          </div>

          {/* ── Daily Flow ── */}
          <div className="lg:col-span-7 space-y-4">
            {/* Selected date header */}
            <div className="cockpit-card p-3.5 flex items-center justify-between bg-[#0f172a] border border-[#1e293b] shadow-xl">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-medium block">
                  ACTIVE WORKSPACE AGENDA
                </span>
                <h3 className="text-xs font-semibold text-white font-mono mt-0.5">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono tracking-wider font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40">
                {selectedDate === todayStr 
                  ? 'TODAY' 
                  : selectedDate}
              </span>
            </div>

            {/* Plan content */}
            {loadingPlan ? (
              <div className="cockpit-card p-10 flex items-center justify-center bg-[#0f172a] border border-[#1e293b]">
                <LoadingSpinner label="Constructing daily calendar blocks..." />
              </div>
            ) : error ? (
              <ErrorMessage message={error} onRetry={() => loadPlanForDate(selectedDate)} />
            ) : plan?.not_found ? (
              <div className="cockpit-card p-8 flex flex-col items-center justify-center text-center space-y-3 bg-[#0f172a] border border-[#1e293b]">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-[#090d16] border border-[#1e293b]">
                  <Calendar className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    No AI Plan Scheduled
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                    No workflow agenda compiled for this date. Let the planning agent organize your day!
                  </p>
                </div>
                <button
                  onClick={handleGeneratePlan}
                  disabled={generating}
                  className="btn-primary text-xs px-4 py-2 rounded mt-2"
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

      {/* Task Detail Modal Pop-up */}
      {selectedTask && (
        <TaskDetail task={selectedTask} tasks={[]} onClose={() => setSelectedTask(null)} />
      )}

      {/* Optimizer Rules Modal Pop-up */}
      {showRules && createPortal(
        <div 
          onClick={() => setShowRules(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-scale-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-y-auto rounded-lg p-6 shadow-2xl flex flex-col justify-between cursor-default bg-[#0f172a] border border-[#1e293b]"
          >
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-[#1e293b] pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded bg-cyan-950/60 flex items-center justify-center border border-cyan-800/40">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  </span>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">AI Optimizer Engine Rules</h2>
                </div>
                <button
                  onClick={() => setShowRules(false)}
                  className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-[#090d16] border border-[#1e293b] rounded">
                  <h4 className="font-semibold text-white mb-1">📅 Rule 1: Cognitive Peak Windowing</h4>
                  <p className="leading-relaxed text-slate-400">Deep Focus agenda slots are allocated dynamically during morning hours when developer cognitive load capacity is at its peak.</p>
                </div>
                <div className="p-3 bg-[#090d16] border border-[#1e293b] rounded">
                  <h4 className="font-semibold text-white mb-1">🛡️ Rule 2: DND Auto-Shielding</h4>
                  <p className="leading-relaxed text-slate-400">Enforces strict Do Not Disturb alerts for high-complexity coding items to prevent team workflow interruptions.</p>
                </div>
                <div className="p-3 bg-[#090d16] border border-[#1e293b] rounded">
                  <h4 className="font-semibold text-white mb-1">☕ Rule 3: Fatigue Recovery Blocks</h4>
                  <p className="leading-relaxed text-slate-400">AI automatically inserts mandatory 30-minute buffers after meeting sequences to alleviate cognitive fatigue.</p>
                </div>
                <div className="p-3 bg-[#090d16] border border-[#1e293b] rounded">
                  <h4 className="font-semibold text-white mb-1">🔄 Rule 4: Signal Fusion Alignment</h4>
                  <p className="leading-relaxed text-slate-400">Cross-references backlog triage priorities between Jira issue severity metrics and GitHub activity feeds dynamically.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#1e293b] mt-5 pt-3.5 flex justify-end">
              <button
                onClick={() => setShowRules(false)}
                className="rounded px-4 py-1.5 text-xs font-semibold text-white bg-[#1e293b] hover:bg-slate-700 transition-colors"
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