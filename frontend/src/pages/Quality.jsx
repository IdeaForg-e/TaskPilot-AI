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
    setLoading(true);
    setError(null);
    try {
      const res = await getQualityReports();
      setReports(res.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  if (loading) return <LoadingSpinner label="Evaluating task structures..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadReports} />;

  // Calculate statistics
  const totalReports = reports.length;
  const poorReports = reports.filter((r) => (r.score || 0) < 50).length;
  const avgScore =
    totalReports > 0
      ? Math.round(reports.reduce((sum, r) => sum + (r.score || 0), 0) / totalReports)
      : 100;
  const passRate = totalReports > 0 ? Math.round(((totalReports - poorReports) / totalReports) * 100) : 100;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Quality Assurance</h2>
          <p className="text-xs text-slate-400 mt-0.5">Automated task parsing structure and attribute completeness verification</p>
        </div>
      </div>

      {/* Summary stats strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Avg Quality</span>
            <span className="text-sm font-bold text-slate-205">{avgScore}% Grade</span>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Pass Rate</span>
            <span className="text-sm font-bold text-slate-205">{passRate}% Complete</span>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Deficient Tasks</span>
            <span className="text-sm font-bold text-slate-205">{poorReports} Identified</span>
          </div>
        </div>
      </div>

      <QualityReport reports={reports} />
    </div>
  );
}