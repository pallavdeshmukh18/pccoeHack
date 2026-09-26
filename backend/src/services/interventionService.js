const capabilitySnapshotService = require('./capabilitySnapshotService');
/**
 * Phase 6C: Intervention Tracking & Learning Impact
 * Tracks interventions and observes before/after capability state changes without claiming causality.
 */

const DevelopmentIntervention = require('../models/DevelopmentIntervention');
const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');
const Employee = require('../models/Employee');
const JobRole = require('../models/JobRole');
const Skill = require('../models/Skill');
const DevelopmentRecommendation = require('../models/DevelopmentRecommendation');

exports.captureBaselineSnapshot = async (employeeId, skillId) => {
  const cap = await EmployeeSkillCapability.findOne({ employee: employeeId, skill: skillId }).lean();
  
  if (!cap) {
    return {
      capturedAt: new Date(),
      capabilityScore: null,
      proficiencyLevel: null,
      confidenceScore: null,
      trajectoryDirection: null,
      trajectoryVelocity: null,
      evidenceCount: 0,
      effectiveEvidenceCount: 0
    };
  }

  return {
    capturedAt: new Date(),
    capabilityScore: cap.capabilityScore,
    proficiencyLevel: cap.proficiencyLevel,
    confidenceScore: cap.confidenceScore,
    trajectoryDirection: cap.trajectoryDirection,
    trajectoryVelocity: cap.trajectoryVelocity,
    evidenceCount: cap.evidenceCount || 0,
    effectiveEvidenceCount: cap.effectiveEvidenceCount || 0
  };
};

exports.capturePostInterventionSnapshot = async (employeeId, skillId) => {
  return await exports.captureBaselineSnapshot(employeeId, skillId);
};

exports.createIntervention = async (data) => {
  // Validate references
  const emp = await Employee.findById(data.employeeId);
  if (!emp) throw new Error('Employee not found');
  
  const role = await JobRole.findById(data.jobRoleId);
  if (!role) throw new Error('JobRole not found');
  
  const skill = await Skill.findById(data.skillId);
  if (!skill) throw new Error('Skill not found');

  if (data.developmentRecommendationId) {
    const rec = await DevelopmentRecommendation.findById(data.developmentRecommendationId);
    if (!rec) throw new Error('DevelopmentRecommendation not found');
    if (rec.employee.toString() !== data.employeeId.toString() || rec.jobRole.toString() !== data.jobRoleId.toString()) {
      throw new Error('DevelopmentRecommendation does not belong to the requested employee/role');
    }
  }

  // Capture baseline
  const baseline = await exports.captureBaselineSnapshot(data.employeeId, data.skillId);

  let impactStatus = 'NOT_STARTED';
  if (data.status === 'IN_PROGRESS') {
    impactStatus = 'IN_PROGRESS';
  } else if (data.status === 'COMPLETED') {
    // If they create it already completed, we can't do a real delta without a historical baseline. 
    // Handled in completeIntervention if called directly.
    impactStatus = 'IN_PROGRESS';
  }

  const intervention = new DevelopmentIntervention({
    employee: data.employeeId,
    jobRole: data.jobRoleId,
    skill: data.skillId,
    developmentRecommendation: data.developmentRecommendationId || null,
    developmentPriority: data.developmentPriorityId || null,
    title: data.title,
    description: data.description,
    interventionType: data.interventionType || 'OTHER',
    status: data.status || 'PLANNED',
    plannedStartDate: data.plannedStartDate,
    plannedEndDate: data.plannedEndDate,
    actualStartDate: data.actualStartDate,
    completionPercentage: data.completionPercentage || 0,
    baselineSnapshot: baseline,
    impact: { impactStatus }
  });

  await intervention.save();
  return intervention;
};

exports.getIntervention = async (id) => {
  const intervention = await DevelopmentIntervention.findById(id)
    .populate('employee', 'firstName lastName')
    .populate('jobRole', 'title')
    .populate('skill', 'name');
  if (!intervention) throw new Error('Intervention not found');
  return intervention;
};

exports.updateIntervention = async (id, data) => {
  const intervention = await DevelopmentIntervention.findById(id);
  if (!intervention) throw new Error('Intervention not found');

  const allowedUpdates = [
    'title', 'description', 'status', 'plannedStartDate', 'plannedEndDate', 
    'actualStartDate', 'actualEndDate', 'completionPercentage', 'employeeFeedback', 'outcomeNotes'
  ];

  for (const key of allowedUpdates) {
    if (data[key] !== undefined) {
      intervention[key] = data[key];
    }
  }

  if (intervention.actualEndDate && intervention.actualStartDate && new Date(intervention.actualEndDate) < new Date(intervention.actualStartDate)) {
    throw new Error('actualEndDate cannot precede actualStartDate');
  }

  if (intervention.status === 'COMPLETED' && (!intervention.postInterventionSnapshot || intervention.impact.impactStatus === 'IN_PROGRESS')) {
    // Usually completeIntervention() should be used, but if updated via generic endpoint:
    return await exports.completeIntervention(id);
  } else if (intervention.status === 'IN_PROGRESS' && intervention.impact.impactStatus === 'NOT_STARTED') {
     intervention.impact.impactStatus = 'IN_PROGRESS';
  }

  await intervention.save();
  return intervention;
};

exports.calculateInterventionImpact = (baseline, post) => {
  const impact = {
    capabilityScoreDelta: null,
    proficiencyLevelDelta: null,
    confidenceScoreDelta: null,
    trajectoryVelocityDelta: null,
    evidenceCountDelta: null,
    effectiveEvidenceCountDelta: null,
    capabilityImproved: null,
    confidenceImproved: null,
    trajectoryImproved: null,
    assessmentAvailable: false,
    impactStatus: 'COMPLETED_INCONCLUSIVE',
    impactSummary: 'Capability could not be compared because a baseline capability estimate was unavailable.'
  };

  if (post && post.capabilityScore != null) {
    impact.assessmentAvailable = true;
  }

  if (!baseline || baseline.capabilityScore == null || !post || post.capabilityScore == null) {
    return impact;
  }

  impact.capabilityScoreDelta = post.capabilityScore - baseline.capabilityScore;
  impact.proficiencyLevelDelta = post.proficiencyLevel - baseline.proficiencyLevel;
  impact.confidenceScoreDelta = (post.confidenceScore != null && baseline.confidenceScore != null) ? post.confidenceScore - baseline.confidenceScore : null;
  impact.trajectoryVelocityDelta = (post.trajectoryVelocity != null && baseline.trajectoryVelocity != null) ? post.trajectoryVelocity - baseline.trajectoryVelocity : null;
  
  impact.evidenceCountDelta = post.evidenceCount - baseline.evidenceCount;
  impact.effectiveEvidenceCountDelta = post.effectiveEvidenceCount - baseline.effectiveEvidenceCount;

  impact.capabilityImproved = impact.capabilityScoreDelta > 0;
  if (impact.confidenceScoreDelta != null) impact.confidenceImproved = impact.confidenceScoreDelta > 0;
  if (impact.trajectoryVelocityDelta != null) impact.trajectoryImproved = impact.trajectoryVelocityDelta > 0;

  // Tiny float normalization
  const epsilon = 0.000001;
  
  if (impact.capabilityScoreDelta > epsilon) {
    impact.impactStatus = 'COMPLETED_IMPROVED';
    impact.impactSummary = `Observed capability increased from ${baseline.capabilityScore.toFixed(2)} to ${post.capabilityScore.toFixed(2)} after completion of the intervention.`;
  } else if (impact.capabilityScoreDelta < -epsilon) {
    impact.impactStatus = 'COMPLETED_DECLINED';
    impact.impactSummary = 'Observed capability decreased after completion; this does not establish that the intervention caused the decrease.';
  } else {
    impact.impactStatus = 'COMPLETED_NO_MEASURABLE_CHANGE';
    impact.impactSummary = 'No measurable change in observed capability was detected after completion of the intervention.';
  }

  return impact;
};

exports.completeIntervention = async (id) => {
  const intervention = await DevelopmentIntervention.findById(id);
  if (!intervention) throw new Error('Intervention not found');

  intervention.status = 'COMPLETED';
  if (!intervention.actualEndDate) {
    intervention.actualEndDate = new Date();
  }
  intervention.completionPercentage = 100;

  // Capture post snapshot
  intervention.postInterventionSnapshot = await exports.capturePostInterventionSnapshot(intervention.employee, intervention.skill);
  
  // Calculate impact
  intervention.impact = exports.calculateInterventionImpact(intervention.baselineSnapshot, intervention.postInterventionSnapshot);

  try {
    await capabilitySnapshotService.createSnapshot(intervention.employee, intervention.skill, 'INTERVENTION_COMPLETION');
  } catch (e) { console.error('Snapshot failed', e); }

  await intervention.save();
  return intervention;
};
