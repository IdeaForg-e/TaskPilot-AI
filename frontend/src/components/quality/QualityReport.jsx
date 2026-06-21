import { CircleAlert, CircleCheck, ClipboardList, HelpCircle } from 'lucide-react';
import QualityScore from './QualityScore';
import EmptyState from '../common/EmptyState';

export default function QualityReport({ reports = [] }) {
  if (reports.length === 0) {
    return <EmptyState message="No automated quality reports available yet." />;
  }

  const sorted = [...reports].sort((a, b) => (a.score || 0) - (b.score || 0));

  return (
    <div className="space-y-4">
      {sorted.map((report) => {
        const poor = (report.score || 0) < 50;
        return (
          <div
            key={report.task_id || report.id}
            className={`glass-card glass-card-hover border-l-4 p-5 shadow-lg ${
              poor
                ? 'border-l-red-500 bg-red-950/5'
                : 'border-l-emerald-500 bg-emerald-950/5'
            }`}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="flex items-center gap-2.5 text-sm font-bold text-slate-100">
                {poor ? (
                  <CircleAlert className="h-4.5 w-4.5 text-red-400 animate-pulse" />
                ) : (
                  <CircleCheck className="h-4.5 w-4.5 text-emerald-400" />
                )}
                {report.task_title || `Task #${report.task_id || report.id}`}
              </h4>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900/60">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">Quality Grade</span>
              <QualityScore score={report.score || 0} />
            </div>

            {report.missing_fields?.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <ClipboardList className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Deficiencies / Missing Attributes
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 ml-5">
                  {report.missing_fields.map((field) => (
                    <span
                      key={field}
                      className="rounded-lg border border-red-500/10 bg-red-500/5 px-2 py-0.5 text-[9px] font-bold text-red-300 uppercase tracking-wide shadow-sm"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {report.clarification_questions?.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-505" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Suggested Refinements / Clarifications
                  </span>
                </div>
                <ul className="list-none space-y-2 ml-5">
                  {report.clarification_questions.map((q, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <span>{q}</span>
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
