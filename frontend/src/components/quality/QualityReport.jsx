import { CircleAlert, CircleCheck, ClipboardList, HelpCircle } from 'lucide-react';
import QualityScore from './QualityScore';
import EmptyState from '../common/EmptyState';

export default function QualityReport({ reports = [] }) {
  if (reports.length === 0) {
    return <EmptyState message="No automated quality reports available yet." />;
  }

  const sorted = [...reports].sort((a, b) => (a.score || 0) - (b.score || 0));

  return (
    <div className="space-y-3">
      {sorted.map((report) => {
        const poor = (report.score || 0) < 50;
        return (
          <div
            key={report.task_id || report.id}
            className="glass-card glass-card-hover p-5 relative overflow-hidden"
            style={{
              borderLeft: `2px solid ${poor ? '#ef4444' : '#4caf8e'}`,
              background: poor ? 'rgba(239,68,68,0.02)' : 'rgba(76,175,142,0.02)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <h4 className="flex items-center gap-2.5 font-headline text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
                {poor
                  ? <CircleAlert className="h-4 w-4 animate-pulse shrink-0" style={{ color: '#ef4444' }} />
                  : <CircleCheck className="h-4 w-4 shrink-0" style={{ color: '#4caf8e' }} />
                }
                {report.task_title || `Task #${report.task_id || report.id}`}
              </h4>
              <span
                className="chip shrink-0 text-[0.5rem] py-0.5"
                style={
                  poor
                    ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '0.5px solid rgba(239,68,68,0.2)' }
                    : { background: 'rgba(76,175,142,0.1)', color: '#4caf8e', border: '0.5px solid rgba(76,175,142,0.2)' }
                }
              >
                {poor ? 'Deficient' : 'Passing'}
              </span>
            </div>

            {/* Quality score bar */}
            <div
              className="rounded-xl p-4 mb-4"
              style={{ background: 'rgba(0,0,0,0.15)', border: '0.5px solid rgba(255,255,255,0.05)' }}
            >
              <span className="label-caps block mb-2" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                Quality Grade
              </span>
              <QualityScore score={report.score || 0} />
            </div>

            {/* Missing fields */}
            {report.missing_fields?.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <ClipboardList className="h-3.5 w-3.5" style={{ color: 'var(--outline)' }} />
                  <span className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                    Deficiencies / Missing Attributes
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 ml-5">
                  {report.missing_fields.map((field) => (
                    <span
                      key={field}
                      className="chip text-[0.5rem] py-0"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '0.5px solid rgba(239,68,68,0.15)' }}
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Clarification questions */}
            {report.clarification_questions?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <HelpCircle className="h-3.5 w-3.5" style={{ color: 'var(--outline)' }} />
                  <span className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                    Suggested Refinements
                  </span>
                </div>
                <ul className="space-y-2 ml-5">
                  {report.clarification_questions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ background: 'var(--primary)' }}
                      />
                      <span className="font-body text-xs" style={{ color: 'var(--on-surface-variant)' }}>
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
