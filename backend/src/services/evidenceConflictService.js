const EvidenceConflict = require('../models/EvidenceConflict');
const Evidence = require('../models/Evidence');

exports.detectConflicts = async (employeeId, skillId) => {
  const evidences = await Evidence.find({ employee: employeeId, skill: skillId, status: 'ACTIVE' });
  
  const eligible = evidences.filter(e => e.normalizedValue !== null && e.quality !== null);
  
  let positiveCount = evidences.filter(e => e.direction === 'POSITIVE').length;
  let negativeCount = evidences.filter(e => e.direction === 'NEGATIVE').length;
  
  let conflictStatus = 'INSUFFICIENT_EVIDENCE';
  let conflictScore = 0;
  let signalSpread = 0;

  if (eligible.length >= 2) {
    let sumWeight = 0;
    let sumWeightedValue = 0;
    
    for (const e of eligible) {
      sumWeight += e.quality;
      sumWeightedValue += (e.normalizedValue * e.quality);
    }
    
    const weightedMean = sumWeight > 0 ? sumWeightedValue / sumWeight : 0;
    
    let sumWeightedVariance = 0;
    for (const e of eligible) {
      sumWeightedVariance += e.quality * Math.pow(e.normalizedValue - weightedMean, 2);
    }
    
    const weightedVariance = sumWeight > 0 ? sumWeightedVariance / sumWeight : 0;
    signalSpread = Math.sqrt(weightedVariance); 

    const weightedNegative = eligible.filter(e => e.direction === 'NEGATIVE').reduce((s, e) => s + e.quality, 0);
    const weightedPositive = eligible.filter(e => e.direction === 'POSITIVE').reduce((s, e) => s + e.quality, 0);
    
    const hasMaterialNegative = weightedNegative >= 0.5;
    const hasMaterialPositive = weightedPositive >= 0.5;
    
    // An outlier shouldn't create a strict CONFLICTING status if the other polarity dominates massively.
    if (hasMaterialNegative && hasMaterialPositive) {
      conflictStatus = 'CONFLICTING';
      conflictScore = Math.max(0.6, signalSpread * 2);
    } else if (signalSpread > 0.3) {
      conflictStatus = 'CONFLICTING';
      conflictScore = signalSpread * 2;
    } else if (signalSpread > 0.15) {
      conflictStatus = 'MIXED';
      conflictScore = signalSpread * 1.5;
    } else {
      conflictStatus = 'CONSISTENT';
      conflictScore = signalSpread;
    }
  } else if (positiveCount > 0 && negativeCount > 0) {
    conflictStatus = 'MIXED';
    conflictScore = 0.3;
  }

  conflictScore = Math.min(1, Math.max(0, conflictScore));

  let conflictRecord = await EvidenceConflict.findOne({ employee: employeeId, skill: skillId });
  if (!conflictRecord) {
    conflictRecord = new EvidenceConflict({ employee: employeeId, skill: skillId });
  }

  conflictRecord.conflictStatus = conflictStatus;
  conflictRecord.conflictScore = conflictScore;
  conflictRecord.evidenceIds = evidences.map(e => e._id);
  conflictRecord.positiveEvidenceCount = positiveCount;
  conflictRecord.negativeEvidenceCount = negativeCount;
  conflictRecord.signalSpread = signalSpread;
  conflictRecord.calculatedAt = new Date();

  await conflictRecord.save();
  return conflictRecord;
};

exports.getEmployeeConflicts = async (employeeId) => {
  return await EvidenceConflict.find({ employee: employeeId }).populate('skill', 'name category');
};
