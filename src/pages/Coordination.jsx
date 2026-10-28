import { useMemo, useState } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  RefreshCcw,
  AlertTriangle,
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useNav } from '../hooks/navigation';
import { PageTitle, Card } from '../components/ui/Typography';
import { Table } from '../components/ui/Table';
import { TaskStatusBadge, Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/FormControls';
import { TaskFormModal } from '../components/workflows/TaskFormModal';
import { bureausForCaseIds, isTaskOverdue } from '../utils/metrics';
import { formatDate, formatDateTime, parseDate, relativeDueLabel } from '../utils/dateUtils';
import {
  COORDINATION_TASK_STATUS,
  COORDINATION_TASK_STATUS_LIST,
  TASK_PRIORITY,
  TASK_PRIORITY_LIST,
} from '../data/constants';

const PRIORITY_TONE = {
  [TASK_PRIORITY.HIGH]: 'danger',
  [TASK_PRIORITY.MEDIUM]: 'warning',
  [TASK_PRIORITY.LOW]: 'neutral',
};
const PRIORITY_ORDER = { [TASK_PRIORITY.HIGH]: 0, [TASK_PRIORITY.MEDIUM]: 1, [TASK_PRIORITY.LOW]: 2 };

function toTime(iso) {
  const d = parseDate(iso);
  return d ? d.getTime() : Infinity; // tasks without due date sort last for "due"
}

export function Coordination() {
  const { getCoordinationTasks, getCases, bureauById, createCoordinationTask } = useData();
  const { navigate } = useNav();
  const tasks = getCoordinationTasks();
  const cases = getCases();

  const [filters, setFilters] = useState({
    status: 'all',
    bureau: 'all',
    priority: 'all',
    overdueOnly: false,
    query: '',
  });
  const [sort, setSort] = useState('due');
  const [createOpen, setCreateOpen] = useState(false);

  const bureauOptions = useMemo(() => {
    const ids = new Set();
    for (const t of tasks) ids.add(t.responsibleBureau);
    return [...ids];
  }, [tasks]);

  const rows = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    let list = tasks.filter((t) => {
      if (filters.status !== 'all' && t.status !== filters.status) return false;
      if (filters.bureau !== 'all' && t.responsibleBureau !== filters.bureau) return false;
      if (filters.priority !== 'all' && (t.priority || TASK_PRIORITY.MEDIUM) !== filters.priority) return false;
      if (filters.overdueOnly && !isTaskOverdue(t)) return false;
      if (q) {
        const hay = [t.taskId, t.title, t.owner].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list = list.slice().sort((a, b) => {
      if (sort === 'due') return toTime(a.dueAt) - toTime(b.dueAt);
      if (sort === 'updated') return toTime(b.lastUpdatedAt) - toTime(a.lastUpdatedAt);
      if (sort === 'priority')
        return (
          (PRIORITY_ORDER[a.priority || 'Medium'] ?? 1) - (PRIORITY_ORDER[b.priority || 'Medium'] ?? 1) ||
          toTime(a.dueAt) - toTime(b.dueAt)
        );
      return 0;
    });
    return list;
  }, [tasks, filters, sort]);

  const activeFilters =
    filters.status !== 'all' ||
    filters.bureau !== 'all' ||
    filters.priority !== 'all' ||
    filters.overdueOnly ||
    filters.query.trim() !== '';

  function clearFilters() {
    setFilters({ status: 'all', bureau: 'all', priority: 'all', overdueOnly: false, query: '' });
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Coordination Workspace"
        subtitle="Turn a confirmed cross-bureau relationship into an accountable, traceable task."
      />

      <div className="flex items-start gap-2.5 rounded-card border border-navy-100 bg-navy-50/60 px-4 py-3 text-sm text-navy-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          Creating or updating a task never changes the linked complaints — their ownership and status stay
          untouched unless an official edits them in Case Management. Overdue tasks are highlighted, never
          auto-completed.
        </p>
      </div>

      <Card
        title="Coordination tasks"
        description={`${rows.length} of ${tasks.length} tasks shown`}
        bodyClassName="p-5"
        actions={
          <Button icon={Plus} size="sm" onClick={() => setCreateOpen(true)}>
            New task
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Search" htmlFor="co-q">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              <Input
                id="co-q"
                className="pl-8"
                value={filters.query}
                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                placeholder="Task ID, title or owner"
              />
            </div>
          </Field>
          <Field label="Status" htmlFor="co-status">
            <Select id="co-status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              <option value="all">All statuses</option>
              {COORDINATION_TASK_STATUS_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Responsible bureau" htmlFor="co-bureau">
            <Select id="co-bureau" value={filters.bureau} onChange={(e) => setFilters((f) => ({ ...f, bureau: e.target.value }))}>
              <option value="all">All bureaus</option>
              {bureauOptions.map((id) => (
                <option key={id} value={id}>
                  {bureauById(id)?.name || id}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority" htmlFor="co-priority">
            <Select id="co-priority" value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
              <option value="all">Any priority</option>
              {TASK_PRIORITY_LIST.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sort by" htmlFor="co-sort">
            <Select id="co-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="due">Due date (soonest)</option>
              <option value="updated">Recently updated</option>
              <option value="priority">Priority (high first)</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-navy-600 focus:ring-navy-500"
                checked={filters.overdueOnly}
                onChange={(e) => setFilters((f) => ({ ...f, overdueOnly: e.target.checked }))}
              />
              Overdue only
            </label>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Select a row to open the task detail and history.</p>
          <Button variant="ghost" size="sm" icon={RefreshCcw} onClick={clearFilters} disabled={!activeFilters}>
            Clear filters
          </Button>
        </div>

        <div className="mt-4">
          <Table
            columns={[
              {
                key: 'title',
                header: 'Task',
                render: (t) => (
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      {t.taskId} · {t.relatedCaseIds.length} linked case(s)
                    </p>
                  </div>
                ),
              },
              {
                key: 'involved',
                header: 'Bureaus involved',
                render: (t) => {
                  const ids = bureausForCaseIds(cases, t.relatedCaseIds);
                  return (
                    <div className="flex flex-wrap gap-1">
                      {ids.length === 0 ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        ids.map((id) => (
                          <Badge key={id} tone="neutral">
                            {(bureauById(id)?.name || id).split(' (')[0]}
                          </Badge>
                        ))
                      )}
                    </div>
                  );
                },
              },
              {
                key: 'responsible',
                header: 'Responsible',
                render: (t) => (
                  <span className="text-xs text-slate-600">{bureauById(t.responsibleBureau)?.name || t.responsibleBureau}</span>
                ),
              },
              { key: 'owner', header: 'Owner', render: (t) => <span className="text-slate-700">{t.owner}</span> },
              {
                key: 'priority',
                header: 'Priority',
                render: (t) => (
                  <Badge tone={PRIORITY_TONE[t.priority || TASK_PRIORITY.MEDIUM]}>
                    {t.priority || TASK_PRIORITY.MEDIUM}
                  </Badge>
                ),
              },
              { key: 'status', header: 'Status', render: (t) => <TaskStatusBadge status={t.status} /> },
              {
                key: 'due',
                header: 'Due',
                render: (t) => {
                  const overdue = isTaskOverdue(t);
                  return (
                    <span className={overdue ? 'font-medium text-rose-600' : 'text-slate-600'}>
                      {t.dueAt ? formatDate(t.dueAt) : 'No due date'}
                      {overdue ? ` · ${relativeDueLabel(t.dueAt)}` : ''}
                    </span>
                  );
                },
              },
              {
                key: 'updated',
                header: 'Last updated',
                render: (t) => <span className="text-xs text-slate-500">{formatDateTime(t.lastUpdatedAt)}</span>,
              },
            ]}
            rows={rows}
            rowKey={(t) => t.taskId}
            onRowClick={(t) => navigate('task', { taskId: t.taskId })}
            empty={
              activeFilters
                ? 'No tasks match these filters. Try clearing them.'
                : 'No coordination tasks yet. Create one from a confirmed cross-bureau relationship.'
            }
          />
        </div>
      </Card>

      <TaskFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        cases={cases}
        bureaus={bureauOptions.length ? bureauOptions.map((id) => ({ bureauId: id, name: bureauById(id)?.name || id })) :
          [...new Set(cases.map((c) => c.bureauId))].map((id) => ({ bureauId: id, name: bureauById(id)?.name || id }))}
        bureauById={bureauById}
        initialCaseIds={[]}
        onCreate={(fields) => {
          const task = createCoordinationTask(fields);
          setCreateOpen(false);
          navigate('task', { taskId: task.taskId });
          return task;
        }}
      />
    </div>
  );
}
