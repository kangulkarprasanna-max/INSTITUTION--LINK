# INSTITUTION-LINK

**Cross-Bureau Case Intelligence and Coordination Platform**

A Smart India Hackathon 2026 prototype built for AICTE problem statement **SIH26264**. INSTITUTION-LINK is an integrated dashboard for monitoring institution-related complaint cases across bureaus, giving officials a shared view of case status, relationships, and coordination tasks.

## Features

- **Login** — Prototype sign-in screen with selectable demonstration accounts and officer roles.
- **Dashboard** — Cross-bureau case overview with headline metrics.
- **Institutions** — Directory of institutions and their case footprint.
- **Institution 360** — Detailed institution profile with overview metrics, a scoped case portfolio, cross-bureau visibility, and a recent-activity timeline.
- **Case Registry** — Searchable and filterable registry of complaint cases, with a detail view for editing officer, status, due date, and next action, plus an action-history audit trail.
- **Cross-Bureau Intelligence** — Related and overlapping cases matched across bureaus.
- **Coordination Workspace** — Joint actions and owners across bureaus.
- **Analytics & Reports** — Trends, distributions, and report exports.

Data is persisted in the browser's `localStorage` and seeded with fictional sample data on first load, so the prototype runs fully client-side with no backend required.

## Signing In

The login screen lists four demonstration accounts. Every one uses the same password: **`demo1234`**.

| User ID | Officer | Role |
| --- | --- | --- |
| `r.iyer` | R. Iyer (Demo) | Bureau Case Officer |
| `a.menon` | A. Menon (Demo) | Bureau Case Officer |
| `s.kulkarni` | S. Kulkarni (Demo) | Cross-Bureau Reviewer |
| `admin` | Nodal Officer (Demo) | Nodal Officer |

Selecting an account fills the form; the session is kept in `localStorage` so a page refresh stays signed in, and **Sign out** clears it. Roles are displayed on the officer's identity in the header and sidebar — they do not restrict any screen in this stage. Accounts and the session live in `src/data/users.js` and `src/services/authService.js`, which is deliberately isolated so a real identity provider can replace it later.

## Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3 (with PostCSS and Autoprefixer)
- **Visualization:** Recharts
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app is served at [http://localhost:5173](http://localhost:5173).

### Production Build

```bash
npm run build
```

The optimized bundle is output to the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable UI, layout, and workflow components
├── data/             # Constants, fictional seed data and demo accounts
├── hooks/            # Navigation, data and auth hooks
├── pages/            # Top-level feature pages (Login, Dashboard, Cases, etc.)
├── services/         # localStorage persistence and prototype auth services
├── utils/            # Case matching, CSV export, date/ID helpers, metrics
├── App.jsx           # Application root and routing
└── main.jsx          # Entry point
```

## Notes

This is a hackathon prototype. All institutions, cases, officers and accounts are fictional, and data is stored locally in the browser. Clearing `localStorage` will reset the app to its seeded state. The login screen is a demonstration of an officer workflow only — it is not real authentication and must not be presented as secure.
