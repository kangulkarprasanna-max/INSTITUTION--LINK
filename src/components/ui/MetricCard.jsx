import { cn } from '../../utils/cn';

const TONE = {
  default: 'text-navy-700',
  active: 'text-navy-700',
  success: 'text-emerald-600',
  danger: 'text-rose-600',
  warning: 'text-amber-600',
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'default',
  className = '',
}) {
  return (
    <div className={cn('card p-5 flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon ? (
          <span
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-200',
              TONE[tone] || TONE.default,
            )}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      <p className={cn('text-3xl font-semibold tracking-tight', TONE[tone] || TONE.default)}>
        {value}
      </p>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
