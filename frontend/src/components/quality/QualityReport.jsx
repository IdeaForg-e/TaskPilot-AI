import { CircleAlert, CircleCheck } from 'lucide-react';
import QualityScore from './QualityScore';
import EmptyState from '../common/EmptyState';

export default function QualityReport({ reports = [] }) {
  if (reports.length === 0) {
    return <EmptyState message="No quality reports available." />;
  }

  const sorted = [...reports].sort((a, b) => (a.score || 0) - (b.score || 0));

  return (
    <div className="space-y-3">
      {sorted.map((report) => {
        const poor = (report.score || 0) < 50;
        return (
          <div
            key={report.task_id || report.id}
            className={`rounded-xl border p-4 shadow-sm ${
              poor
                ? 'border-red-900/60 bg-red-950/20'
                : 'border-emerald-900/60 bg-emerald-950/10'
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="flex items-center gap-2 text-sm font-medium text-slate-100">
                {poor ? (
                  <CircleAlert className="h-4 w-4 text-red-400" />
                ) : (
                  <CircleCheck className="h-4 w-4 text-emerald-400" />
                )}
                {report.task_title || `Task #${report.task_id || report.id}`}
              </h4>
            </div>

            <QualityScore score={report.score || 0} />

            {report.missing_fields?.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-medium text-slate-400">
                  Missing fields
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {report.missing_fields.map((field) => (
                    <span
                      key={field}
                      className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-300"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {report.clarification_questions?.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-medium text-slate-400">
                  Clarification questions
                </p>
                <ul className="list-inside list-disc space-y-1 text-xs text-slate-400">
                  {report.clarification_questions.map((q, i) => (
                    <li key={i}>{q}</li>
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
