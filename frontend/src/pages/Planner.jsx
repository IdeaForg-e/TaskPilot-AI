import { useEffect, useState } from 'react';
import { getPlan } from '../services/api';
import DailyPlanner from '../components/planner/DailyPlanner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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
      setError(err.message || 'Failed to load today\'s plan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  if (loading) return <LoadingSpinner label="Loading today's plan..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadPlan} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-100">Planner</h1>
        <span className="text-sm text-slate-400">{todayISO()}</span>
      </div>
      <DailyPlanner plan={plan} />
    </div>
  );
}
