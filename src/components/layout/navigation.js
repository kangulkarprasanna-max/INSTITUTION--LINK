import {
  LayoutDashboard,
  Building2,
  FolderSearch,
  Network,
  ClipboardList,
  BarChart3,
} from 'lucide-react';

// Single source of truth for navigation. Every key maps to a real page in
// App.jsx — no entry points to a blank or nonexistent route.
export const PAGES = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Cross-bureau case overview and headline metrics',
  },
  {
    key: 'institutions',
    label: 'Institutions',
    icon: Building2,
    description: 'Directory of institutions and their case footprint',
  },
  {
    key: 'cases',
    label: 'Case Registry',
    icon: FolderSearch,
    description: 'Search, filter and track complaint cases',
  },
  {
    key: 'cross-bureau',
    label: 'Cross-Bureau Intelligence',
    icon: Network,
    description: 'Related and overlapping cases across bureaus',
  },
  {
    key: 'coordination',
    label: 'Coordination Workspace',
    icon: ClipboardList,
    description: 'Joint actions and owners across bureaus',
  },
  {
    key: 'analytics',
    label: 'Analytics & Reports',
    icon: BarChart3,
    description: 'Trends, distributions and report exports',
  },
];

export const PAGE_LABELS = PAGES.reduce((acc, p) => {
  acc[p.key] = p.label;
  return acc;
}, {});

export function getPage(key) {
  return PAGES.find((p) => p.key === key) || PAGES[0];
}
