const HIGH_RISK_THRESHOLD = 80;
const MEDIUM_RISK_THRESHOLD = 50;

export const assessTransactionRisk = ({ amount, user, recentFailures = 0, rapidAttempts = 0 }) => {
  let score = 0;
  const reasons = [];

  const normalizedAmount = Number(amount || 0);
  if (normalizedAmount >= 10000) {
    score += 40;
    reasons.push('High transaction amount');
  } else if (normalizedAmount >= 5000) {
    score += 25;
    reasons.push('Moderate-high transaction amount');
  }

  if (recentFailures >= 3) {
    score += 30;
    reasons.push('Multiple recent failed transactions');
  }

  if (rapidAttempts >= 3) {
    score += 25;
    reasons.push('Rapid repeat attempts detected');
  }

  if (!user?.email) {
    score += 10;
    reasons.push('Missing verified email');
  }

  if (!user?.aadhaar) {
    score += 10;
    reasons.push('Missing identity profile attributes');
  }

  const boundedScore = Math.min(100, score);
  let level = 'LOW';
  if (boundedScore >= HIGH_RISK_THRESHOLD) level = 'HIGH';
  else if (boundedScore >= MEDIUM_RISK_THRESHOLD) level = 'MEDIUM';

  return {
    riskScore: boundedScore,
    riskLevel: level,
    reasons
  };
};
