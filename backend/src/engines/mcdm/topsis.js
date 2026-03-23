"use strict";

// ---------------------------------------------------------------------------
// topsis.js â€” pure TOPSIS algorithm, zero DB access
//
// TOPSIS = Technique for Order of Preference by Similarity to Ideal Solution
// A multi-criteria decision-making method that scores alternatives by their
// distance from an ideal best solution and an ideal worst solution.
//
// Steps:
//   1. Build decision matrix from criteria values
//   2. Normalize the matrix (vector normalization)
//   3. Apply criteria weights to normalized matrix
//   4. Determine ideal best (max) and ideal worst (min) for each criterion
//   5. Calculate Euclidean distance from ideal best and ideal worst
//   6. Compute relative closeness score = distWorst / (distBest + distWorst)
//      Score range: 0 (worst) to 1 (best)
//
// Input:
//   alternatives â€” array of objects: [{ id, criteria: { urgency, socialImpact, ... } }]
//   weights      â€” object: { urgency: 0.30, socialImpact: 0.25, ... }
//
// Output:
//   array of { id, score } sorted descending by score (highest priority first)
// ---------------------------------------------------------------------------

/**
 * Runs TOPSIS on an array of alternatives with criteria values
 *
 * @param {object[]} alternatives  - [{ id, criteria: { urgency, socialImpact, estimatedCost, feasibility, environmentImpact } }]
 * @param {object}   weights       - { urgency: 0.30, socialImpact: 0.25, ... }
 * @returns {object[]}             - [{ id, score }] sorted descending
 */
const runTopsis = (alternatives, weights) => {
  // -------------------------------------------------------------------------
  // Guard â€” need at least 2 alternatives to make a comparison meaningful
  // With 1 alternative, return score of 1.0 (it wins by default)
  // -------------------------------------------------------------------------
  if (!alternatives || alternatives.length === 0) {
    return [];
  }

  if (alternatives.length === 1) {
    return [{ id: alternatives[0].id, score: 1.0 }];
  }

  const criteriaKeys = Object.keys(weights);
  const n = alternatives.length;   // number of alternatives
  const m = criteriaKeys.length;   // number of criteria

  // -------------------------------------------------------------------------
  // Step 1 â€” Build raw decision matrix
  // matrix[i][j] = value of criterion j for alternative i
  // -------------------------------------------------------------------------
  const matrix = alternatives.map((alt) =>
    criteriaKeys.map((key) => {
      const val = alt.criteria[key];
      // Default to 5 (midpoint of 1-10 scale) if criterion is missing
      return typeof val === "number" ? val : 5;
    })
  );

  // -------------------------------------------------------------------------
  // Step 2 â€” Vector normalization
  // For each criterion column, divide each value by the column's Euclidean norm
  // norm_j = sqrt(sum of squares of all values in column j)
  // normalized[i][j] = matrix[i][j] / norm_j
  // -------------------------------------------------------------------------
  const columnNorms = criteriaKeys.map((_, j) => {
    const sumOfSquares = matrix.reduce((sum, row) => sum + row[j] * row[j], 0);
    return Math.sqrt(sumOfSquares);
  });

  const normalized = matrix.map((row) =>
    row.map((val, j) => (columnNorms[j] === 0 ? 0 : val / columnNorms[j]))
  );

  // -------------------------------------------------------------------------
  // Step 3 â€” Weighted normalized matrix
  // weighted[i][j] = normalized[i][j] * weight_j
  // -------------------------------------------------------------------------
  const weightValues = criteriaKeys.map((key) => weights[key] || 0);

  const weighted = normalized.map((row) =>
    row.map((val, j) => val * weightValues[j])
  );

  // -------------------------------------------------------------------------
  // Step 4 â€” Ideal best and ideal worst solutions
  //
  // For benefit criteria (higher = better): urgency, socialImpact, feasibility
  //   idealBest[j]  = max of column j
  //   idealWorst[j] = min of column j
  //
  // For cost criteria (lower = better): estimatedCost, environmentImpact
  //   idealBest[j]  = min of column j
  //   idealWorst[j] = max of column j
  //
  // estimatedCost here is the SCORE (1-10) representing cost level â€”
  //   lower score = cheaper = better, so it is a cost criterion
  // environmentImpact: lower impact = better, so it is a cost criterion
  // -------------------------------------------------------------------------
  const COST_CRITERIA = new Set(["estimatedCost", "environmentImpact"]);

  const idealBest  = new Array(m);
  const idealWorst = new Array(m);

  for (let j = 0; j < m; j++) {
    const col    = weighted.map((row) => row[j]);
    const maxVal = Math.max(...col);
    const minVal = Math.min(...col);

    if (COST_CRITERIA.has(criteriaKeys[j])) {
      // Cost criterion â€” lower is better
      idealBest[j]  = minVal;
      idealWorst[j] = maxVal;
    } else {
      // Benefit criterion â€” higher is better
      idealBest[j]  = maxVal;
      idealWorst[j] = minVal;
    }
  }

  // -------------------------------------------------------------------------
  // Step 5 â€” Euclidean distances from ideal best and ideal worst
  // distBest[i]  = sqrt(sum_j (weighted[i][j] - idealBest[j])^2)
  // distWorst[i] = sqrt(sum_j (weighted[i][j] - idealWorst[j])^2)
  // -------------------------------------------------------------------------
  const distBest = weighted.map((row) => {
    const sumSq = row.reduce(
      (sum, val, j) => sum + Math.pow(val - idealBest[j], 2),
      0
    );
    return Math.sqrt(sumSq);
  });

  const distWorst = weighted.map((row) => {
    const sumSq = row.reduce(
      (sum, val, j) => sum + Math.pow(val - idealWorst[j], 2),
      0
    );
    return Math.sqrt(sumSq);
  });

  // -------------------------------------------------------------------------
  // Step 6 â€” Relative closeness score
  // score[i] = distWorst[i] / (distBest[i] + distWorst[i])
  // Range: 0 (worst) to 1 (best)
  // Higher score = closer to ideal best = higher priority
  // -------------------------------------------------------------------------
  const results = alternatives.map((alt, i) => {
    const dBest  = distBest[i];
    const dWorst = distWorst[i];
    const total  = dBest + dWorst;

    // Avoid division by zero â€” if both distances are 0, alternatives are identical
    const score = total === 0 ? 0.5 : dWorst / total;

    return {
      id:    alt.id,
      score: Math.round(score * 10000) / 10000, // round to 4 decimal places
    };
  });

  // Sort descending â€” highest score (highest priority) first
  results.sort((a, b) => b.score - a.score);

  return results;
};

module.exports = { runTopsis };
