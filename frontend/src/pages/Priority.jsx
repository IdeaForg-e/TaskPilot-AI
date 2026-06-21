import { useEffect, useState } from 'react';
import { getRankedTasks, getApiErrorMessage } from '../services/api';
import PriorityList from '../components/priority/PriorityList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { Award, ShieldAlert, Sparkles } from 'lucide-react';

export default function Priority() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRankedTasks();
      setTasks(res.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  if (loading) return <LoadingSpinner label="Calculating workspace priorities..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadTasks} />;

  const highPriorityCount = tasks.filter((t) => (t.priority_score || 0) >= 80).length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Priority Leaderboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">Ranked actions computed dynamically based on project impact, deadline, and context</p>
        </div>
        
        <div className="flex gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400">
            <Award className="h-3.5 w-3.5" />
            {tasks.length > 0 ? 'Rankings Complete' : 'Calculating'}
          </span>
          {highPriorityCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-xs font-bold text-violet-400">
              <Sparkles className="h-3.5 w-3.5" />
              {highPriorityCount} High Urgency
            </span>
          )}
        </div>
      </div>

      <PriorityList tasks={tasks} />
    </div>
  );
}