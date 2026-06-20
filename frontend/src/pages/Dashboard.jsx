import { useEffect, useState } from 'react';
import { ListTodo, EyeOff, ShieldCheck, ArrowUpNarrowWide } from 'lucide-react';
import { getTasks, getQualityReports, getRankedTasks } from '../services/api';
import StatsCard from '../components/dashboard/StatsCard';
import PipelineStatus from '../components/dashboard/PipelineStatus';
import RecentActivity from '../components/dashboard/RecentActivity';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function Dashboard() {
  const [tasks, setTasks] = useState(null);
  const [qualityReports, setQualityReports] = useState(null);
  const [rankedTasks, setRankedTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, qualityRes, rankedRes] = await Promise.all([
        getTasks(),
        getQualityReports(),
        getRankedTasks(),
      ]);
      setTasks(tasksRes.data || []);
      setQualityReports(qualityRes.data || []);
      setRankedTasks(rankedRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  const totalTasks = tasks?.length || 0;
  const hiddenTasks = tasks?.filter((t) => t.is_hidden || t.hidden).length || 0;
  const avgQuality =
    qualityReports?.length > 0
      ? Math.round(
          qualityReports.reduce((sum, r) => sum + (r.score || 0), 0) /
            qualityReports.length
        )
      : 0;
  const topPriority = rankedTasks?.[0]?.title || 'No tasks ranked';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Tasks" value={totalTasks} icon={ListTodo} accent="indigo" />
        <StatsCard
          label="Hidden / Extracted"
          value={hiddenTasks}
          icon={EyeOff}
          accent="amber"
        />
        <StatsCard
          label="Avg Quality Score"
          value={`${avgQuality}%`}
          icon={ShieldCheck}
          accent={avgQuality >= 50 ? 'emerald' : 'red'}
        />
        <StatsCard
          label="Top Priority Task"
          value={topPriority}
          icon={ArrowUpNarrowWide}
          accent="indigo"
        />
      </div>

      <PipelineStatus activeStage={0} />

      <RecentActivity tasks={tasks || []} />
    </div>
  );
}
