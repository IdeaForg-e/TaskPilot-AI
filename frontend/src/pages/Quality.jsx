import { useEffect, useState } from 'react';
import { getQualityReports, getApiErrorMessage } from '../services/api';
import QualityReport from '../components/quality/QualityReport';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { ShieldCheck, HeartPulse, Activity } from 'lucide-react';

export default function Quality() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReports = async () => {
    setLoading(true); setError(null);
    try { const res = await getQualityReports(); setReports(res.data || []); }
    catch (err) { setError(getApiErrorMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadReports(); }, []);

  if (loading) return <LoadingSpinner label="Evaluating task structures..." />;
  if (error)   return <ErrorMessage message={error} onRetry={loadReports} />;

  const totalReports  = reports.length;
  const poorReports   = reports.filter((r) => (r.score || 0) < 50).length;
  const avgScore      = totalReports > 0
    ? Math.round(reports.reduce((s, r) => s + (r.score || 0), 0) / totalReports)
    : 100;
  const passRate = totalReports > 0
    ? Math.round(((totalReports - poorReports) / totalReports) * 100)
    : 100;

  const stats = [
    { label: 'Avg Quality',     value: `${avgScore}% Grade`,       icon: ShieldCheck, color: '#8ecdff', bg: 'rgba(142,205,255,0.1)',  border: 'rgba(142,205,255,0.15)' },
    { label: 'Pass Rate',       value: `${passRate}% Complete`,    icon: HeartPulse,  color: '#4caf8e', bg: 'rgba(76,175,142,0.1)',   border: 'rgba(76,175,142,0.15)' },
    { label: 'Deficient Tasks', value: `${poorReports} Identified`, icon: Activity,   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.15)' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="font-headline text-3xl font-light" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
          Quality Assurance
        </h2>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
          Automated task parsing structure and attribute completeness verification
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 animate-fade-in-up stagger-1">
        {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: bg, border: `0.5px solid ${border}` }}
            >
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <span className="label-caps block mb-1" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                {label}
              </span>
              <span className="font-headline text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Avg score bar */}
      {totalReports > 0 && (
        <div
          className="glass-card p-4 animate-fade-in-up stagger-2"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
              Overall Quality Score
            </span>
            <span className="font-headline text-xl font-semibold" style={{ color: 'var(--on-surface)' }}>
              {avgScore}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${avgScore}%`,
                background: avgScore >= 50
                  ? 'linear-gradient(90deg, var(--primary), #4caf8e)'
                  : 'linear-gradient(90deg, #ef4444, #f97316)',
                transition: 'width 1s ease',
              }}
            />
          </div>
        </div>
      )}

      <div className="animate-fade-in-up stagger-3">
        <QualityReport reports={reports} />
      </div>
    </div>
  );
}