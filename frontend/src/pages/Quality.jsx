import { useEffect, useState, useMemo } from 'react';
import { getQualityReports, getApiErrorMessage } from '../services/api';
import QualityReport from '../components/quality/QualityReport';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { ShieldCheck, HeartPulse, Activity, Search, Sparkles } from 'lucide-react';

export default function Quality() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | deficient | passing

  const loadReports = async () => {
    setLoading(true); setError(null);
    try { const res = await getQualityReports(); setReports(res.data || []); }
    catch (err) { setError(getApiErrorMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadReports(); }, []);

  const totalReports  = reports.length;
  const poorReports   = reports.filter((r) => (r.score || 0) < 50).length;
  const avgScore      = totalReports > 0
    ? Math.round(reports.reduce((s, r) => s + (r.score || 0), 0) / totalReports)
    : 100;
  const passRate = totalReports > 0
    ? Math.round(((totalReports - poorReports) / totalReports) * 100)
    : 100;

  // Segment counts
  const excellentCount = reports.filter(r => (r.score || 0) >= 80).length;
  const goodCount = reports.filter(r => (r.score || 0) >= 50 && (r.score || 0) < 80).length;
  const poorCount = reports.filter(r => (r.score || 0) < 50).length;

  const total = totalReports || 1;
  const pctExcellent = Math.round((excellentCount / total) * 100);
  const pctGood = Math.round((goodCount / total) * 100);
  const pctPoor = Math.round((poorCount / total) * 100);

  // SVG Gauge calculations
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avgScore / 100) * circumference;

  // Filters logic
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleMatch = (r.task_title || '').toLowerCase().includes(query);
        const idMatch = (r.task_id || '').toString().includes(query);
        if (!titleMatch && !idMatch) return false;
      }
      if (statusFilter === 'deficient' && (r.score || 0) >= 50) return false;
      if (statusFilter === 'passing' && (r.score || 0) < 50) return false;

      return true;
    });
  }, [reports, searchQuery, statusFilter]);

  if (loading) return <LoadingSpinner label="Evaluating task structures..." />;
  if (error)   return <ErrorMessage message={error} onRetry={loadReports} />;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,210,255,0.8)]" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-400 font-semibold">
              QA_ENGINE // AUDIT_GATE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Quality Assurance
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Automated schema validation, missing attribute detection, and prompt clarification audit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono tracking-wider uppercase font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40">
            <Sparkles className="h-3 w-3 animate-pulse text-cyan-400" />
            AUDITOR ACTIVE
          </span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 items-start">
        
        {/* Left Side: Search, Filter Tabs and Reports list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls Bar */}
          <div className="cockpit-card p-3 flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0f172a] border border-[#1e293b]">
            {/* Search Box */}
            <div className="flex w-full sm:max-w-xs items-center gap-2 rounded px-3 py-1.5 bg-[#090d16] border border-[#1e293b] focus-within:border-cyan-400">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit reports by title or ID..."
                className="w-full bg-transparent border-0 outline-none text-xs text-slate-200 placeholder:text-slate-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-[#090d16] p-0.5 rounded border border-[#1e293b] gap-1 shrink-0">
              {[
                { id: 'all', label: 'All Reports' },
                { id: 'deficient', label: 'Deficient' },
                { id: 'passing', label: 'Passing' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setStatusFilter(t.id)}
                  className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold rounded transition-all cursor-pointer ${
                    statusFilter === t.id 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,210,255,0.2)]' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Content List */}
          <div>
            <QualityReport reports={filteredReports} />
          </div>
        </div>

        {/* Right Side: Charts & Analysis Metrics */}
        <div className="lg:col-span-1 space-y-4">
          {/* Circular SVG Gauge Card */}
          {totalReports > 0 && (
            <div className="cockpit-card p-5 flex flex-col items-center justify-center text-center bg-[#0f172a] border border-[#1e293b] shadow-xl relative overflow-hidden">
              <span className="font-mono text-[10px] tracking-wider uppercase text-slate-400 font-semibold mb-3 block">
                COMPREHENSIVE QUALITY INDEX
              </span>
              
              <div className="relative h-32 w-32 flex items-center justify-center mb-3">
                <svg className="h-full w-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-[#1e293b]"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="transition-all duration-700 ease-out"
                    stroke={avgScore >= 50 ? '#00d2ff' : '#ef4444'}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{
                      filter: avgScore >= 50 ? 'drop-shadow(0 0 6px rgba(0,210,255,0.6))' : 'drop-shadow(0 0 6px rgba(239,68,68,0.6))'
                    }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-white font-mono tabular-nums">
                    {avgScore}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                    PTS / 100
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                Aggregate quality score synthesized across completeness of criteria, scope definitions, and context linkages.
              </p>
            </div>
          )}

          {/* Stats Breakdown cards */}
          <div className="grid grid-cols-1 gap-2.5">
            {[
              { label: 'Pass Rate', value: `${passRate}% Complete`, icon: HeartPulse, color: '#34d399', bg: 'rgba(16,185,129,0.08)' },
              { label: 'Deficient Tasks', value: `${poorReports} Identified`, icon: Activity, color: '#fbbf24', bg: 'rgba(245,158,11,0.08)' },
              { label: 'Total Audited', value: `${totalReports} Reports`, icon: ShieldCheck, color: '#38bdf8', bg: 'rgba(0,210,255,0.08)' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="cockpit-card p-3 flex items-center gap-3 bg-[#0f172a] border border-[#1e293b]"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
                  style={{ background: bg }}
                >
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div>
                  <span className="font-mono text-[9px] tracking-wider uppercase text-slate-400 font-medium block">
                    {label}
                  </span>
                  <span className="text-xs font-semibold text-slate-100 font-mono tabular-nums">
                    {value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Completeness Distribution Bar Card */}
          {totalReports > 0 && (
            <div className="cockpit-card p-4 bg-[#0f172a] border border-[#1e293b]">
              <span className="font-mono text-[10px] tracking-wider uppercase text-slate-400 font-semibold mb-2.5 block">
                COMPLETENESS SPECTRUM
              </span>
              <div className="h-2 w-full rounded-full flex overflow-hidden bg-[#090d16] border border-[#1e293b] mb-3">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pctExcellent}%` }} title={`Excellent: ${pctExcellent}%`} />
                <div className="h-full bg-cyan-400 transition-all" style={{ width: `${pctGood}%` }} title={`Good: ${pctGood}%`} />
                <div className="h-full bg-rose-500 transition-all" style={{ width: `${pctPoor}%` }} title={`Critical: ${pctPoor}%`} />
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'Optimal (>=80%)', count: excellentCount, pct: pctExcellent, dot: '#10b981' },
                  { label: 'Adequate (50-79%)', count: goodCount, pct: pctGood, dot: '#00d2ff' },
                  { label: 'Deficient (<50%)', count: poorCount, pct: pctPoor, dot: '#ef4444' }
                ].map(l => (
                  <div key={l.label} className="flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.dot }} />
                      <span>{l.label}</span>
                    </div>
                    <span className="font-semibold text-slate-200 tabular-nums">
                      {l.count} ({l.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}