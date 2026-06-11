export default function StatsCard({ label, value, sub, accent = 'indigo', icon: Icon }) {
  const accentMap = {
    indigo: 'text-indigo-400 bg-indigo-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    sky: 'text-sky-400 bg-sky-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
  };

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400 font-medium">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentMap[accent]}`}>
            <Icon className="w-4 h-4" strokeWidth={2} />
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-semibold text-slate-50 tracking-tight">{value}</p>
        {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}
