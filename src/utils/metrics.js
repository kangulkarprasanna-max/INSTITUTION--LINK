// ---------------------------------------------------------------------------
// Dashboard / analytics metric calculations.
// Every number is derived from the underlying dataset — never hardcoded.
// ---------------------------------------------------------------------------

import {
  CASE_STATUS,
  isActiveCase,
  isTerminalCase,
  COORDINATION_TASK_STATUS,
  TERMINAL_TASK_STATUSES,
  RELATION_REVIEW_STATUS,
} from '../data/constants';
import { isOverdue, daysUntil, parseDate } from './dateUtils';

/** Count of all cases. */
export function totalCases(cases) {
  return cases.length;
}

/** Active (non-terminal) cases. */
export function activeCases(cases) {
  return cases.filter((c) => isActiveCase(c.status)).length;
}

/** Resolved + Closed cases. */
export function resolvedClosedCases(cases) {
  return cases.filter((c) => isTerminalCase(c.status)).length;
}

/**
 * Single source of truth for "is this complaint overdue?" — an active case
 * (not Resolved/Closed) with a valid due date strictly before today. A blank
 * due date is never overdue. Every page must use this instead of re-deriving
 * the condition inline, so the rule can never drift between views.
 */
export function isCaseOverdue(c) {
  return isActiveCase(c.status) && isOverdue(c.dueAt);
}

/** Active cases whose due date has passed. */
export function overdueActiveCases(cases) {
  return cases.filter(isCaseOverdue).length;
}

/** Active cases due within the next `withinDays` days (inclusive), not overdue. */
export function dueSoonCases(cases, withinDays = 7) {
  return cases.filter((c) => {
    if (!isActiveCase(c.status)) return false;
    const diff = daysUntil(c.dueAt);
    return diff !== null && diff >= 0 && diff <= withinDays;
  }).length;
}

/** Counts grouped by a case status. */
export function casesByStatus(cases) {
  const counts = {};
  for (const c of cases) {
    counts[c.status] = (counts[c.status] || 0) + 1;
  }
  return counts;
}

/** Counts grouped by bureau id. */
export function casesByBureau(cases) {
  const counts = {};
  for (const c of cases) {
    counts[c.bureauId] = (counts[c.bureauId] || 0) + 1;
  }
  return counts;
}

/** Counts grouped by category. */
export function casesByCategory(cases) {
  const counts = {};
  for (const c of cases) {
    counts[c.category] = (counts[c.category] || 0) + 1;
  }
  return counts;
}

/** Number of institutions that currently have at least one active case. */
export function institutionsWithActiveCases(cases) {
  const set = new Set(cases.filter((c) => isActiveCase(c.status)).map((c) => c.institutionId));
  return set.size;
}

/**
 * Institutions that have two or more *active* cases assigned to different
 * bureaus — the core "cross-bureau overlap" signal for later stages.
 * Returns an array of { institutionId, bureauIds: string[] }.
 */
export function institutionsWithCrossBureauOverlap(cases) {
  const byInstitution = new Map();
  for (const c of cases) {
    if (!isActiveCase(c.status)) continue;
    if (!byInstitution.has(c.institutionId)) byInstitution.set(c.institutionId, new Set());
    byInstitution.get(c.institutionId).add(c.bureauId);
  }
  return [...byInstitution.entries()]
    .filter(([, bureauSet]) => bureauSet.size >= 2)
    .map(([institutionId, bureauSet]) => ({
      institutionId,
      bureauIds: [...bureauSet],
    }));
}

/** Aggregate every headline dashboard metric in one call. */
export function computeDashboardMetrics(cases) {
  return {
    total: totalCases(cases),
    active: activeCases(cases),
    resolvedClosed: resolvedClosedCases(cases),
    overdue: overdueActiveCases(cases),
    dueSoon: dueSoonCases(cases, 7),
    byStatus: casesByStatus(cases),
    byBureau: casesByBureau(cases),
    byCategory: casesByCategory(cases),
    institutionsWithActive: institutionsWithActiveCases(cases),
    crossBureauOverlaps: institutionsWithCrossBureauOverlap(cases),
  };
}

/**
 * Per-institution case rollup. All figures are derived from the shared cases
 * so counts always match the dataset (including user-created cases).
 */
export function institutionCaseSummary(cases, institutionId) {
  const own = cases.filter((c) => c.institutionId === institutionId);
  const active = own.filter((c) => isActiveCase(c.status));
  const overdue = active.filter(isCaseOverdue);
  const resolvedClosed = own.filter((c) => isTerminalCase(c.status));
  const bureaus = new Set(active.map((c) => c.bureauId));
  const stamps = own
    .map((c) => c.lastActionAt)
    .filter(Boolean)
    .map((s) => new Date(s).getTime())
    .filter((t) => !Number.isNaN(t));
  const latestActivity = stamps.length ? new Date(Math.max(...stamps)).toISOString() : null;
  return {
    cases: own,
    total: own.length,
    active: active.length,
    overdue: overdue.length,
    resolvedClosed: resolvedClosed.length,
    bureauCount: bureaus.size,
    crossBureau: bureaus.size >= 2,
    latestActivity,
  };
}

/**
 * Actual relationship records touching a case. Two cases are only linked when
 * a CaseRelation exists — never inferred from a shared institution.
 */
export function relationsForCase(caseRelations, caseId) {
  return caseRelations
    .filter((r) => r.caseId1 === caseId || r.caseId2 === caseId)
    .map((r) => ({
      relation: r,
      otherCaseId: r.caseId1 === caseId ? r.caseId2 : r.caseId1,
    }));
}

/**
 * A coordination task is overdue only when it has a valid, past due date and
 * is not in a terminal (Completed/Cancelled) state. Tasks with no due date are
 * never auto-flagged overdue.
 */
export function isTaskOverdue(task) {
  if (!task.dueAt) return false;
  if (TERMINAL_TASK_STATUSES.includes(task.status)) return false;
  return isOverdue(task.dueAt);
}

/** Roll up coordination-task counts by status + overdue. */
export function coordinationSummary(tasks) {
  const byStatus = {};
  for (const t of tasks) byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  const openCount = tasks.filter(
    (t) => t.status !== COORDINATION_TASK_STATUS.COMPLETED && t.status !== COORDINATION_TASK_STATUS.CANCELLED,
  ).length;
  return {
    total: tasks.length,
    open: openCount,
    overdue: tasks.filter(isTaskOverdue).length,
    byStatus,
  };
}

/** Distinct bureaus involved across a set of linked case ids. */
export function bureausForCaseIds(cases, caseIds) {
  const set = new Set();
  for (const id of caseIds) {
    const c = cases.find((x) => x.caseId === id);
    if (c) set.add(c.bureauId);
  }
  return [...set];
}

/** Counts of candidate pairs by review status (derived from generated list). */
export function countCandidateStatuses(candidates) {
  return {
    awaiting: candidates.filter((c) => c.reviewStatus === RELATION_REVIEW_STATUS.PROPOSED).length,
    related: candidates.filter((c) => c.reviewStatus === RELATION_REVIEW_STATUS.CONFIRMED).length,
    unrelated: candidates.filter((c) => c.reviewStatus === RELATION_REVIEW_STATUS.REJECTED).length,
    needsReview: candidates.filter((c) => c.reviewStatus === RELATION_REVIEW_STATUS.NEEDS_REVIEW).length,
  };
}

// --- Analytics aggregations -------------------------------------------------

/** Per-institution rollup for the institutional-intelligence view. */
export function institutionRollups(cases, institutions) {
  return institutions.map((inst) => {
    const s = institutionCaseSummary(cases, inst.institutionId);
    return {
      institutionId: inst.institutionId,
      name: inst.name,
      active: s.active,
      total: s.total,
      overdue: s.overdue,
      crossBureau: s.crossBureau,
      bureauCount: s.bureauCount,
    };
  });
}

/** Coordination tasks grouped by their (task) status. */
export function tasksByStatus(tasks) {
  const counts = {};
  for (const t of tasks) counts[t.status] = (counts[t.status] || 0) + 1;
  return counts;
}

/** Coordination tasks grouped by responsible bureau id. */
export function tasksByBureau(tasks) {
  const counts = {};
  for (const t of tasks) counts[t.responsibleBureau] = (counts[t.responsibleBureau] || 0) + 1;
  return counts;
}

/** Stored relationship decisions grouped by review status. */
export function relationDecisionsByStatus(relations) {
  const counts = {};
  for (const r of relations) counts[r.reviewStatus] = (counts[r.reviewStatus] || 0) + 1;
  return counts;
}

/** Monday-based week start for a date (local). */
function weekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7; // Mon = 0
  d.setDate(d.getDate() - offset);
  return d;
}

/**
 * Group timestamps into contiguous calendar weeks from the earliest event to
 * the current week (filling empty weeks with zero). Returns a series of
 * { label, count } plus an `empty` flag so callers can be honest about having
 * no historical data rather than fabricating a trend.
 */
export function weeklySeries(timestamps, maxWeeks = 26) {
  const times = timestamps
    .map(parseDate)
    .filter(Boolean)
    .map((d) => d.getTime());
  if (times.length === 0) return { empty: true, series: [] };

  const bucketByWeek = new Map();
  for (const t of times) {
    const key = weekStart(new Date(t)).getTime();
    bucketByWeek.set(key, (bucketByWeek.get(key) || 0) + 1);
  }

  const minWeek = Math.min(...bucketByWeek.keys());
  const currentWeek = weekStart(new Date()).getTime();
  const series = [];
  let cursor = minWeek;
  let guard = 0;
  while (cursor <= currentWeek && guard < maxWeeks) {
    const d = new Date(cursor);
    series.push({
      label: `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-GB', { month: 'short' })}`,
      count: bucketByWeek.get(cursor) || 0,
    });
    cursor += 7 * 24 * 60 * 60 * 1000;
    guard += 1;
  }
  return { empty: false, series };
}

// Status color tokens reused by badges and charts.
export const STATUS_COLOR = {
  [CASE_STATUS.SUBMITTED]: '#2f63a8',
  [CASE_STATUS.UNDER_REVIEW]: '#7c3aed',
  [CASE_STATUS.ASSIGNED]: '#0891b2',
  [CASE_STATUS.IN_PROGRESS]: '#d97706',
  [CASE_STATUS.RESOLVED]: '#16a34a',
  [CASE_STATUS.CLOSED]: '#64748b',
};

// Task-status colors — a separate palette from case statuses by design.
export const TASK_STATUS_COLOR = {
  [COORDINATION_TASK_STATUS.OPEN]: '#2f63a8',
  [COORDINATION_TASK_STATUS.IN_PROGRESS]: '#d97706',
  [COORDINATION_TASK_STATUS.BLOCKED]: '#e11d48',
  [COORDINATION_TASK_STATUS.COMPLETED]: '#16a34a',
  [COORDINATION_TASK_STATUS.CANCELLED]: '#94a3b8',
};

// Relationship-review colors — a third, distinct status domain.
export const REVIEW_STATUS_COLOR = {
  [RELATION_REVIEW_STATUS.PROPOSED]: '#d97706',
  [RELATION_REVIEW_STATUS.CONFIRMED]: '#16a34a',
  [RELATION_REVIEW_STATUS.REJECTED]: '#e11d48',
  [RELATION_REVIEW_STATUS.NEEDS_REVIEW]: '#7c3aed',
};

// General-purpose categorical palette for bureau / institution charts.
export const CHART_PALETTE = [
  '#2f63a8',
  '#0891b2',
  '#7c3aed',
  '#d97706',
  '#16a34a',
  '#e11d48',
  '#475569',
  '#0d9488',
];
