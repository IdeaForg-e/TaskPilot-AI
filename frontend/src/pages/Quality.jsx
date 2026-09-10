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
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avgScore / 100) * circumference;

  // Filters logic
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // 1. Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleMatch = (r.task_title || '').toLowerCase().includes(query);
        const idMatch = (r.task_id || '').toString().includes(query);
        if (!titleMatch && !idMatch) return false;
      }
      // 2. Status Filter
      if (statusFilter === 'deficient' && (r.score || 0) >= 50) return false;
      if (statusFilter === 'passing' && (r.score || 0) < 50) return false;

      return true;
    });
  }, [reports, searchQuery, statusFilter]);

  if (loading) return <LoadingSpinner label="Evaluating task structures..." />;
  if (error)   return <ErrorMessage message={error} onRetry={loadReports} />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-400 font-semibold">
              QA_ENGINE // AUDIT_GATE
            </span>
          </div>
          <h2 className="font-headline text-3xl font-light text-slate-100 tracking-tight">
            Quality Assurance
          </h2>
          <p className="font-body text-xs text-slate-400 mt-1 max-w-lg">
            Automated schema validation, missing attribute detection, and prompt clarification audit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_12px_rgba(142,205,255,0.15)]">
            <Sparkles className="h-3 w-3 animate-pulse text-cyan-400" />
            AUDITOR ACTIVE
          </span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        
        {/* Left Side: Search, Filter Tabs and Reports list */}
        <div className="lg:col-span-2 space-y-5">
          {/* Controls Bar */}
          <div className="glass-card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xl">
            {/* Search Box */}
            <div
              className="flex w-full sm:max-w-xs items-center gap-2.5 rounded-xl px-3.5 py-1.5 transition-all focus-within:border-cyan-400/40 focus-within:ring-1 focus-within:ring-cyan-400/20"
              style={{
                background: 'rgba(15,20,30,0.6)',
                border: '0.5px solid rgba(255,255,255,0.08)',
              }}
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit reports by title or ID..."
                className="w-full bg-transparent border-0 outline-none text-xs font-body text-slate-200 placeholder:text-slate-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/8 gap-1 shrink-0">
              {[
                { id: 'all', label: 'All Reports' },
                { id: 'deficient', label: 'Deficient' },
                { id: 'passing', label: 'Passing' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setStatusFilter(t.id)}
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-lg transition-all cursor-pointer ${
                    statusFilter === t.id 
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(142,205,255,0.2)]' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Content List */}
          <div className="animate-fade-in-up stagger-3">
            <QualityReport reports={filteredReports} />
          </div>
        </div>

        {/* Right Side: Charts & Analysis Metrics */}
        <div className="lg:col-span-1 space-y-5">
          {/* Circular SVG Gauge Card */}
          {totalReports > 0 && (
            <div
              className="glass-card p-6 flex flex-col items-center justify-center text-center animate-fade-in-up stagger-1 shadow-2xl relative overflow-hidden"
              style={{ boxShadow: '0 20px 40px -15px rgba(0,0,0,0.6)' }}
            >
              <span className="font-mono text-[10px] tracking-wider uppercase text-slate-400 font-semibold mb-4 block">
                COMPREHENSIVE QUALITY INDEX
              </span>
              
              <div className="relative h-36 w-36 flex items-center justify-center mb-4">
                {/* SVG circular progress ring */}
                <svg className="h-full w-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    className="stroke-white/5"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    className="transition-all duration-1000 ease-out"
                    stroke={avgScore >= 50 ? '#8ecdff' : '#ef4444'}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{
                      filter: avgScore >= 50 ? 'drop-shadow(0 0 8px rgba(142,205,255,0.4))' : 'drop-shadow(0 0 8px rgba(239,68,68,0.4))'
                    }}
                  />
                </svg>
                {/* Score text inside ring */}
                <div className="absolute flex flex-col items-center">
                  <span className="font-headline text-3xl font-extrabold text-white tabular-nums">
                    {avgScore}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                    PTS / 100
                  </span>
                </div>
              </div>

              <p className="font-body text-xs text-slate-400 leading-relaxed max-w-xs">
                Aggregate quality score synthesized across completeness of criteria, scope definitions, and context linkages.
              </p>
            </div>
          )}

          {/* Stats Breakdown cards */}
          <div className="grid grid-cols-1 gap-3.5 animate-fade-in-up stagger-2">
            {[
              { label: 'Pass Rate', value: `${passRate}% Complete`, icon: HeartPulse, color: '#4caf8e', bg: 'rgba(76,175,142,0.08)', border: 'rgba(76,175,142,0.2)' },
              { label: 'Deficient Tasks', value: `${poorReports} Identified`, icon: Activity, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
              { label: 'Total Audited', value: `${totalReports} Reports`, icon: ShieldCheck, color: '#8ecdff', bg: 'rgba(142,205,255,0.08)', border: 'rgba(142,205,255,0.2)' },
            ].map(({ label, value, icon: Icon, color, bg, border }) => (
              <div
                key={label}
                className="glass-card p-4 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: bg, border: `0.5px solid ${border}` }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <div>
                  <span className="font-mono text-[9px] tracking-wider uppercase text-slate-400 font-semibold block mb-0.5">
                    {label}
                  </span>
                  <span className="font-headline text-sm font-semibold text-slate-100 tabular-nums">
                    {value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Completeness Distribution Bar Card */}
          {totalReports > 0 && (
            <div className="glass-card p-5 animate-fade-in-up stagger-4 shadow-xl">
              <span className="font-mono text-[10px] tracking-wider uppercase text-slate-400 font-semibold mb-3 block">
                COMPLETENESS SPECTRUM
              </span>
              {/* Segment Bar */}
              <div className="h-2.5 w-full rounded-full flex overflow-hidden bg-white/5 mb-4">
                <div className="h-full bg-[#4caf8e] transition-all" style={{ width: `${pctExcellent}%` }} title={`Excellent: ${pctExcellent}%`} />
                <div className="h-full bg-cyan-400/80 transition-all" style={{ width: `${pctGood}%` }} title={`Good: ${pctGood}%`} />
                <div className="h-full bg-[#ef4444] transition-all" style={{ width: `${pctPoor}%` }} title={`Critical: ${pctPoor}%`} />
              </div>
              {/* Legends */}
              <div className="space-y-2">
                {[
                  { label: 'Optimal (>=80%)', count: excellentCount, pct: pctExcellent, dot: '#4caf8e' },
                  { label: 'Adequate (50-79%)', count: goodCount, pct: pctGood, dot: '#8ecdff' },
                  { label: 'Deficient (<50%)', count: poorCount, pct: pctPoor, dot: '#ef4444' }
                ].map(l => (
                  <div key={l.label} className="flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="h-2 w-2 rounded-full" style={{ background: l.dot }} />
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