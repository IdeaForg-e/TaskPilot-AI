import { Trophy, Star, GitMerge, ShieldAlert, Timer, Users, Factory, LockKeyhole, Briefcase, Network, Activity } from 'lucide-react';

const getPlatformStyle = (platform) => {
  const styles = {
    jira: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    github: 'bg-slate-500/20 text-slate-350 border border-slate-500/30',
    slack: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    email: 'bg-red-500/10 text-red-400 border border-red-500/20',
    calendar: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    meetings: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    incidents: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  };
  return styles[platform.toLowerCase()] || 'bg-slate-800 text-slate-400 border border-slate-700';
};

const formatPlatformName = (platform) => {
  const names = {
    jira: 'Jira',
    github: 'GitHub',
    slack: 'Slack',
    email: 'Email',
    calendar: 'Calendar',
    meetings: 'Meetings',
    incidents: 'Incident',
  };
  return names[platform.toLowerCase()] || platform;
};

export default function PriorityCard({ task, rank }) {
  const explanation = task.explanation || task.reason || 'No prioritization reasoning provided.';

  // Styled colors for podium ranks
  const rankColors = {
    1: 'bg-gradient-to-tr from-amber-500 to-yellow-350 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.25)] border-amber-400/30',
    2: 'bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-950 shadow-[0_0_15px_rgba(148,163,184,0.15)] border-slate-350/30',
    3: 'bg-gradient-to-tr from-amber-700 to-amber-600 text-white shadow-[0_0_15px_rgba(180,83,9,0.15)] border-amber-650/30',
  };

  const currentRankColor = rankColors[rank] || 'bg-slate-900/60 border-slate-800 text-indigo-400';
  const breakdown = [
    ['Severity', task.severity_score, ShieldAlert],
    ['Deadline', task.deadline_score, Timer],
    ['Prod', task.production_impact_score, Factory],
    ['Customer', task.customer_impact_score, Users],
    ['Blocker', task.blocker_score, LockKeyhole],
    ['Business', task.business_impact_score, Briefcase],
    ['Dependency', task.dependency_score, Network],
    ['Quality Factor', task.quality_factor_score, Activity],
  ];

  return (
    <div className="glass-card glass-card-hover flex items-start gap-4 p-5 shadow-lg relative overflow-hidden group">
      {/* Visual podium glows */}
      {rank <= 3 && (
        <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-amber-500/3 blur-2xl group-hover:bg-amber-500/6 transition-colors" />
      )}

      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold border transition-transform duration-300 group-hover:scale-105 ${currentRankColor}`}>
        {rank === 1 ? (
          <Trophy className="h-4 w-4 stroke-[2.5]" />
        ) : rank === 2 || rank === 3 ? (
          <Star className="h-4 w-4 fill-current stroke-[2.5]" />
        ) : (
          <span>#{rank}</span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-200 transition-colors">
              {task.title || `Task #${task.id}`}
            </h4>
            {task.platforms && task.platforms.map((platform) => (
              <span
                key={platform}
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider ${getPlatformStyle(platform)}`}
              >
                {formatPlatformName(platform)}
              </span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold text-violet-400 tracking-wide">
            Priority Score: {task.priority_score ?? '—'}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-2xl">
          {explanation}
        </p>
        {task.priority_reason && task.priority_reason.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {task.priority_reason.map((reason, idx) => (
              <span key={idx} className="inline-flex items-center rounded-lg bg-amber-500/5 border border-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-400/95 tracking-wide shadow-sm">
                ⚡ {reason}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {breakdown.map(([label, value, Icon]) => (
            value !== undefined && value !== null ? (
              <span key={label} className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/40 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                <Icon className="h-3 w-3 text-slate-500" />
                {label}: {value}
              </span>
            ) : null
          ))}
          {(task.source_count || 0) > 1 && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-cyan-300">
              <GitMerge className="h-3 w-3" />
              {task.source_count} Signals
            </span>
          )}
        </div>
        {task.agent_summary && (
          <p className="mt-2 text-[10px] text-slate-500">{task.agent_summary}</p>
        )}
      </div>
    </div>
  );
}
