import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Phone, Clock, ArrowUpRight } from 'lucide-react';
import { fetchCalls } from '../services/api';
import OutcomeBadge from '../components/OutcomeBadge';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'booked', label: 'Booked' },
  { value: 'not_qualified', label: 'Not Qualified' },
  { value: 'pending', label: 'Pending' },
];

function duration(secs) {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function Calls() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [outcome, setOutcome] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['calls', { page, outcome, search }],
    queryFn: () => fetchCalls({ page, limit: 20, outcome, search }),
    placeholderData: (prev) => prev,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleFilterChange = (value) => {
    setOutcome(value);
    setPage(1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-50">Calls</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {data?.total != null ? `${data.total} total` : '—'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Outcome filter tabs */}
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                outcome === f.value
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search name or phone…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-60 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3.5">Lead</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3.5">Phone</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3.5">Outcome</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3.5">Duration</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="w-32 h-4 bg-slate-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="w-28 h-4 bg-slate-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="w-24 h-4 bg-slate-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="w-12 h-4 bg-slate-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="w-28 h-4 bg-slate-800 rounded" /></td>
                    <td className="px-5 py-4" />
                  </tr>
                ))
              : error
              ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-rose-400 text-sm">
                      Failed to load calls. Is the backend running?
                    </td>
                  </tr>
                )
              : data?.calls?.length === 0
              ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-600 text-sm">
                      No calls found.
                    </td>
                  </tr>
                )
              : data?.calls?.map((call) => (
                  <tr
                    key={call.id}
                    onClick={() => navigate(`/calls/${call.id}`)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-4 font-medium text-slate-200">{call.lead_name}</td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">{call.lead_phone}</td>
                    <td className="px-5 py-4"><OutcomeBadge outcome={call.outcome} /></td>
                    <td className="px-5 py-4 text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {duration(call.duration_seconds)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(call.created_at)}</td>
                    <td className="px-5 py-4">
                      <ArrowUpRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors" />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
            <p className="text-sm text-slate-500">
              Page {data.page} of {data.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
