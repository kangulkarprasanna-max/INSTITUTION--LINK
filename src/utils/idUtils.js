// ---------------------------------------------------------------------------
// ID generation — stable, collision-resistant IDs for prototype records.
// ---------------------------------------------------------------------------

/**
 * Generate a unique ID with a readable prefix, e.g. "CASE-7f3a9c1b".
 * Uses a random segment plus a timestamp segment to avoid collisions in a
 * single session. Not a substitute for a real backend primary key.
 */
export function generateId(prefix) {
  const rand = Math.random().toString(16).slice(2, 8);
  const time = Date.now().toString(36).slice(-4);
  return `${prefix}-${time}${rand}`;
}

/** Prefixes used across the data model. */
export const ID_PREFIX = {
  INSTITUTION: 'INST',
  BUREAU: 'BUR',
  CASE: 'CASE',
  CASE_ACTION: 'ACT',
  CASE_RELATION: 'REL',
  COORDINATION_TASK: 'TASK',
};
