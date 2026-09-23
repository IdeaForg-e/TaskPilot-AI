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

  return (
    <div className="cockpit-card p-5 bg-[#0f172a] border border-[#1e293b] shadow-xl relative overflow-hidden">
      {/* Background glow behind active stage */}
      <div
        className="absolute -left-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #00d2ff, transparent)' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1e293b]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
            <Workflow className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white tracking-wide uppercase font-mono">
              Autonomous Pipeline Stepper
            </h3>
            <p className="font-mono text-[9px] text-slate-400 tracking-wider uppercase mt-0.5">
              Multi-Agent Orchestration Sequence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Polling: 4s
          </span>
        </div>
      </div>

      {/* Running banner */}
      {status === 'running' && currentAgent && (
        <div className="mb-5 rounded p-3 flex items-center justify-between bg-cyan-950/40 border border-cyan-500/30 animate-pulse">
          <div className="flex items-center gap-2.5">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
            <div>
              <p className="font-mono text-[10px] uppercase text-cyan-400 font-semibold">
                ACTIVE AGENT EXECUTING:
              </p>
              <p className="text-xs font-semibold text-white capitalize">
                {currentAgent.replace('_', ' ')} Agent
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-300 px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-700/50">
            Processing
          </span>
        </div>
      )}

      {/* Horizontal Stepper Grid */}
      <div className="relative flex items-start justify-between pt-2 pb-1">
        {/* Connecting track */}
        <div
          className="absolute top-[18px] left-6 right-6 h-[1.5px] bg-[#1e293b]"
          style={{ zIndex: 0 }}
        />

        {STAGES.map((stage) => {
          const isCompleted = completedAgents.includes(stage.key) || status === 'completed';
          const isActive = status === 'running' && currentAgent === stage.key && !isCompleted;
          const isFailed = status === 'failed' && currentAgent === stage.key && !isCompleted;

          let nodeClasses = 'bg-[#0d121d] border-[#1e293b] text-slate-500';
          let nodeContent = <Hourglass className="h-3 w-3 opacity-60" />;
          let labelColor = 'text-slate-400';
          let subText = 'Pending';
          let subColor = 'text-slate-500';

          if (isCompleted) {
            nodeClasses = 'bg-emerald-950/50 border-emerald-500/60 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
            nodeContent = <Check className="h-3 w-3 stroke-[2.5]" />;
            labelColor = 'text-slate-200';
            subText = 'Completed';
            subColor = 'text-emerald-400';
          }
          if (isActive) {
            nodeClasses = 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-[0_0_14px_rgba(0,210,255,0.4)] animate-pulse';
            nodeContent = <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" />;
            labelColor = 'text-cyan-400';
            subText = 'Running...';
            subColor = 'text-cyan-400';
          }
          if (isFailed) {
            nodeClasses = 'bg-rose-950/50 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]';
            nodeContent = <XCircle className="h-3 w-3" />;
            labelColor = 'text-rose-400';
            subText = 'Failed';
            subColor = 'text-rose-400';
          }

          return (
            <div
              key={stage.key}
              className="flex flex-col items-center gap-2 flex-1 relative z-10"
            >
              {/* Node Circle */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-md border transition-all duration-200 ${nodeClasses}`}
              >
                {nodeContent}
              </div>

              {/* Label & Description */}
              <div className="text-center px-0.5">
                <p className={`font-mono text-[10px] tracking-wider uppercase font-semibold ${labelColor}`}>
                  {stage.name}
                </p>
                <p className={`font-mono text-[9px] mt-0.5 tracking-tight ${subColor}`}>
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