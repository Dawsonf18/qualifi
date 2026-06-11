import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PhoneCall, PhoneForwarded, CalendarCheck, XCircle, RefreshCw } from 'lucide-react';
import { fetchStats } from '../services/api';
import StatsCard from '../components/StatsCard';
import CallChart from '../components/CallChart';
import OutcomeBadge from '../components/OutcomeBadge';

function pct(n) {
  return `${Math.round((n || 0) * 100)}%`;
}

function duration(secs) {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error, dataUpdatedAt, refetch, isFetching } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          {lastUpdated && <span className="text-slate-600">Updated {lastUpdated}</span>}
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          Failed to load dashboard data. Is the backend running?
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Total Calls"
          value={isLoading ? '—' : stats?.total ?? 0}
          sub={`${stats?.today ?? 0} today`}
          icon={PhoneCall}
          accent="indigo"
        />
        <StatsCard
          label="Transfers"
          value={isLoading ? '—' : stats?.transfers ?? 0}
          sub={`${pct(stats?.transfer_rate)} rate`}
          icon={PhoneForwarded}
          accent="emerald"
        />
        <StatsCard
          label="Booked"
          value={isLoading ? '—' : stats?.booked ?? 0}
          sub={`${pct(stats?.book_rate)} rate`}
          icon={CalendarCheck}
          accent="sky"
        />
        <StatsCard
          label="Not Qualified"
          value={isLoading ? '—' : stats?.not_qualified ?? 0}
          sub={`${stats?.pending ?? 0} pending`}
          icon={XCircle}
          accent="rose"
        />
      </div>

      {/* Chart */}
      <div className="mb-6">
        {isLoading ? (
          <div className="card h-64 animate-pulse" />
        ) : (
          <CallChart data={stats?.chart ?? []} />
        )}
      </div>

      {/* Recent Calls */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-300">Recent Calls</h2>
          <button
            onClick={() => navigate('/calls')}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all
          </button>
        </div>

        {isLoading ? (
          <div className="divide-y divide-slate-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-32 h-4 bg-slate-800 rounded" />
                  <div className="w-24 h-4 bg-slate-800 rounded" />
                  <div className="w-20 h-4 bg-slate-800 rounded ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : !stats?.chart || stats.total === 0 ? (
          <div className="px-5 py-12 text-center text-slate-600 text-sm">
            No calls yet. Submit a GHL form to trigger the first one.
          </div>
        ) : null}
      </div>
    </div>
  );
}
