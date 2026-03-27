// MCDM Scoring — Multi Criteria Decision Making
export function calculateMCDM({ budget, duration, publicImpact, urgency }) {
  const weights = { budget: 0.25, duration: 0.25, publicImpact: 0.30, urgency: 0.20 }
  const score =
    (budget * weights.budget) +
    (duration * weights.duration) +
    (publicImpact * weights.publicImpact) +
    (urgency * weights.urgency)
  return Math.round(score * 10) / 10
}
