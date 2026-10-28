// ---------------------------------------------------------------------------
// Demonstration user accounts for the login screen.
//
// These are INVENTED identities used only to show how a role-aware login would
// look in the prototype. There is no backend: passwords live in this file and
// the "session" is kept in localStorage, so this is NOT real authentication and
// must never be presented as secure.
// ---------------------------------------------------------------------------

import { BUREAU } from './constants';

// Roles shown to the user. Kept as display labels (no permission engine is
// wired to them in this prototype stage).
export const USER_ROLE = {
  NODAL: 'Nodal Officer',
  BUREAU_OFFICER: 'Bureau Case Officer',
  REVIEWER: 'Cross-Bureau Reviewer',
};

export const USER_ROLE_LIST = Object.values(USER_ROLE);

// Shared demonstration password, surfaced on the login screen on purpose so an
// evaluator can sign in without being handed a secret.
export const DEMO_PASSWORD = 'demo1234';

// displayName values intentionally match the officer names used in the seed
// case timeline (e.g. "R. Iyer (Demo)") so activity history reads consistently.
export const DEMO_USERS = [
  {
    username: 'r.iyer',
    password: DEMO_PASSWORD,
    displayName: 'R. Iyer (Demo)',
    initials: 'RI',
    role: USER_ROLE.BUREAU_OFFICER,
    designation: 'Officer — Public Grievance Redressal Cell',
    bureauId: BUREAU.PGRC,
  },
  {
    username: 'a.menon',
    password: DEMO_PASSWORD,
    displayName: 'A. Menon (Demo)',
    initials: 'AM',
    role: USER_ROLE.BUREAU_OFFICER,
    designation: 'Officer — Approval Bureau',
    bureauId: BUREAU.APPROVAL,
  },
  {
    username: 's.kulkarni',
    password: DEMO_PASSWORD,
    displayName: 'S. Kulkarni (Demo)',
    initials: 'SK',
    role: USER_ROLE.REVIEWER,
    designation: 'Reviewer — Regulation Bureau',
    bureauId: BUREAU.REGULATION,
  },
  {
    username: 'admin',
    password: DEMO_PASSWORD,
    displayName: 'Nodal Officer (Demo)',
    initials: 'NO',
    role: USER_ROLE.NODAL,
    designation: 'Nodal Officer — Institution-Link programme',
    bureauId: null, // bureau-agnostic view
  },
];

/** Password-free view of the accounts, safe to render on the login screen. */
export const DEMO_ACCOUNTS = DEMO_USERS.map(({ username, displayName, role, designation }) => ({
  username,
  displayName,
  role,
  designation,
}));

export function findDemoUser(username) {
  const key = String(username || '').trim().toLowerCase();
  return DEMO_USERS.find((u) => u.username.toLowerCase() === key) || null;
}
