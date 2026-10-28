import { useMemo, useState } from 'react';
import { ArrowLeft, Plus, Search, Network, ExternalLink } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useNav } from '../hooks/navigation';
import { PageTitle, Card } from '../components/ui/Typography';
import { MetricCard } from '../components/ui/MetricCard';
import { Table } from '../components/ui/Table';
import { CaseStatusBadge, VerificationBadge, Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Timeline } from '../components/ui/Timeline';
import { Field, Input, Select, Textarea } from '../components/ui/FormControls';
import { institutionCaseSummary, relationsForCase, isCaseOverdue } from '../utils/metrics';
import {
  CASE_STATUS_LIST,
  CASE_CATEGORY_LIST,
  isActiveCase,
} from '../data/constants';
import { formatDate, relativeDueLabel, isOverdue } from '../utils/dateUtils';

const CATEGORY_OPTIONS = CASE_CATEGORY_LIST;

export function InstitutionDetail({ institutionId }) {
  const { institutionById, getCases, getBureaus, getCaseRelations, caseById, bureauById, createCase, dataset } =
    useData();
  const { navigate, goBack } = useNav();

  const institution = institutionById(institutionId);
  const bureaus = getBureaus();
  const cases = getCases();
  const relations = getCaseRelations();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [bureauFilter, setBureauFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const [newCaseOpen, setNewCaseOpen] = useState(false);

  const summary = useMemo(
    () => institutionCaseSummary(cases, institutionId),
    [cases, institutionId],
  );

  // Cases belonging to this institution only.
  const instCaseIds = useMemo(() => new Set(summary.cases.map((c) => c.caseId)), [summary.cases]);

  const portfolio = useMemo(() => {
    const q = query.trim().toLowerCase();
    return summary.cases.filter((c) => {
      if (status !== 'all' && c.status !== status) return false;
      if (bureauFilter !== 'all' && c.bureauId !== bureauFilter) return false;
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (overdueOnly && !isCaseOverdue(c)) return false;
      if (!q) return true;
      return (
        c.caseId.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    });
  }, [summary.cases, query, status, bureauFilter, categoryFilter, overdueOnly]);

  const hasPortfolioFilters =
    query.trim() !== '' ||
    status !== 'all' ||
    bureauFilter !== 'all' ||
    categoryFilter !== 'all' ||
    overdueOnly;

  function clearPortfolioFilters() {
    setQuery('');
    setStatus('all');
    setBureauFilter('all');
    setCategoryFilter('all');
    setOverdueOnly(false);
  }

  // Group this institution's cases by bureau to make cross-bureau handling visible.
  const bureauGroups = useMemo(() => {
    const map = new Map();
    for (const c of summary.cases) {
      if (!map.has(c.bureauId)) map.set(c.bureauId, []);
      map.get(c.bureauId).push(c);
    }
    return [...map.entries()]
      .map(([bureauId, list]) => ({
        bureauId,
        name: bureauById(bureauId)?.name || bureauId,
        cases: list,
        active: list.filter((c) => isActiveCase(c.status)).length,
      }))
      .sort((a, b) => b.cases.length - a.cases.length);
  }, [summary.cases, bureauById]);

  // Recent activity: latest case actions across this institution's cases.
  const recentActions = useMemo(() => {
    return dataset.caseActions
      .filter((a) => instCaseIds.has(a.caseId))
      .slice()
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [dataset.caseActions, instCaseIds]);

  // Real relationships touching this institution's cases (never inferred).
  const internalRelations = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const c of summary.cases) {
      for (const { relation, otherCaseId } of relationsForCase(relations, c.caseId)) {
        const key = relation.relationId;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ relation, anchorCaseId: c.caseId, otherCaseId });
      }
    }
    return out;
  }, [relations, summary.cases]);

  if (!institution) {
    return (
      <div className="space-y-6">
        <PageTitle title="Institution not found" subtitle="This record may have been reset." />
        <EmptyState title="Unknown institution" description="No institution matches this reference.">
          <Button variant="secondary" size="sm" onClick={() => navigate('institutions')}>
            Back to institutions
          </Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to institutions
      </button>

      <PageTitle
        title={institution.name}
        subtitle={`${institution.institutionId} · ${institution.region} · ${institution.address}`}
        actions={
          <Button icon={Plus} onClick={() => setNewCaseOpen(true)}>
            New case
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Identity verification:</span>
        <VerificationBadge status={institution.identityVerificationStatus} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total cases" value={summary.total} hint="All cases for this institution" />
        <MetricCard label="Active cases" value={summary.active} tone="active" hint="Not resolved or closed" />
        <MetricCard
          label="Resolved / Closed"
          value={summary.resolvedClosed}
          tone="success"
          hint="Cases at a terminal status"
        />
        <MetricCard
          label="Overdue active"
          value={summary.overdue}
          tone="danger"
          hint="Active cases past their due date"
        />
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Search cases" htmlFor="inst-case-search">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                id="inst-case-search"
                className="pl-9"
                placeholder="Case ID, subject or category"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status" htmlFor="inst-case-status">
              <Select id="inst-case-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All</option>
                {CASE_STATUS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Bureau" htmlFor="inst-case-bureau">
              <Select
                id="inst-case-bureau"
                value={bureauFilter}
                onChange={(e) => setBureauFilter(e.target.value)}
              >
                <option value="all">All</option>
                {bureaus.map((b) => (
                  <option key={b.bureauId} value={b.bureauId}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 items-end gap-3">
            <Field label="Category" htmlFor="inst-case-category">
              <Select
                id="inst-case-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <label className="flex select-none items-center gap-2 pb-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-navy-600 focus:ring-navy-500"
              />
              Overdue only
            </label>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Showing {portfolio.length} of {summary.total} institution cases.
          </p>
          {hasPortfolioFilters ? (
            <Button variant="ghost" size="sm" onClick={clearPortfolioFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </Card>

      <Card title="Case portfolio" description="Cases handled by all bureaus for this institution" bodyClassName="p-0">
        {portfolio.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Search}
              title="No cases match"
              description="No institution cases match the current filters."
            />
          </div>
        ) : (
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
              { key: 'category', header: 'Category' },
              { key: 'bureauId', header: 'Bureau', render: (row) => bureauById(row.bureauId)?.name || row.bureauId },
              { key: 'assignedOfficer', header: 'Officer' },
              { key: 'receivedAt', header: 'Received', render: (row) => <span className="text-xs text-slate-500">{formatDate(row.receivedAt)}</span> },
              { key: 'status', header: 'Status', render: (row) => <CaseStatusBadge status={row.status} /> },
              {
                key: 'dueAt',
                header: 'Due',
                render: (row) => {
                  const overdue = isCaseOverdue(row);
                  return (
                    <div className="text-xs">
                      <p className="text-slate-600">{formatDate(row.dueAt)}</p>
                      {overdue ? <p className="font-medium text-rose-600">{relativeDueLabel(row.dueAt)}</p> : null}
                    </div>
                  );
                },
              },
            ]}
            rows={portfolio}
          />
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Cross-bureau visibility" description="Cases grouped by handling bureau / cell">
          {bureauGroups.length === 0 ? (
            <EmptyState title="No cases" description="This institution has no cases to group." />
          ) : (
            <div className="space-y-4">
              {bureauGroups.length > 1 ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <Network className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>
                    This institution is handled by <strong>{bureauGroups.length} bureaus</strong>. Shared
                    involvement is a coordination signal — it does <em>not</em> mean the cases are related.
                  </p>
                </div>
              ) : null}
              {bureauGroups.map((group) => (
                <div key={group.bureauId} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{group.name}</p>
                    <Badge tone="neutral">
                      {group.active} active / {group.cases.length}
                    </Badge>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {group.cases.map((c) => (
                      <li key={c.caseId}>
                        <button
                          type="button"
                          onClick={() => navigate('case', { caseId: c.caseId })}
                          className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-navy-50 hover:text-navy-800"
                        >
                          <span className="truncate">{c.subject}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Recent activity"
          description="Latest case actions across this institution (newest first)"
        >
          <Timeline
            actions={recentActions}
            showCase
            caseLabel={(caseId) => caseById(caseId)?.subject || caseId}
            emptyMessage="No recorded actions for this institution yet."
          />
        </Card>
      </div>

      {internalRelations.length > 0 ? (
        <Card title="Recorded relationships" description="Confirmed / proposed links that involve this institution's cases">
          <ul className="space-y-2">
            {internalRelations.map(({ relation, otherCaseId }) => {
              const other = caseById(otherCaseId);
              const sameInstitution = other && instCaseIds.has(other.caseId);
              return (
                <li
                  key={relation.relationId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm"
                >
                  <span className="text-slate-600">
                    <span className="font-medium text-slate-800">{relation.caseId1}</span> ↔{' '}
                    <span className="font-medium text-slate-800">{relation.caseId2}</span>
                    <span className="ml-2 text-xs text-slate-500">· {relation.reason}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge tone={relation.reviewStatus === 'Confirmed' ? 'success' : relation.reviewStatus === 'Rejected' ? 'danger' : 'warning'}>
                      {relation.reviewStatus}
                    </Badge>
                    {sameInstitution ? (
                      <button
                        type="button"
                        onClick={() => navigate('case', { caseId: otherCaseId })}
                        className="text-xs font-medium text-navy-600 hover:text-navy-800"
                      >
                        Open {otherCaseId}
                      </button>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      <NewCaseModal
        open={newCaseOpen}
        institution={institution}
        bureaus={bureaus}
        onClose={() => setNewCaseOpen(false)}
        onCreate={(fields) => {
          const created = createCase({ ...fields, institutionId: institution.institutionId });
          setNewCaseOpen(false);
          navigate('case', { caseId: created.caseId });
        }}
      />
    </div>
  );
}

function NewCaseModal({ open, institution, bureaus, onClose, onCreate }) {
  const empty = {
    subject: '',
    category: '',
    bureauId: bureaus[0]?.bureauId || '',
    assignedOfficer: '',
    dueAt: '',
    description: '',
    nextAction: '',
  };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const next = {};
    if (!form.subject.trim()) next.subject = 'Subject is required.';
    if (!form.category) next.category = 'Choose a category.';
    if (!form.bureauId) next.bureauId = 'Choose a responsible bureau.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit() {
    if (!validate()) return;
    onCreate({
      subject: form.subject.trim(),
      category: form.category,
      bureauId: form.bureauId,
      assignedOfficer: form.assignedOfficer.trim() || 'Unassigned (Demo)',
      description: form.description.trim(),
      nextAction: form.nextAction.trim() || 'Await triage',
      dueAt: form.dueAt ? new Date(`${form.dueAt}T12:00:00`).toISOString() : undefined,
      initialRemarks: `Case logged from Institution 360 — ${institution.name}.`,
    });
    setForm(empty);
    setErrors({});
  }

  function handleAfterClose() {
    setForm(empty);
    setErrors({});
    onClose();
  }

  return (
    <Modal
      open={open}
      title="New case"
      description={`Log a fictional complaint case for ${institution.name}.`}
      onClose={handleAfterClose}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleAfterClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Create case</Button>
        </>
      }
    >
      <div className="space-y-4">
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
            <Select id="nc-category" value={form.category} onChange={(e) => set('category', e.target.value)}>
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
            <Select id="nc-bureau" value={form.bureauId} onChange={(e) => set('bureauId', e.target.value)}>
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
