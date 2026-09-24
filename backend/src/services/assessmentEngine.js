exports.calculateNextDifficulty = (currentDifficulty, evaluation) => {
  const { score, estimatedLevel } = evaluation;
  
  const coverage = evaluation.rubricCoverage ?? 0.8;
  const depth = evaluation.depth ?? 0.8;
  const reasoning = evaluation.reasoningQuality ?? 0.8;
  const correctness = evaluation.correctness ?? 0.8;
  
  const baseScoreSignal = 1 + (score / 25);
  const executionQuality = (depth + reasoning + correctness) / 3;
  const modifier = coverage * executionQuality;
  const adjustedSignal = baseScoreSignal * (0.5 + (0.5 * modifier));
  
  // The backend's true continuous interpretation of this single answer
  const signal = (adjustedSignal * 0.8) + ((estimatedLevel || 3) * 0.2);
  
  // Strong performance: signal is clearly above current difficulty or near max
  if (signal > currentDifficulty + 0.5 || signal >= 4.5) {
    return Math.min(5, currentDifficulty + 1);
  } 
  // Weak performance: signal is clearly below current difficulty or near min
  else if (signal < currentDifficulty - 0.5 || signal <= 1.5) {
    return Math.max(1, currentDifficulty - 1);
  }
  
  return currentDifficulty; // Moderate performance, keep stable
};

exports.calculateAssessmentMetrics = (questions) => {
  const answered = questions.filter(q => q.answer && q.evaluation);
  if (answered.length === 0) {
    return {
      currentEstimate: 3,
      confidence: 0
    };
  }

  // Calculate weighted estimate for each question
  const estimatedSignals = answered.map(q => {
    // Convert 0-100 score to 1-5 continuous signal
    const baseScoreSignal = 1 + (q.score / 25);
    
    // Support backward compatibility for old documents missing new fields
    const coverage = q.rubricCoverage ?? 0.8;
    const depth = q.depth ?? 0.8;
    const reasoning = q.reasoningQuality ?? 0.8;
    const correctness = q.correctness ?? 0.8;
    
    // Average quality of the execution
    const executionQuality = (depth + reasoning + correctness) / 3;
    
    // Coverage is a hard gate. If you only cover 30% of the rubric, your overall 
    // effectiveness is gated by that, even if what you said was 100% correct.
    const modifier = coverage * executionQuality;
    
    // Adjust base signal: a poor modifier heavily discounts the score
    const adjustedSignal = baseScoreSignal * (0.5 + (0.5 * modifier));
    
    // Blend mostly backend logic with the LLM's raw estimatedLevel
    const llmEstimate = q.estimatedLevel || 3;
    const finalSignal = (adjustedSignal * 0.8) + (llmEstimate * 0.2);
    
    // Clamp to 1-5
    return Math.max(1, Math.min(5, finalSignal));
  });

  const totalEstimate = estimatedSignals.reduce((acc, val) => acc + val, 0);
  const averageEstimate = totalEstimate / answered.length;

  // Calculate variance to adjust confidence
  const variance = estimatedSignals.reduce((acc, val) => acc + Math.pow(val - averageEstimate, 2), 0) / answered.length;
  
  // Base confidence on number of questions answered (scales linearly)
  // Max questions is 8. So if answered = 8, base confidence is high.
  const baseConfidence = Math.min(1, answered.length / 8);

  // High variance reduces confidence
  // If variance is 0, penalty is 0. If variance is high (e.g. 1.0+), penalty is larger.
  const variancePenalty = Math.min(0.3, variance * 0.1); 
  
  let confidence = baseConfidence - variancePenalty;
  
  // Ensure confidence is between 0 and 1
  confidence = Math.max(0, Math.min(1, confidence));

  // Round estimate to 1 decimal place
  const roundedEstimate = Math.round(averageEstimate * 10) / 10;
  
  return {
    currentEstimate: roundedEstimate,
    confidence: Number(confidence.toFixed(2))
  };
};

exports.shouldStopAssessment = (answeredCount, minQuestions, maxQuestions, confidence) => {
  if (answeredCount >= maxQuestions) {
    return true;
  }
  
  if (answeredCount >= minQuestions && confidence >= 0.75) {
    return true;
  }
  
  return false;
};
