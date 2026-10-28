import { useMemo, useState } from 'react';
import { Building2, Search, ArrowRight } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useNav } from '../hooks/navigation';
import { PageTitle, Card } from '../components/ui/Typography';
import { Table } from '../components/ui/Table';
import { VerificationBadge, Badge } from '../components/ui/Badge';
import { Field, Input, Select } from '../components/ui/FormControls';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { institutionCaseSummary } from '../utils/metrics';
import { formatDate } from '../utils/dateUtils';

const SORT_OPTIONS = [
  { value: 'name', label: 'Institution name (A–Z)' },
  { value: '-name', label: 'Institution name (Z–A)' },
  { value: '-total', label: 'Most total cases' },
  { value: 'total', label: 'Fewest total cases' },
  { value: '-active', label: 'Most active cases' },
  { value: '-overdue', label: 'Most overdue cases' },
];

export function Institutions() {
  const { getInstitutions, getCases } = useData();
  const { navigate } = useNav();
  const institutions = getInstitutions();
  const cases = getCases();

  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('all');
  const [activeOnly, setActiveOnly] = useState(false);
  const [sort, setSort] = useState('name');

  const regions = useMemo(
    () => [...new Set(institutions.map((i) => i.region).filter(Boolean))].sort(),
    [institutions],
  );

  // Build rows with counts derived live from the shared dataset.
  const baseRows = useMemo(
    () =>
      institutions.map((inst) => {
        const summary = institutionCaseSummary(cases, inst.institutionId);
        return {
          ...inst,
          total: summary.total,
          active: summary.active,
          overdue: summary.overdue,
          crossBureau: summary.crossBureau,
          latestActivity: summary.latestActivity,
        };
      }),
    [institutions, cases],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = baseRows.filter((r) => {
      if (region !== 'all' && r.region !== region) return false;
      if (activeOnly && r.active === 0) return false;
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || r.institutionId.toLowerCase().includes(q);
    });

    out = [...out].sort((a, b) => {
      switch (sort) {
        case '-name':
          return b.name.localeCompare(a.name);
        case 'total':
          return a.total - b.total;
        case '-total':
          return b.total - a.total;
        case '-active':
          return b.active - a.active;
        case '-overdue':
          return b.overdue - a.overdue;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return out;
  }, [baseRows, query, region, activeOnly, sort]);

  const hasFilters = query.trim() !== '' || region !== 'all' || activeOnly || sort !== 'name';

  function clearFilters() {
    setQuery('');
    setRegion('all');
    setActiveOnly(false);
    setSort('name');
  }

  function openInstitution(row) {
    navigate('institution', { institutionId: row.institutionId });
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Institutions"
        subtitle="Directory of fictional demonstration institutions and their cross-bureau case footprint."
      />

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Search" htmlFor="inst-search">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                id="inst-search"
                className="pl-9"
                placeholder="Name or institution ID"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </Field>
          <Field label="Region" htmlFor="inst-region">
            <Select id="inst-region" value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="all">All regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sort by" htmlFor="inst-sort">
            <Select id="inst-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end gap-2">
            <label className="flex select-none items-center gap-2 pb-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-navy-600 focus:ring-navy-500"
              />
              With active cases
            </label>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Showing {rows.length} of {baseRows.length} institutions.
          </p>
          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No institutions match your filters"
          description="Adjust the search text or clear the filters to see the full directory."
        >
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <Card bodyClassName="p-0">
          <Table
            onRowClick={openInstitution}
            rowKey={(r) => r.institutionId}
            columns={[
              {
                key: 'name',
                header: 'Institution',
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-600 ring-1 ring-navy-100">
                      <Building2 className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-800">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.institutionId}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'region', header: 'Region' },
              {
                key: 'identityVerificationStatus',
                header: 'Identity',
                render: (row) => <VerificationBadge status={row.identityVerificationStatus} />,
              },
              { key: 'total', header: 'Total', align: 'right' },
              { key: 'active', header: 'Active', align: 'right' },
              {
                key: 'overdue',
                header: 'Overdue',
                align: 'right',
                render: (row) =>
                  row.overdue > 0 ? (
                    <span className="font-medium text-rose-600">{row.overdue}</span>
                  ) : (
                    <span className="text-slate-400">0</span>
                  ),
              },
              {
                key: 'latestActivity',
                header: 'Last activity',
                render: (row) => (
                  <span className="text-xs text-slate-500">{formatDate(row.latestActivity)}</span>
                ),
              },
              {
                key: 'crossBureau',
                header: 'Cross-bureau',
                align: 'center',
                render: (row) =>
                  row.crossBureau ? (
                    <Badge tone="warning">Overlap</Badge>
                  ) : (
                    <span className="text-slate-400">—</span>
                  ),
              },
              {
                key: 'open',
                header: '',
                align: 'right',
                render: () => <ArrowRight className="ml-auto h-4 w-4 text-navy-400" aria-hidden="true" />,
              },
            ]}
            rows={rows}
          />
        </Card>
      )}
    </div>
  );
}
