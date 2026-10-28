import { Hourglass } from 'lucide-react';

/**
 * Honest, non-clickable notice for capabilities scheduled in later build
 * stages. It never pretends to perform an action.
 */
export function StageNotice({ children }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-navy-100 bg-navy-50 px-3.5 py-3 text-sm text-navy-700">
      <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-navy-500" aria-hidden="true" />
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}
