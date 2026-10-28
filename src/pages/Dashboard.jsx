import { useMemo } from 'react';
import {
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  Network,
  ArrowRight,
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useNav } from '../hooks/navigation';
import { PageTitle, Card } from '../components/ui/Typography';
import { MetricCard } from '../components/ui/MetricCard';
import { CaseStatusBadge, Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { computeDashboardMetrics, isCaseOverdue } from '../utils/metrics';
import { CASE_STATUS_LIST } from '../data/constants';
import { formatDate, relativeDueLabel, parseDate } from '../utils/dateUtils';
import { isActiveCase } from '../data/constants';

function DistributionBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-800">
          {value} <span className="text-xs text-slate-400">({pct}%)</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${value} of ${total}`}
        />
      </div>
    </div>
  );
}

export function Dashboard() {
  const { getCases, bureauById, institutionById } = useData();
  const { navigate } = useNav();
  const cases = getCases();

  const metrics = useMemo(() => computeDashboardMetrics(cases), [cases]);

  const overdueList = useMemo(
    () =>
      cases
        .filter(isCaseOverdue)
        .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)),
    [cases],
  );

  const bureauRows = useMemo(() => {
    return Object.entries(metrics.byBureau)
      .map(([bureauId, count]) => ({
        bureauId,
        name: bureauById(bureauId)?.name || bureauId,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [metrics.byBureau, bureauById]);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Cross-Bureau Case Overview"
        subtitle="Headline metrics computed live from the shared demonstration dataset."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Total cases"
          value={metrics.total}
          icon={Layers}
          tone="default"
          hint="All complaint cases on record"
        />
        <MetricCard
          label="Active cases"
          value={metrics.active}
          icon={Activity}
          tone="active"
          hint="Not yet resolved or closed"
        />
        <MetricCard
          label="Resolved / Closed"
          value={metrics.resolvedClosed}
          icon={CheckCircle2}
          tone="success"
          hint="Cases at a terminal status"
        />
        <MetricCard
          label="Overdue active cases"
          value={metrics.overdue}
          icon={AlertTriangle}
          tone="danger"
          hint="Active cases past their due date"
        />
        <MetricCard
          label="Due within 7 days"
          value={metrics.dueSoon}
          icon={CalendarClock}
          tone="warning"
          hint="Upcoming active-case deadlines"
        />
        <MetricCard
          label="Cross-bureau institutions"
          value={metrics.crossBureauOverlaps.length}
          icon={Network}
          hint="Institutions with active cases in 2+ bureaus"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Cases by status" description="Distribution across the case lifecycle">
          <div className="space-y-4">
            {CASE_STATUS_LIST.map((status) => (
              <DistributionBar
                key={status}
                label={status}
                value={metrics.byStatus[status] || 0}
                total={metrics.total}
                color={{
                  Submitted: '#2f63a8',
                  'Under Review': '#7c3aed',
                  Assigned: '#0891b2',
                  'In Progress': '#d97706',
                  Resolved: '#16a34a',
                  Closed: '#64748b',
                }[status]}
              />
            ))}
          </div>
        </Card>

        <Card
          title="Cases by Bureau / Cell"
          description="Demonstration bureaus, not an authoritative AICTE org list"
          className="lg:col-span-2"
        >
          {bureauRows.length === 0 ? (
            <EmptyState title="No bureau activity" description="No cases are assigned yet." />
          ) : (
            <Table
              columns={[
                { key: 'name', header: 'Bureau / Cell' },
                {
                  key: 'status',
                  header: 'Active cases',
                  render: (row) => {
                    const active = cases.filter(
                      (c) => c.bureauId === row.bureauId && isActiveCase(c.status),
                    ).length;
                    return (
                      <span className="text-sm text-slate-600">
                        {active} of {row.count}
                      </span>
                    );
                  },
                },
                { key: 'count', header: 'Total', align: 'right' },
              ]}
              rows={bureauRows}
              rowKey={(r) => r.bureauId}
            />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="Overdue active cases"
          description="Prioritised coordination signals for reviewers"
          actions={
            <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('cases')}>
              All cases
            </Button>
          }
        >
          {overdueList.length === 0 ? (
            <EmptyState
              title="Nothing overdue"
              description="No active cases are past their due date in the current sample."
            />
          ) : (
            <Table
              columns={[
                {
                  key: 'subject',
                  header: 'Case',
                  render: (row) => (
                    <div className="min-w-[180px]">
                      <p className="font-medium text-slate-800">{row.subject}</p>
                      <p className="text-xs text-slate-500">
                        {institutionById(row.institutionId)?.name || row.institutionId}
                      </p>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => <CaseStatusBadge status={row.status} />,
                },
                {
                  key: 'dueAt',
                  header: 'Due',
                  render: (row) => {
                    const d = parseDate(row.dueAt);
                    return (
                      <div className="text-xs">
                        <Badge tone="danger">{relativeDueLabel(row.dueAt)}</Badge>
                        {d ? <p className="mt-1 text-slate-400">{formatDate(row.dueAt)}</p> : null}
                      </div>
                    );
                  },
                },
              ]}
              rows={overdueList}
              rowKey={(r) => r.caseId}
              onRowClick={(r) => navigate('case', { caseId: r.caseId })}
            />
          )}
        </Card>

        <Card
          title="Cross-bureau overlap preview"
          description="Institutions with active cases in more than one bureau"
          actions={
            <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('cross-bureau')}>
              Review candidates
            </Button>
          }
        >
          {metrics.crossBureauOverlaps.length === 0 ? (
            <EmptyState
              title="No overlaps detected"
              description="No institution currently has active cases spanning multiple bureaus."
            />
          ) : (
            <>
              <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                This shows institutions with cases spread across bureaus — a prompt to review, not proof
                that any two complaints are related. Confirmed relationships are decided only in Cross-Bureau
                Intelligence.
              </p>
              <ul className="space-y-3">
                {metrics.crossBureauOverlaps.map((overlap) => (
                  <li key={overlap.institutionId}>
                    <button
                      type="button"
                      onClick={() => navigate('institution', { institutionId: overlap.institutionId })}
                      className="flex w-full items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-left hover:bg-navy-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy-500"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {institutionById(overlap.institutionId)?.name || overlap.institutionId}
                        </p>
                        <p className="text-xs text-slate-500">
                          {overlap.bureauIds.length} bureaus with active cases
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1">
                        {overlap.bureauIds.map((bId) => (
                          <Badge key={bId} tone="info">
                            {bureauById(bId)?.name?.split(' (')[0] || bId}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
