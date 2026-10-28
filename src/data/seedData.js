// ---------------------------------------------------------------------------
// Fictional demonstration seed data for INSTITUTION-LINK.
//
// IMPORTANT: Every institution, case, officer and note below is INVENTED for a
// Hackathon prototype. None of it is connected to real AICTE systems, real
// complainants, or real allegations. Bureau/Cell names are illustrative and are
// NOT an authoritative list of AICTE organizational units.
//
// Dates are derived relative to "today" via isoDaysFromToday() so overdue and
// upcoming cases stay meaningful on the day of a presentation.
// ---------------------------------------------------------------------------

import {
  BUREAU,
  CASE_STATUS,
  CASE_CATEGORY,
  CASE_ACTION_TYPE,
  IDENTITY_VERIFICATION_STATUS,
  RELATION_REASON,
  RELATION_REVIEW_STATUS,
  COORDINATION_TASK_STATUS,
  TASK_PRIORITY,
} from './constants';
import { isoDaysFromToday } from '../utils/dateUtils';

export const DEMO_NOTICE =
  'Prototype demonstration — fictional sample data; not connected to AICTE systems.';

export function createSeedDataset() {
  const bureaus = [
    { bureauId: BUREAU.PGRC, name: 'Public Grievance Redressal Cell (PGRC)' },
    { bureauId: BUREAU.REGULATION, name: 'Regulation Bureau' },
    { bureauId: BUREAU.APPROVAL, name: 'Approval Bureau' },
    { bureauId: BUREAU.OTHER, name: 'Other Cell' },
  ];

  const institutions = [
    {
      institutionId: 'INST-001',
      name: 'Meridian Institute of Technology & Management',
      region: 'Western Region',
      address: 'Plot 24, Knowledge Park, Sample City',
      identityVerificationStatus: IDENTITY_VERIFICATION_STATUS.VERIFIED,
    },
    {
      institutionId: 'INST-002',
      name: 'Sunrise College of Engineering',
      region: 'Southern Region',
      address: 'Survey 118, Green Valley Layout, Demo District',
      identityVerificationStatus: IDENTITY_VERIFICATION_STATUS.PENDING,
    },
    {
      institutionId: 'INST-003',
      name: 'Northgate Polytechnic',
      region: 'Northern Region',
      address: 'Sector 7, Industrial Estate, Model Town',
      identityVerificationStatus: IDENTITY_VERIFICATION_STATUS.UNDER_QUERY,
    },
    {
      institutionId: 'INST-004',
      name: 'Vidya Arc School of Architecture',
      region: 'Central Region',
      address: 'Old Campus Road, Example Nagar',
      identityVerificationStatus: IDENTITY_VERIFICATION_STATUS.VERIFIED,
    },
    {
      institutionId: 'INST-005',
      name: 'Lakeside Institute of Pharmacy',
      region: 'Eastern Region',
      address: 'Ring Road, Test Village',
      identityVerificationStatus: IDENTITY_VERIFICATION_STATUS.NOT_STARTED,
    },
    {
      institutionId: 'INST-006',
      name: 'Heritage Academy of Design',
      region: 'Western Region',
      address: 'Fort Lane, Illustration Ward',
      identityVerificationStatus: IDENTITY_VERIFICATION_STATUS.VERIFIED,
    },
    {
      institutionId: 'INST-007',
      name: 'Frontier Institute of Science',
      region: 'Southern Region',
      address: 'Tech Park, Placeholder Hills',
      identityVerificationStatus: IDENTITY_VERIFICATION_STATUS.PENDING,
    },
  ];

  // Case shape mirrors the shared data model exactly.
  const cases = [
    // INST-001 — active across multiple bureaus (cross-bureau overlap)
    {
      caseId: 'CASE-1001', institutionId: 'INST-001', category: CASE_CATEGORY.APPROVAL,
      subject: 'Permission enhancement intake for added seats',
      description: 'Fictional request to increase approved intake; verification of infrastructure records pending.',
      status: CASE_STATUS.IN_PROGRESS, bureauId: BUREAU.APPROVAL, assignedOfficer: 'A. Menon (Demo)',
      receivedAt: isoDaysFromToday(-28), lastActionAt: isoDaysFromToday(-2),
      nextAction: 'Review submitted infrastructure annexure', dueAt: isoDaysFromToday(4),
    },
    {
      caseId: 'CASE-1002', institutionId: 'INST-001', category: CASE_CATEGORY.GRIEVANCE,
      subject: 'Grievance regarding delayed refund processing',
      description: 'Sample student-grievance thread about refund timelines; illustrative only.',
      status: CASE_STATUS.UNDER_REVIEW, bureauId: BUREAU.PGRC, assignedOfficer: 'R. Iyer (Demo)',
      receivedAt: isoDaysFromToday(-15), lastActionAt: isoDaysFromToday(-1),
      nextAction: 'Request status update from institution nodal officer', dueAt: isoDaysFromToday(-3),
    },
    {
      caseId: 'CASE-1003', institutionId: 'INST-001', category: CASE_CATEGORY.COMPLIANCE,
      subject: 'Compliance clarification on faculty quota',
      description: 'Unrelated compliance query about fictional faculty ratio reporting.',
      status: CASE_STATUS.SUBMITTED, bureauId: BUREAU.REGULATION, assignedOfficer: 'S. Kulkarni (Demo)',
      receivedAt: isoDaysFromToday(-4), lastActionAt: isoDaysFromToday(-4),
      nextAction: 'Acknowledge and route to inspection cell', dueAt: isoDaysFromToday(9),
    },
    // INST-002 — active overlap + a closed unrelated case
    {
      caseId: 'CASE-1004', institutionId: 'INST-002', category: CASE_CATEGORY.AFFILIATION,
      subject: 'Affiliation renewal documentation gap',
      description: 'Fictional affiliation renewal with missing statutory declarations.',
      status: CASE_STATUS.ASSIGNED, bureauId: BUREAU.REGULATION, assignedOfficer: 'P. Nair (Demo)',
      receivedAt: isoDaysFromToday(-20), lastActionAt: isoDaysFromToday(-3),
      nextAction: 'Await documents from institution', dueAt: isoDaysFromToday(2),
    },
    {
      caseId: 'CASE-1005', institutionId: 'INST-002', category: CASE_CATEGORY.FINANCIAL,
      subject: 'Fee-structure discrepancy report',
      description: 'Sample financial review of a notional published fee structure.',
      status: CASE_STATUS.IN_PROGRESS, bureauId: BUREAU.OTHER, assignedOfficer: 'D. Sharma (Demo)',
      receivedAt: isoDaysFromToday(-12), lastActionAt: isoDaysFromToday(-1),
      nextAction: 'Reconcile submitted fee schedules', dueAt: isoDaysFromToday(-1),
    },
    {
      caseId: 'CASE-1006', institutionId: 'INST-002', category: CASE_CATEGORY.ACADEMIC,
      subject: 'Curriculum update advisory (closed)',
      description: 'Earlier unrelated academic advisory, now concluded.',
      status: CASE_STATUS.CLOSED, bureauId: BUREAU.REGULATION, assignedOfficer: 'P. Nair (Demo)',
      receivedAt: isoDaysFromToday(-90), lastActionAt: isoDaysFromToday(-40),
      nextAction: 'No further action', dueAt: isoDaysFromToday(-45),
    },
    // INST-003
    {
      caseId: 'CASE-1007', institutionId: 'INST-003', category: CASE_CATEGORY.COMPLIANCE,
      subject: 'Inspection follow-up on laboratory safety',
      description: 'Fictional follow-up after a notional inspection visit.',
      status: CASE_STATUS.IN_PROGRESS, bureauId: BUREAU.REGULATION, assignedOfficer: 'K. Rao (Demo)',
      receivedAt: isoDaysFromToday(-18), lastActionAt: isoDaysFromToday(-2),
      nextAction: 'Verify corrective-action evidence', dueAt: isoDaysFromToday(-6),
    },
    {
      caseId: 'CASE-1008', institutionId: 'INST-003', category: CASE_CATEGORY.GRIEVANCE,
      subject: 'Staff grievance on attendance records',
      description: 'Sample internal grievance thread; entirely fictional.',
      status: CASE_STATUS.RESOLVED, bureauId: BUREAU.PGRC, assignedOfficer: 'R. Iyer (Demo)',
      receivedAt: isoDaysFromToday(-40), lastActionAt: isoDaysFromToday(-8),
      nextAction: 'No further action', dueAt: isoDaysFromToday(-10),
    },
    // INST-004
    {
      caseId: 'CASE-1009', institutionId: 'INST-004', category: CASE_CATEGORY.APPROVAL,
      subject: 'New programme commencement application',
      description: 'Notional application for a new fictional programme start.',
      status: CASE_STATUS.UNDER_REVIEW, bureauId: BUREAU.APPROVAL, assignedOfficer: 'A. Menon (Demo)',
      receivedAt: isoDaysFromToday(-9), lastActionAt: isoDaysFromToday(-1),
      nextAction: 'Schedule expert committee review', dueAt: isoDaysFromToday(6),
    },
    {
      caseId: 'CASE-1010', institutionId: 'INST-004', category: CASE_CATEGORY.AFFILIATION,
      subject: 'Affiliation transfer query',
      description: 'Unrelated fictional query about an affiliation transfer process.',
      status: CASE_STATUS.SUBMITTED, bureauId: BUREAU.REGULATION, assignedOfficer: 'S. Kulkarni (Demo)',
      receivedAt: isoDaysFromToday(-2), lastActionAt: isoDaysFromToday(-2),
      nextAction: 'Classify and assign owner', dueAt: isoDaysFromToday(12),
    },
    // INST-005 — active overlap across two bureaus
    {
      caseId: 'CASE-1011', institutionId: 'INST-005', category: CASE_CATEGORY.APPROVAL,
      subject: 'Renewal of approval with document mismatch',
      description: 'Sample renewal application containing a notional document mismatch.',
      status: CASE_STATUS.ASSIGNED, bureauId: BUREAU.APPROVAL, assignedOfficer: 'T. Das (Demo)',
      receivedAt: isoDaysFromToday(-16), lastActionAt: isoDaysFromToday(-3),
      nextAction: 'Clarify mismatched enclosures', dueAt: isoDaysFromToday(1),
    },
    {
      caseId: 'CASE-1012', institutionId: 'INST-005', category: CASE_CATEGORY.GRIEVANCE,
      subject: 'Grievance on examination conduct',
      description: 'Fictional grievance about a notional examination process.',
      status: CASE_STATUS.IN_PROGRESS, bureauId: BUREAU.PGRC, assignedOfficer: 'R. Iyer (Demo)',
      receivedAt: isoDaysFromToday(-11), lastActionAt: isoDaysFromToday(-1),
      nextAction: 'Collect institution response', dueAt: isoDaysFromToday(-2),
    },
    // INST-006
    {
      caseId: 'CASE-1013', institutionId: 'INST-006', category: CASE_CATEGORY.FINANCIAL,
      subject: 'Grant utilization report review',
      description: 'Sample review of a fictional grant utilization report.',
      status: CASE_STATUS.UNDER_REVIEW, bureauId: BUREAU.OTHER, assignedOfficer: 'D. Sharma (Demo)',
      receivedAt: isoDaysFromToday(-7), lastActionAt: isoDaysFromToday(-1),
      nextAction: 'Cross-check reported expenditures', dueAt: isoDaysFromToday(5),
    },
    {
      caseId: 'CASE-1014', institutionId: 'INST-006', category: CASE_CATEGORY.ACADEMIC,
      subject: 'Programme outcome mapping advisory (resolved)',
      description: 'Earlier academic advisory, now resolved.',
      status: CASE_STATUS.RESOLVED, bureauId: BUREAU.REGULATION, assignedOfficer: 'K. Rao (Demo)',
      receivedAt: isoDaysFromToday(-60), lastActionAt: isoDaysFromToday(-20),
      nextAction: 'No further action', dueAt: isoDaysFromToday(-25),
    },
    // INST-007 — active overlap across three bureaus
    {
      caseId: 'CASE-1015', institutionId: 'INST-007', category: CASE_CATEGORY.COMPLIANCE,
      subject: 'Compliance response on annual reporting',
      description: 'Fictional compliance case about a notional annual report submission.',
      status: CASE_STATUS.IN_PROGRESS, bureauId: BUREAU.REGULATION, assignedOfficer: 'S. Kulkarni (Demo)',
      receivedAt: isoDaysFromToday(-22), lastActionAt: isoDaysFromToday(-2),
      nextAction: 'Assess completeness of filings', dueAt: isoDaysFromToday(-4),
    },
    {
      caseId: 'CASE-1016', institutionId: 'INST-007', category: CASE_CATEGORY.APPROVAL,
      subject: 'Intake change request under scrutiny',
      description: 'Sample approval case for a notional intake change.',
      status: CASE_STATUS.ASSIGNED, bureauId: BUREAU.APPROVAL, assignedOfficer: 'T. Das (Demo)',
      receivedAt: isoDaysFromToday(-14), lastActionAt: isoDaysFromToday(-3),
      nextAction: 'Verify prerequisite approvals', dueAt: isoDaysFromToday(3),
    },
    {
      caseId: 'CASE-1017', institutionId: 'INST-007', category: CASE_CATEGORY.GRIEVANCE,
      subject: 'Escalated grievance on service records',
      description: 'Fictional grievance escalated to the demonstration PGRC.',
      status: CASE_STATUS.UNDER_REVIEW, bureauId: BUREAU.PGRC, assignedOfficer: 'R. Iyer (Demo)',
      receivedAt: isoDaysFromToday(-10), lastActionAt: isoDaysFromToday(-1),
      nextAction: 'Convene coordination note', dueAt: isoDaysFromToday(0),
    },
    // Additional closed/resolved mix
    {
      caseId: 'CASE-1018', institutionId: 'INST-003', category: CASE_CATEGORY.AFFILIATION,
      subject: 'Historical affiliation query (closed)',
      description: 'Unrelated older fictional affiliation query, closed.',
      status: CASE_STATUS.CLOSED, bureauId: BUREAU.REGULATION, assignedOfficer: 'K. Rao (Demo)',
      receivedAt: isoDaysFromToday(-120), lastActionAt: isoDaysFromToday(-70),
      nextAction: 'No further action', dueAt: isoDaysFromToday(-75),
    },
    {
      caseId: 'CASE-1019', institutionId: 'INST-001', category: CASE_CATEGORY.FINANCIAL,
      subject: 'Fee-refund audit follow-up (resolved)',
      description: 'Resolved financial follow-up related to grievance CASE-1002.',
      status: CASE_STATUS.RESOLVED, bureauId: BUREAU.OTHER, assignedOfficer: 'D. Sharma (Demo)',
      receivedAt: isoDaysFromToday(-50), lastActionAt: isoDaysFromToday(-12),
      nextAction: 'No further action', dueAt: isoDaysFromToday(-15),
    },
    {
      caseId: 'CASE-1020', institutionId: 'INST-004', category: CASE_CATEGORY.OTHER,
      subject: 'General administrative enquiry',
      description: 'Sample low-priority administrative enquiry.',
      status: CASE_STATUS.SUBMITTED, bureauId: BUREAU.OTHER, assignedOfficer: 'Unassigned (Demo)',
      receivedAt: isoDaysFromToday(-1), lastActionAt: isoDaysFromToday(-1),
      nextAction: 'Await triage', dueAt: isoDaysFromToday(14),
    },
  ];

  // Case timeline actions. Referenced caseIds all exist above.
  const caseActions = [
    { actionId: 'ACT-2001', caseId: 'CASE-1001', actor: 'A. Menon (Demo)', actionType: CASE_ACTION_TYPE.CREATED, timestamp: isoDaysFromToday(-28), remarks: 'Application logged from demonstration portal.' },
    { actionId: 'ACT-2002', caseId: 'CASE-1001', actor: 'A. Menon (Demo)', actionType: CASE_ACTION_TYPE.STATUS_CHANGE, timestamp: isoDaysFromToday(-2), remarks: 'Moved to In Progress after annexure received.' },
    { actionId: 'ACT-2003', caseId: 'CASE-1002', actor: 'R. Iyer (Demo)', actionType: CASE_ACTION_TYPE.TRIAGED, timestamp: isoDaysFromToday(-14), remarks: 'Triaged and assigned to PGRC.' },
    { actionId: 'ACT-2004', caseId: 'CASE-1002', actor: 'R. Iyer (Demo)', actionType: CASE_ACTION_TYPE.COMMENT, timestamp: isoDaysFromToday(-1), remarks: 'Awaiting institution response; case now overdue.' },
    { actionId: 'ACT-2005', caseId: 'CASE-1004', actor: 'P. Nair (Demo)', actionType: CASE_ACTION_TYPE.ASSIGNED, timestamp: isoDaysFromToday(-3), remarks: 'Assigned to Regulation Bureau owner.' },
    { actionId: 'ACT-2006', caseId: 'CASE-1007', actor: 'K. Rao (Demo)', actionType: CASE_ACTION_TYPE.ESCALATED, timestamp: isoDaysFromToday(-2), remarks: 'Escalated for overdue corrective action.' },
    { actionId: 'ACT-2007', caseId: 'CASE-1008', actor: 'R. Iyer (Demo)', actionType: CASE_ACTION_TYPE.RESOLVED, timestamp: isoDaysFromToday(-8), remarks: 'Grievance resolved to satisfaction.' },
    { actionId: 'ACT-2008', caseId: 'CASE-1012', actor: 'R. Iyer (Demo)', actionType: CASE_ACTION_TYPE.STATUS_CHANGE, timestamp: isoDaysFromToday(-1), remarks: 'Status changed to In Progress.' },
    { actionId: 'ACT-2009', caseId: 'CASE-1015', actor: 'S. Kulkarni (Demo)', actionType: CASE_ACTION_TYPE.COMMENT, timestamp: isoDaysFromToday(-2), remarks: 'Coordination required with Approval Bureau.' },
    { actionId: 'ACT-2010', caseId: 'CASE-1017', actor: 'R. Iyer (Demo)', actionType: CASE_ACTION_TYPE.ESCALATED, timestamp: isoDaysFromToday(-1), remarks: 'Escalated; overlaps with CASE-1016 subject.' },
  ];

  // Cross-case relationships (review status is separate from case status).
  const caseRelations = [
    {
      relationId: 'REL-3001', caseId1: 'CASE-1002', caseId2: 'CASE-1019',
      reason: RELATION_REASON.RELATED_SUBJECT, reviewStatus: RELATION_REVIEW_STATUS.CONFIRMED,
      reviewedBy: 'R. Iyer (Demo)', reviewedAt: isoDaysFromToday(-10),
    },
    {
      relationId: 'REL-3002', caseId1: 'CASE-1015', caseId2: 'CASE-1016',
      reason: RELATION_REASON.SAME_INSTITUTION_OVERLAP, reviewStatus: RELATION_REVIEW_STATUS.PROPOSED,
      reviewedBy: null, reviewedAt: null,
    },
    {
      relationId: 'REL-3003', caseId1: 'CASE-1016', caseId2: 'CASE-1017',
      reason: RELATION_REASON.SAME_INSTITUTION_OVERLAP, reviewStatus: RELATION_REVIEW_STATUS.PROPOSED,
      reviewedBy: null, reviewedAt: null,
    },
    {
      relationId: 'REL-3004', caseId1: 'CASE-1001', caseId2: 'CASE-1003',
      reason: RELATION_REASON.COMMON_EVIDENCE, reviewStatus: RELATION_REVIEW_STATUS.REJECTED,
      reviewedBy: 'S. Kulkarni (Demo)', reviewedAt: isoDaysFromToday(-3),
      remarks: 'Same institution but unrelated subject; kept separate on purpose.',
    },
    {
      // Strong-evidence, confirmed pair that already has a coordination task.
      relationId: 'REL-3005', caseId1: 'CASE-1001', caseId2: 'CASE-1002',
      reason: RELATION_REASON.SAME_INSTITUTION_OVERLAP, reviewStatus: RELATION_REVIEW_STATUS.CONFIRMED,
      reviewedBy: 'R. Iyer (Demo)', reviewedAt: isoDaysFromToday(-1),
      remarks: 'Refund + intake matters at Meridian handled by two bureaus; coordinated.',
    },
    {
      // Needs-review example for the human review workflow.
      relationId: 'REL-3006', caseId1: 'CASE-1011', caseId2: 'CASE-1012',
      reason: RELATION_REASON.SAME_INSTITUTION_OVERLAP, reviewStatus: RELATION_REVIEW_STATUS.NEEDS_REVIEW,
      reviewedBy: 'T. Das (Demo)', reviewedAt: isoDaysFromToday(-1),
      remarks: 'Possible link between renewal and grievance; awaiting more evidence.',
    },
  ];

  // Cross-bureau coordination tasks.
  const coordinationTasks = [
    {
      taskId: 'TASK-4001', relatedCaseIds: ['CASE-1015', 'CASE-1016', 'CASE-1017'],
      title: 'Align approval + compliance + grievance track for Frontier Institute',
      description: 'Coordinate a single next step across Regulation, Approval and PGRC for the three active Frontier cases.',
      responsibleBureau: BUREAU.REGULATION, owner: 'S. Kulkarni (Demo)', priority: TASK_PRIORITY.HIGH,
      nextAction: 'Host joint review call across three bureaus', dueAt: isoDaysFromToday(2),
      status: COORDINATION_TASK_STATUS.IN_PROGRESS, createdAt: isoDaysFromToday(-3),
      lastUpdatedAt: isoDaysFromToday(-1),
      actionHistory: [
        { actionId: 'ACT-4101', actor: 'S. Kulkarni (Demo)', actionType: CASE_ACTION_TYPE.CREATED, timestamp: isoDaysFromToday(-3), remarks: 'Task created from cross-bureau overlap signal.' },
        { actionId: 'ACT-4102', actor: 'S. Kulkarni (Demo)', actionType: CASE_ACTION_TYPE.COMMENT, timestamp: isoDaysFromToday(-1), remarks: 'Invite sent to Approval and PGRC owners.' },
      ],
    },
    {
      taskId: 'TASK-4002', relatedCaseIds: ['CASE-1001', 'CASE-1002'],
      title: 'Reconcile overlapping Meridian institution matters',
      description: 'Agree one point of contact so the intake approval and refund grievance do not diverge.',
      responsibleBureau: BUREAU.PGRC, owner: 'R. Iyer (Demo)', priority: TASK_PRIORITY.HIGH,
      nextAction: 'Confirm single point of contact for institution', dueAt: isoDaysFromToday(-1),
      status: COORDINATION_TASK_STATUS.OPEN, createdAt: isoDaysFromToday(-5),
      lastUpdatedAt: isoDaysFromToday(-5),
      actionHistory: [
        { actionId: 'ACT-4103', actor: 'R. Iyer (Demo)', actionType: CASE_ACTION_TYPE.CREATED, timestamp: isoDaysFromToday(-5), remarks: 'Opened after two active cases hit same institution.' },
      ],
    },
    {
      taskId: 'TASK-4003', relatedCaseIds: ['CASE-1011', 'CASE-1012'],
      title: 'Coordinate Lakeside renewal and grievance timelines',
      description: 'Keep the approval renewal and PGRC grievance on a shared timeline.',
      responsibleBureau: BUREAU.APPROVAL, owner: 'T. Das (Demo)', priority: TASK_PRIORITY.MEDIUM,
      nextAction: 'Consolidate document checklist', dueAt: isoDaysFromToday(4),
      status: COORDINATION_TASK_STATUS.BLOCKED, createdAt: isoDaysFromToday(-6),
      lastUpdatedAt: isoDaysFromToday(-2),
      actionHistory: [
        { actionId: 'ACT-4104', actor: 'T. Das (Demo)', actionType: CASE_ACTION_TYPE.CREATED, timestamp: isoDaysFromToday(-6), remarks: 'Created to align two active cases.' },
        { actionId: 'ACT-4105', actor: 'T. Das (Demo)', actionType: CASE_ACTION_TYPE.COMMENT, timestamp: isoDaysFromToday(-2), remarks: 'Blocked pending institution documents.' },
      ],
    },
    {
      taskId: 'TASK-4004', relatedCaseIds: ['CASE-1002', 'CASE-1019'],
      title: 'Close the loop on Meridian refund grievance and audit',
      description: 'Confirmed link between the refund grievance and the resolved fee-refund audit.',
      responsibleBureau: BUREAU.OTHER, owner: 'D. Sharma (Demo)', priority: TASK_PRIORITY.LOW,
      nextAction: 'None — completed', dueAt: isoDaysFromToday(-12),
      status: COORDINATION_TASK_STATUS.COMPLETED, createdAt: isoDaysFromToday(-20),
      lastUpdatedAt: isoDaysFromToday(-12),
      actionHistory: [
        { actionId: 'ACT-4106', actor: 'D. Sharma (Demo)', actionType: CASE_ACTION_TYPE.CREATED, timestamp: isoDaysFromToday(-20), remarks: 'Created to align grievance and audit follow-up.' },
        { actionId: 'ACT-4107', actor: 'D. Sharma (Demo)', actionType: CASE_ACTION_TYPE.RESOLVED, timestamp: isoDaysFromToday(-12), remarks: 'Refund processed; both cases closed out.' },
      ],
    },
    {
      taskId: 'TASK-4005', relatedCaseIds: ['CASE-1003', 'CASE-1005'],
      title: 'Cross-check unrelated faculty and fee queries',
      description: 'Raised from a weak candidate signal; reviewer decided no coordination was needed.',
      responsibleBureau: BUREAU.REGULATION, owner: 'S. Kulkarni (Demo)', priority: TASK_PRIORITY.LOW,
      nextAction: 'None — cancelled', dueAt: isoDaysFromToday(-3),
      status: COORDINATION_TASK_STATUS.CANCELLED, createdAt: isoDaysFromToday(-4),
      lastUpdatedAt: isoDaysFromToday(-2),
      actionHistory: [
        { actionId: 'ACT-4108', actor: 'S. Kulkarni (Demo)', actionType: CASE_ACTION_TYPE.CREATED, timestamp: isoDaysFromToday(-4), remarks: 'Created from a low-strength candidate.' },
        { actionId: 'ACT-4109', actor: 'S. Kulkarni (Demo)', actionType: CASE_ACTION_TYPE.COMMENT, timestamp: isoDaysFromToday(-2), remarks: 'Cancelled: subjects are unrelated.' },
      ],
    },
  ];

  return {
    bureaus,
    institutions,
    cases,
    caseActions,
    caseRelations,
    coordinationTasks,
  };
}
