/**
 * Phase 5C: Capability Trajectory & Velocity
 * Calculates historical progression of skills using Weighted Linear Regression.
 */

const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');
const Evidence = require('../models/Evidence');

function clamp(value) {
  if (value == null) return null;
  return Math.max(0, Math.min(1, value));
}

exports.calculateTrajectory = async (employeeId, skillId) => {
  // Return structure for INSUFFICIENT_DATA
  const insufficientResult = {
    trajectoryDirection: 'INSUFFICIENT_DATA',
    trajectorySlope: null,
    trajectoryVelocity: null,
    trajectoryR2: null,
    trajectoryConfidence: null,
    observationCount: 0,
    firstObservedAt: null,
    lastObservedAt: null
  };

  // 1. Fetch historical eligible observations
  // Rules match Phase 5A: active, mapped, normalizedValue != null, quality != null, direction != NEGATIVE
  const contributingEvidence = await Evidence.find({
    employee: employeeId,
    skill: skillId,
    status: 'ACTIVE',
    direction: { $ne: 'NEGATIVE' },
    normalizedValue: { $ne: null },
    quality: { $ne: null }
  }).sort({ occurredAt: 1 }); // Sort chronologically

  const n = contributingEvidence.length;
  
  // Set count & dates even if insufficient for full math
  if (n > 0) {
    insufficientResult.observationCount = n;
    insufficientResult.firstObservedAt = contributingEvidence[0].occurredAt;
    insufficientResult.lastObservedAt = contributingEvidence[n - 1].occurredAt;
  }

  // 2. Minimum Data Requirement
  if (n < 3) {
    return insufficientResult;
  }

  const firstDate = contributingEvidence[0].occurredAt;
  const lastDate = contributingEvidence[n - 1].occurredAt;

  // Protect against all observations having the exact same timestamp (prevents div/0 in regression)
  if (!firstDate || !lastDate || firstDate.getTime() === lastDate.getTime()) {
    return insufficientResult;
  }

  // Calculate timespan in days
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const timeSpanDays = (lastDate.getTime() - firstDate.getTime()) / MS_PER_DAY;

  if (timeSpanDays === 0) {
    return insufficientResult;
  }

  // 3. Prepare data points
  const points = contributingEvidence.map(ev => ({
    x: (ev.occurredAt.getTime() - firstDate.getTime()) / MS_PER_DAY,
    y: ev.normalizedValue,
    w: ev.quality
  }));

  // 4. Weighted Linear Regression
  let sumW = 0;
  let sumWX = 0;
  let sumWY = 0;

  for (const pt of points) {
    sumW += pt.w;
    sumWX += pt.w * pt.x;
    sumWY += pt.w * pt.y;
  }

  if (sumW === 0) return insufficientResult; // Safety fallback

  const meanX = sumWX / sumW;
  const meanY = sumWY / sumW;

  let sumWCovXY = 0;
  let sumWVarX = 0;
  let sumWVarY = 0;

  for (const pt of points) {
    const dx = pt.x - meanX;
    const dy = pt.y - meanY;
    sumWCovXY += pt.w * dx * dy;
    sumWVarX += pt.w * dx * dx;
    sumWVarY += pt.w * dy * dy;
  }

  const covXY = sumWCovXY / sumW;
  const varX = sumWVarX / sumW;
  const varY = sumWVarY / sumW;

  if (varX === 0) {
    return insufficientResult; // Cannot calculate slope if all x variance is 0
  }

  const slope = covXY / varX;
  
  // 5. Velocity Calculation
  const velocity = slope * 30; // normalized score change per 30 days

  // 6. R-Squared
  let r2 = 0;
  if (varX > 0 && varY > 0) {
    r2 = (covXY * covXY) / (varX * varY);
    r2 = clamp(r2); // Ensure float math doesn't result in 1.000000001
  } else if (varX > 0 && varY === 0) {
    r2 = 1.0; // Perfect flat line
  }

  // 7. Direction mapping (Threshold: +/- 0.01 per 30 days)
  let direction = 'STABLE';
  if (velocity > 0.01) direction = 'IMPROVING';
  else if (velocity < -0.01) direction = 'DECLINING';

  // 8. Trajectory Confidence
  const quantityFactor = n / (n + 3);
  const timeSpanFactor = Math.min(timeSpanDays / 180, 1.0);
  const fitFactor = r2;

  const trajectoryConfidence = clamp(
    (0.30 * quantityFactor) +
    (0.30 * timeSpanFactor) +
    (0.40 * fitFactor)
  );

  return {
    trajectoryDirection: direction,
    trajectorySlope: slope,
    trajectoryVelocity: velocity,
    trajectoryR2: r2,
    trajectoryConfidence,
    observationCount: n,
    firstObservedAt: firstDate,
    lastObservedAt: lastDate
  };
};

exports.updateCapabilityTrajectory = async (employeeId, skillId) => {
  const trajectoryFields = await exports.calculateTrajectory(employeeId, skillId);
  
  return await EmployeeSkillCapability.findOneAndUpdate(
    { employee: employeeId, skill: skillId },
    { $set: trajectoryFields },
    { returnDocument: 'after' }
  );
};
