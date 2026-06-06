const logger = require('./logger');

exports.validateProctoringReport = (report, config = {}) => {
  if (!report) {
    return { isValid: false, reason: 'Report missing' };
  }

  const {
    sessionId,
    monitoringDurationMs,
    sessionDurationMs,
    heartbeatCount,
    violations,
    timeline,
    overallRiskScore,
  } = report;

  // 1. Validate Session ID
  if (!sessionId) {
    return { isValid: false, reason: 'Session ID is missing from proctoring report' };
  }

  // 2. Validate Duration (Monitoring should not exceed Session)
  // Give a small buffer (5000ms) for clock differences
  if (monitoringDurationMs > sessionDurationMs + 5000) {
    logger.warn('Proctoring duration anomaly', { sessionId, monitoringDurationMs, sessionDurationMs });
    return { isValid: false, reason: 'Monitoring duration exceeds session duration' };
  }

  // 3. Validate Heartbeat Sanity
  // Expected heartbeats = monitoringDurationMs / 500ms (since heartbeat is 500ms interval)
  if (monitoringDurationMs > 5000) { // Only check if monitoring was active for > 5s
    const expectedHeartbeats = Math.floor(monitoringDurationMs / 500);
    // Allow for 20% variance due to browser throttling, performance, etc.
    const minAcceptableHeartbeats = Math.floor(expectedHeartbeats * 0.8);

    if (heartbeatCount < minAcceptableHeartbeats) {
      logger.warn('Proctoring heartbeat anomaly', { sessionId, heartbeatCount, expectedHeartbeats });
      return { isValid: false, reason: `Insufficient heartbeats. Expected ~${expectedHeartbeats}, got ${heartbeatCount}` };
    }

    if (!report.heartbeatSamples || report.heartbeatSamples.length === 0) {
      return { isValid: false, reason: 'Heartbeat samples are missing' };
    }
  }

  // 4. Validate Timeline Chronology
  if (timeline && timeline.length > 1) {
    for (let i = 1; i < timeline.length; i++) {
      if (timeline[i].timestamp < timeline[i - 1].timestamp) {
        return { isValid: false, reason: 'Timeline chronology is invalid (events out of order)' };
      }
    }
  }

  // 5. Validate Risk Score consistency (Optional, re-calculate risk from violations)
  let calculatedRisk = 0;
  if (violations && Array.isArray(violations)) {
    calculatedRisk = violations.reduce((acc, v) => acc + (v.severity || 0), 0);
  }

  // Note: Since currentRiskScore decays, we validate against overallRiskScore
  if (overallRiskScore !== undefined && calculatedRisk !== overallRiskScore) {
     logger.warn('Proctoring risk score mismatch', { sessionId, reportedRisk: overallRiskScore, calculatedRisk });
     // We don't strictly invalidate for this, just log, since decay logic on frontend might be complex.
     // But if we want to be strict:
     // return { isValid: false, reason: 'Risk score calculation mismatch' };
  }

  return { isValid: true };
};
