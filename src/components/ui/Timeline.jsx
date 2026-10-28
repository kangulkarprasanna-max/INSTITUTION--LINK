import { formatDateTime } from '../../utils/dateUtils';
import { EmptyState } from './EmptyState';
import { History } from 'lucide-react';

// Map action types to a restrained accent for the timeline dot.
const DOT = {
  Created: 'bg-navy-500',
  Triaged: 'bg-cyan-500',
  Assigned: 'bg-cyan-600',
  Comment: 'bg-slate-400',
  'Status Change': 'bg-violet-500',
  Escalated: 'bg-amber-500',
  Resolved: 'bg-emerald-500',
  Closed: 'bg-slate-500',
};

/**
 * Read-only action timeline. Newest first by default. Optionally labels each
 * entry with its case subject/id for institution-level cross-case views.
 */
export function Timeline({ actions, showCase = false, caseLabel, emptyMessage = 'No actions recorded yet.' }) {
  if (!actions || actions.length === 0) {
    return <EmptyState icon={History} title="No activity" description={emptyMessage} />;
  }

  return (
    <ol className="relative space-y-4 pl-1">
      {actions.map((a) => (
        <li key={a.actionId} className="flex gap-3">
          <span
            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[a.actionType] || 'bg-slate-400'}`}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1 border-b border-slate-100 pb-3 last:border-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-sm font-medium text-slate-800">{a.actionType}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">{formatDateTime(a.timestamp)}</span>
            </div>
            {showCase && caseLabel ? (
              <p className="mt-0.5 text-xs text-navy-600">{caseLabel(a.caseId)}</p>
            ) : null}
            {a.remarks ? <p className="mt-1 text-sm text-slate-600">{a.remarks}</p> : null}
            {a.actor ? <p className="mt-1 text-xs text-slate-400">By {a.actor}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
