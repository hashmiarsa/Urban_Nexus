"use strict";

const { runTopsis } = require("./topsis");
const config        = require("../../config/index");

// ---------------------------------------------------------------------------
// mcdm.engine.js â€” pure function, zero DB access
//
// Orchestrates TOPSIS scoring for a pair of conflicting projects.
// Reads criteria weights from config (never hardcoded).
//
// Input:  two plain project objects with criteria sub-documents
// Output: {
//   scores:      { [projectId]: number }   â€” TOPSIS score per project
//   order:       [projectId, ...]          â€” IDs sorted by score descending
//   explanation: string                    â€” human-readable reasoning
// }
// ---------------------------------------------------------------------------

/**
 * Scores two conflicting projects using TOPSIS and returns execution order
 *
 * @param {object} projectA  - Plain project object with _id and criteria
 * @param {object} projectB  - Plain project object with _id and criteria
 * @returns {object}         - { scores, order, explanation }
 */
const scoreConflict = (projectA, projectB) => {
  const weights = config.TOPSIS_WEIGHTS;

  // Build alternatives array for TOPSIS
  // Each alternative needs an id and a criteria object
  const alternatives = [
    {
      id:       projectA._id.toString(),
      criteria: {
        urgency:           projectA.criteria?.urgency           ?? 5,
        socialImpact:      projectA.criteria?.socialImpact      ?? 5,
        estimatedCost:     projectA.criteria?.estimatedCost     ?? 5,
        feasibility:       projectA.criteria?.feasibility       ?? 5,
        environmentImpact: projectA.criteria?.environmentImpact ?? 5,
      },
    },
    {
      id:       projectB._id.toString(),
      criteria: {
        urgency:           projectB.criteria?.urgency           ?? 5,
        socialImpact:      projectB.criteria?.socialImpact      ?? 5,
        estimatedCost:     projectB.criteria?.estimatedCost     ?? 5,
        feasibility:       projectB.criteria?.feasibility       ?? 5,
        environmentImpact: projectB.criteria?.environmentImpact ?? 5,
      },
    },
  ];

  // Run TOPSIS â€” returns [{ id, score }] sorted descending
  const topsisResults = runTopsis(alternatives, weights);

  // Build scores map â€” { projectId: score }
  const scores = {};
  for (const result of topsisResults) {
    scores[result.id] = result.score;
  }

  // Execution order â€” highest score executes first
  const order = topsisResults.map((r) => r.id);

  // Generate human-readable explanation
  const winner  = topsisResults[0];
  const loser   = topsisResults[1];

  const winnerProject = winner.id === projectA._id.toString() ? projectA : projectB;
  const loserProject  = loser.id  === projectA._id.toString() ? projectA : projectB;

  const explanation = buildExplanation(
    winnerProject,
    loserProject,
    winner.score,
    loser.score,
    weights
  );

  return { scores, order, explanation };
};

/**
 * Builds a human-readable explanation of why the winner scored higher
 *
 * @param {object} winner        - Winning project object
 * @param {object} loser         - Losing project object
 * @param {number} winnerScore   - TOPSIS score of winner
 * @param {number} loserScore    - TOPSIS score of loser
 * @param {object} weights       - Criteria weights used
 * @returns {string}             - Explanation text
 */
const buildExplanation = (winner, loser, winnerScore, loserScore, weights) => {
  // Find which criteria the winner scored better on
  const advantages = [];

  const criteriaLabels = {
    urgency:           "urgency",
    socialImpact:      "social impact",
    estimatedCost:     "cost efficiency",
    feasibility:       "feasibility",
    environmentImpact: "environmental impact",
  };

  // For benefit criteria: higher winner value is an advantage
  // For cost criteria: lower winner value is an advantage
  const COST_CRITERIA = new Set(["estimatedCost", "environmentImpact"]);

  for (const [key, label] of Object.entries(criteriaLabels)) {
    const wVal = winner.criteria?.[key] ?? 5;
    const lVal = loser.criteria?.[key]  ?? 5;

    const isCost      = COST_CRITERIA.has(key);
    const isAdvantage = isCost ? wVal < lVal : wVal > lVal;

    if (isAdvantage && weights[key] >= 0.15) {
      // Only mention criteria with meaningful weight
      advantages.push(label);
    }
  }

  const advantageText = advantages.length > 0
    ? ` scoring higher on ${advantages.join(" and ")}`
    : "";

  return (
    `"${winner.title}" (score: ${winnerScore}) outranked ` +
    `"${loser.title}" (score: ${loserScore})${advantageText}. ` +
    `Execute "${winner.title}" first, then "${loser.title}".`
  );
};

module.exports = { scoreConflict };
