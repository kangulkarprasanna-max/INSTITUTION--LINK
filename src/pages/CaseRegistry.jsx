import { useMemo, useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useNav } from '../hooks/navigation';
import { PageTitle, Card } from '../components/ui/Typography';
import { Table } from '../components/ui/Table';
import { CaseStatusBadge } from '../components/ui/Badge';
import { Field, Input, Select } from '../components/ui/FormControls';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import {
  CASE_STATUS_LIST,
  CASE_CATEGORY_LIST,
  isActiveCase,
} from '../data/constants';
import { formatDate, relativeDueLabel, isOverdue } from '../utils/dateUtils';
import { isCaseOverdue } from '../utils/metrics';

const SORT_OPTIONS = [
  { value: '-receivedAt', label: 'Newest received' },
  { value: 'receivedAt', label: 'Oldest received' },
  { value: 'dueAt', label: 'Due date (soonest)' },
  { value: '-lastActionAt', label: 'Recent activity' },
  { value: 'status', label: 'Status (A–Z)' },
];

function toTime(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

export function CaseRegistry() {
  const { getCases, getBureaus, institutionById, bureauById } = useData();
  const { navigate } = useNav();
  const cases = getCases();
  const bureaus = getBureaus();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [bureauId, setBureauId] = useState('all');
  const [category, setCategory] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sort, setSort] = useState('-receivedAt');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = cases.filter((c) => {
      if (status !== 'all' && c.status !== status) return false;
      if (bureauId !== 'all' && c.bureauId !== bureauId) return false;
      if (category !== 'all' && c.category !== category) return false;
      if (overdueOnly && !isCaseOverdue(c)) return false;
      if (!q) return true;
      const instName = institutionById(c.institutionId)?.name?.toLowerCase() || '';
      return (
        c.caseId.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.assignedOfficer || '').toLowerCase().includes(q) ||
        instName.includes(q)
      );
    });

    return [...out].sort((a, b) => {
      if (sort === 'status') return a.status.localeCompare(b.status);
      if (sort === 'dueAt') {
        // Push cases without a due date to the end.
        const av = a.dueAt ? toTime(a.dueAt) : Number.MAX_SAFE_INTEGER;
        const bv = b.dueAt ? toTime(b.dueAt) : Number.MAX_SAFE_INTEGER;
        return av - bv;
      }
      const key = sort.replace(/^-/, '');
      const dir = sort.startsWith('-') ? -1 : 1;
      return dir * (toTime(a[key]) - toTime(b[key]));
    });
  }, [cases, query, status, bureauId, category, overdueOnly, sort, institutionById]);

  const hasFilters =
    query.trim() !== '' ||
    status !== 'all' ||
    bureauId !== 'all' ||
    category !== 'all' ||
    overdueOnly ||
    sort !== '-receivedAt';

  function clearFilters() {
    setQuery('');
    setStatus('all');
    setBureauId('all');
    setCategory('all');
    setOverdueOnly(false);
    setSort('-receivedAt');
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Case Registry"
        subtitle="Search, filter and open complaint cases in the shared demonstration dataset."
      />

      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Search" htmlFor="case-search">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                id="case-search"
                className="pl-9"
                placeholder="Case ID, subject, category, officer or institution"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </Field>
          <Field label="Status" htmlFor="case-status">
            <Select id="case-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {CASE_STATUS_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Bureau / Cell" htmlFor="case-bureau">
            <Select id="case-bureau" value={bureauId} onChange={(e) => setBureauId(e.target.value)}>
              <option value="all">All bureaus</option>
              {bureaus.map((b) => (
                <option key={b.bureauId} value={b.bureauId}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Category" htmlFor="case-category">
            <Select id="case-category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              {CASE_CATEGORY_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sort by" htmlFor="case-sort">
            <Select id="case-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <label className="flex select-none items-center gap-2 pb-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-navy-600 focus:ring-navy-500"
              />
              Overdue active cases only
            </label>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Showing {filtered.length} of {cases.length} cases.
          </p>
          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No cases match your filters"
          description="Try clearing the search text or choosing different filter values."
        >
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <Card bodyClassName="p-0">
          <Table
            onRowClick={(row) => navigate('case', { caseId: row.caseId })}
            rowKey={(r) => r.caseId}
            columns={[
              {
                key: 'caseId',
                header: 'Case',
                render: (row) => (
                  <div className="min-w-[200px]">
                    <p className="font-medium text-slate-800">{row.subject}</p>
                    <p className="text-xs text-slate-500">{row.caseId}</p>
                  </div>
                ),
              },
              {
                key: 'institutionId',
                header: 'Institution',
                render: (row) => institutionById(row.institutionId)?.name || row.institutionId,
              },
              { key: 'category', header: 'Category' },
              {
                key: 'bureauId',
                header: 'Bureau',
                render: (row) => bureauById(row.bureauId)?.name || row.bureauId,
              },
              { key: 'assignedOfficer', header: 'Officer' },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <CaseStatusBadge status={row.status} />,
              },
              {
                key: 'receivedAt',
                header: 'Received',
                render: (row) => <span className="text-xs text-slate-500">{formatDate(row.receivedAt)}</span>,
              },
              {
                key: 'dueAt',
                header: 'Due',
                render: (row) => {
                  const overdue = isCaseOverdue(row);
                  return (
                    <div className="text-xs">
                      <p className="text-slate-600">{formatDate(row.dueAt)}</p>
                      {overdue ? (
                        <p className="font-medium text-rose-600">{relativeDueLabel(row.dueAt)}</p>
                      ) : null}
                    </div>
                  );
                },
              },
              {
                key: 'lastActionAt',
                header: 'Last action',
                render: (row) => <span className="text-xs text-slate-500">{formatDate(row.lastActionAt)}</span>,
              },
              {
                key: 'open',
                header: '',
                align: 'right',
                render: () => <ArrowRight className="ml-auto h-4 w-4 text-navy-400" aria-hidden="true" />,
              },
            ]}
            rows={filtered}
          />
        </Card>
      )}
    </div>
  );
}
