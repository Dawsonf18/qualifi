import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const SERIES = [
  { key: 'transfer', color: '#10b981', label: 'Transfer' },
  { key: 'booked', color: '#0ea5e9', label: 'Booked' },
  { key: 'not_qualified', color: '#f43f5e', label: 'Not Qualified' },
  { key: 'pending', color: '#f59e0b', label: 'Pending' },
];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 shadow-xl">
      <p className="text-xs text-slate-400 mb-2">{formatDate(label)}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-semibold text-slate-100">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function CallChart({ data = [] }) {
  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-slate-300 mb-5">Calls — Last 14 Days</h2>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            {SERIES.map(({ key, color }) => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={1}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 12, color: '#94a3b8' }}
          />
          {SERIES.map(({ key, color, label }) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={label}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${key})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
