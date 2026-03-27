// MCDM Engine — 7 criteria scoring
const config = require("../config/staticConfig")
const Complaint = require("../models/Complaint")
const Project = require("../models/Project")

async function calculateMCDM(projectData) {
  const scores = {}
  const w = config.mcdmWeights
  const inputs = projectData.mcdmInputs
  const location = projectData.location
  const startMonth = new Date(projectData.startDate).getMonth() + 1

  // Criteria 1 — Condition Severity (26%)
  const conditionMap = { critical:10, poor:7, fair:4, good:2 }
  let c1 = conditionMap[inputs.conditionRating] || 5
  if (inputs.incidents?.includes("accidents")) c1 = Math.min(10, c1 + 2)
  const complaints = await Complaint.countDocuments({
    "location.ward": location.ward,
    createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
  })
  if (complaints > 20) c1 = Math.min(10, c1 + 2)
  else if (complaints > 10) c1 = Math.min(10, c1 + 1)
  scores.conditionSeverity = c1

  // Criteria 2 — Population & Facility Impact (21%)
  // Uses data from map auto-detection passed in projectData
  scores.populationImpact = projectData.autoDetected?.populationScore || 5

  // Criteria 3 — Seasonal Compatibility (16%)
  const { monsoon, drySeason, preMonsoon } = config.seasonal
  let c3 = 5
  if (["road","sewage"].includes(projectData.projectType)) {
    if (monsoon.includes(startMonth)) c3 = 1
    else if (drySeason.includes(startMonth)) c3 = 10
    else c3 = 6
  } else if (projectData.projectType === "parks") {
    c3 = monsoon.includes(startMonth) ? 10 : 4
  } else {
    c3 = 8 // underground work less affected by season
  }
  scores.seasonalCompatibility = c3

  // Criteria 4 — Execution Readiness (16%)
  const tenderMap = { "complete":8, "in_process":5, "planning":2 }
  let c4 = tenderMap[inputs.tenderStatus] || 5
  if (inputs.contractorAssigned) c4 = Math.min(10, c4 + 2)
  scores.executionReadiness = c4

  // Criteria 5 — Citizen Disruption (10%)
  const closureMap = { "full":2, "partial":6, "none":10 }
  let c5 = closureMap[inputs.roadClosure] || 6
  const utilCount = inputs.utilityDisruption?.length || 0
  if (utilCount >= 2) c5 = Math.max(1, c5 - 2)
  else if (utilCount === 1) c5 = Math.max(1, c5 - 1)
  if (inputs.disruptionDays > 30) c5 = Math.max(1, c5 - 2)
  scores.citizenDisruption = c5

  // Criteria 6 — Infrastructure Age (8%)
  const currentYear = new Date().getFullYear()
  const age = currentYear - (inputs.lastWorkYear || currentYear - 5)
  const lifecycle = config.lifecycle[projectData.projectType] || 10
  const ratio = age / lifecycle
  let c6 = ratio >= 1.5 ? 10 : ratio >= 1 ? 8 : ratio >= 0.5 ? 5 : 2
  scores.infrastructureAge = c6

  // Criteria 7 — Economic Value (3%)
  scores.economicValue = projectData.autoDetected?.economicScore || 5

  // Final weighted score
  const total = (
    scores.conditionSeverity    * w.conditionSeverity    +
    scores.populationImpact     * w.populationImpact     +
    scores.seasonalCompatibility* w.seasonalCompatibility+
    scores.executionReadiness   * w.executionReadiness   +
    scores.citizenDisruption    * w.citizenDisruption    +
    scores.infrastructureAge    * w.infrastructureAge    +
    scores.economicValue        * w.economicValue
  )

  return {
    score:     Math.round(total * 10) / 10,
    breakdown: scores,
    outOf100:  Math.round(total * 10),
  }
}

module.exports = { calculateMCDM }
