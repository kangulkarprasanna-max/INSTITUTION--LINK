import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/FormControls';
import { CASE_CATEGORY_LIST } from '../../data/constants';

/**
 * Shared "New case" creation dialog.
 *
 * Two entry points use it:
 *  - Institution 360 passes `institution`, which locks the complaint to that
 *    institution (no selector is shown).
 *  - Case Registry passes the full `institutions` list, so the officer picks the
 *    institution the complaint is logged against.
 *
 * A case always belongs to exactly one institution, so that link is required in
 * both modes.
 */
export function NewCaseModal({
  open,
  institution = null,
  institutions = [],
  bureaus,
  sourceLabel = 'Case Registry',
  onClose,
  onCreate,
}) {
  const options = useMemo(
    () =>
      (institution ? [institution] : institutions)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [institution, institutions],
  );

  const emptyForm = () => ({
    institutionId: institution?.institutionId || '',
    subject: '',
    category: '',
    bureauId: bureaus[0]?.bureauId || '',
    assignedOfficer: '',
    dueAt: '',
    description: '',
    nextAction: '',
  });

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  // Re-opening (including after Escape or a backdrop click, which never unmount
  // this component) must always start from a clean form.
  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, institution?.institutionId]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    // Drop the stale error for a field as soon as the officer edits it.
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function validate() {
    const next = {};
    if (!form.institutionId) next.institutionId = 'Choose the institution this complaint is about.';
    if (!form.subject.trim()) next.subject = 'Subject is required.';
    if (!form.category) next.category = 'Choose a category.';
    if (!form.bureauId) next.bureauId = 'Choose a responsible bureau.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit() {
    if (!validate()) return;
    const target = options.find((i) => i.institutionId === form.institutionId);
    onCreate({
      institutionId: form.institutionId,
      subject: form.subject.trim(),
      category: form.category,
      bureauId: form.bureauId,
      assignedOfficer: form.assignedOfficer.trim() || 'Unassigned (Demo)',
      description: form.description.trim(),
      nextAction: form.nextAction.trim() || 'Await triage',
      dueAt: form.dueAt ? new Date(`${form.dueAt}T12:00:00`).toISOString() : undefined,
      initialRemarks: `Case logged from ${sourceLabel} — ${target?.name || form.institutionId}.`,
    });
  }

  const targetName = institution?.name || options.find((i) => i.institutionId === form.institutionId)?.name;

  return (
    <Modal
      open={open}
      title="New case"
      description={
        targetName
          ? `Log a fictional complaint case for ${targetName}.`
          : 'Log a fictional complaint case against an institution.'
      }
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Create case</Button>
        </>
      }
    >
      <div className="space-y-4">
        {institution ? null : (
          <Field label="Institution" htmlFor="nc-institution" hint="Every case belongs to one institution.">
            <Select
              id="nc-institution"
              value={form.institutionId}
              onChange={(e) => set('institutionId', e.target.value)}
              aria-invalid={Boolean(errors.institutionId)}
            >
              <option value="">Select institution…</option>
              {options.map((i) => (
                <option key={i.institutionId} value={i.institutionId}>
                  {i.name} ({i.institutionId})
                </option>
              ))}
            </Select>
            {errors.institutionId ? (
              <p className="mt-1 text-xs text-rose-600">{errors.institutionId}</p>
            ) : null}
          </Field>
        )}

        <Field label="Subject" htmlFor="nc-subject" hint="A short, fictional summary of the complaint.">
          <Input
            id="nc-subject"
            value={form.subject}
            onChange={(e) => set('subject', e.target.value)}
            placeholder="e.g. Renewal documentation query"
            aria-invalid={Boolean(errors.subject)}
          />
          {errors.subject ? <p className="mt-1 text-xs text-rose-600">{errors.subject}</p> : null}
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="nc-category">
            <Select
              id="nc-category"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              aria-invalid={Boolean(errors.category)}
            >
              <option value="">Select category…</option>
              {CASE_CATEGORY_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            {errors.category ? <p className="mt-1 text-xs text-rose-600">{errors.category}</p> : null}
          </Field>
          <Field label="Responsible bureau / cell" htmlFor="nc-bureau">
            <Select
              id="nc-bureau"
              value={form.bureauId}
              onChange={(e) => set('bureauId', e.target.value)}
              aria-invalid={Boolean(errors.bureauId)}
            >
              {bureaus.map((b) => (
                <option key={b.bureauId} value={b.bureauId}>
                  {b.name}
                </option>
              ))}
            </Select>
            {errors.bureauId ? <p className="mt-1 text-xs text-rose-600">{errors.bureauId}</p> : null}
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Assigned officer" htmlFor="nc-officer" hint="Optional. Defaults to Unassigned.">
            <Input
              id="nc-officer"
              value={form.assignedOfficer}
              onChange={(e) => set('assignedOfficer', e.target.value)}
              placeholder="e.g. A. Menon (Demo)"
            />
          </Field>
          <Field label="Due date" htmlFor="nc-due" hint="Optional target date for action.">
            <Input id="nc-due" type="date" value={form.dueAt} onChange={(e) => set('dueAt', e.target.value)} />
          </Field>
        </div>

        <Field label="Description" htmlFor="nc-desc">
          <Textarea
            id="nc-desc"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Fictional case details…"
          />
        </Field>

        <Field label="Next action" htmlFor="nc-next" hint="Optional. Defaults to “Await triage”.">
          <Input
            id="nc-next"
            value={form.nextAction}
            onChange={(e) => set('nextAction', e.target.value)}
            placeholder="e.g. Route to inspection cell"
          />
        </Field>
      </div>
    </Modal>
  );
}
