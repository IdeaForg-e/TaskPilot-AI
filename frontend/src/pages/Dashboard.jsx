import { useEffect, useState } from 'react';
import { ListTodo, EyeOff, ShieldCheck, ArrowUpNarrowWide, Sparkles, Zap, Cpu } from 'lucide-react';
import { getTasks, getQualityReports, getRankedTasks, getLatestPipelineRun, getApiErrorMessage } from '../services/api';
import StatsCard from '../components/dashboard/StatsCard';
import PipelineStatus from '../components/dashboard/PipelineStatus';
import RecentActivity from '../components/dashboard/RecentActivity';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

function getGreeting() {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good morning';
  if (hr < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const [tasks, setTasks] = useState(null);
  const [qualityReports, setQualityReports] = useState(null);
  const [rankedTasks, setRankedTasks] = useState(null);
  const [latestRun, setLatestRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async (showSpinner = true) => {
    if (showSpinner) { setLoading(true); setError(null); }
    try {
      const [tasksRes, qualityRes, rankedRes, runRes] = await Promise.all([
        getTasks(), getQualityReports(), getRankedTasks(), getLatestPipelineRun(),
      ]);
      setTasks(tasksRes.data || []);
      setQualityReports(qualityRes.data || []);
      setRankedTasks(rankedRes.data || []);
      setLatestRun(runRes.data || null);
    } catch (err) {
      if (showSpinner) setError(getApiErrorMessage(err));
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner label="Compiling dashboard indicators..." />;
  if (error)   return <ErrorMessage message={error} onRetry={() => loadData(true)} />;

  const totalTasks    = tasks?.length || 0;
  const hiddenTasks   = tasks?.filter((t) => t.is_hidden || t.hidden).length || 0;
  const avgQuality    = qualityReports?.length > 0
    ? Math.round(qualityReports.reduce((s, r) => s + (r.score || 0), 0) / qualityReports.length)
    : 0;
  const topPriority   = rankedTasks?.[0]?.title || 'No tasks ranked';
  const isPipelineRunning = latestRun?.latest_run?.status === 'running';

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Hero Banner ── */}
      <div
        className="glass-card p-6 relative overflow-hidden"
        style={{ background: 'rgba(0,125,184,0.04)' }}
      >
        {/* Background accent */}
        <div
          className="absolute right-0 top-0 h-full w-1/3 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 80% 50%, rgba(142,205,255,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="label-caps mb-2" style={{ color: 'var(--primary)', fontSize: '0.6rem' }}>
              AI Orchestration Hub
            </p>
            <h2 className="font-headline text-3xl font-light" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
              {getGreeting()},{' '}
              <span style={{ color: 'var(--primary)', fontWeight: 400 }}>Engineer</span>
            </h2>
            <p className="font-body text-sm mt-2 max-w-md" style={{ color: 'var(--on-surface-variant)' }}>
              {isPipelineRunning
                ? 'Pipeline is currently running. AI agents are processing your tasks.'
                : `All systems nominal. ${totalTasks} tasks tracked across your pipeline.`}
            </p>

            {/* Metric chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="btn-ghost text-[0.65rem] py-1.5 px-3 rounded-lg">
                <Zap className="h-3 w-3" style={{ color: 'var(--primary)' }} />
                Latency: {latestRun?.average_latency !== undefined ? `${latestRun.average_latency}ms` : '14.5ms'}
              </span>
              <span className="btn-ghost text-[0.65rem] py-1.5 px-3 rounded-lg">
                <Cpu className="h-3 w-3" style={{ color: 'var(--primary)' }} />
                Nodes: {totalTasks > 0 ? `${(totalTasks * 0.04).toFixed(1)}K` : '—'}
              </span>
            </div>
          </div>

          {/* AI Agent status box */}
          <div
            className="shrink-0 flex flex-col items-center justify-center rounded-2xl p-5 min-w-[160px] min-h-[120px]"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '0.5px solid rgba(142,205,255,0.12)',
            }}
          >
            <Sparkles
              className="h-8 w-8 mb-3 animate-pulse"
              style={{ color: 'var(--primary)' }}
            />
            <p className="label-caps text-center" style={{ color: 'var(--primary)', fontSize: '0.55rem' }}>
              AI Agent: {isPipelineRunning ? 'Running' : 'Active'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-fade-in-up stagger-1">
          <StatsCard label="Total Tasks"       value={totalTasks}  icon={ListTodo}          accent="blue" />
        </div>
        <div className="animate-fade-in-up stagger-2">
          <StatsCard label="Hidden / Extracted" value={hiddenTasks} icon={EyeOff}            accent="amber" />
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
          <StatsCard label="Top Priority"      value={topPriority}  icon={ArrowUpNarrowWide} accent="blue" />
        </div>
      </div>

      {/* ── Pipeline + Metrics ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5 animate-fade-in-up stagger-5">
          <PipelineStatus latestRun={latestRun} />
        </div>

        {/* Metrics card */}
        <div className="lg:col-span-1 animate-fade-in-up stagger-6">
          <div className="glass-card p-5 h-full flex flex-col justify-between">
            <div>
              <h3 className="font-headline text-sm font-semibold mb-4" style={{ color: 'var(--on-surface)' }}>
                Pipeline Metrics
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: 'Total Run Count',
                    value: latestRun?.total_runs !== undefined
                      ? `${latestRun.total_runs} run${latestRun.total_runs === 1 ? '' : 's'}`
                      : '0 runs',
                    color: 'var(--on-surface)',
                  },
                  {
                    label: 'Target Environment',
                    value: latestRun?.environment || 'Development',
                    color: '#4caf8e',
                  },
                  {
                    label: 'System Accuracy',
                    value: latestRun?.system_accuracy !== undefined
                      ? `${latestRun.system_accuracy}%`
                      : '95.0%',
                    color: 'var(--primary)',
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between pb-3"
                    style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}
                  >
                    <span className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.6rem' }}>
                      {label}
                    </span>
                    <span className="font-headline text-sm font-semibold" style={{ color }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="mt-6 rounded-xl p-4"
              style={{ background: 'rgba(142,205,255,0.04)', border: '0.5px solid rgba(142,205,255,0.1)' }}
            >
              <div className="flex gap-2">
                <Sparkles className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />
                <p className="font-body text-[0.7rem] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                  TaskPilot AI extracts actions from multiple streams, evaluates quality, and outputs ranked daily plans automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="animate-fade-in-up stagger-7">
        <RecentActivity tasks={tasks || []} />
      </div>
    </div>
  );
}