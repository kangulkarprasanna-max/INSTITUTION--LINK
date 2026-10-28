import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/FormControls';
import { TASK_PRIORITY, TASK_PRIORITY_LIST } from '../../data/constants';
import { toISODateInput, dateInputToIso } from '../../utils/dateUtils';

/**
 * Shared, validated form for creating a cross-bureau coordination task.
 * Used from the Cross-Bureau Intelligence page (with a confirmed pair
 * prepopulated) and from the Coordination Workspace (blank). Every validation
 * rule required by the workflow is enforced before onSubmit is called.
 */
export function TaskFormModal({
  open,
  onClose,
  cases = [],
  bureaus = [],
  bureauById,
  initialCaseIds = [],
  onCreate,
}) {
  const blank = {
    title: '',
    description: '',
    responsibleBureau: '',
    owner: '',
    priority: TASK_PRIORITY.MEDIUM,
    nextAction: '',
    dueAt: '',
    initialRemarks: '',
  };
  const [form, setForm] = useState(blank);
  const [selected, setSelected] = useState([]);
  const [caseQuery, setCaseQuery] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // Reopen with a clean form; prepopulate the confirmed pair when supplied.
  useEffect(() => {
    if (open) {
      setForm(blank);
      setSelected(initialCaseIds.filter((id) => cases.some((c) => c.caseId === id)));
      setCaseQuery('');
      setErrors({});
      setFormError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialCaseIds.join(','), cases.length]);

  const filteredCases = useMemo(() => {
    const q = caseQuery.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter(
      (c) =>
        c.caseId.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        (c.institutionId || '').toLowerCase().includes(q),
    );
  }, [cases, caseQuery]);

  function toggleCase(caseId) {
    setSelected((prev) =>
      prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId],
    );
    setErrors((e) => ({ ...e, cases: undefined }));
  }

  function selectedBureauCount() {
    const set = new Set();
    for (const id of selected) {
      const c = cases.find((x) => x.caseId === id);
      if (c) set.add(c.bureauId);
    }
    return set.size;
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = 'Task title is required.';
    if (!form.responsibleBureau) next.responsibleBureau = 'Responsible bureau is required.';
    if (!form.owner.trim()) next.owner = 'Task owner is required.';
    if (selected.length < 2) {
      next.cases = 'A cross-bureau task must link at least two cases.';
    } else if (selectedBureauCount() < 2) {
      next.cases = 'Selected cases must span at least two different bureaus.';
    }
    let dueIso = null;
    if (form.dueAt) {
      dueIso = dateInputToIso(form.dueAt);
      if (!dueIso) next.dueAt = 'Enter a valid date, or leave it empty.';
    }
    setErrors(next);
    return { ok: Object.keys(next).length === 0, dueIso };
  }

  function submit() {
    const { ok, dueIso } = validate();
    if (!ok) {
      setFormError('Please correct the highlighted fields before creating the task.');
      return;
    }
    const task = onCreate({
      title: form.title.trim(),
      description: form.description.trim(),
      relatedCaseIds: selected,
      responsibleBureau: form.responsibleBureau,
      owner: form.owner.trim(),
      priority: form.priority,
      nextAction: form.nextAction.trim(),
      dueAt: dueIso,
      initialRemarks: form.initialRemarks.trim() || 'Coordination task created.',
      actor: form.owner.trim(),
    });
    if (task) onClose?.();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Create coordination task"
      description="Turn a confirmed cross-bureau relationship into a trackable, accountable task."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Create task</Button>
        </>
      }
    >
      <div className="space-y-4">
        {formError ? (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {formError}
          </div>
        ) : null}

        <Field label="Task title" htmlFor="task-title">
          <Input
            id="task-title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            aria-invalid={Boolean(errors.title)}
            placeholder="e.g. Align approval and grievance timelines"
          />
          {errors.title ? <p className="mt-1 text-xs text-rose-600">{errors.title}</p> : null}
        </Field>

        <Field label="Coordination objective" htmlFor="task-desc">
          <Textarea
            id="task-desc"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="What needs to be coordinated across bureaus…"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Responsible bureau" htmlFor="task-bureau">
            <Select
              id="task-bureau"
              value={form.responsibleBureau}
              onChange={(e) => setForm((f) => ({ ...f, responsibleBureau: e.target.value }))}
              aria-invalid={Boolean(errors.responsibleBureau)}
            >
              <option value="">Select bureau…</option>
              {bureaus.map((b) => (
                <option key={b.bureauId} value={b.bureauId}>
                  {b.name}
                </option>
              ))}
            </Select>
            {errors.responsibleBureau ? (
              <p className="mt-1 text-xs text-rose-600">{errors.responsibleBureau}</p>
            ) : null}
          </Field>
          <Field label="Task owner" htmlFor="task-owner">
            <Input
              id="task-owner"
              value={form.owner}
              onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
              aria-invalid={Boolean(errors.owner)}
              placeholder="Officer / owner"
            />
            {errors.owner ? <p className="mt-1 text-xs text-rose-600">{errors.owner}</p> : null}
          </Field>
          <Field label="Priority" htmlFor="task-priority">
            <Select
              id="task-priority"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            >
              {TASK_PRIORITY_LIST.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Next action" htmlFor="task-next">
            <Input
              id="task-next"
              value={form.nextAction}
              onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))}
              placeholder="Immediate next step"
            />
          </Field>
          <Field label="Due date (optional)" htmlFor="task-due">
            <Input
              id="task-due"
              type="date"
              value={form.dueAt}
              onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
              aria-invalid={Boolean(errors.dueAt)}
            />
            {errors.dueAt ? <p className="mt-1 text-xs text-rose-600">{errors.dueAt}</p> : null}
          </Field>
        </div>

        <Field
          label={`Linked cases (${selected.length} selected)`}
          htmlFor="task-case-search"
          hint="Choose at least two cases handled by at least two different bureaus."
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <Input
              id="task-case-search"
              className="pl-8"
              value={caseQuery}
              onChange={(e) => setCaseQuery(e.target.value)}
              placeholder="Search cases by ID, subject or institution…"
            />
          </div>
          {errors.cases ? <p className="mt-1 text-xs text-rose-600">{errors.cases}</p> : null}

          <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-slate-200">
            {filteredCases.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-500">No cases match this search.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredCases.map((c) => {
                  const checked = selected.includes(c.caseId);
                  return (
                    <li key={c.caseId}>
                      <label className="flex cursor-pointer items-start gap-2 px-3 py-2 text-sm hover:bg-slate-50">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-navy-600 focus:ring-navy-500"
                          checked={checked}
                          onChange={() => toggleCase(c.caseId)}
                        />
                        <span className="min-w-0">
                          <span className="block font-medium text-slate-800">
                            {c.caseId} · {c.subject}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {bureauById(c.bureauId)?.name || c.bureauId} · {c.institutionId}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Field>

        <Field label="Initial remarks" htmlFor="task-remarks">
          <Textarea
            id="task-remarks"
            value={form.initialRemarks}
            onChange={(e) => setForm((f) => ({ ...f, initialRemarks: e.target.value }))}
            placeholder="Recorded as the task's first history entry…"
          />
        </Field>
      </div>
    </Modal>
  );
}
