import { CircleAlert, CircleCheck, ClipboardList, HelpCircle } from 'lucide-react';
import QualityScore from './QualityScore';
import EmptyState from '../common/EmptyState';

export default function QualityReport({ reports = [] }) {
  if (reports.length === 0) {
    return <EmptyState message="No automated quality reports available yet." />;
  }

  const sorted = [...reports].sort((a, b) => (a.score || 0) - (b.score || 0));

  return (
    <div className="space-y-3.5">
      {sorted.map((report) => {
        const poor = (report.score || 0) < 50;
        return (
          <div
            key={report.task_id || report.id}
            className={`cockpit-card p-4.5 bg-[#0f172a] border transition-all duration-150 ${
              poor
                ? 'border-l-4 border-l-rose-500 border-[#1e293b]'
                : 'border-l-4 border-l-emerald-500 border-[#1e293b]'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2.5">
                {poor ? (
                  <CircleAlert className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                ) : (
                  <CircleCheck className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-semibold text-white leading-snug">
                    {report.task_title || `Task #${report.task_id || report.id}`}
                  </h4>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                    ID: {report.task_id || report.id}
                  </span>
                </div>
              </div>

              <span
                className={`inline-flex items-center px-2 py-0.2 rounded text-[9px] font-mono tracking-wider uppercase font-semibold shrink-0 ${
                  poor
                    ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                    : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                }`}
              >
                {poor ? 'DEFICIENT' : 'PASSING'}
              </span>
            </div>

            {/* Quality score bar */}
            <div className="rounded p-3 mb-3 bg-[#090d16] border border-[#1e293b]">
              <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-medium block mb-1.5">
                SCHEMA INTEGRITY SCORE
              </span>
              <QualityScore score={report.score || 0} />
            </div>

            {/* Missing fields */}
            {report.missing_fields?.length > 0 && (
              <div className="mb-3 pl-0.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <ClipboardList className="h-3 w-3 text-rose-400" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                    MISSING ATTRIBUTES / OMISSIONS
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 ml-4">
                  {report.missing_fields.map((field) => (
                    <span
                      key={field}
                      className="px-1.5 py-0.2 rounded text-[9px] font-mono tracking-wider uppercase font-semibold bg-rose-950/40 text-rose-400 border border-rose-800/30"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Clarification questions */}
            {report.clarification_questions?.length > 0 && (
              <div className="pl-0.5 pt-0.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <HelpCircle className="h-3 w-3 text-cyan-400" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                    COPILOT REFINEMENT PROMPTS
                  </span>
                </div>
                <ul className="space-y-1 ml-4">
                  {report.clarification_questions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1 w-1 rounded-full mt-1.5 shrink-0 bg-cyan-400" />
                      <span className="text-[11px] text-slate-300 leading-relaxed">
                        {q}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
