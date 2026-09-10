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
    <div
      className="glass-card p-6 shadow-2xl relative overflow-hidden"
      style={{
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.6)',
      }}
    >
      {/* Background glow behind active stage */}
      <div
        className="absolute -left-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #8ecdff, transparent)' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: 'rgba(142,205,255,0.08)',
              border: '0.5px solid rgba(142,205,255,0.2)',
            }}
          >
            <Workflow className="h-4.5 w-4.5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-headline text-sm font-semibold text-slate-100 tracking-tight">
              Autonomous Pipeline Stepper
            </h3>
            <p className="font-mono text-[10px] text-slate-400 tracking-wider uppercase mt-0.5">
              Multi-Agent Orchestration Sequence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Polling: 4s
          </span>
        </div>
      </div>

      {/* Running banner */}
      {status === 'running' && currentAgent && (
        <div
          className="mb-6 rounded-2xl p-3.5 flex items-center justify-between animate-pulse-glow"
          style={{
            background: 'rgba(142,205,255,0.06)',
            border: '0.5px solid rgba(142,205,255,0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
            <div>
              <p className="font-mono text-xs font-semibold text-cyan-300">
                ACTIVE AGENT EXECUTING:
              </p>
              <p className="font-headline text-xs font-semibold text-slate-100 capitalize">
                {currentAgent.replace('_', ' ')} Agent
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/80 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
            Processing
          </span>
        </div>
      )}

      {/* Horizontal stepper */}
      <div className="relative flex items-start justify-between pt-2 pb-1">
        {/* Connecting track behind nodes */}
        <div
          className="absolute top-[22px] left-6 right-6 h-[2px]"
          style={{
            background: 'rgba(255,255,255,0.06)',
            zIndex: 0,
          }}
        />

        {STAGES.map((stage, idx) => {
          const isCompleted = completedAgents.includes(stage.key) || status === 'completed';
          const isActive = status === 'running' && currentAgent === stage.key && !isCompleted;
          const isFailed = status === 'failed' && currentAgent === stage.key && !isCompleted;

          let nodeClasses = 'bg-white/3 border-white/10 text-slate-500';
          let nodeContent = <Hourglass className="h-3.5 w-3.5 opacity-60" />;
          let labelColor = 'text-slate-500';
          let subText = 'Pending';
          let subColor = 'text-slate-600';

          if (isCompleted) {
            nodeClasses = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_14px_rgba(76,175,142,0.2)]';
            nodeContent = <Check className="h-3.5 w-3.5 stroke-[2.5]" />;
            labelColor = 'text-slate-200';
            subText = 'Completed';
            subColor = 'text-emerald-400/80';
          }
          if (isActive) {
            nodeClasses = 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_18px_rgba(142,205,255,0.4)] animate-pulse';
            nodeContent = <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />;
            labelColor = 'text-cyan-400';
            subText = 'Running...';
            subColor = 'text-cyan-400';
          }
          if (isFailed) {
            nodeClasses = 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_18px_rgba(239,68,68,0.4)]';
            nodeContent = <XCircle className="h-3.5 w-3.5" />;
            labelColor = 'text-rose-400';
            subText = 'Failed';
            subColor = 'text-rose-400';
          }

          return (
            <div
              key={stage.key}
              className="flex flex-col items-center gap-2.5 flex-1 relative"
              style={{ zIndex: 1 }}
            >
              {/* Node Circle */}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-300 ${nodeClasses}`}
              >
                {nodeContent}
              </div>

              {/* Label & Description */}
              <div className="text-center px-1">
                <p
                  className={`font-mono text-[10px] tracking-wider uppercase font-semibold ${labelColor}`}
                >
                  {stage.name}
                </p>
                <p
                  className={`font-body text-[10px] mt-0.5 tracking-tight ${subColor}`}
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