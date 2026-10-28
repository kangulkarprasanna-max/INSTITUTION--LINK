// ---------------------------------------------------------------------------
// Cross-bureau candidate discovery — a transparent, explainable heuristic.
//
// This is DECISION SUPPORT, not AI. It never concludes that two complaints are
// related; it only proposes candidate pairs with concrete, data-backed reasons
// for a human reviewer to confirm or reject. No percentage is presented as an
// accuracy or probability — the "match strength" is an ordinal heuristic score.
// ---------------------------------------------------------------------------

import { RELATION_REVIEW_STATUS } from '../data/constants';
import { daysUntil, parseDate } from './dateUtils';

// Common words ignored when extracting meaningful keywords.
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'has', 'are',
  'was', 'were', 'been', 'being', 'case', 'cases', 'about', 'into', 'over',
  'under', 'their', 'there', 'them', 'they', 'than', 'then', 'when', 'what',
  'which', 'while', 'these', 'those', 'such', 'also', 'only', 'your', 'our',
  'not', 'but', 'all', 'any', 'per', 'via', 'etc', 'e.g', 'i.e', 'demo',
  'sample', 'fictional', 'new', 'request', 'query', 'regarding', 'related',
  'notional', 'institution', 'case', 'cases', 'bureau', 'cell',
]);

// Extract distinctive keywords from a subject + description string.
export function extractKeywords(text) {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w)),
  );
}

/** Canonical, order-independent identity for an unordered case pair. */
export function pairKey(a, b) {
  return [a, b].sort().join('::');
}

function sharedKeywords(a, b) {
  const out = [];
  for (const w of a) if (b.has(w)) out.push(w);
  return out.sort();
}

// Reason weights (ordinal). Documented so reviewers understand the score.
const WEIGHTS = {
  sameInstitution: 35,
  sameCategory: 20,
  perKeyword: 10,
  keywordCap: 3,
  temporal: 15,
};
const TEMPORAL_WINDOW_DAYS = 30;
// Non-same-institution pairs must clear this bar to avoid noise (restraint).
const MIN_SCORE_CROSS_INSTITUTION = 45;

/**
 * Evaluate a single eligible (different-bureau) pair. Returns null when no
 * concrete reason is found. Never mutates inputs.
 */
function evaluatePair(caseA, caseB) {
  // Self-pairing guard and duplicate-order guard.
  if (caseA.caseId === caseB.caseId) return null;
  // Only compare cases handled by different bureaus.
  if (caseA.bureauId === caseB.bureauId) return null;

  const reasons = [];
  let score = 0;

  const sameInstitution = caseA.institutionId === caseB.institutionId;
  if (sameInstitution) {
    score += WEIGHTS.sameInstitution;
    reasons.push({
      type: 'same_institution',
      label: 'Same institution, handled by different bureaus',
    });
  }

  const sameCategory = caseA.category && caseA.category === caseB.category;
  if (sameCategory) {
    score += WEIGHTS.sameCategory;
    reasons.push({ type: 'same_category', label: `Matching category · ${caseA.category}` });
  }

  const kw = sharedKeywords(
    extractKeywords(`${caseA.subject} ${caseA.description || ''}`),
    extractKeywords(`${caseB.subject} ${caseB.description || ''}`),
  );
  if (kw.length > 0) {
    score += Math.min(kw.length, WEIGHTS.keywordCap) * WEIGHTS.perKeyword;
    reasons.push({
      type: 'shared_keywords',
      label: `Shared keywords · ${kw.slice(0, 6).join(', ')}`,
      detail: kw,
    });
  }

  // Temporal proximity between received dates.
  const dA = daysUntil(caseA.receivedAt);
  const dB = daysUntil(caseB.receivedAt);
  if (dA !== null && dB !== null && Math.abs(dA - dB) <= TEMPORAL_WINDOW_DAYS) {
    score += WEIGHTS.temporal;
    reasons.push({
      type: 'temporal',
      label: `Received within ${Math.abs(dA - dB)} day(s) of each other`,
    });
  }

  // Restraint: same-institution pairs always qualify (core signal); otherwise
  // require a meaningful score so we do not pair every case with every other.
  if (reasons.length === 0) return null;
  if (!sameInstitution && score < MIN_SCORE_CROSS_INSTITUTION) return null;

  return { reasons, score: Math.min(score, 100), sharedKeywords: kw };
}

/**
 * Generate candidate pairs plus their persisted review decisions.
 *
 * @param cases      all cases
 * @param relations  persisted CaseRelation records (the review source of truth)
 */
export function generateCandidates(cases, relations) {
  const decisions = new Map();
  for (const r of relations) {
    decisions.set(pairKey(r.caseId1, r.caseId2), r);
  }

  const byId = new Map(cases.map((c) => [c.caseId, c]));
  const seen = new Set();
  const candidates = [];

  for (let i = 0; i < cases.length; i += 1) {
    for (let j = i + 1; j < cases.length; j += 1) {
      const a = cases[i];
      const b = cases[j];
      // Deterministic A/B: smaller caseId is Case A.
      const [first, second] = a.caseId <= b.caseId ? [a, b] : [b, a];
      const key = pairKey(first.caseId, second.caseId);
      if (seen.has(key)) continue;

      const evaluation = evaluatePair(first, second);
      if (!evaluation) continue;

      seen.add(key);
      const relation = decisions.get(key);
      candidates.push(buildCandidate(key, first, second, evaluation, relation, byId));
    }
  }

  // Surface explicit relationship records even if generation skipped them, so
  // every persisted decision stays visible and editable.
  for (const r of relations) {
    const key = pairKey(r.caseId1, r.caseId2);
    if (seen.has(key)) continue;
    const a = byId.get(r.caseId1);
    const b = byId.get(r.caseId2);
    if (!a || !b) continue; // skip dangling references rather than break the page
    const [first, second] = a.caseId <= b.caseId ? [a, b] : [b, a];
    seen.add(key);
    candidates.push(
      buildCandidate(
        key,
        first,
        second,
        { reasons: [{ type: 'explicit', label: 'Explicitly recorded relationship' }], score: 0, sharedKeywords: [] },
        r,
        byId,
      ),
    );
  }

  return candidates;
}

function buildCandidate(key, first, second, evaluation, relation, byId) {
  const reviewAt = relation?.reviewedAt ? parseDate(relation.reviewedAt) : null;
  return {
    key,
    relationId: relation?.relationId || null,
    caseA: first,
    caseB: second,
    reasons: evaluation.reasons,
    reasonTypes: evaluation.reasons.map((r) => r.type),
    sharedKeywords: evaluation.sharedKeywords,
    score: evaluation.score,
    reviewStatus: relation?.reviewStatus || RELATION_REVIEW_STATUS.PROPOSED,
    reviewedBy: relation?.reviewedBy || null,
    reviewedAt: relation?.reviewedAt || null,
    // newest of the two received dates, used for recency sorting
    latestReceivedAt:
      (parseDate(first.receivedAt)?.getTime() || 0) >= (parseDate(second.receivedAt)?.getTime() || 0)
        ? first.receivedAt
        : second.receivedAt,
    oldestReceivedAt:
      (parseDate(first.receivedAt)?.getTime() || 0) <= (parseDate(second.receivedAt)?.getTime() || 0)
        ? first.receivedAt
        : second.receivedAt,
    decisionAt: reviewAt ? reviewAt.getTime() : null,
  };
}
