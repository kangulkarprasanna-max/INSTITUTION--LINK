// ---------------------------------------------------------------------------
// Demonstration auth service (browser localStorage).
//
// LOCAL PROTOTYPE ONLY: accounts live in src/data/users.js and the "session"
// is a plain localStorage record. There is no server, no hashing and no real
// credential protection. The shape mirrors storageService so a later stage can
// swap this module for a real identity provider without touching the UI.
// ---------------------------------------------------------------------------

import { DEMO_USERS, findDemoUser } from '../data/users';

const SESSION_KEY = 'institution-link:session:v1';

// Fields safe to persist for a session — deliberately excludes the password.
const SESSION_FIELDS = ['username', 'displayName', 'initials', 'role', 'designation', 'bureauId'];

function safeHasStorage() {
  // Guard browser-only APIs so module evaluation / SSR-style builds never touch
  // localStorage at import time.
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Reduce a full account record to the session-safe subset. */
export function toSessionUser(account) {
  if (!account) return null;
  return SESSION_FIELDS.reduce((acc, key) => {
    acc[key] = account[key] ?? null;
    return acc;
  }, {});
}

/**
 * Validate a stored session. The account must still exist in the demo set,
 * otherwise a stale/edited record is discarded rather than trusted.
 */
function normalizeSession(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.username !== 'string') return null;
  const account = findDemoUser(raw.username);
  return account ? toSessionUser(account) : null;
}

/** Return the signed-in user, or null when no valid session exists. */
export function readSession() {
  if (!safeHasStorage()) return null;
  try {
    const stored = window.localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return normalizeSession(JSON.parse(stored));
  } catch (err) {
    // Corrupt JSON or a blocked storage API — treat as signed out.
    return null;
  }
}

function writeSession(user) {
  if (!safeHasStorage() || !user) return false;
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return true;
  } catch (err) {
    return false;
  }
}

function removeSession() {
  if (!safeHasStorage()) return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch (err) {
    /* ignore — the in-memory state already dropped the user */
  }
}

/**
 * Check credentials against the demonstration accounts.
 * Returns { ok: true, user } or { ok: false, error }.
 */
export function authenticate(username, password) {
  const key = String(username || '').trim().toLowerCase();
  if (!key) return { ok: false, error: 'Enter your user ID.' };
  if (!String(password || '')) return { ok: false, error: 'Enter your password.' };

  const account = findDemoUser(key);
  if (!account || account.password !== String(password)) {
    // One generic message — never reveal which part was wrong.
    return { ok: false, error: 'User ID or password is not correct for this prototype.' };
  }
  const user = toSessionUser(account);
  writeSession(user);
  return { ok: true, user };
}

/** Sign in directly to a listed demo account (no password typing needed). */
export function signInAs(username) {
  const account = findDemoUser(username);
  if (!account) return { ok: false, error: 'That demonstration account is not available.' };
  const user = toSessionUser(account);
  writeSession(user);
  return { ok: true, user };
}

/** Clear the stored session. */
export function signOut() {
  removeSession();
  return null;
}

/** Total accounts in the demonstration set (used by the login-screen helper). */
export function countDemoAccounts() {
  return DEMO_USERS.length;
}

export { SESSION_KEY };
