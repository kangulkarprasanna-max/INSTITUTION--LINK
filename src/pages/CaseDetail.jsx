import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Pencil,
  X,
  Check,
  Plus,
  Building2,
  Link2,
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useNav } from '../hooks/navigation';
import { PageTitle, Card } from '../components/ui/Typography';
import { CaseStatusBadge, Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Timeline } from '../components/ui/Timeline';
import { Field, Input, Select, Textarea } from '../components/ui/FormControls';
import { relationsForCase, isCaseOverdue } from '../utils/metrics';
import {
  CASE_STATUS_LIST,
  CASE_ACTION_TYPE_LIST,
  CASE_ACTION_TYPE,
  isActiveCase,
} from '../data/constants';
import {
  formatDate,
  formatDateTime,
  relativeDueLabel,
  isOverdue,
  toISODateInput,
  dateInputToIso,
} from '../utils/dateUtils';

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

export function CaseDetail({ caseId }) {
  const { caseById, institutionById, bureauById, actionsForCase, getCaseRelations, updateCase, recordCaseAction } =
    useData();
  const { navigate, goBack } = useNav();

  const currentCase = caseById(caseId);
  const relations = getCaseRelations();

  // ---- Edit form state ----------------------------------------------------
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [editFeedback, setEditFeedback] = useState(null);

  // ---- Add-action form state ----------------------------------------------
  const [actionForm, setActionForm] = useState({
    actionType: CASE_ACTION_TYPE.COMMENT,
    remarks: '',
    actor: '',
    nextAction: '',
    dueAt: '',
  });
  const [actionErrors, setActionErrors] = useState({});
  const [actionFeedback, setActionFeedback] = useState(null);

  // Keep default actor synced to the assigned officer when not editing it.
  useEffect(() => {
    if (currentCase && actionForm.actor === '') {
      setActionForm((f) => (f.actor === '' ? { ...f, actor: currentCase.assignedOfficer } : f));
    }
  }, [currentCase, actionForm.actor]);

  const timeline = useMemo(
    () => (currentCase ? actionsForCase(currentCase.caseId).slice().reverse() : []),
    [currentCase, actionsForCase],
  );

  const related = useMemo(
    () => (currentCase ? relationsForCase(relations, currentCase.caseId) : []),
    [relations, currentCase],
  );

  if (!currentCase) {
    return (
      <div className="space-y-6">
        <PageTitle title="Case not found" subtitle="This case may have been reset or removed." />
        <EmptyState title="Unknown case" description="No case matches this reference.">
          <Button variant="secondary" size="sm" onClick={() => navigate('cases')}>
            Back to Case Registry
          </Button>
        </EmptyState>
      </div>
    );
  }

  const institution = institutionById(currentCase.institutionId);
  const bureau = bureauById(currentCase.bureauId);
  const overdue = isCaseOverdue(currentCase);

  function startEdit() {
    setEditForm({
      assignedOfficer: currentCase.assignedOfficer || '',
      status: currentCase.status,
      dueAt: toISODateInput(currentCase.dueAt),
      nextAction: currentCase.nextAction || '',
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
    if (!editForm.assignedOfficer.trim()) errors.assignedOfficer = 'Assigned officer is required.';
    if (!CASE_STATUS_LIST.includes(editForm.status)) errors.status = 'Choose a valid status.';
    if (!editForm.dueAt) errors.dueAt = 'Due date is required.';
    else if (!dateInputToIso(editForm.dueAt)) errors.dueAt = 'Enter a valid date.';
    if (!editForm.nextAction.trim()) errors.nextAction = 'Next action is required.';
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) {
      setEditFeedback({ tone: 'error', message: 'Please correct the highlighted fields.' });
      return;
    }

    const previousStatus = currentCase.status;
    const nextStatus = editForm.status;
    const statusChanged = previousStatus !== nextStatus;
    const actor = editForm.assignedOfficer.trim();

    updateCase(currentCase.caseId, {
      assignedOfficer: actor,
      status: nextStatus,
      dueAt: dateInputToIso(editForm.dueAt),
      nextAction: editForm.nextAction.trim(),
    });

    // A status change is an audit-trail event: append a "Status Change" entry
    // to the case timeline and refresh lastActionAt (recordCaseAction does both),
    // so the case history and the Institution 360 activity feed stay in sync.
    if (statusChanged) {
      recordCaseAction({
        caseId: currentCase.caseId,
        actor,
        actionType: CASE_ACTION_TYPE.STATUS_CHANGE,
        remarks: `Status changed from \u201c${previousStatus}\u201d to \u201c${nextStatus}\u201d.`,
      });
    }

    setEditing(false);
    setEditForm(null);
    setEditFeedback({ tone: 'success', message: 'Case updated and saved.' });
  }

  function submitAction() {
    const errors = {};
    if (!actionForm.remarks.trim()) errors.remarks = 'Remarks are required.';
    if (!actionForm.actor.trim()) errors.actor = 'Actor / officer is required.';
    let dueIso = null;
    if (actionForm.dueAt) {
      dueIso = dateInputToIso(actionForm.dueAt);
      if (!dueIso) errors.dueAt = 'Enter a valid date.';
    }
    setActionErrors(errors);
    if (Object.keys(errors).length > 0) {
      setActionFeedback({ tone: 'error', message: 'Please correct the highlighted fields.' });
      return;
    }

    recordCaseAction({
      caseId: currentCase.caseId,
      actor: actionForm.actor.trim(),
      actionType: actionForm.actionType,
      remarks: actionForm.remarks.trim(),
      nextAction: actionForm.nextAction.trim(),
      dueAt: dueIso || undefined,
    });

    setActionForm((f) => ({
      actionType: CASE_ACTION_TYPE.COMMENT,
      remarks: '',
      actor: currentCase.assignedOfficer || '',
      nextAction: '',
      dueAt: '',
    }));
    setActionFeedback({ tone: 'success', message: 'Action added to the case timeline.' });
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
        title={currentCase.subject}
        subtitle={`${currentCase.caseId} · ${currentCase.category}`}
        actions={
          editing ? null : (
            <Button variant="secondary" icon={Pencil} onClick={startEdit}>
              Edit case
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <CaseStatusBadge status={currentCase.status} />
        <Badge tone="neutral">{bureau?.name || currentCase.bureauId}</Badge>
        {overdue ? (
          <Badge tone="danger">{relativeDueLabel(currentCase.dueAt)}</Badge>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Institution link */}
          <Card title="Institution">
            {institution ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-600 ring-1 ring-navy-100">
                    <Building2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-medium text-slate-800">{institution.name}</p>
                    <p className="text-xs text-slate-500">
                      {institution.institutionId} · {institution.region}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Link2}
                  onClick={() => navigate('institution', { institutionId: institution.institutionId })}
                >
                  Open Institution 360
                </Button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Linked institution record not found.</p>
            )}
          </Card>

          {/* Details / Edit */}
          <Card title={editing ? 'Edit case' : 'Case details'}>
            {editing ? (
              <div className="space-y-4">
                <Feedback message={editFeedback?.message} tone={editFeedback?.tone} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Assigned officer" htmlFor="edit-officer">
                    <Input
                      id="edit-officer"
                      value={editForm.assignedOfficer}
                      onChange={(e) => setEditForm((f) => ({ ...f, assignedOfficer: e.target.value }))}
                      aria-invalid={Boolean(editErrors.assignedOfficer)}
                    />
                    {editErrors.assignedOfficer ? (
                      <p className="mt-1 text-xs text-rose-600">{editErrors.assignedOfficer}</p>
                    ) : null}
                  </Field>
                  <Field label="Status" htmlFor="edit-status">
                    <Select
                      id="edit-status"
                      value={editForm.status}
                      onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                    >
                      {CASE_STATUS_LIST.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                    {editErrors.status ? (
                      <p className="mt-1 text-xs text-rose-600">{editErrors.status}</p>
                    ) : null}
                  </Field>
                  <Field label="Due date" htmlFor="edit-due">
                    <Input
                      id="edit-due"
                      type="date"
                      value={editForm.dueAt}
                      onChange={(e) => setEditForm((f) => ({ ...f, dueAt: e.target.value }))}
                      aria-invalid={Boolean(editErrors.dueAt)}
                    />
                    {editErrors.dueAt ? <p className="mt-1 text-xs text-rose-600">{editErrors.dueAt}</p> : null}
                  </Field>
                  <Field label="Next action" htmlFor="edit-next">
                    <Input
                      id="edit-next"
                      value={editForm.nextAction}
                      onChange={(e) => setEditForm((f) => ({ ...f, nextAction: e.target.value }))}
                      aria-invalid={Boolean(editErrors.nextAction)}
                    />
                    {editErrors.nextAction ? (
                      <p className="mt-1 text-xs text-rose-600">{editErrors.nextAction}</p>
                    ) : null}
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
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Detail label="Description" full>
                    <p className="text-sm text-slate-700">{currentCase.description || '—'}</p>
                  </Detail>
                  <Detail label="Category">{currentCase.category}</Detail>
                  <Detail label="Responsible bureau">{bureau?.name || currentCase.bureauId}</Detail>
                  <Detail label="Assigned officer">{currentCase.assignedOfficer}</Detail>
                  <Detail label="Status">{currentCase.status}</Detail>
                  <Detail label="Received">{formatDate(currentCase.receivedAt)}</Detail>
                  <Detail label="Due date">
                    <span className={overdue ? 'font-medium text-rose-600' : ''}>
                      {formatDate(currentCase.dueAt)}
                      {overdue ? ` · ${relativeDueLabel(currentCase.dueAt)}` : ''}
                    </span>
                  </Detail>
                  <Detail label="Last action">{formatDateTime(currentCase.lastActionAt)}</Detail>
                  <Detail label="Next action" full>
                    {currentCase.nextAction || '—'}
                  </Detail>
                </dl>
              </div>
            )}
          </Card>

          {/* Action history */}
          <Card title="Action history" description="Chronological case activity (newest first)">
            <Timeline actions={timeline} emptyMessage="No actions recorded for this case yet." />
          </Card>
        </div>

        {/* Sidebar: add action + related */}
        <div className="space-y-4">
          <Card title="Add action" description="Record an update to this case">
            <div className="space-y-4">
              <Feedback message={actionFeedback?.message} tone={actionFeedback?.tone} />
              <Field label="Action type" htmlFor="act-type">
                <Select
                  id="act-type"
                  value={actionForm.actionType}
                  onChange={(e) => setActionForm((f) => ({ ...f, actionType: e.target.value }))}
                >
                  {CASE_ACTION_TYPE_LIST.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Remarks" htmlFor="act-remarks">
                <Textarea
                  id="act-remarks"
                  value={actionForm.remarks}
                  onChange={(e) => setActionForm((f) => ({ ...f, remarks: e.target.value }))}
                  placeholder="Summary of the action taken…"
                  aria-invalid={Boolean(actionErrors.remarks)}
                />
                {actionErrors.remarks ? (
                  <p className="mt-1 text-xs text-rose-600">{actionErrors.remarks}</p>
                ) : null}
              </Field>
              <Field label="Actor / officer" htmlFor="act-actor">
                <Input
                  id="act-actor"
                  value={actionForm.actor}
                  onChange={(e) => setActionForm((f) => ({ ...f, actor: e.target.value }))}
                  aria-invalid={Boolean(actionErrors.actor)}
                />
                {actionErrors.actor ? <p className="mt-1 text-xs text-rose-600">{actionErrors.actor}</p> : null}
              </Field>
              <Field label="Next action (optional)" htmlFor="act-next">
                <Input
                  id="act-next"
                  value={actionForm.nextAction}
                  onChange={(e) => setActionForm((f) => ({ ...f, nextAction: e.target.value }))}
                  placeholder="Updates the case next-action field"
                />
              </Field>
              <Field label="New due date (optional)" htmlFor="act-due">
                <Input
                  id="act-due"
                  type="date"
                  value={actionForm.dueAt}
                  onChange={(e) => setActionForm((f) => ({ ...f, dueAt: e.target.value }))}
                  aria-invalid={Boolean(actionErrors.dueAt)}
                />
                {actionErrors.dueAt ? <p className="mt-1 text-xs text-rose-600">{actionErrors.dueAt}</p> : null}
              </Field>
              <div className="flex items-center justify-end">
                <Button icon={Plus} onClick={submitAction}>
                  Add action
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Related cases" description="Only actual recorded relationships">
            {related.length === 0 ? (
              <p className="text-sm text-slate-500">
                No relationship records exist for this case. Cases are never linked automatically just
                because they share an institution.
              </p>
            ) : (
              <ul className="space-y-2">
                {related.map(({ relation, otherCaseId }) => {
                  const other = caseById(otherCaseId);
                  return (
                    <li
                      key={relation.relationId}
                      className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-800">
                          {other?.subject || otherCaseId}
                        </span>
                        <Badge
                          tone={
                            relation.reviewStatus === 'Confirmed'
                              ? 'success'
                              : relation.reviewStatus === 'Rejected'
                                ? 'danger'
                                : 'warning'
                          }
                        >
                          {relation.reviewStatus}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {relation.reason} · {otherCaseId}
                      </p>
                      {other ? (
                        <button
                          type="button"
                          onClick={() => navigate('case', { caseId: otherCaseId })}
                          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-navy-600 hover:text-navy-800"
                        >
                          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Open case
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, children, full = false }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm text-slate-700">{children}</dd>
    </div>
  );
}
