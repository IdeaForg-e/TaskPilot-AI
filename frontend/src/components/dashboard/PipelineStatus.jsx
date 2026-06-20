import { Workflow, Check, Loader2, Hourglass, XCircle } from 'lucide-react';

const STAGES = [
  { name: 'Ingest', desc: 'Data Ingestion', key: 'ingestion' },
  { name: 'Extract', desc: 'Task Extraction', key: 'extraction' },
  { name: 'Fuse', desc: 'Context Fusion', key: 'fusion' },
  { name: 'Evaluate', desc: 'Quality Check', key: 'quality' },
  { name: 'Prioritize', desc: 'Task Priority', key: 'prioritization' },
  { name: 'Plan', desc: 'Daily Planning', key: 'planning' }
];

// If the pipeline was last started more than 2 minutes ago and is still "running",
// treat it as stale/idle — probably a server restart left a zombie record.
const STALE_THRESHOLD_MS = 2 * 60 * 1000;

export default function PipelineStatus({ latestRun }) {
  const runInfo = latestRun?.latest_run || null;
  
  // Compute effective status from the DB state
  let status = 'idle';
  let currentAgent = null;
  let completedAgents = [];

  if (runInfo) {
    const rawStatus = runInfo.status || 'idle';
    const rawAgent = runInfo.current_agent || null;
    const rawCompleted = runInfo.agents_completed || [];
    const startedAtStr = runInfo.started_at;
    const startedAt = startedAtStr ? new Date(startedAtStr.endsWith('Z') ? startedAtStr : startedAtStr + 'Z') : null;
    const now = new Date();
    const isStale = rawStatus === 'running' && startedAt && (now - startedAt > STALE_THRESHOLD_MS);

    if (isStale) {
      status = 'idle';
      currentAgent = null;
      completedAgents = rawCompleted; // Keep completed agents visible if any
    } else {
      status = rawStatus;
      currentAgent = rawAgent;
      completedAgents = rawCompleted;
    }
  }

  // When pipeline fully completes, all agents are done
  const allCompleted = status === 'completed' || (status === 'failed' && completedAgents.length > 0);

  let badgeText = "Pipeline Idle";
  let badgeColor = "text-slate-400 bg-slate-950/20 border border-slate-800/30";

  if (status === 'running') {
    const stageIdx = STAGES.findIndex(s => s.key === currentAgent);
    badgeText = `Active: Stage ${stageIdx !== -1 ? stageIdx + 1 : '-'}`;
    badgeColor = "text-cyan-400 bg-cyan-950/20 border border-cyan-800/30";
  } else if (status === 'completed') {
    badgeText = "Completed";
    badgeColor = "text-emerald-400 bg-emerald-950/20 border border-emerald-800/30";
  } else if (status === 'failed') {
    badgeText = "Failed";
    badgeColor = "text-red-400 bg-red-950/20 border border-red-800/30";
  }

  return (
    <div className="glass-card p-5 shadow-xl relative overflow-hidden">
      <div className="mb-4.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Workflow className="h-4.5 w-4.5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Pipeline Steps</h3>
            <p className="text-[10px] text-slate-500">Autonomous processing sequence status</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${badgeColor}`}>
          {badgeText}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STAGES.map((stage) => {
          // Determine this stage's state:
          const isCompleted = completedAgents.includes(stage.key);
          const isActive = status === 'running' && currentAgent === stage.key && !isCompleted;
          const isFailed = status === 'failed' && currentAgent === stage.key && !isCompleted;
          // Stages after the failed one that never ran
          const isSkipped = status === 'failed' && !isCompleted && !isFailed && !isActive;
          // Future stages not yet reached when still running
          const isPending = status === 'idle' || (status === 'running' && !isCompleted && !isActive);

          let cardStyle = "border-slate-900 bg-slate-950/40 text-slate-500";
          let icon = <Hourglass className="h-3.5 w-3.5 text-slate-650" />;
          let statusText = "Pending";

          if (isCompleted || (status === 'completed' && !isFailed)) {
            // Completed — show green checkmark
            cardStyle = "border-emerald-500/20 bg-emerald-500/5 text-slate-200 shadow-[0_0_8px_rgba(16,185,129,0.02)]";
            icon = <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[3]" />;
            statusText = "Completed";
          }

          if (isActive) {
            // Currently running — show spinning loader
            cardStyle = "border-violet-500/40 bg-violet-500/10 text-white shadow-[0_0_12px_rgba(139,92,246,0.08)] animate-pulse-glow";
            icon = <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />;
            statusText = "Active";
          }

          if (isFailed) {
            // Failed — show red X
            cardStyle = "border-red-500/40 bg-red-500/10 text-slate-200 shadow-[0_0_12px_rgba(239,68,68,0.08)] animate-pulse";
            icon = <XCircle className="h-3.5 w-3.5 text-red-400 stroke-[2.5]" />;
            statusText = "Failed";
          }

          if (isSkipped) {
            // Skipped due to earlier failure — show dimmed
            cardStyle = "border-slate-900 bg-slate-950/20 text-slate-600";
            icon = <Hourglass className="h-3.5 w-3.5 text-slate-700" />;
            statusText = "Skipped";
          }

          return (
            <div
              key={stage.key}
              className={`rounded-xl border p-3 flex flex-col justify-between min-h-[90px] transition-all duration-300 ${cardStyle}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {stage.name}
                </span>
                {icon}
              </div>
              
              <div className="mt-3">
                <p className="text-[11px] font-bold leading-tight truncate">
                  {stage.desc}
                </p>
                <span className={`text-[9px] font-semibold mt-1 block ${
                  isActive ? 'text-violet-400' : isFailed ? 'text-red-400' : isCompleted ? 'text-emerald-400' : 'text-slate-600'
                }`}>
                  {statusText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}