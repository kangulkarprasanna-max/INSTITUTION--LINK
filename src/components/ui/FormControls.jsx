import { cn } from '../../utils/cn';

export function Field({ label, htmlFor, hint, children, className = '' }) {
  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <label className="label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Input({ className = '', id, icon: Icon, ...rest }) {
  if (!Icon) return <input id={id} className={cn('field', className)} {...rest} />;
  // Optional leading icon: the input keeps the shared .field look, with text
  // cleared of the absolutely-positioned glyph.
  return (
    <div className="relative">
      <Icon
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input id={id} className={cn('field pl-9', className)} {...rest} />
    </div>
  );
}

export function Select({ className = '', id, children, ...rest }) {
  return (
    <select id={id} className={cn('field', className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className = '', id, ...rest }) {
  return <textarea id={id} className={cn('field min-h-[80px]', className)} {...rest} />;
}
