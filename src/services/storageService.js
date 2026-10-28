// ---------------------------------------------------------------------------
// Centralized persistence service (browser localStorage).
//
// This is a LOCAL PROTOTYPE store only. localStorage is not a secure,
// shared, or multi-user database. It exists so demo edits survive a page
// refresh within one browser.
// ---------------------------------------------------------------------------

import { createSeedDataset } from '../data/seedData';

// Versioned, centralized storage key. Bump the version when the data shape
// changes incompatibly so stale local data is discarded rather than misread.
const STORAGE_KEY = 'institution-link:dataset:v1';

const TOP_LEVEL_KEYS = [
  'bureaus',
  'institutions',
  'cases',
  'caseActions',
  'caseRelations',
  'coordinationTasks',
];

function safeHasStorage() {
  // Guard browser-only APIs so module evaluation / SSR-style builds never touch
  // localStorage at import time.
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Return a fresh, valid seed dataset. */
export function readSeedDataset() {
  return createSeedDataset();
}

/**
 * Validate the general shape of a stored dataset and apply backward-compatible
 * defaults for fields introduced in later stages. Returns the dataset if it
 * looks usable, otherwise null so callers can fall back to seed data.
 */
function normalizeDataset(raw) {
  if (!raw || typeof raw !== 'object') return null;
  for (const key of TOP_LEVEL_KEYS) {
    if (!Array.isArray(raw[key])) return null;
  }

  // Additive defaults: older saved tasks may predate priority / description /
  // lastUpdatedAt. Fill them without discarding any stored values.
  raw.coordinationTasks = raw.coordinationTasks.map((t) => ({
    priority: t.priority || 'Medium',
    description: t.description || '',
    lastUpdatedAt: t.lastUpdatedAt || t.createdAt || new Date().toISOString(),
    actionHistory: Array.isArray(t.actionHistory) ? t.actionHistory : [],
    ...t,
  }));

  raw.caseRelations = raw.caseRelations.map((r) => ({
    reviewedBy: r.reviewedBy ?? null,
    reviewedAt: r.reviewedAt ?? null,
    remarks: r.remarks || '',
    ...r,
  }));

  return raw;
}

/** Load persisted demo data, falling back to a fresh seed dataset on any issue. */
export function loadDataset() {
  if (!safeHasStorage()) {
    return { dataset: readSeedDataset(), source: 'seed' };
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const dataset = readSeedDataset();
      saveDataset(dataset);
      return { dataset, source: 'seed' };
    }
    const parsed = JSON.parse(stored);
    const normalized = normalizeDataset(parsed);
    if (!normalized) {
      // Malformed / incompatible — reset to a valid seed set.
      const dataset = readSeedDataset();
      saveDataset(dataset);
      return { dataset, source: 'seed' };
    }
    return { dataset: normalized, source: 'storage' };
  } catch (err) {
    // Corrupt JSON, quota errors, etc. Never let storage break the app.
    const dataset = readSeedDataset();
    return { dataset, source: 'seed' };
  }
}

/** Persist the full dataset. Returns true on success, false if unavailable. */
export function saveDataset(dataset) {
  if (!safeHasStorage()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
    return true;
  } catch (err) {
    return false;
  }
}

/** Reset storage and return a pristine seed dataset. */
export function resetDataset() {
  const dataset = readSeedDataset();
  if (safeHasStorage()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* ignore — we still return a fresh dataset */
    }
    saveDataset(dataset);
  }
  return dataset;
}

export { STORAGE_KEY };
