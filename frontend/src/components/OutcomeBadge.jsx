import { PhoneForwarded, CalendarCheck, XCircle, Clock } from 'lucide-react';

const OUTCOMES = {
  transfer: {
    label: 'Transfer',
    icon: PhoneForwarded,
    classes: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  booked: {
    label: 'Booked',
    icon: CalendarCheck,
    classes: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  },
  not_qualified: {
    label: 'Not Qualified',
    icon: XCircle,
    classes: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    classes: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
};

export default function OutcomeBadge({ outcome, size = 'sm' }) {
  const key = outcome || 'pending';
  const config = OUTCOMES[key] || OUTCOMES.pending;
  const Icon = config.icon;

  const sizeClasses = size === 'lg'
    ? 'text-sm px-3 py-1.5 gap-2'
    : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeClasses} ${config.classes}`}>
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} strokeWidth={2} />
      {config.label}
    </span>
  );
}
