import { useEffect, useState } from 'react';
import { getPlan, getApiErrorMessage } from '../services/api';
import DailyPlanner from '../components/planner/DailyPlanner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { CalendarRange, Sparkles } from 'lucide-react';

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getFormattedDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date().toLocaleDateString(undefined, options);
}

export default function Planner() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPlan(todayISO());
      setPlan(res.data || null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  if (loading) return <LoadingSpinner label="Constructing daily calendar blocks..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadPlan} />;

  const slotCount = plan?.time_blocks?.length || plan?.schedule?.length || 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-900/60 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Daily Planner</h2>
          <p className="text-xs text-slate-400 mt-0.5">{getFormattedDate()}</p>
        </div>
        
        <div className="flex gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-850 px-3 py-1 text-xs font-bold text-slate-350">
            <CalendarRange className="h-3.5 w-3.5 text-violet-400" />
            {slotCount} Time Slots Allocated
          </span>
        </div>
      </div>
      
      <DailyPlanner plan={plan} />
    </div>
  );
}