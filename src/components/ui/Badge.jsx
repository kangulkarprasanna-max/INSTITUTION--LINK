import { CASE_STATUS, RELATION_REVIEW_STATUS, COORDINATION_TASK_STATUS } from '../../data/constants';

// Tone -> Tailwind classes. Restrained, accessible palette for status/alerts.
const TONE = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  info: 'bg-navy-50 text-navy-700 ring-navy-200',
  review: 'bg-violet-50 text-violet-700 ring-violet-200',
  assigned: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  progress: 'bg-amber-50 text-amber-800 ring-amber-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  warning: 'bg-orange-50 text-orange-800 ring-orange-200',
};

export function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE[tone] || TONE.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

const CASE_TONE = {
  [CASE_STATUS.SUBMITTED]: 'info',
  [CASE_STATUS.UNDER_REVIEW]: 'review',
  [CASE_STATUS.ASSIGNED]: 'assigned',
  [CASE_STATUS.IN_PROGRESS]: 'progress',
  [CASE_STATUS.RESOLVED]: 'success',
  [CASE_STATUS.CLOSED]: 'neutral',
};

const RELATION_TONE = {
  [RELATION_REVIEW_STATUS.PROPOSED]: 'warning',
  [RELATION_REVIEW_STATUS.CONFIRMED]: 'success',
  [RELATION_REVIEW_STATUS.REJECTED]: 'danger',
  [RELATION_REVIEW_STATUS.NEEDS_REVIEW]: 'review',
};

const TASK_TONE = {
  [COORDINATION_TASK_STATUS.OPEN]: 'info',
  [COORDINATION_TASK_STATUS.IN_PROGRESS]: 'progress',
  [COORDINATION_TASK_STATUS.BLOCKED]: 'danger',
  [COORDINATION_TASK_STATUS.COMPLETED]: 'success',
  [COORDINATION_TASK_STATUS.CANCELLED]: 'neutral',
};

const VERIFY_TONE = {
  Verified: 'success',
  Pending: 'warning',
  'Under Query': 'danger',
  'Not Started': 'neutral',
};

export function CaseStatusBadge({ status, className = '' }) {
  return (
    <Badge tone={CASE_TONE[status] || 'neutral'} className={className}>
      {status}
    </Badge>
  );
}

export function RelationStatusBadge({ status, label, className = '' }) {
  return (
    <Badge tone={RELATION_TONE[status] || 'neutral'} className={className}>
      {label || status}
    </Badge>
  );
}

export function TaskStatusBadge({ status, className = '' }) {
  return (
    <Badge tone={TASK_TONE[status] || 'neutral'} className={className}>
      {status}
    </Badge>
  );
}

export function VerificationBadge({ status, className = '' }) {
  return (
    <Badge tone={VERIFY_TONE[status] || 'neutral'} className={className}>
      {status}
    </Badge>
  );
}
