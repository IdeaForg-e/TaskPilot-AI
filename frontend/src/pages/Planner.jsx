import { useEffect, useState } from 'react';
import { getPlan, getPlansList, generatePlan, getApiErrorMessage } from '../services/api';
import DailyPlanner from '../components/planner/DailyPlanner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { CalendarRange, Sparkles, ChevronLeft, ChevronRight, CalendarDays, Calendar } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Planner() {
  // Default to June 2026 since that is where the demo standups/meetings and data reside.
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // 0-indexed, 5 = June
  const [selectedDate, setSelectedDate] = useState('2026-06-18');
  const [plannedDates, setPlannedDates] = useState([]);
  
  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const loadPlannedDates = async () => {
    try {
      const res = await getPlansList();
      setPlannedDates(res.data || []);
    } catch (err) {
      console.error('Failed to load planned dates list:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const loadPlanForDate = async (dateStr) => {
    setLoadingPlan(true);
    setError(null);
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
    setGenerating(true);
    setError(null);
    try {
      await generatePlan({ user_id: 'user-001', date: selectedDate, buffer_hours: 1.0 });
      // Reload planned dates and then the plan
      await loadPlannedDates();
      await loadPlanForDate(selectedDate);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadPlannedDates();
    loadPlanForDate(selectedDate);
  }, []);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleDateClick = (dayNum) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    const dateStr = `${currentYear}-${mm}-${dd}`;
    setSelectedDate(dateStr);
    loadPlanForDate(dateStr);
  };

  // Calendar math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const calendarCells = [];

  // Pad empty starting days
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }

  // Populate days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(i);
  }

  const getDayFormatted = (dayNum) => {
    if (!dayNum) return '';
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  const hasPlan = (dayNum) => {
    const formatted = getDayFormatted(dayNum);
    return plannedDates.includes(formatted);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Title Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-900/60 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarRange className="h-5.5 w-5.5 text-violet-400" />
            AI Calendar Planner
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Visualize your AI-constructed schedule and timeline blocks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Month Calendar View */}
        <div className="lg:col-span-5 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h3>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handlePrevMonth}
                className="p-1 rounded-lg border border-slate-800 hover:bg-slate-900 transition-colors text-slate-450 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1 rounded-lg border border-slate-800 hover:bg-slate-900 transition-colors text-slate-450 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, idx) => (
              <span key={idx} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-1">
                {label}
              </span>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((dayNum, index) => {
              if (!dayNum) {
                return <div key={`empty-${index}`} className="aspect-square bg-slate-950/5 rounded-lg" />;
              }

              const formattedDate = getDayFormatted(dayNum);
              const isSelected = selectedDate === formattedDate;
              const planned = hasPlan(dayNum);

              return (
                <button
                  key={`day-${dayNum}`}
                  onClick={() => handleDateClick(dayNum)}
                  className={`aspect-square relative rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-gradient-to-tr from-violet-650 to-indigo-650 text-white border border-violet-500/35 ring-2 ring-violet-500/20 shadow-md scale-102 z-10'
                      : planned
                      ? 'bg-slate-900/60 border border-violet-950/50 hover:border-violet-850/60 text-violet-300'
                      : 'bg-slate-950/20 border border-slate-900/30 hover:border-slate-800/40 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{dayNum}</span>
                  {planned && !isSelected && (
                    <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-[10px] text-slate-450 border-t border-slate-900 pt-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-550 border border-violet-500/25" />
              Plan Scheduled
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-950/30 border border-slate-900" />
              Empty / Unplanned
            </span>
          </div>
        </div>

        {/* Right Column: Focus Agenda & Detailed Timeblocks */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card p-4 flex items-center justify-between bg-slate-900/20 border border-slate-900">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Selected Schedule Date</span>
              <h3 className="text-sm font-bold text-slate-200 mt-0.5">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </h3>
            </div>
          </div>

          {loadingPlan ? (
            <div className="glass-card p-12 flex flex-col items-center justify-center">
              <LoadingSpinner label="Constructing daily calendar blocks..." />
            </div>
          ) : error ? (
            <ErrorMessage message={error} onRetry={() => loadPlanForDate(selectedDate)} />
          ) : plan?.not_found ? (
            <div className="glass-card p-10 flex flex-col items-center justify-center text-center space-y-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 border border-slate-900 text-slate-500">
                <Calendar className="h-6 w-6" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-200">No AI Plan Scheduled</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  There is no active workflow agenda compiled for this date. Click below to let the planning agent organize your day!
                </p>
              </div>
              <button
                onClick={handleGeneratePlan}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-650 px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:scale-100"
              >
                {generating ? (
                  <>
                    <LoadingSpinner size="sm" label="" />
                    Generating Planner Blocks...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-cyan-300 animate-pulse" />
                    Plan Day with AI
                  </>
                )}
              </button>
            </div>
          ) : (
            <DailyPlanner plan={plan} />
          )}
        </div>
      </div>
    </div>
  );
}