// ---------------------------------------------------------------------------
// Date utilities — all stored dates are ISO 8601 strings.
// Demo dates are derived relative to "today" so overdue / upcoming cases stay
// meaningful on the day of a presentation.
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parse an ISO string defensively; returns a valid Date or null. */
export function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Start of today (local), used as the demo "now" reference. */
export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Return an ISO string for a date `offsetDays` from today (negative = past). */
export function isoDaysFromToday(offsetDays, hour = 10, minute = 0) {
  const d = startOfToday();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Difference in whole days between an ISO date and today (positive = future). */
export function daysUntil(iso) {
  const d = parseDate(iso);
  if (!d) return null;
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - startOfToday().getTime()) / DAY_MS);
}

/** A case is overdue when it is active and its due date is strictly in the past. */
export function isOverdue(iso) {
  const diff = daysUntil(iso);
  return diff !== null && diff < 0;
}

/** Human-friendly date, e.g. "12 Mar 2026". Falls back to an em dash. */
export function formatDate(iso) {
  const d = parseDate(iso);
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Human-friendly date + time, e.g. "12 Mar 2026, 10:30". */
export function formatDateTime(iso) {
  const d = parseDate(iso);
  if (!d) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Relative label for a due date, e.g. "in 4 days" / "3 days overdue". */
export function relativeDueLabel(iso) {
  const diff = daysUntil(iso);
  if (diff === null) return 'No due date';
  if (diff === 0) return 'Due today';
  if (diff > 0) return `Due in ${diff} day${diff === 1 ? '' : 's'}`;
  const over = Math.abs(diff);
  return `${over} day${over === 1 ? '' : 's'} overdue`;
}

/** Convert an ISO timestamp to a yyyy-mm-dd string for <input type="date">. */
export function toISODateInput(iso) {
  const d = parseDate(iso);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Convert a yyyy-mm-dd date-input value to an ISO string (local, midday to
 * avoid timezone day-shift). Returns null for empty/invalid input so callers
 * can validate rather than store an Invalid Date.
 */
export function dateInputToIso(value) {
  if (!value) return null;
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
