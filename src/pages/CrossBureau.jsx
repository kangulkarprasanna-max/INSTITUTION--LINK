import { useMemo, useState } from 'react';
import {
  Network,
  Search,
  ArrowLeftRight,
  Check,
  XCircle,
  Eye,
  ClipboardList,
  Info,
  Gauge,
  RefreshCcw,
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useNav } from '../hooks/navigation';
import { PageTitle, Card } from '../components/ui/Typography';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge, CaseStatusBadge, RelationStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Field, Input, Select } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';
import { TaskFormModal } from '../components/workflows/TaskFormModal';
import { generateCandidates } from '../utils/caseMatching';
import { countCandidateStatuses, coordinationSummary } from '../utils/metrics';
import { parseDate } from '../utils/dateUtils';
import {
  RELATION_REVIEW_STATUS,
  RELATION_REVIEW_LABELS,
  RELATION_REVIEW_STATUS_LIST,
} from '../data/constants';

const REVIEWER = 'Demo Reviewer (Prototype)';

const REASON_OPTIONS = [
  { value: 'same_institution', label: 'Same institution' },
  { value: 'same_category', label: 'Matching category' },
  { value: 'shared_keywords', label: 'Shared keywords' },
  { value: 'temporal', label: 'Close in time' },
  { value: 'explicit', label: 'Explicitly recorded' },
];

function toTime(iso) {
  const d = parseDate(iso);
  return d ? d.getTime() : 0;
}

export function CrossBureau() {
  const {
    getCases,
    getCaseRelations,
    getCoordinationTasks,
    institutionById,
    bureauById,
    caseById,
    setRelationDecision,
    createCoordinationTask,
  } = useData();
  const { navigate } = useNav();

  const cases = getCases();
  const relations = getCaseRelations();
  const tasks = getCoordinationTasks();

  const candidates = useMemo(() => generateCandidates(cases, relations), [cases, relations]);
  const counts = useMemo(() => countCandidateStatuses(candidates), [candidates]);
  const taskSummary = useMemo(() => coordinationSummary(tasks), [tasks]);

  const [filters, setFilters] = useState({
    review: 'all',
    bureauPair: 'all',
    institution: 'all',
    reason: 'all',
    query: '',
  });
  const [sort, setSort] = useState('score');
  const [feedback, setFeedback] = useState(null);

  const [needsReview, setNeedsReview] = useState(null); // candidate
  const [needsRemarks, setNeedsRemarks] = useState('');
  const [taskTarget, setTaskTarget] = useState(null); // candidate

  // Filter option sets derived from the data.
  const bureauPairOptions = useMemo(() => {
    const set = new Map();
    for (const c of candidates) {
      const pair = [c.caseA.bureauId, c.caseB.bureauId].sort();
      set.set(pair.join('|'), pair);
    }
    return [...set.entries()];
  }, [candidates]);

  const institutionOptions = useMemo(() => {
    const set = new Set();
    for (const c of candidates) {
      set.add(c.caseA.institutionId);
      set.add(c.caseB.institutionId);
    }
    return [...set].filter(Boolean).sort();
  }, [candidates]);

  const visible = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    let list = candidates.filter((c) => {
      if (filters.review !== 'all' && c.reviewStatus !== filters.review) return false;
      if (filters.bureauPair !== 'all') {
        const pair = [c.caseA.bureauId, c.caseB.bureauId].sort().join('|');
        if (pair !== filters.bureauPair) return false;
      }
      if (filters.institution !== 'all' && c.caseA.institutionId !== filters.institution && c.caseB.institutionId !== filters.institution) {
        return false;
      }
      if (filters.reason !== 'all' && !c.reasonTypes.includes(filters.reason)) return false;
      if (q) {
        const instNameA = institutionById(c.caseA.institutionId)?.name?.toLowerCase() || '';
        const instNameB = institutionById(c.caseB.institutionId)?.name?.toLowerCase() || '';
        const hay = [c.caseA.caseId, c.caseB.caseId, c.caseA.subject, c.caseB.subject, instNameA, instNameB]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list = list.slice().sort((a, b) => {
      if (sort === 'newest') return toTime(b.latestReceivedAt) - toTime(a.latestReceivedAt);
      if (sort === 'oldest') return toTime(a.oldestReceivedAt) - toTime(b.oldestReceivedAt);
      return b.score - a.score || toTime(b.latestReceivedAt) - toTime(a.latestReceivedAt);
    });
    return list;
  }, [candidates, filters, sort, institutionById]);

  const activeFilters =
    filters.review !== 'all' ||
    filters.bureauPair !== 'all' ||
    filters.institution !== 'all' ||
    filters.reason !== 'all' ||
    filters.query.trim() !== '';

  function clearFilters() {
    setFilters({ review: 'all', bureauPair: 'all', institution: 'all', reason: 'all', query: '' });
  }

  function decide(candidate, decision, remarks) {
    setRelationDecision({
      caseIdA: candidate.caseA.caseId,
      caseIdB: candidate.caseB.caseId,
      decision,
      reviewer: REVIEWER,
      reason: candidate.reasons[0]?.label || 'Reviewed candidate',
      remarks,
    });
    const label = RELATION_REVIEW_LABELS[decision];
    setFeedback({
      tone: 'success',
      message: `Pair marked as “${label}” and saved. This decision persists after refresh and is preserved if the pair is rediscovered.`,
    });
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Cross-Bureau Intelligence"
        subtitle="Explainable candidate matching that supports — but never replaces — a reviewer's decision."
      />

      <div className="flex items-start gap-2.5 rounded-card border border-navy-100 bg-navy-50/60 px-4 py-3 text-sm text-navy-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          Potential connections are proposed from shared institutions, categories, keywords and timing.
          The application does <strong>not</strong> assume two complaints are related, and never merges,
          reassigns or re-statuses a case because a candidate is detected. Only a human reviewer confirms
          a relationship, and only a confirmed relationship can start a coordination task.
        </p>
      </div>

      {/* Summary metrics — derived from the actual records */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Awaiting review" value={counts.awaiting} icon={Eye} hint="New candidates" />
        <MetricCard label="Marked related" value={counts.related} icon={Check} tone="success" />
        <MetricCard label="Marked unrelated" value={counts.unrelated} icon={XCircle} tone="danger" />
        <MetricCard label="Needs review" value={counts.needsReview} icon={ArrowLeftRight} tone="warning" />
        <MetricCard label="Open tasks" value={taskSummary.open} icon={ClipboardList} />
        <MetricCard label="Overdue tasks" value={taskSummary.overdue} icon={Network} tone="danger" />
      </div>

      {feedback ? (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {feedback.message}
        </div>
      ) : null}

      {/* Filters */}
      <Card title="Find candidates" description="Filters combine; Clear resets them all" bodyClassName="p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Search" htmlFor="cb-q">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              <Input
                id="cb-q"
                className="pl-8"
                value={filters.query}
                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                placeholder="Case ID, subject or institution"
              />
            </div>
          </Field>
          <Field label="Review status" htmlFor="cb-review">
            <Select id="cb-review" value={filters.review} onChange={(e) => setFilters((f) => ({ ...f, review: e.target.value }))}>
              <option value="all">All review states</option>
              {RELATION_REVIEW_STATUS_LIST.map((s) => (
                <option key={s} value={s}>
                  {RELATION_REVIEW_LABELS[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Bureau pair" htmlFor="cb-pair">
            <Select id="cb-pair" value={filters.bureauPair} onChange={(e) => setFilters((f) => ({ ...f, bureauPair: e.target.value }))}>
              <option value="all">All bureau pairs</option>
              {bureauPairOptions.map(([key, pair]) => (
                <option key={key} value={key}>
                  {(bureauById(pair[0])?.name || pair[0]).split(' (')[0]} ↔{' '}
                  {(bureauById(pair[1])?.name || pair[1]).split(' (')[0]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Institution" htmlFor="cb-inst">
            <Select id="cb-inst" value={filters.institution} onChange={(e) => setFilters((f) => ({ ...f, institution: e.target.value }))}>
              <option value="all">All institutions</option>
              {institutionOptions.map((id) => (
                <option key={id} value={id}>
                  {institutionById(id)?.name || id}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Matching reason" htmlFor="cb-reason">
            <Select id="cb-reason" value={filters.reason} onChange={(e) => setFilters((f) => ({ ...f, reason: e.target.value }))}>
              <option value="all">Any reason</option>
              {REASON_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sort by" htmlFor="cb-sort">
            <Select id="cb-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="score">Strongest heuristic match</option>
              <option value="newest">Newest candidate</option>
              <option value="oldest">Oldest candidate</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Showing {visible.length} of {candidates.length} candidate pairs
          </p>
          <Button variant="ghost" size="sm" icon={RefreshCcw} onClick={clearFilters} disabled={!activeFilters}>
            Clear filters
          </Button>
        </div>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          icon={Network}
          title={activeFilters ? 'No candidates match these filters' : 'No cross-bureau candidates'}
          description={
            activeFilters
              ? 'Try broadening or clearing the filters to see more candidate pairs.'
              : 'Candidate discovery compares active complaints across different bureaus.'
          }
        />
      ) : (
        <div className="space-y-4">
          {visible.map((c) => (
            <CandidateCard
              key={c.key}
              candidate={c}
              institutionName={(id) => institutionById(id)?.name || id}
              bureauName={(id) => bureauById(id)?.name || id}
              caseExists={(id) => Boolean(caseById(id))}
              onRelated={() => decide(c, RELATION_REVIEW_STATUS.CONFIRMED, undefined)}
              onUnrelated={() => decide(c, RELATION_REVIEW_STATUS.REJECTED, undefined)}
              onNeedsReview={() => {
                setNeedsReview(c);
                setNeedsRemarks('');
              }}
              onViewCase={(id) => navigate('case', { caseId: id })}
              onCreateTask={() => setTaskTarget(c)}
            />
          ))}
        </div>
      )}

      {/* Needs-review remarks modal */}
      <Modal
        open={Boolean(needsReview)}
        onClose={() => setNeedsReview(null)}
        title="Flag for further review"
        description="Record that this pair needs more information before a decision."
        footer={
          <>
            <Button variant="ghost" onClick={() => setNeedsReview(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (needsReview) decide(needsReview, RELATION_REVIEW_STATUS.NEEDS_REVIEW, needsRemarks.trim());
                setNeedsReview(null);
              }}
            >
              Save for review
            </Button>
          </>
        }
      >
        {needsReview ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              {needsReview.caseA.caseId} ↔ {needsReview.caseB.caseId}
            </p>
            <Field label="Remarks (optional)" htmlFor="nr-remarks">
              <textarea
                id="nr-remarks"
                className="field min-h-[80px]"
                value={needsRemarks}
                onChange={(e) => setNeedsRemarks(e.target.value)}
                placeholder="What additional evidence is needed?"
              />
            </Field>
          </div>
        ) : null}
      </Modal>

      {/* Coordination task creation, prepopulated with the confirmed pair */}
      <TaskFormModal
        open={Boolean(taskTarget)}
        onClose={() => setTaskTarget(null)}
        cases={cases}
        bureaus={getBureausFromCases(cases, bureauById)}
        bureauById={bureauById}
        initialCaseIds={taskTarget ? [taskTarget.caseA.caseId, taskTarget.caseB.caseId] : []}
        onCreate={(fields) => {
          const task = createCoordinationTask(fields);
          setFeedback({ tone: 'success', message: `Coordination task ${task.taskId} created for the confirmed pair.` });
          navigate('task', { taskId: task.taskId });
          return task;
        }}
      />
    </div>
  );
}

// Build a small bureau list for the task form from the bureaus already known.
function getBureausFromCases(cases, bureauById) {
  const ids = [...new Set(cases.map((c) => c.bureauId))];
  return ids.map((id) => ({ bureauId: id, name: bureauById(id)?.name || id }));
}

function CaseColumn({ side, c, institutionName, bureauName, onView }) {
  return (
    <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-navy-600">Case {side}</span>
        <CaseStatusBadge status={c.status} />
      </div>
      <button
        type="button"
        onClick={() => onView(c.caseId)}
        className="text-left text-sm font-semibold text-slate-800 hover:text-navy-700 hover:underline"
      >
        {c.subject}
      </button>
      <p className="mt-0.5 text-xs text-slate-500">
        {c.caseId} · {c.category}
      </p>
      <div className="mt-2 space-y-0.5 text-xs text-slate-600">
        <p>
          <span className="text-slate-400">Institution:</span> {institutionName(c.institutionId)}
        </p>
        <p>
          <span className="text-slate-400">Bureau:</span> {bureauName(c.bureauId)}
        </p>
      </div>
    </div>
  );
}

function CandidateCard({ candidate, institutionName, bureauName, caseExists, onRelated, onUnrelated, onNeedsReview, onViewCase, onCreateTask }) {
  const c = candidate;
  const confirmed = c.reviewStatus === RELATION_REVIEW_STATUS.CONFIRMED;
  return (
    <Card bodyClassName="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <RelationStatusBadge status={c.reviewStatus} label={RELATION_REVIEW_LABELS[c.reviewStatus]} />
          {c.reviewedBy ? (
            <span className="text-xs text-slate-500">Reviewed by {c.reviewedBy}</span>
          ) : null}
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700 ring-1 ring-navy-100">
          <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
          Heuristic strength {c.score}/100 · not a probability
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <CaseColumn side="A" c={c.caseA} institutionName={institutionName} bureauName={bureauName} onView={onViewCase} />
        <div className="hidden items-center justify-center text-navy-400 md:flex">
          <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
        </div>
        <CaseColumn side="B" c={c.caseB} institutionName={institutionName} bureauName={bureauName} onView={onViewCase} />
      </div>

      {/* Reasons — only genuine, data-backed ones */}
      <div className="mt-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Why this was flagged</p>
        <ul className="flex flex-wrap gap-1.5">
          {c.reasons.map((r) => (
            <li key={r.type + (r.detail || '')}>
              <Badge tone="info">{r.label}</Badge>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <Button size="sm" icon={Check} onClick={onRelated}>
          Mark related
        </Button>
        <Button size="sm" variant="danger" icon={XCircle} onClick={onUnrelated}>
          Mark unrelated
        </Button>
        <Button size="sm" variant="secondary" icon={ArrowLeftRight} onClick={onNeedsReview}>
          Needs review
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon={Eye}
            onClick={() => onViewCase(c.caseA.caseId)}
            disabled={!caseExists(c.caseA.caseId)}
          >
            View Case A
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={Eye}
            onClick={() => onViewCase(c.caseB.caseId)}
            disabled={!caseExists(c.caseB.caseId)}
          >
            View Case B
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={ClipboardList}
            onClick={onCreateTask}
            disabled={!confirmed}
            title={confirmed ? 'Create a coordination task for this confirmed pair' : 'Confirm the relationship before creating a task'}
          >
            Create task
          </Button>
        </div>
      </div>
      {!confirmed ? (
        <p className="mt-2 text-xs text-slate-400">
          A coordination task can only be created once the relationship is marked related.
        </p>
      ) : null}
    </Card>
  );
}
