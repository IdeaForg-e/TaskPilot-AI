import { Workflow, Check, Loader2, Hourglass, XCircle } from 'lucide-react';

const STAGES = [
  { name: 'INTAKE',       desc: 'Data Ingestion',  key: 'ingestion' },
  { name: 'VALIDATE',     desc: 'Task Extraction', key: 'extraction' },
  { name: 'PROCESS',      desc: 'Context Fusion',  key: 'fusion' },
  { name: 'ANALYSIS',     desc: 'Quality Check',   key: 'quality' },
  { name: 'PRIORITIZE',   desc: 'Task Priority',   key: 'prioritization' },
  { name: 'PLAN',         desc: 'Daily Planning',  key: 'planning' },
];

const STALE_THRESHOLD_MS = 5 * 60 * 1000;

export default function PipelineStatus({ latestRun }) {
  const runInfo = latestRun?.latest_run || null;

  let status = 'idle';
  let currentAgent = null;
  let completedAgents = [];

  if (runInfo) {
    const rawStatus = runInfo.status || 'idle';
    const rawAgent = runInfo.current_agent || null;
    const rawCompleted = runInfo.agents_completed || [];
    const startedAtStr = runInfo.started_at;
    const startedAt = startedAtStr
      ? new Date(startedAtStr.endsWith('Z') ? startedAtStr : startedAtStr + 'Z')
      : null;
    const now = new Date();
    const isStale = rawStatus === 'running' && startedAt && (now - startedAt > STALE_THRESHOLD_MS);

    if (isStale) {
      status = 'idle'; currentAgent = null; completedAgents = rawCompleted;
    } else {
      status = rawStatus; currentAgent = rawAgent; completedAgents = rawCompleted;
    }
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="glass-card p-5 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'rgba(142,205,255,0.1)', border: '0.5px solid rgba(142,205,255,0.15)' }}
          >
            <Workflow className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h3 className="font-headline text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
              Workflow Pipeline Status
            </h3>
            <p className="label-caps mt-0.5" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
              Autonomous processing sequence
            </p>
          </div>
        </div>
        <span
          className="label-caps text-[0.55rem] px-2 py-1 rounded-lg"
          style={{ color: 'var(--primary)', background: 'rgba(142,205,255,0.08)', border: '0.5px solid rgba(142,205,255,0.12)' }}
        >
          Live Refresh: 4s
        </span>
      </div>

      {/* Running banner */}
      {status === 'running' && currentAgent && (
        <div
          className="mb-5 rounded-xl p-3 flex items-center gap-2.5 animate-pulse-glow"
          style={{ background: 'rgba(142,205,255,0.06)', border: '0.5px solid rgba(142,205,255,0.15)' }}
        >
          <Loader2 className="h-4 w-4 animate-spin shrink-0" style={{ color: 'var(--primary)' }} />
          <p className="font-body text-xs font-semibold" style={{ color: 'var(--primary)' }}>
            Running: <span style={{ color: 'var(--on-surface)' }} className="capitalize">
              {currentAgent.replace('_', ' ')} Agent
            </span>
          </p>
        </div>
      )}

      {/* Horizontal stepper */}
      <div className="relative flex items-start justify-between">
        {/* Connecting line behind the nodes */}
        <div
          className="absolute top-[18px] left-0 right-0 h-px"
          style={{ background: 'rgba(255,255,255,0.06)', zIndex: 0 }}
        />

        {STAGES.map((stage, idx) => {
          const isCompleted = completedAgents.includes(stage.key) || status === 'completed';
          const isActive = status === 'running' && currentAgent === stage.key && !isCompleted;
          const isFailed = status === 'failed' && currentAgent === stage.key && !isCompleted;

          let nodeStyle = {};
          let nodeContent = <Hourglass className="h-3.5 w-3.5" style={{ color: 'var(--outline)' }} />;
          let labelColor = 'var(--outline)';
          let subText = 'Pending';
          let subColor = 'var(--outline)';

          if (isCompleted) {
            nodeStyle = { background: 'rgba(76,175,142,0.15)', border: '1.5px solid rgba(76,175,142,0.6)' };
            nodeContent = <Check className="h-3.5 w-3.5 stroke-[2.5]" style={{ color: '#4caf8e' }} />;
            labelColor = 'var(--on-surface-variant)';
            subText = timeStr;
            subColor = 'var(--outline)';
          }
          if (isActive) {
            nodeStyle = { background: 'rgba(142,205,255,0.15)', border: '1.5px solid var(--primary)', boxShadow: '0 0 12px rgba(142,205,255,0.25)' };
            nodeContent = <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: 'var(--primary)' }} />;
            labelColor = 'var(--primary)';
            subText = 'Running...';
            subColor = 'var(--primary)';
          }
          if (isFailed) {
            nodeStyle = { background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.5)' };
            nodeContent = <XCircle className="h-3.5 w-3.5" style={{ color: '#ef4444' }} />;
            labelColor = '#ef4444';
            subText = 'Failed';
            subColor = '#ef4444';
          }

          return (
            <div key={stage.key} className="flex flex-col items-center gap-2 flex-1 relative" style={{ zIndex: 1 }}>
              {/* Node */}
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300"
                style={{
                  background: nodeStyle.background || 'rgba(255,255,255,0.03)',
                  border: nodeStyle.border || '1.5px solid rgba(255,255,255,0.08)',
                  boxShadow: nodeStyle.boxShadow,
                }}
              >
                {nodeContent}
              </div>
              {/* Label */}
              <div className="text-center">
                <p
                  className="label-caps"
                  style={{ color: labelColor, fontSize: '0.55rem', letterSpacing: '0.06em' }}
                >
                  {stage.name}
                </p>
                <p
                  className="font-body mt-0.5"
                  style={{ color: subColor, fontSize: '0.55rem', opacity: 0.8 }}
                >
                  {subText}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}