// ---------------------------------------------------------------------------
// DataContext — the single, shared way every page reads and mutates data.
// Later prompts must use this hook instead of importing seed arrays directly.
// ---------------------------------------------------------------------------

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  loadDataset,
  saveDataset,
  resetDataset,
  readSeedDataset,
} from '../services/storageService';
import { generateId, ID_PREFIX } from '../utils/idUtils';
import {
  CASE_STATUS,
  CASE_ACTION_TYPE,
  COORDINATION_TASK_STATUS,
  TASK_PRIORITY,
} from '../data/constants';
import { pairKey } from '../utils/caseMatching';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [dataset, setDataset] = useState(() => loadDataset().dataset);
  const [isReady, setIsReady] = useState(false);

  // Persist whenever the dataset changes (after initial hydration).
  useEffect(() => {
    if (!isReady) {
      setIsReady(true);
      return;
    }
    saveDataset(dataset);
  }, [dataset, isReady]);

  // ---- Read helpers -------------------------------------------------------
  const getInstitutions = useCallback(() => dataset.institutions, [dataset]);
  const getBureaus = useCallback(() => dataset.bureaus, [dataset]);
  const getCases = useCallback(() => dataset.cases, [dataset]);
  const getCaseRelations = useCallback(() => dataset.caseRelations, [dataset]);
  const getCoordinationTasks = useCallback(() => dataset.coordinationTasks, [dataset]);

  const institutionById = useCallback(
    (id) => dataset.institutions.find((i) => i.institutionId === id) || null,
    [dataset],
  );
  const bureauById = useCallback(
    (id) => dataset.bureaus.find((b) => b.bureauId === id) || null,
    [dataset],
  );
  const caseById = useCallback(
    (id) => dataset.cases.find((c) => c.caseId === id) || null,
    [dataset],
  );
  const actionsForCase = useCallback(
    (caseId) =>
      dataset.caseActions
        .filter((a) => a.caseId === caseId)
        .slice()
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    [dataset],
  );

  // ---- Safe generic update ----------------------------------------------
  // Replaces one entity in a collection by matching its id field. Keeps edits
  // consistent and immutability-friendly so React re-renders predictably.
  const updateEntity = useCallback((collectionKey, idField, idValue, patch) => {
    setDataset((prev) => {
      const list = prev[collectionKey];
      if (!Array.isArray(list)) return prev;
      const exists = list.some((item) => item[idField] === idValue);
      if (!exists) return prev; // never silently create on an update path
      return {
        ...prev,
        [collectionKey]: list.map((item) =>
          item[idField] === idValue ? { ...item, ...patch } : item,
        ),
      };
    });
  }, []);

  const updateCase = useCallback(
    (caseId, patch) => updateEntity('cases', 'caseId', caseId, patch),
    [updateEntity],
  );
  const updateInstitution = useCallback(
    (institutionId, patch) =>
      updateEntity('institutions', 'institutionId', institutionId, patch),
    [updateEntity],
  );

  // Append a timeline action to a case (used by later workflow stages).
  const addCaseAction = useCallback(
    ({ caseId, actor, actionType, remarks }) => {
      const action = {
        actionId: generateId(ID_PREFIX.CASE_ACTION),
        caseId,
        actor,
        actionType,
        timestamp: new Date().toISOString(),
        remarks,
      };
      setDataset((prev) => ({ ...prev, caseActions: [...prev.caseActions, action] }));
      return action;
    },
    [],
  );

  // Create a new case (with an initial "Created" timeline action) in a single
  // immutable update so the case and its history never drift apart.
  const createCase = useCallback((fields) => {
    const now = new Date().toISOString();
    const caseId = generateId(ID_PREFIX.CASE);
    const newCase = {
      caseId,
      institutionId: fields.institutionId,
      category: fields.category,
      subject: fields.subject,
      description: fields.description || '',
      status: fields.status || CASE_STATUS.SUBMITTED,
      bureauId: fields.bureauId,
      assignedOfficer: fields.assignedOfficer || 'Unassigned (Demo)',
      receivedAt: now,
      lastActionAt: now,
      nextAction: fields.nextAction || 'Await triage',
      // No due date supplied means "not scheduled", not "due today".
      dueAt: fields.dueAt || null,
    };
    const createdAction = {
      actionId: generateId(ID_PREFIX.CASE_ACTION),
      caseId,
      actor: newCase.assignedOfficer,
      actionType: CASE_ACTION_TYPE.CREATED,
      timestamp: now,
      remarks: fields.initialRemarks || 'Case logged from Institution 360.',
    };
    setDataset((prev) => ({
      ...prev,
      cases: [...prev.cases, newCase],
      caseActions: [...prev.caseActions, createdAction],
    }));
    return newCase;
  }, []);

  // Record a case update and refresh the case's last-action (and optional
  // next-action / due) fields together, so the timeline and case stay in sync.
  const recordCaseAction = useCallback((input) => {
    const now = new Date().toISOString();
    const action = {
      actionId: generateId(ID_PREFIX.CASE_ACTION),
      caseId: input.caseId,
      actor: input.actor,
      actionType: input.actionType,
      timestamp: now,
      remarks: input.remarks,
    };
    setDataset((prev) => {
      const cases = prev.cases.map((c) => {
        if (c.caseId !== input.caseId) return c;
        const patch = { lastActionAt: now };
        if (typeof input.nextAction === 'string' && input.nextAction.trim()) {
          patch.nextAction = input.nextAction.trim();
        }
        if (input.dueAt) patch.dueAt = input.dueAt;
        return { ...c, ...patch };
      });
      return { ...prev, cases, caseActions: [...prev.caseActions, action] };
    });
    return action;
  }, []);

  // Upsert a canonical relationship decision for a case pair. The CaseRelation
  // record is the persisted source of truth; discovering the same pair again
  // (in either order) reuses this record instead of resetting it.
  const setRelationDecision = useCallback(
    ({ caseIdA, caseIdB, decision, reviewer, reason, remarks }) => {
      const now = new Date().toISOString();
      const key = pairKey(caseIdA, caseIdB);
      const [canon1, canon2] = [caseIdA, caseIdB].sort();
      setDataset((prev) => {
        const idx = prev.caseRelations.findIndex((r) => pairKey(r.caseId1, r.caseId2) === key);
        if (idx >= 0) {
          const existing = prev.caseRelations[idx];
          const next = prev.caseRelations.slice();
          next[idx] = {
            ...existing,
            reviewStatus: decision,
            reviewedBy: reviewer,
            reviewedAt: now,
            remarks: typeof remarks === 'string' ? remarks : existing.remarks,
            reason: existing.reason || reason || 'Reviewed candidate',
          };
          return { ...prev, caseRelations: next };
        }
        const record = {
          relationId: generateId(ID_PREFIX.CASE_RELATION),
          caseId1: canon1,
          caseId2: canon2,
          reason: reason || 'Reviewed candidate',
          reviewStatus: decision,
          reviewedBy: reviewer,
          reviewedAt: now,
          remarks: remarks || '',
        };
        return { ...prev, caseRelations: [...prev.caseRelations, record] };
      });
    },
    [],
  );

  // Create a cross-bureau coordination task with an initial history entry.
  const createCoordinationTask = useCallback((fields) => {
    const now = new Date().toISOString();
    const task = {
      taskId: generateId(ID_PREFIX.COORDINATION_TASK),
      relatedCaseIds: fields.relatedCaseIds,
      title: fields.title,
      description: fields.description || '',
      responsibleBureau: fields.responsibleBureau,
      owner: fields.owner,
      priority: fields.priority || TASK_PRIORITY.MEDIUM,
      nextAction: fields.nextAction || '',
      dueAt: fields.dueAt || null,
      status: fields.status || COORDINATION_TASK_STATUS.OPEN,
      createdAt: now,
      lastUpdatedAt: now,
      actionHistory: [
        {
          actionId: generateId(ID_PREFIX.CASE_ACTION),
          actor: fields.actor || fields.owner,
          actionType: CASE_ACTION_TYPE.CREATED,
          timestamp: now,
          remarks: fields.initialRemarks || 'Coordination task created.',
        },
      ],
    };
    setDataset((prev) => ({ ...prev, coordinationTasks: [...prev.coordinationTasks, task] }));
    return task;
  }, []);

  // Update permitted task fields; optionally append a history entry and always
  // refresh lastUpdatedAt.
  const updateCoordinationTask = useCallback((taskId, patch, historyEntry) => {
    const now = new Date().toISOString();
    setDataset((prev) => ({
      ...prev,
      coordinationTasks: prev.coordinationTasks.map((t) => {
        if (t.taskId !== taskId) return t;
        const merged = { ...t, ...patch, lastUpdatedAt: now };
        if (historyEntry) {
          merged.actionHistory = [
            ...(t.actionHistory || []),
            { actionId: generateId(ID_PREFIX.CASE_ACTION), timestamp: now, ...historyEntry },
          ];
        }
        return merged;
      }),
    }));
  }, []);

  // Append a progress update to a task (and optionally set its next action).
  const addTaskProgress = useCallback(
    ({ taskId, actor, actionType, remarks, nextAction }) => {
      const now = new Date().toISOString();
      const entry = {
        actionId: generateId(ID_PREFIX.CASE_ACTION),
        actor,
        actionType: actionType || CASE_ACTION_TYPE.COMMENT,
        timestamp: now,
        remarks,
      };
      setDataset((prev) => ({
        ...prev,
        coordinationTasks: prev.coordinationTasks.map((t) =>
          t.taskId === taskId
            ? {
                ...t,
                lastUpdatedAt: now,
                nextAction:
                  typeof nextAction === 'string' && nextAction.trim() ? nextAction.trim() : t.nextAction,
                actionHistory: [...(t.actionHistory || []), entry],
              }
            : t,
        ),
      }));
      return entry;
    },
    [],
  );

  const resetDemoData = useCallback(() => {
    const fresh = resetDataset();
    setDataset(fresh);
    return fresh;
  }, []);

  const reloadFromSeed = useCallback(() => {
    setDataset(readSeedDataset());
  }, []);

  const value = useMemo(
    () => ({
      dataset,
      isReady,
      // reads
      getInstitutions,
      getBureaus,
      getCases,
      getCaseRelations,
      getCoordinationTasks,
      institutionById,
      bureauById,
      caseById,
      actionsForCase,
      // writes
      updateEntity,
      updateCase,
      updateInstitution,
      addCaseAction,
      createCase,
      recordCaseAction,
      setRelationDecision,
      createCoordinationTask,
      updateCoordinationTask,
      addTaskProgress,
      resetDemoData,
      reloadFromSeed,
    }),
    [
      dataset,
      isReady,
      getInstitutions,
      getBureaus,
      getCases,
      getCaseRelations,
      getCoordinationTasks,
      institutionById,
      bureauById,
      caseById,
      actionsForCase,
      updateEntity,
      updateCase,
      updateInstitution,
      addCaseAction,
      createCase,
      recordCaseAction,
      setRelationDecision,
      createCoordinationTask,
      updateCoordinationTask,
      addTaskProgress,
      resetDemoData,
      reloadFromSeed,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within a <DataProvider>.');
  }
  return ctx;
}
