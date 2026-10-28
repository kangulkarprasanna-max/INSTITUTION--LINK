// ---------------------------------------------------------------------------
// INSTITUTION-LINK — Shared data model constants (single source of truth)
// Stage 1 of 4. Later prompts must reuse these names; do not invent new ones.
// ---------------------------------------------------------------------------

// Case lifecycle statuses. Kept distinct from relationship-review and
// coordination-task statuses below.
export const CASE_STATUS = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const CASE_STATUS_LIST = Object.values(CASE_STATUS);

// Terminal statuses are no longer active.
export const TERMINAL_CASE_STATUSES = [CASE_STATUS.RESOLVED, CASE_STATUS.CLOSED];

export const ACTIVE_CASE_STATUSES = CASE_STATUS_LIST.filter(
  (s) => !TERMINAL_CASE_STATUSES.includes(s),
);

export function isTerminalCase(status) {
  return TERMINAL_CASE_STATUSES.includes(status);
}

export function isActiveCase(status) {
  return !isTerminalCase(status);
}

// Category of complaint (demonstration taxonomy; not an authoritative AICTE list).
export const CASE_CATEGORY = {
  AFFILIATION: 'Affiliation',
  APPROVAL: 'Approval / Permission',
  COMPLIANCE: 'Compliance & Inspection',
  GRIEVANCE: 'Grievance Redressal',
  FINANCIAL: 'Financial',
  ACADEMIC: 'Academic / Curriculum',
  OTHER: 'Other',
};

export const CASE_CATEGORY_LIST = Object.values(CASE_CATEGORY);

// Institution identity-verification status.
export const IDENTITY_VERIFICATION_STATUS = {
  VERIFIED: 'Verified',
  PENDING: 'Pending',
  UNDER_QUERY: 'Under Query',
  NOT_STARTED: 'Not Started',
};

export const IDENTITY_VERIFICATION_STATUS_LIST = Object.values(IDENTITY_VERIFICATION_STATUS);

// Case-relationship review status (distinct from case status).
// Stored value is the source of truth; the intelligence UI maps these to
// reviewer-facing labels (Related / Unrelated / Needs review / Awaiting).
export const RELATION_REVIEW_STATUS = {
  PROPOSED: 'Proposed', // discovered, not yet reviewed
  CONFIRMED: 'Confirmed', // reviewer marked the pair Related
  REJECTED: 'Rejected', // reviewer marked the pair Unrelated
  NEEDS_REVIEW: 'Needs Review', // reviewer needs more information
};

export const RELATION_REVIEW_STATUS_LIST = Object.values(RELATION_REVIEW_STATUS);

// Reviewer-facing labels. Keeps stored statuses stable while the UI reads as
// plain case-intelligence language.
export const RELATION_REVIEW_LABELS = {
  [RELATION_REVIEW_STATUS.PROPOSED]: 'Awaiting review',
  [RELATION_REVIEW_STATUS.CONFIRMED]: 'Related',
  [RELATION_REVIEW_STATUS.REJECTED]: 'Unrelated',
  [RELATION_REVIEW_STATUS.NEEDS_REVIEW]: 'Needs review',
};

// Relationship reason taxonomy.
export const RELATION_REASON = {
  SAME_INSTITUTION_OVERLAP: 'Same-institution overlap',
  RELATED_SUBJECT: 'Related subject matter',
  SHARED_COMPLAINANT: 'Shared complainant thread',
  COMMON_EVIDENCE: 'Common evidence / inspection',
};

export const RELATION_REASON_LIST = Object.values(RELATION_REASON);

// Coordination-task status (distinct from case status).
export const COORDINATION_TASK_STATUS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const COORDINATION_TASK_STATUS_LIST = Object.values(COORDINATION_TASK_STATUS);

// Terminal task statuses are never counted as overdue.
export const TERMINAL_TASK_STATUSES = [
  COORDINATION_TASK_STATUS.COMPLETED,
  COORDINATION_TASK_STATUS.CANCELLED,
];

// Coordination-task priority (additive to the existing model).
export const TASK_PRIORITY = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export const TASK_PRIORITY_LIST = Object.values(TASK_PRIORITY);

// Action types recorded on the case timeline (CaseAction).
export const CASE_ACTION_TYPE = {
  CREATED: 'Created',
  TRIAGED: 'Triaged',
  ASSIGNED: 'Assigned',
  COMMENT: 'Comment',
  STATUS_CHANGE: 'Status Change',
  ESCALATED: 'Escalated',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const CASE_ACTION_TYPE_LIST = Object.values(CASE_ACTION_TYPE);

// Well-known demonstration Bureau/Cell ids (see seed data).
export const BUREAU = {
  PGRC: 'BUR-PGRC',
  REGULATION: 'BUR-REG',
  APPROVAL: 'BUR-APP',
  OTHER: 'BUR-OTH',
};
