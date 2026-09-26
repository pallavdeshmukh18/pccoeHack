const ManagerAction = require('../models/ManagerAction');
const SkillRisk = require('../models/SkillRisk');
const DevelopmentPriority = require('../models/EmployeeDevelopmentPriority');

exports.generateActions = async () => {
  await ManagerAction.deleteMany({ status: 'OPEN' });

  const criticalRisks = await SkillRisk.find({ riskLevel: 'CRITICAL', scopeType: 'ORGANIZATION' }).populate('skill');
  for (const risk of criticalRisks) {
    await ManagerAction.create({
      type: 'SKILL_RISK',
      severity: 'HIGH',
      title: `Critical Skill Shortage: ${risk.skill.name}`,
      description: `Only ${risk.capableEmployeeCount} capable employees globally. Concentration score: ${risk.concentrationScore.toFixed(2)}.`,
      referenceType: 'SkillRisk',
      referenceId: risk._id,
      recommendedNextStep: 'Launch global upskilling program or hire externally.',
      status: 'OPEN'
    });
  }

  const priorities = await DevelopmentPriority.find().populate('employee').populate('priorities.skill');
  for (const p of priorities) {
    const top = p.priorities.find(pr => pr.priorityScore >= 0.75); // canonical 0-1 scale
    if (top) {
      await ManagerAction.create({
        type: 'DEVELOPMENT_PRIORITY',
        severity: 'MEDIUM',
        title: `High Priority Development: ${p.employee.firstName} ${p.employee.lastName}`,
        description: `Employee has a critical gap in ${top.skill.name} needed for their role.`,
        referenceType: 'Employee',
        referenceId: p.employee._id,
        recommendedNextStep: 'Schedule 1:1 and initiate a copilot development plan.',
        status: 'OPEN'
      });
    }
  }
};

exports.getActions = async () => {
  return await ManagerAction.find().sort({ severity: 1, createdAt: -1 });
};

exports.updateActionStatus = async (id, status) => {
  return await ManagerAction.findByIdAndUpdate(id, { status }, { new: true });
};
