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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-light" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
            Quality Assurance
          </h2>
          <p className="font-body text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
            Automated task parsing structure and attribute completeness verification
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip chip-blue text-[0.6rem] py-1">
            <Sparkles className="h-3 w-3 animate-pulse" />
            AI Auditor Active
          </span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        
        {/* Left Side: Search, Filter Tabs and Reports list */}
        <div className="lg:col-span-2 space-y-5">
          {/* Controls Bar */}
          <div className="glass-card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Box */}
            <div
              className="flex w-full sm:max-w-xs items-center gap-2 rounded-xl px-3.5 py-1.5"
              style={{
                background: 'rgba(0,0,0,0.25)',
                border: '0.5px solid rgba(255,255,255,0.08)',
              }}
            >
              <Search className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--outline)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit reports..."
                className="w-full bg-transparent border-0 outline-none text-xs font-body"
                style={{ color: 'var(--on-surface)' }}
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 gap-1 shrink-0">
              {[
                { id: 'all', label: 'All Reports' },
                { id: 'deficient', label: 'Deficient' },
                { id: 'passing', label: 'Passing' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setStatusFilter(t.id)}
                  className={`px-3 py-1.5 text-[10px] font-headline font-semibold rounded-lg transition-colors cursor-pointer ${
                    statusFilter === t.id 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'text-outline hover:text-on-surface'
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
            <div className="glass-card p-6 flex flex-col items-center justify-center text-center animate-fade-in-up stagger-1">
              <span className="label-caps mb-4 block" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                Overall Quality Index
              </span>
              
              <div className="relative h-32 w-32 flex items-center justify-center mb-4">
                {/* SVG circular progress ring */}
                <svg className="h-full w-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-white/5"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="transition-all duration-1000 ease-out"
                    stroke={avgScore >= 50 ? 'var(--primary)' : '#ef4444'}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                {/* Score text inside ring */}
                <div className="absolute flex flex-col items-center">
                  <span className="font-headline text-3xl font-extrabold" style={{ color: 'var(--on-surface)' }}>
                    {avgScore}
                  </span>
                  <span className="text-[9px] font-body uppercase tracking-wider text-slate-500">
                    Score
                  </span>
                </div>
              </div>

              <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                System average score based on checklist completeness of attributes.
              </p>
            </div>
          )}

          {/* Stats Breakdown cards */}
          <div className="grid grid-cols-1 gap-4 animate-fade-in-up stagger-2">
            {[
              { label: 'Pass Rate', value: `${passRate}% Complete`, icon: HeartPulse, color: '#4caf8e', bg: 'rgba(76,175,142,0.1)', border: 'rgba(76,175,142,0.15)' },
              { label: 'Deficient Tasks', value: `${poorReports} Identified`, icon: Activity, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.15)' },
              { label: 'Total Audited', value: `${totalReports} Reports`, icon: ShieldCheck, color: '#8ecdff', bg: 'rgba(142,205,255,0.1)', border: 'rgba(142,205,255,0.15)' },
            ].map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className="glass-card p-4 flex items-center gap-4 hover:translate-x-1 transition-transform">
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

          {/* Distribution Bar Chart Card */}
          {totalReports > 0 && (
            <div className="glass-card p-5 animate-fade-in-up stagger-4">
              <span className="label-caps mb-3 block" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                Completeness Distribution
              </span>
              {/* Segment Bar */}
              <div className="h-3 w-full rounded-full flex overflow-hidden bg-white/5 mb-4">
                <div className="h-full bg-[#4caf8e] transition-all" style={{ width: `${pctExcellent}%` }} title={`Excellent: ${pctExcellent}%`} />
                <div className="h-full bg-primary/70 transition-all" style={{ width: `${pctGood}%` }} title={`Good: ${pctGood}%`} />
                <div className="h-full bg-[#ef4444] transition-all" style={{ width: `${pctPoor}%` }} title={`Critical: ${pctPoor}%`} />
              </div>
              {/* Legends */}
              <div className="space-y-2">
                {[
                  { label: 'Excellent (>=80%)', count: excellentCount, pct: pctExcellent, dot: '#4caf8e' },
                  { label: 'Good (50% - 79%)', count: goodCount, pct: pctGood, dot: 'var(--primary)' },
                  { label: 'Critical (<50%)', count: poorCount, pct: pctPoor, dot: '#ef4444' }
                ].map(l => (
                  <div key={l.label} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="h-2 w-2 rounded-full" style={{ background: l.dot }} />
                      <span>{l.label}</span>
                    </div>
                    <span className="font-semibold text-slate-200">
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