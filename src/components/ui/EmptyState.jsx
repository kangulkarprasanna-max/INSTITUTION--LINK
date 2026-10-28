import { cn } from '../../utils/cn';

export function EmptyState({ icon: Icon, title, description, children, className = '' }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center',
        className,
      )}
    >
      {Icon ? (
        <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      ) : null}
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
