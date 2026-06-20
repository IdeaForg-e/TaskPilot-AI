export default function StatsCard({ label, value, icon: Icon, accent = 'indigo' }) {
  const accentMap = {
    indigo: 'text-violet-400 bg-gradient-to-tr from-violet-500/10 to-indigo-500/5 border border-violet-500/20',
    emerald: 'text-emerald-400 bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 border border-emerald-500/20',
    amber: 'text-amber-400 bg-gradient-to-tr from-amber-500/10 to-yellow-500/5 border border-amber-500/20',
    red: 'text-red-400 bg-gradient-to-tr from-red-500/10 to-orange-500/5 border border-red-500/20',
  };

  return (
    <div className="glass-card glass-card-hover relative overflow-hidden p-5 shadow-lg group">
      {/* Background radial highlight */}
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-violet-500/5 blur-xl group-hover:bg-violet-500/10 transition-colors duration-300" />
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        {Icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${accentMap[accent] || accentMap.indigo}`}>
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
      </div>
      
      <div className="mt-4">
        <p className="text-2xl font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors duration-200">
          {value}
        </p>
      </div>
    </div>
  );
}
