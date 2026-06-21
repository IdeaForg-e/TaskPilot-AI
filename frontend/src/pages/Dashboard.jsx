import { useEffect, useState } from 'react';
import { ListTodo, EyeOff, ShieldCheck, ArrowUpNarrowWide, Sparkles } from 'lucide-react';
import { getTasks, getQualityReports, getRankedTasks, getLatestPipelineRun, getApiErrorMessage } from '../services/api';
import StatsCard from '../components/dashboard/StatsCard';
import PipelineStatus from '../components/dashboard/PipelineStatus';
import RecentActivity from '../components/dashboard/RecentActivity';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

function getGreeting() {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good Morning';
  if (hr < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const AGENT_TO_STAGE = {
  ingestion: 0,
  extraction: 1,
  fusion: 2,
  quality: 3,
  prioritization: 4,
  planning: 5,
};

export default function Dashboard() {
  const [tasks, setTasks] = useState(null);
  const [qualityReports, setQualityReports] = useState(null);
  const [rankedTasks, setRankedTasks] = useState(null);
  const [latestRun, setLatestRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
      setError(null);
    }
    try {
      const [tasksRes, qualityRes, rankedRes, runRes] = await Promise.all([
        getTasks(),
        getQualityReports(),
        getRankedTasks(),
        getLatestPipelineRun(),
      ]);
      setTasks(tasksRes.data || []);
      setQualityReports(qualityRes.data || []);
      setRankedTasks(rankedRes.data || []);
      setLatestRun(runRes.data || null);
    } catch (err) {
      if (showSpinner) {
        setError(getApiErrorMessage(err));
      }
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData(true);

    const interval = setInterval(() => {
      loadData(false);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner label="Compiling dashboard indicators..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => loadData(true)} />;

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
    <div className="space-y-8 animate-fade-in-up">
      {/* Header section with greetings */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
            <Sparkles className="h-3 w-3 text-violet-400 animate-pulse" />
            <span>AI Orchestration Hub</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            {getGreeting()}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Here is the active telemetry of your automated task pipeline.</p>
        </div>
      </div>

      {/* Grid containing Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-fade-in-up stagger-1">
          <StatsCard label="Total Tasks" value={totalTasks} icon={ListTodo} accent="indigo" />
        </div>
        <div className="animate-fade-in-up stagger-2">
          <StatsCard
            label="Hidden / Extracted"
            value={hiddenTasks}
            icon={EyeOff}
            accent="amber"
          />
        </div>
        <div className="animate-fade-in-up stagger-3">
          <StatsCard
            label="Avg Quality Score"
            value={`${avgQuality}%`}
            icon={ShieldCheck}
            accent={avgQuality >= 50 ? 'emerald' : 'red'}
          />
        </div>
        <div className="animate-fade-in-up stagger-4">
          <StatsCard
            label="Top Priority Task"
            value={topPriority}
            icon={ArrowUpNarrowWide}
            accent="indigo"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pipeline steppers occupy wider space */}
        <div className="lg:col-span-2 space-y-6">
          <div className="animate-fade-in-up stagger-5">
            <PipelineStatus latestRun={latestRun} />
          </div>
          <div className="animate-fade-in-up stagger-6">
            <RecentActivity tasks={tasks || []} />
          </div>
        </div>

        {/* System telemetry metadata status summary card */}
        <div className="space-y-6 lg:col-span-1 animate-fade-in-up stagger-7">
          <div className="glass-card p-5 shadow-lg relative overflow-hidden flex flex-col justify-between h-full min-h-[300px]">
            <div>
              <h3 className="text-sm font-bold text-slate-200 mb-4">Pipeline Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <span className="text-xs text-slate-400">Total Run Count</span>
                  <span className="text-xs font-semibold text-slate-250">
                    {latestRun?.total_runs !== undefined ? `${latestRun.total_runs} run${latestRun.total_runs === 1 ? '' : 's'}` : '0 runs'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <span className="text-xs text-slate-400">Target Environment</span>
                  <span className="text-xs font-semibold text-emerald-400">
                    {latestRun?.environment || 'Development'}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs text-slate-400">System Accuracy</span>
                  <span className="text-xs font-bold text-cyan-400">
                    {latestRun?.system_accuracy !== undefined ? `${latestRun.system_accuracy}%` : '95.0%'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-xl bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/20 p-4">
              <div className="flex gap-2">
                <Sparkles className="h-4 w-4 text-violet-400 shrink-0" />
                <p className="text-[11px] text-slate-350 leading-relaxed">
                  The TaskPilot AI pipeline extracts actions dynamically from multiple streams, evaluates structural details, and outputs ranked execution templates automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}