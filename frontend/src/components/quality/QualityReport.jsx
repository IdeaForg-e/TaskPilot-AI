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
            className={`glass-card p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
              poor
                ? 'border-l-4 border-l-rose-500'
                : 'border-l-4 border-l-[#2e7d55]'
            }`}
            style={{
              boxShadow: '0 4px 16px -4px rgba(44,51,43,0.08)',
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-2.5">
                {poor ? (
                  <CircleAlert className="h-4.5 w-4.5 text-rose-400 mt-0.5 animate-pulse shrink-0" />
                ) : (
                  <CircleCheck className="h-4.5 w-4.5 text-emerald-400 mt-0.5 shrink-0" />
                )}
                <div>
                  <h4 className="font-headline text-sm font-semibold text-[#2c332b] leading-snug">
                    {report.task_title || `Task #${report.task_id || report.id}`}
                  </h4>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#788275]">
                    ID: {report.task_id || report.id}
                  </span>
                </div>
              </div>

              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider uppercase font-semibold shrink-0 ${
                  poor
                    ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                    : 'bg-[#2e7d55]/10 text-[#2e7d55] border border-[#2e7d55]/30'
                }`}
              >
                {poor ? 'DEFICIENT' : 'PASSING'}
              </span>
            </div>

            {/* Quality score bar */}
            <div
              className="rounded-2xl p-4 mb-4"
              style={{
                background: '#efeee9',
                border: '1px solid #dad7cb',
              }}
            >
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#788275] font-semibold block mb-2">
                SCHEMA INTEGRITY SCORE
              </span>
              <QualityScore score={report.score || 0} />
            </div>

            {/* Missing fields */}
            {report.missing_fields?.length > 0 && (
              <div className="mb-4 pl-1">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="h-3.5 w-3.5 text-rose-500" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#788275] font-semibold">
                    MISSING ATTRIBUTES / OMISSIONS
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 ml-5">
                  {report.missing_fields.map((field) => (
                    <span
                      key={field}
                      className="px-2 py-0.5 rounded-md text-[9px] font-mono tracking-wider uppercase font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/25"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Clarification questions */}
            {report.clarification_questions?.length > 0 && (
              <div className="pl-1 pt-1">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="h-3.5 w-3.5 text-[#0284c7]" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#788275] font-semibold">
                    COPILOT REFINEMENT PROMPTS
                  </span>
                </div>
                <ul className="space-y-1.5 ml-5">
                  {report.clarification_questions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 bg-[#0284c7]" />
                      <span className="font-body text-xs text-[#525d50] leading-relaxed">
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
