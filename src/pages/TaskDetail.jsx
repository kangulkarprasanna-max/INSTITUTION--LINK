import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Pencil,
  X,
  Check,
  Plus,
  Link2,
  ClipboardList,
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useNav } from '../hooks/navigation';
import { PageTitle, Card } from '../components/ui/Typography';
import { TaskStatusBadge, CaseStatusBadge, Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Timeline } from '../components/ui/Timeline';
import { Field, Input, Select, Textarea } from '../components/ui/FormControls';
import { isTaskOverdue } from '../utils/metrics';
import {
  formatDate,
  formatDateTime,
  relativeDueLabel,
  toISODateInput,
  dateInputToIso,
} from '../utils/dateUtils';
import {
  COORDINATION_TASK_STATUS,
  COORDINATION_TASK_STATUS_LIST,
  TASK_PRIORITY,
  TASK_PRIORITY_LIST,
  CASE_ACTION_TYPE,
  isActiveCase,
} from '../data/constants';

const PRIORITY_TONE = {
  [TASK_PRIORITY.HIGH]: 'danger',
  [TASK_PRIORITY.MEDIUM]: 'warning',
  [TASK_PRIORITY.LOW]: 'neutral',
};

function Feedback({ message, tone = 'success' }) {
  if (!message) return null;
  const tones = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-rose-200 bg-rose-50 text-rose-800',
  };
  return (
    <div role="status" className={`rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}>
      {message}
    </div>
  );
}

export function TaskDetail({ taskId }) {
  const {
    getCoordinationTasks,
    getCases,
    bureauById,
    caseById,
    institutionById,
    updateCoordinationTask,
    addTaskProgress,
  } = useData();
  const { navigate, goBack } = useNav();

  const task = getCoordinationTasks().find((t) => t.taskId === taskId) || null;
  const cases = getCases();

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [editFeedback, setEditFeedback] = useState(null);

  const [progressForm, setProgressForm] = useState({ actor: '', remarks: '', nextAction: '' });
  const [progressErrors, setProgressErrors] = useState({});
  const [progressFeedback, setProgressFeedback] = useState(null);

  const history = useMemo(() => (task ? (task.actionHistory || []).slice().reverse() : []), [task]);

  if (!task) {
    return (
      <div className="space-y-6">
        <PageTitle title="Task not found" subtitle="This coordination task may have been reset or removed." />
        <EmptyState icon={ClipboardList} title="Unknown task" description="No coordination task matches this reference.">
          <Button variant="secondary" size="sm" onClick={() => navigate('coordination')}>
            Back to Coordination Workspace
          </Button>
        </EmptyState>
      </div>
    );
  }

  const overdue = isTaskOverdue(task);
  const responsible = bureauById(task.responsibleBureau);
  const linkedCases = task.relatedCaseIds.map((id) => caseById(id)).filter(Boolean);
  const involvedBureauIds = [...new Set(linkedCases.map((c) => c.bureauId))];

  function startEdit() {
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      responsibleBureau: task.responsibleBureau || '',
      owner: task.owner || '',
      priority: task.priority || TASK_PRIORITY.MEDIUM,
      status: task.status || COORDINATION_TASK_STATUS.OPEN,
      nextAction: task.nextAction || '',
      dueAt: toISODateInput(task.dueAt),
    });
    setEditErrors({});
    setEditFeedback(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditForm(null);
    setEditErrors({});
    setEditFeedback(null);
  }

  function saveEdit() {
    const errors = {};
    if (!editForm.title.trim()) errors.title = 'Task title is required.';
    if (!editForm.owner.trim()) errors.owner = 'Task owner is required.';
    if (!editForm.responsibleBureau) errors.responsibleBureau = 'Responsible bureau is required.';
    if (!COORDINATION_TASK_STATUS_LIST.includes(editForm.status)) errors.status = 'Choose a valid status.';
    let dueIso = null;
    if (editForm.dueAt) {
      dueIso = dateInputToIso(editForm.dueAt);
      if (!dueIso) errors.dueAt = 'Enter a valid date, or leave it empty.';
    }
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) {
      setEditFeedback({ tone: 'error', message: 'Please correct the highlighted fields.' });
      return;
    }

    const statusChanged = editForm.status !== task.status;
    updateCoordinationTask(
      task.taskId,
      {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        responsibleBureau: editForm.responsibleBureau,
        owner: editForm.owner.trim(),
        priority: editForm.priority,
        status: editForm.status,
        nextAction: editForm.nextAction.trim(),
        dueAt: dueIso,
      },
      {
        actor: editForm.owner.trim(),
        actionType: statusChanged ? CASE_ACTION_TYPE.STATUS_CHANGE : CASE_ACTION_TYPE.COMMENT,
        remarks: statusChanged
          ? `Task status changed from ${task.status} to ${editForm.status}.`
          : 'Task details updated.',
      },
    );
    setEditing(false);
    setEditForm(null);
    setEditFeedback({ tone: 'success', message: 'Task updated and saved to its history.' });
  }

  function submitProgress() {
    const actor = progressForm.actor.trim() || task.owner;
    const errors = {};
    if (!progressForm.remarks.trim()) errors.remarks = 'Remarks are required.';
    setProgressErrors(errors);
    if (Object.keys(errors).length > 0) {
      setProgressFeedback({ tone: 'error', message: 'Please add remarks for this update.' });
      return;
    }
    addTaskProgress({
      taskId: task.taskId,
      actor,
      actionType: CASE_ACTION_TYPE.COMMENT,
      remarks: progressForm.remarks.trim(),
      nextAction: progressForm.nextAction.trim(),
    });
    setProgressForm({ actor: '', remarks: '', nextAction: '' });
    setProgressFeedback({ tone: 'success', message: 'Progress update added to the task history.' });
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </button>

      <PageTitle
        title={task.title}
        subtitle={`${task.taskId} · ${task.relatedCaseIds.length} linked case(s)`}
        actions={
          editing ? null : (
            <Button variant="secondary" icon={Pencil} onClick={startEdit}>
              Edit task
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <TaskStatusBadge status={task.status} />
        <Badge tone={PRIORITY_TONE[task.priority || TASK_PRIORITY.MEDIUM]}>
          {task.priority || TASK_PRIORITY.MEDIUM} priority
        </Badge>
        <Badge tone="neutral">{responsible?.name || task.responsibleBureau}</Badge>
        {overdue ? <Badge tone="danger">{relativeDueLabel(task.dueAt)}</Badge> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Details / Edit */}
          <Card title={editing ? 'Edit task' : 'Task details'}>
            {editing ? (
              <div className="space-y-4">
                <Feedback message={editFeedback?.message} tone={editFeedback?.tone} />
                <Field label="Task title" htmlFor="td-title">
                  <Input
                    id="td-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    aria-invalid={Boolean(editErrors.title)}
                  />
                  {editErrors.title ? <p className="mt-1 text-xs text-rose-600">{editErrors.title}</p> : null}
                </Field>
                <Field label="Coordination objective" htmlFor="td-desc">
                  <Textarea
                    id="td-desc"
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Responsible bureau" htmlFor="td-bureau">
                    <Select
                      id="td-bureau"
                      value={editForm.responsibleBureau}
                      onChange={(e) => setEditForm((f) => ({ ...f, responsibleBureau: e.target.value }))}
                      aria-invalid={Boolean(editErrors.responsibleBureau)}
                    >
                      <option value="">Select bureau…</option>
                      {getBureauList(cases, bureauById).map((b) => (
                        <option key={b.bureauId} value={b.bureauId}>
                          {b.name}
                        </option>
                      ))}
                    </Select>
                    {editErrors.responsibleBureau ? (
                      <p className="mt-1 text-xs text-rose-600">{editErrors.responsibleBureau}</p>
                    ) : null}
                  </Field>
                  <Field label="Task owner" htmlFor="td-owner">
                    <Input
                      id="td-owner"
                      value={editForm.owner}
                      onChange={(e) => setEditForm((f) => ({ ...f, owner: e.target.value }))}
                      aria-invalid={Boolean(editErrors.owner)}
                    />
                    {editErrors.owner ? <p className="mt-1 text-xs text-rose-600">{editErrors.owner}</p> : null}
                  </Field>
                  <Field label="Status" htmlFor="td-status">
                    <Select
                      id="td-status"
                      value={editForm.status}
                      onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                      aria-invalid={Boolean(editErrors.status)}
                    >
                      {COORDINATION_TASK_STATUS_LIST.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                    {editErrors.status ? <p className="mt-1 text-xs text-rose-600">{editErrors.status}</p> : null}
                  </Field>
                  <Field label="Priority" htmlFor="td-priority">
                    <Select
                      id="td-priority"
                      value={editForm.priority}
                      onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}
                    >
                      {TASK_PRIORITY_LIST.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Due date (optional)" htmlFor="td-due">
                    <Input
                      id="td-due"
                      type="date"
                      value={editForm.dueAt}
                      onChange={(e) => setEditForm((f) => ({ ...f, dueAt: e.target.value }))}
                      aria-invalid={Boolean(editErrors.dueAt)}
                    />
                    {editErrors.dueAt ? <p className="mt-1 text-xs text-rose-600">{editErrors.dueAt}</p> : null}
                  </Field>
                  <Field label="Next action" htmlFor="td-next">
                    <Input
                      id="td-next"
                      value={editForm.nextAction}
                      onChange={(e) => setEditForm((f) => ({ ...f, nextAction: e.target.value }))}
                    />
                  </Field>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                  <Button variant="ghost" icon={X} onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button icon={Check} onClick={saveEdit}>
                    Save changes
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {editFeedback && !editing ? (
                  <div className="mb-4">
                    <Feedback message={editFeedback.message} tone={editFeedback.tone} />
                  </div>
                ) : null}
                {task.description ? (
                  <p className="mb-4 text-sm text-slate-700">{task.description}</p>
                ) : null}
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Detail label="Owner">{task.owner}</Detail>
                  <Detail label="Responsible bureau">{responsible?.name || task.responsibleBureau}</Detail>
                  <Detail label="Bureaus involved">
                    {involvedBureauIds.map((id) => bureauById(id)?.name || id).join(', ') || '—'}
                  </Detail>
                  <Detail label="Priority">{task.priority || TASK_PRIORITY.MEDIUM}</Detail>
                  <Detail label="Status">{task.status}</Detail>
                  <Detail label="Due date">
                    <span className={overdue ? 'font-medium text-rose-600' : ''}>
                      {task.dueAt ? formatDate(task.dueAt) : 'No due date'}
                      {overdue ? ` · ${relativeDueLabel(task.dueAt)}` : ''}
                    </span>
                  </Detail>
                  <Detail label="Next action" full>
                    {task.nextAction || '—'}
                  </Detail>
                  <Detail label="Created">{formatDateTime(task.createdAt)}</Detail>
                  <Detail label="Last updated">{formatDateTime(task.lastUpdatedAt)}</Detail>
                </dl>
              </div>
            )}
          </Card>

          {/* Linked cases */}
          <Card title="Linked cases" description="Jump to a case to inspect or update it">
            {linkedCases.length === 0 ? (
              <p className="text-sm text-slate-500">No linked case records found for this task.</p>
            ) : (
              <ul className="space-y-2">
                {linkedCases.map((c) => (
                  <li
                    key={c.caseId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {c.caseId} · {c.subject}
                      </p>
                      <p className="text-xs text-slate-500">
                        {bureauById(c.bureauId)?.name || c.bureauId} ·{' '}
                        {institutionById(c.institutionId)?.name || c.institutionId}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CaseStatusBadge status={c.status} />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Link2}
                        onClick={() => navigate('case', { caseId: c.caseId })}
                      >
                        Open
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* History */}
          <Card title="Task action history" description="Chronological task activity (newest first)">
            <Timeline actions={history} emptyMessage="No task activity recorded yet." />
          </Card>
        </div>

        {/* Sidebar: progress update */}
        <div className="space-y-4">
          <Card title="Add progress update" description="Record coordinated follow-up on this task">
            <div className="space-y-4">
              <Feedback message={progressFeedback?.message} tone={progressFeedback?.tone} />
              <Field label="Actor / officer" htmlFor="tp-actor" hint="Defaults to the task owner.">
                <Input
                  id="tp-actor"
                  value={progressForm.actor}
                  onChange={(e) => setProgressForm((f) => ({ ...f, actor: e.target.value }))}
                  placeholder={task.owner}
                />
              </Field>
              <Field label="Remarks" htmlFor="tp-remarks">
                <Textarea
                  id="tp-remarks"
                  value={progressForm.remarks}
                  onChange={(e) => setProgressForm((f) => ({ ...f, remarks: e.target.value }))}
                  placeholder="What progressed…"
                  aria-invalid={Boolean(progressErrors.remarks)}
                />
                {progressErrors.remarks ? (
                  <p className="mt-1 text-xs text-rose-600">{progressErrors.remarks}</p>
                ) : null}
              </Field>
              <Field label="Next action (optional)" htmlFor="tp-next">
                <Input
                  id="tp-next"
                  value={progressForm.nextAction}
                  onChange={(e) => setProgressForm((f) => ({ ...f, nextAction: e.target.value }))}
                  placeholder="Updates the task next-action field"
                />
              </Field>
              <div className="flex items-center justify-end">
                <Button icon={Plus} onClick={submitProgress}>
                  Add update
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Accountability" bodyClassName="p-4">
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <span className="text-slate-400">Active cases linked:</span>{' '}
                {linkedCases.filter((c) => isActiveCase(c.status)).length} of {linkedCases.length}
              </li>
              <li>
                <span className="text-slate-400">Overdue:</span> {overdue ? 'Yes' : 'No'}
              </li>
              <li className="text-xs text-slate-400">
                Editing this task never changes the linked complaints themselves.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getBureauList(cases, bureauById) {
  const ids = [...new Set(cases.map((c) => c.bureauId))];
  return ids.map((id) => ({ bureauId: id, name: bureauById(id)?.name || id }));
}

function Detail({ label, children, full = false }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm text-slate-700">{children}</dd>
    </div>
  );
}
