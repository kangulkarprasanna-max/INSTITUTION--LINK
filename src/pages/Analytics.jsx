import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  Layers,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClipboardList,
  Eye,
  Download,
  Building2,
  Network,
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useNav } from '../hooks/navigation';
import { PageTitle, Card } from '../components/ui/Typography';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Field, Select } from '../components/ui/FormControls';
import { generateCandidates } from '../utils/caseMatching';
import {
  computeDashboardMetrics,
  isCaseOverdue,
  isTaskOverdue,
  countCandidateStatuses,
  coordinationSummary,
  institutionRollups,
  tasksByStatus,
  tasksByBureau,
  relationDecisionsByStatus,
  weeklySeries,
  STATUS_COLOR,
  TASK_STATUS_COLOR,
  REVIEW_STATUS_COLOR,
  CHART_PALETTE,
} from '../utils/metrics';
import { toCSV, downloadCSV } from '../utils/csvExport';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import {
  CASE_STATUS,
  CASE_STATUS_LIST,
  COORDINATION_TASK_STATUS_LIST,
  RELATION_REVIEW_STATUS,
  RELATION_REVIEW_STATUS_LIST,
  RELATION_REVIEW_LABELS,
} from '../data/constants';

const shortBureau = (name) => (name || '').split(' (')[0];

// Consistent, restrained tooltip styling for all charts.
const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  boxShadow: '0 6px 20px rgba(15,23,42,0.08)',
};

function ChartFrame({ title, description, isEmpty, emptyText = 'No data for this view.', children, tall = false }) {
  return (
    <Card title={title} description={description}>
      {isEmpty ? (
        <EmptyState title="Nothing to chart" description={emptyText} />
      ) : (
        <div style={{ height: tall ? 300 : 260 }} className="w-full">
          {children}
        </div>
      )}
    </Card>
  );
}

export function Analytics() {
  const {
    getCases,
    getCaseRelations,
    getCoordinationTasks,
    getBureaus,
    getInstitutions,
    institutionById,
    bureauById,
  } = useData();
  const { navigate } = useNav();

  const cases = getCases();
  const relations = getCaseRelations();
  const tasks = getCoordinationTasks();
  const bureaus = getBureaus();
  const institutions = getInstitutions();

  const [bureauFilter, setBureauFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exportNote, setExportNote] = useState(null);

  // Case-domain charts + CSV respect the active filters; coordination and
  // relationship domains are kept dataset-wide so statuses never blend.
  const scopedCases = useMemo(
    () =>
      cases.filter(
        (c) =>
          (bureauFilter === 'all' || c.bureauId === bureauFilter) &&
          (statusFilter === 'all' || c.status === statusFilter),
      ),
    [cases, bureauFilter, statusFilter],
  );

  const metrics = useMemo(() => computeDashboardMetrics(cases), [cases]);
  const taskSummary = useMemo(() => coordinationSummary(tasks), [tasks]);
  const reviewCounts = useMemo(() => countCandidateStatuses(generateCandidates(cases, relations)), [cases, relations]);

  const resolvedCount = cases.filter((c) => c.status === CASE_STATUS.RESOLVED).length;
  const closedCount = cases.filter((c) => c.status === CASE_STATUS.CLOSED).length;

  // ---- Case-domain chart data (from scopedCases) --------------------------
  const statusData = useMemo(
    () =>
      CASE_STATUS_LIST.map((s) => ({ name: s, value: scopedCases.filter((c) => c.status === s).length })).filter(
        (d) => d.value > 0,
      ),
    [scopedCases],
  );

  const workloadData = useMemo(() => {
    const ids = [...new Set(scopedCases.map((c) => c.bureauId))];
    return ids.map((id) => {
      const own = scopedCases.filter((c) => c.bureauId === id);
      return {
        name: shortBureau(bureauById(id)?.name || id),
        active: own.filter((c) => c.status !== CASE_STATUS.RESOLVED && c.status !== CASE_STATUS.CLOSED).length,
        terminal: own.filter((c) => c.status === CASE_STATUS.RESOLVED || c.status === CASE_STATUS.CLOSED).length,
      };
    });
  }, [scopedCases, bureauById]);

  const overdueByBureau = useMemo(() => {
    const ids = [...new Set(scopedCases.map((c) => c.bureauId))];
    return ids.map((id) => {
      const own = scopedCases.filter((c) => c.bureauId === id);
      return {
        name: shortBureau(bureauById(id)?.name || id),
        active: own.filter((c) => c.status !== CASE_STATUS.RESOLVED && c.status !== CASE_STATUS.CLOSED).length,
        overdue: own.filter(isCaseOverdue).length,
      };
    });
  }, [scopedCases, bureauById]);

  const institutionActiveData = useMemo(() => {
    return institutionRollups(scopedCases, institutions)
      .filter((r) => r.active > 0)
      .sort((a, b) => b.active - a.active)
      .slice(0, 8)
      .map((r) => ({ name: r.name.length > 26 ? `${r.name.slice(0, 25)}…` : r.name, active: r.active }));
  }, [scopedCases, institutions]);

  const intake = useMemo(() => weeklySeries(scopedCases.map((c) => c.receivedAt)), [scopedCases]);

  // ---- Coordination + relationship chart data (dataset-wide) --------------
  const taskStatusData = useMemo(() => {
    const counts = tasksByStatus(tasks);
    return COORDINATION_TASK_STATUS_LIST.filter((s) => counts[s]).map((s) => ({ name: s, value: counts[s] }));
  }, [tasks]);

  const taskBureauData = useMemo(() => {
    const counts = tasksByBureau(tasks);
    return Object.entries(counts).map(([id, value]) => ({ name: shortBureau(bureauById(id)?.name || id), value }));
  }, [tasks, bureauById]);

  const reviewData = useMemo(() => {
    const counts = relationDecisionsByStatus(relations);
    return RELATION_REVIEW_STATUS_LIST.filter((s) => counts[s]).map((s) => ({
      name: RELATION_REVIEW_LABELS[s],
      status: s,
      value: counts[s],
    }));
  }, [relations]);

  // ---- Institutional intelligence -----------------------------------------
  const topInstitutions = useMemo(
    () =>
      institutionRollups(cases, institutions)
        .filter((r) => r.total > 0)
        .sort((a, b) => b.active - a.active || b.total - a.total)
        .slice(0, 6)
        .map((r) => ({
          ...r,
          confirmed: relations.filter((rel) => {
            const a = cases.find((c) => c.caseId === rel.caseId1);
            const b = cases.find((c) => c.caseId === rel.caseId2);
            return (
              rel.reviewStatus === RELATION_REVIEW_STATUS.CONFIRMED &&
              (a?.institutionId === r.institutionId || b?.institutionId === r.institutionId)
            );
          }).length,
        })),
    [cases, institutions, relations],
  );

  // ---- CSV export -----------------------------------------------------------
  function exportCases() {
    const columns = [
      { label: 'Case ID', key: 'caseId' },
      { label: 'Institution', value: (r) => institutionById(r.institutionId)?.name || r.institutionId },
      { label: 'Category', key: 'category' },
      { label: 'Subject', key: 'subject' },
      { label: 'Status', key: 'status' },
      { label: 'Bureau', value: (r) => bureauById(r.bureauId)?.name || r.bureauId },
      { label: 'Assigned Officer', key: 'assignedOfficer' },
      { label: 'Received', value: (r) => formatDate(r.receivedAt) },
      { label: 'Due Date', value: (r) => (r.dueAt ? formatDate(r.dueAt) : '') },
      { label: 'Last Action', value: (r) => formatDateTime(r.lastActionAt) },
      { label: 'Next Action', value: (r) => r.nextAction || '' },
      { label: 'Overdue', value: (r) => (isCaseOverdue(r) ? 'Yes' : 'No') },
    ];
    const csv = toCSV(columns, scopedCases);
    downloadCSV(`institution-link-cases-${formatDate(new Date().toISOString()).replace(/\s/g, '-')}.csv`, csv);
    setExportNote(
      scopedCases.length === 0
        ? 'Exported a file with headers only — no cases match the current filters.'
        : `Exported ${scopedCases.length} case record(s) to CSV.`,
    );
  }

  function exportTasks() {
    const columns = [
      { label: 'Task ID', key: 'taskId' },
      { label: 'Title', key: 'title' },
      { label: 'Status', key: 'status' },
      { label: 'Priority', key: 'priority' },
      { label: 'Responsible Bureau', value: (r) => bureauById(r.responsibleBureau)?.name || r.responsibleBureau },
      { label: 'Owner', key: 'owner' },
      { label: 'Linked Cases', value: (r) => r.relatedCaseIds.join('; ') },
      { label: 'Next Action', value: (r) => r.nextAction || '' },
      { label: 'Due Date', value: (r) => (r.dueAt ? formatDate(r.dueAt) : '') },
      { label: 'Overdue', value: (r) => (isTaskOverdue(r) ? 'Yes' : 'No') },
    ];
    const csv = toCSV(columns, tasks);
    downloadCSV(`institution-link-tasks-${formatDate(new Date().toISOString()).replace(/\s/g, '-')}.csv`, csv);
    setExportNote(
      tasks.length === 0
        ? 'Exported a file with headers only — no coordination tasks yet.'
        : `Exported ${tasks.length} coordination task(s) to CSV.`,
    );
  }

  const filtersActive = bureauFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      <PageTitle
        title="Analytics & Reports"
        subtitle="Trends and distributions derived live from the shared demonstration dataset."
      />

      {/* Executive metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total cases" value={metrics.total} icon={Layers} />
        <MetricCard label="Active cases" value={metrics.active} icon={Activity} tone="active" />
        <MetricCard label="Resolved" value={resolvedCount} icon={CheckCircle2} tone="success" />
        <MetricCard label="Closed" value={closedCount} icon={XCircle} />
        <MetricCard label="Overdue active" value={metrics.overdue} icon={AlertTriangle} tone="danger" />
        <MetricCard label="Open tasks" value={taskSummary.open} icon={ClipboardList} />
        <MetricCard label="Overdue tasks" value={taskSummary.overdue} icon={AlertTriangle} tone="danger" />
        <MetricCard label="Candidates awaiting review" value={reviewCounts.awaiting} icon={Eye} tone="warning" />
      </div>

      {/* Filters + export */}
      <Card title="Case analytics controls" description="Filters scope the case charts and CSV export only." bodyClassName="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:w-2/3">
            <Field label="Bureau / cell" htmlFor="an-bureau">
              <Select id="an-bureau" value={bureauFilter} onChange={(e) => setBureauFilter(e.target.value)}>
                <option value="all">All bureaus</option>
                {bureaus.map((b) => (
                  <option key={b.bureauId} value={b.bureauId}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Case status" htmlFor="an-status">
              <Select id="an-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                {CASE_STATUS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={Download} onClick={exportCases}>
              Export cases CSV
            </Button>
            <Button variant="secondary" size="sm" icon={Download} onClick={exportTasks}>
              Export tasks CSV
            </Button>
            {filtersActive ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBureauFilter('all');
                  setStatusFilter('all');
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>
        {exportNote ? (
          <p role="status" className="mt-3 rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-800">
            {exportNote}
          </p>
        ) : null}
      </Card>

      {/* Case lifecycle charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartFrame
          title="Case distribution by status"
          description={`Across ${scopedCases.length} filtered case(s)`}
          isEmpty={statusData.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLOR[entry.name] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Case workload by bureau" description="Active vs terminal (resolved/closed) composition" isEmpty={workloadData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadData} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} height={48} angle={-12} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="active" name="Active" stackId="a" fill="#2f63a8" radius={[0, 0, 0, 0]} />
              <Bar dataKey="terminal" name="Resolved / Closed" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Active vs overdue cases by bureau" description="Overdue is always a subset of active" isEmpty={overdueByBureau.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overdueByBureau} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} height={48} angle={-12} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="active" name="Active" fill="#0891b2" radius={[4, 4, 0, 0]} />
              <Bar dataKey="overdue" name="Overdue" fill="#e11d48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Institution active-case distribution" description="Top institutions by active case count" isEmpty={institutionActiveData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={institutionActiveData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="active" name="Active cases" fill="#2f63a8" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>

      {/* Date-based trend */}
      <ChartFrame
        title="Weekly case intake"
        description="Cases received per calendar week (real timestamps, grouped locally)"
        isEmpty={intake.empty || intake.series.length === 0}
        emptyText="Not enough historical timestamps to build a meaningful trend for this selection."
        tall
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={intake.series} margin={{ top: 8, right: 16, left: -20, bottom: 4 }}>
            <defs>
              <linearGradient id="intakeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2f63a8" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#2f63a8" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="count" name="Cases received" stroke="#2f63a8" strokeWidth={2} fill="url(#intakeFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>

      {/* Institutional intelligence */}
      <Card
        title="Institutional intelligence"
        description="Cross-bureau activity is not proof of a confirmed relationship — selecting an institution opens its profile."
        bodyClassName="p-0"
      >
        {topInstitutions.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No institutions" description="No institutions have cases in the current dataset." />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {topInstitutions.map((r) => (
              <li key={r.institutionId}>
                <button
                  type="button"
                  onClick={() => navigate('institution', { institutionId: r.institutionId })}
                  className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-navy-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy-500"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-medium text-slate-800">
                      <Building2 className="h-4 w-4 shrink-0 text-navy-500" aria-hidden="true" />
                      {r.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {r.active} active · {r.total} total cases
                      {r.overdue > 0 ? ` · ${r.overdue} overdue` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    {r.crossBureau ? (
                      <Badge tone="info">
                        <Network className="h-3 w-3" aria-hidden="true" /> {r.bureauCount} bureaus
                      </Badge>
                    ) : null}
                    {r.confirmed > 0 ? <Badge tone="success">{r.confirmed} confirmed link(s)</Badge> : null}
                    {r.overdue > 0 ? <Badge tone="danger">{r.overdue} overdue</Badge> : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Coordination + relationship analytics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartFrame title="Coordination tasks by status" description="Task statuses, kept separate from case statuses" isEmpty={taskStatusData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={taskStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {taskStatusData.map((entry) => (
                  <Cell key={entry.name} fill={TASK_STATUS_COLOR[entry.name] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Tasks by responsible bureau" description={`Across ${tasks.length} task(s)`} isEmpty={taskBureauData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={taskBureauData} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} height={48} angle={-12} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" name="Tasks" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame
          title="Relationship-review decisions"
          description="Stored review decisions by review status (distinct from case and task statuses)"
          isEmpty={reviewData.length === 0}
          emptyText="No relationship decisions recorded yet."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reviewData} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} height={48} angle={-12} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" name="Decision count" radius={[4, 4, 0, 0]}>
                {reviewData.map((entry, i) => (
                  <Cell key={entry.status} fill={REVIEW_STATUS_COLOR[entry.status] || CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <Card title="Reading this dashboard" description="How the domains stay separate">
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[CASE_STATUS.IN_PROGRESS] }} />
              Case lifecycle uses complaint statuses (Submitted → Closed).
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: REVIEW_STATUS_COLOR[RELATION_REVIEW_STATUS.NEEDS_REVIEW] }} />
              Relationship review tracks a reviewer decision, never a case outcome.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TASK_STATUS_COLOR[COORDINATION_TASK_STATUS_LIST[0]] }} />
              Coordination tasks track follow-up accountability, separate from cases.
            </li>
            <li className="pt-1 text-xs text-slate-400">
              All figures update automatically as cases, relationships or tasks change. Prototype with fictional
              demonstration data — not connected to AICTE systems.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
