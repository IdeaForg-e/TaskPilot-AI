import { useEffect, useState } from 'react';
import { getRankedTasks } from '../services/api';
import PriorityList from '../components/priority/PriorityList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

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
      setError(err.message || 'Failed to load ranked tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  if (loading) return <LoadingSpinner label="Loading priority ranking..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadTasks} />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-100">Priority</h1>
      <PriorityList tasks={tasks} />
    </div>
  );
}
