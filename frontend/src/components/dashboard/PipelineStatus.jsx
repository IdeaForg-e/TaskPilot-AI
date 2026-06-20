import { Workflow } from 'lucide-react';

const STAGES = ['Ingest', 'Extract', 'Fuse', 'Evaluate', 'Prioritize', 'Plan'];

export default function PipelineStatus({ activeStage = 0 }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Workflow className="h-4 w-4 text-indigo-400" />
        <h3 className="text-sm font-medium text-slate-200">Pipeline Status</h3>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {STAGES.map((stage, i) => (
          <div key={stage} className="flex items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                i < activeStage
                  ? 'border-emerald-700 bg-emerald-500/10 text-emerald-400'
                  : i === activeStage
                  ? 'border-indigo-600 bg-indigo-500/10 text-indigo-400'
                  : 'border-slate-800 bg-slate-950 text-slate-500'
              }`}
            >
              {stage}
            </span>
            {i < STAGES.length - 1 && (
              <span className="h-px w-4 bg-slate-800 sm:w-6" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
