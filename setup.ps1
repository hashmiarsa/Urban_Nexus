# Urban Nexus — Phase 2, 4 and 5 setup script
# Run from project root: Urban_Nexus\
# Usage: .\setup.ps1

Set-Location -Path $PSScriptRoot

# ===========================================================================
# PHASE 2 — Decision Engines + Services + Controllers
# ===========================================================================

# backend\src\engines\conflict\geo.detector.js
@'
"use strict";

const turf = require("@turf/turf");

// ---------------------------------------------------------------------------
// geo.detector.js — pure function, zero DB access
//
// Detects whether two GeoJSON Polygon geometries intersect
// and computes the overlap area if they do.
//
// Input:  two GeoJSON Polygon geometry objects (from Project.location)
// Output: { intersects: boolean, overlapArea: GeoJSON Polygon | null }
// ---------------------------------------------------------------------------

/**
 * Detects geographic intersection between two project polygons
 *
 * @param {object} geometryA  - GeoJSON Polygon geometry { type, coordinates }
 * @param {object} geometryB  - GeoJSON Polygon geometry { type, coordinates }
 * @returns {object}          - { intersects, overlapArea }
 */
const detectGeoConflict = (geometryA, geometryB) => {
  // Wrap raw geometry objects into GeoJSON Feature objects
  // Turf functions expect Feature wrappers, not bare geometry objects
  const featureA = turf.feature(geometryA);
  const featureB = turf.feature(geometryB);

  // Quick boolean check first — cheaper than computing full intersection
  const intersects = turf.booleanIntersects(featureA, featureB);

  if (!intersects) {
    return { intersects: false, overlapArea: null };
  }

  // Compute the actual intersection polygon
  // turf.intersect returns null if polygons only touch at a point/edge
  // (booleanIntersects may return true for edge touches, intersect returns null)
  let overlapArea = null;

  try {
    const intersection = turf.intersect(featureA, featureB);

    if (intersection && intersection.geometry) {
      // Only store if the overlap is a proper Polygon (not Point or LineString)
      // Point/line touches are not meaningful conflicts
      if (intersection.geometry.type === "Polygon") {
        overlapArea = intersection.geometry;
      }
    }
  } catch (_err) {
    // turf.intersect can throw on malformed geometries
    // Treat as non-overlapping if intersection computation fails
    return { intersects: false, overlapArea: null };
  }

  // If intersection exists but produced no Polygon, it's a boundary touch
  // not a real spatial conflict — treat as no conflict
  if (!overlapArea) {
    return { intersects: false, overlapArea: null };
  }

  return { intersects: true, overlapArea };
};

module.exports = { detectGeoConflict };
'@ | Set-Content -Path "backend\src\engines\conflict\geo.detector.js" -Encoding UTF8

# backend\src\engines\conflict\time.detector.js
@'
"use strict";

// ---------------------------------------------------------------------------
// time.detector.js — pure function, zero DB access
//
// Detects whether two project date ranges overlap
// and computes the exact overlap period if they do.
//
// Two ranges overlap if: startA <= endB AND startB <= endA
// (Standard interval overlap test)
//
// Input:  two pairs of Date objects { startDate, endDate }
// Output: { overlaps: boolean, overlapDates: { start, end } | null }
// ---------------------------------------------------------------------------

/**
 * Detects temporal overlap between two project date ranges
 *
 * @param {Date|string} startA  - Start date of project A
 * @param {Date|string} endA    - End date of project A
 * @param {Date|string} startB  - Start date of project B
 * @param {Date|string} endB    - End date of project B
 * @returns {object}            - { overlaps, overlapDates }
 */
const detectTimeConflict = (startA, endA, startB, endB) => {
  // Normalize to Date objects — handles both Date and ISO string inputs
  const sA = new Date(startA);
  const eA = new Date(endA);
  const sB = new Date(startB);
  const eB = new Date(endB);

  // Standard interval overlap: two intervals [sA, eA] and [sB, eB] overlap
  // if and only if sA <= eB AND sB <= eA
  const overlaps = sA <= eB && sB <= eA;

  if (!overlaps) {
    return { overlaps: false, overlapDates: null };
  }

  // Compute the actual overlap window
  // Overlap starts at the LATER of the two start dates
  // Overlap ends at the EARLIER of the two end dates
  const overlapStart = sA > sB ? sA : sB;
  const overlapEnd   = eA < eB ? eA : eB;

  return {
    overlaps: true,
    overlapDates: {
      start: overlapStart,
      end:   overlapEnd,
    },
  };
};

module.exports = { detectTimeConflict };
'@ | Set-Content -Path "backend\src\engines\conflict\time.detector.js" -Encoding UTF8

# backend\src\engines\conflict\conflict.engine.js
@'
"use strict";

const { detectGeoConflict }  = require("./geo.detector");
const { detectTimeConflict } = require("./time.detector");

// ---------------------------------------------------------------------------
// conflict.engine.js — pure function, zero DB access
//
// Orchestrates geo and time detectors to determine if two projects clash.
// A clash requires BOTH spatial overlap AND temporal overlap.
//
// Input:  two full project objects (plain JS, not Mongoose documents)
// Output: { hasConflict, overlapArea, overlapDates } | { hasConflict: false }
// ---------------------------------------------------------------------------

/**
 * Determines whether two projects have a scheduling conflict
 * A conflict exists only when BOTH location AND date ranges overlap
 *
 * @param {object} projectA  - Plain project object with location, startDate, endDate
 * @param {object} projectB  - Plain project object with location, startDate, endDate
 * @returns {object}         - { hasConflict, overlapArea, overlapDates }
 */
const detectConflict = (projectA, projectB) => {
  // -------------------------------------------------------------------------
  // Guard — both projects must have valid location geometry
  // -------------------------------------------------------------------------
  if (
    !projectA.location ||
    !projectA.location.type ||
    !projectA.location.coordinates ||
    !projectB.location ||
    !projectB.location.type ||
    !projectB.location.coordinates
  ) {
    return { hasConflict: false, overlapArea: null, overlapDates: null };
  }

  // -------------------------------------------------------------------------
  // Step 1 — Geographic check (cheaper than always doing both)
  // If polygons don't intersect, skip time check entirely
  // -------------------------------------------------------------------------
  const geoResult = detectGeoConflict(projectA.location, projectB.location);

  if (!geoResult.intersects) {
    return { hasConflict: false, overlapArea: null, overlapDates: null };
  }

  // -------------------------------------------------------------------------
  // Step 2 — Temporal check
  // Polygons overlap — now check if date ranges also overlap
  // -------------------------------------------------------------------------
  const timeResult = detectTimeConflict(
    projectA.startDate,
    projectA.endDate,
    projectB.startDate,
    projectB.endDate
  );

  if (!timeResult.overlaps) {
    return { hasConflict: false, overlapArea: null, overlapDates: null };
  }

  // -------------------------------------------------------------------------
  // Both checks pass — genuine conflict
  // -------------------------------------------------------------------------
  return {
    hasConflict:  true,
    overlapArea:  geoResult.overlapArea,
    overlapDates: timeResult.overlapDates,
  };
};

/**
 * Checks a new project against an array of existing projects
 * Returns all conflicts found
 *
 * @param {object}   newProject       - The newly submitted project
 * @param {object[]} existingProjects - Array of existing projects to check against
 * @returns {object[]}                - Array of { project, overlapArea, overlapDates }
 */
const detectAllConflicts = (newProject, existingProjects) => {
  const conflicts = [];

  for (const existing of existingProjects) {
    // Never check a project against itself
    if (existing._id.toString() === newProject._id.toString()) {
      continue;
    }

    const result = detectConflict(newProject, existing);

    if (result.hasConflict) {
      conflicts.push({
        conflictingProject: existing,
        overlapArea:        result.overlapArea,
        overlapDates:       result.overlapDates,
      });
    }
  }

  return conflicts;
};

module.exports = { detectConflict, detectAllConflicts };
'@ | Set-Content -Path "backend\src\engines\conflict\conflict.engine.js" -Encoding UTF8

# backend\src\engines\mcdm\topsis.js
@'
"use strict";

// ---------------------------------------------------------------------------
// topsis.js — pure TOPSIS algorithm, zero DB access
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
//   alternatives — array of objects: [{ id, criteria: { urgency, socialImpact, ... } }]
//   weights      — object: { urgency: 0.30, socialImpact: 0.25, ... }
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
  // Guard — need at least 2 alternatives to make a comparison meaningful
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
  // Step 1 — Build raw decision matrix
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
  // Step 2 — Vector normalization
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
  // Step 3 — Weighted normalized matrix
  // weighted[i][j] = normalized[i][j] * weight_j
  // -------------------------------------------------------------------------
  const weightValues = criteriaKeys.map((key) => weights[key] || 0);

  const weighted = normalized.map((row) =>
    row.map((val, j) => val * weightValues[j])
  );

  // -------------------------------------------------------------------------
  // Step 4 — Ideal best and ideal worst solutions
  //
  // For benefit criteria (higher = better): urgency, socialImpact, feasibility
  //   idealBest[j]  = max of column j
  //   idealWorst[j] = min of column j
  //
  // For cost criteria (lower = better): estimatedCost, environmentImpact
  //   idealBest[j]  = min of column j
  //   idealWorst[j] = max of column j
  //
  // estimatedCost here is the SCORE (1-10) representing cost level —
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
      // Cost criterion — lower is better
      idealBest[j]  = minVal;
      idealWorst[j] = maxVal;
    } else {
      // Benefit criterion — higher is better
      idealBest[j]  = maxVal;
      idealWorst[j] = minVal;
    }
  }

  // -------------------------------------------------------------------------
  // Step 5 — Euclidean distances from ideal best and ideal worst
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
  // Step 6 — Relative closeness score
  // score[i] = distWorst[i] / (distBest[i] + distWorst[i])
  // Range: 0 (worst) to 1 (best)
  // Higher score = closer to ideal best = higher priority
  // -------------------------------------------------------------------------
  const results = alternatives.map((alt, i) => {
    const dBest  = distBest[i];
    const dWorst = distWorst[i];
    const total  = dBest + dWorst;

    // Avoid division by zero — if both distances are 0, alternatives are identical
    const score = total === 0 ? 0.5 : dWorst / total;

    return {
      id:    alt.id,
      score: Math.round(score * 10000) / 10000, // round to 4 decimal places
    };
  });

  // Sort descending — highest score (highest priority) first
  results.sort((a, b) => b.score - a.score);

  return results;
};

module.exports = { runTopsis };
'@ | Set-Content -Path "backend\src\engines\mcdm\topsis.js" -Encoding UTF8

# backend\src\engines\mcdm\mcdm.engine.js
@'
"use strict";

const { runTopsis } = require("./topsis");
const config        = require("../../config/index");

// ---------------------------------------------------------------------------
// mcdm.engine.js — pure function, zero DB access
//
// Orchestrates TOPSIS scoring for a pair of conflicting projects.
// Reads criteria weights from config (never hardcoded).
//
// Input:  two plain project objects with criteria sub-documents
// Output: {
//   scores:      { [projectId]: number }   — TOPSIS score per project
//   order:       [projectId, ...]          — IDs sorted by score descending
//   explanation: string                    — human-readable reasoning
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

  // Run TOPSIS — returns [{ id, score }] sorted descending
  const topsisResults = runTopsis(alternatives, weights);

  // Build scores map — { projectId: score }
  const scores = {};
  for (const result of topsisResults) {
    scores[result.id] = result.score;
  }

  // Execution order — highest score executes first
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
'@ | Set-Content -Path "backend\src\engines\mcdm\mcdm.engine.js" -Encoding UTF8

# backend\src\engines\graph\dag.js
@'
"use strict";

// ---------------------------------------------------------------------------
// dag.js — Directed Acyclic Graph data structure, zero DB access
//
// Represents project execution dependencies as a directed graph.
// An edge A → B means "A must complete before B can start".
//
// Internally uses an adjacency list for O(1) node lookup and
// efficient neighbour traversal during topological sort.
//
// Usage:
//   const dag = createDAG();
//   dag.addNode("projectA");
//   dag.addNode("projectB");
//   dag.addEdge("projectA", "projectB"); // A must complete before B
//   dag.getNeighbours("projectA");       // ["projectB"]
// ---------------------------------------------------------------------------

/**
 * Creates and returns a new DAG instance
 *
 * @returns {object} DAG with addNode, addEdge, getNodes, getEdges,
 *                   getNeighbours, getInDegree, hasNode, hasEdge
 */
const createDAG = () => {
  // adjacencyList: Map<nodeId, Set<neighbourId>>
  // Using Set for neighbours prevents duplicate edges
  const adjacencyList = new Map();

  // inDegree: Map<nodeId, number>
  // Tracks incoming edge count per node — needed for Kahn's algorithm
  const inDegree = new Map();

  // -------------------------------------------------------------------------
  // addNode — registers a node in the graph
  // Idempotent — calling twice with same id is safe
  // -------------------------------------------------------------------------
  const addNode = (nodeId) => {
    const id = String(nodeId);
    if (!adjacencyList.has(id)) {
      adjacencyList.set(id, new Set());
      inDegree.set(id, 0);
    }
  };

  // -------------------------------------------------------------------------
  // addEdge — adds a directed edge from → to
  // Means: "from" must complete before "to" can start
  // Auto-registers nodes if they don't exist
  // Ignores self-loops and duplicate edges silently
  // -------------------------------------------------------------------------
  const addEdge = (from, to) => {
    const fromId = String(from);
    const toId   = String(to);

    // Ignore self-loops
    if (fromId === toId) return;

    // Auto-register nodes
    addNode(fromId);
    addNode(toId);

    // Ignore duplicate edges
    if (adjacencyList.get(fromId).has(toId)) return;

    // Add edge and increment in-degree of destination
    adjacencyList.get(fromId).add(toId);
    inDegree.set(toId, (inDegree.get(toId) || 0) + 1);
  };

  // -------------------------------------------------------------------------
  // getNodes — returns all node IDs as an array
  // -------------------------------------------------------------------------
  const getNodes = () => Array.from(adjacencyList.keys());

  // -------------------------------------------------------------------------
  // getEdges — returns all edges as array of [from, to] pairs
  // -------------------------------------------------------------------------
  const getEdges = () => {
    const edges = [];
    for (const [from, neighbours] of adjacencyList) {
      for (const to of neighbours) {
        edges.push([from, to]);
      }
    }
    return edges;
  };

  // -------------------------------------------------------------------------
  // getNeighbours — returns array of nodes that depend on this node
  // i.e. nodes that have an incoming edge from nodeId
  // -------------------------------------------------------------------------
  const getNeighbours = (nodeId) => {
    const id = String(nodeId);
    if (!adjacencyList.has(id)) return [];
    return Array.from(adjacencyList.get(id));
  };

  // -------------------------------------------------------------------------
  // getInDegree — returns number of incoming edges for a node
  // Used by Kahn's algorithm to find nodes with no prerequisites
  // -------------------------------------------------------------------------
  const getInDegree = (nodeId) => {
    const id = String(nodeId);
    return inDegree.get(id) || 0;
  };

  // -------------------------------------------------------------------------
  // getInDegreeMap — returns a copy of the full inDegree map
  // Kahn's algorithm needs a mutable copy to decrement during sort
  // -------------------------------------------------------------------------
  const getInDegreeMap = () => new Map(inDegree);

  // -------------------------------------------------------------------------
  // hasNode — checks if a node exists
  // -------------------------------------------------------------------------
  const hasNode = (nodeId) => adjacencyList.has(String(nodeId));

  // -------------------------------------------------------------------------
  // hasEdge — checks if a directed edge exists from → to
  // -------------------------------------------------------------------------
  const hasEdge = (from, to) => {
    const fromId = String(from);
    const toId   = String(to);
    if (!adjacencyList.has(fromId)) return false;
    return adjacencyList.get(fromId).has(toId);
  };

  // -------------------------------------------------------------------------
  // size — returns number of nodes in the graph
  // -------------------------------------------------------------------------
  const size = () => adjacencyList.size;

  return {
    addNode,
    addEdge,
    getNodes,
    getEdges,
    getNeighbours,
    getInDegree,
    getInDegreeMap,
    hasNode,
    hasEdge,
    size,
  };
};

module.exports = { createDAG };
'@ | Set-Content -Path "backend\src\engines\graph\dag.js" -Encoding UTF8

# backend\src\engines\graph\topological.js
@'
"use strict";

// ---------------------------------------------------------------------------
// topological.js — Kahn's algorithm for topological sort, zero DB access
//
// Kahn's Algorithm:
//   1. Compute in-degree for every node
//   2. Add all nodes with in-degree 0 to a queue (no prerequisites)
//   3. While queue is not empty:
//      a. Dequeue a node, add it to the result
//      b. For each neighbour of this node, decrement its in-degree
//      c. If neighbour's in-degree reaches 0, add it to the queue
//   4. If result length < total nodes, a cycle exists (not a valid DAG)
//
// For Urban Nexus, the sort order determines which projects execute first.
// When multiple nodes have in-degree 0 simultaneously (parallel candidates),
// they are ordered by their MCDM score — higher score executes first.
//
// Input:
//   dag     — DAG instance from dag.js
//   scores  — optional { [nodeId]: number } MCDM scores for tie-breaking
//
// Output:
//   { order: [nodeId, ...], hasCycle: boolean }
// ---------------------------------------------------------------------------

/**
 * Performs topological sort using Kahn's algorithm
 * Ties broken by MCDM score (higher score = earlier in order)
 *
 * @param {object} dag      - DAG instance from createDAG()
 * @param {object} scores   - Optional { nodeId: score } for tie-breaking
 * @returns {object}        - { order: string[], hasCycle: boolean }
 */
const topologicalSort = (dag, scores = {}) => {
  const nodes       = dag.getNodes();
  const inDegreeMap = dag.getInDegreeMap(); // mutable copy
  const order       = [];

  // -------------------------------------------------------------------------
  // Step 1 — Initialize queue with all zero in-degree nodes
  // These are projects with no prerequisites — can start immediately
  // -------------------------------------------------------------------------
  let queue = nodes.filter((node) => inDegreeMap.get(node) === 0);

  // Sort initial queue by MCDM score descending for deterministic output
  queue = sortByScore(queue, scores);

  // -------------------------------------------------------------------------
  // Step 2 — Process queue
  // -------------------------------------------------------------------------
  while (queue.length > 0) {
    // Take first node from queue (already sorted by priority)
    const current = queue.shift();
    order.push(current);

    // For each node that depends on current, decrement their in-degree
    const neighbours = dag.getNeighbours(current);

    const newlyReady = [];

    for (const neighbour of neighbours) {
      const newInDegree = (inDegreeMap.get(neighbour) || 0) - 1;
      inDegreeMap.set(neighbour, newInDegree);

      if (newInDegree === 0) {
        // This neighbour's prerequisites are all done — it's ready
        newlyReady.push(neighbour);
      }
    }

    // Sort newly ready nodes by score and add to front-of-queue
    // This keeps higher-priority nodes executing as early as possible
    if (newlyReady.length > 0) {
      const sortedNewlyReady = sortByScore(newlyReady, scores);
      queue = sortByScore([...queue, ...sortedNewlyReady], scores);
    }
  }

  // -------------------------------------------------------------------------
  // Step 3 — Cycle detection
  // If we couldn't process all nodes, there is a cycle in the graph
  // A cycle means the dependency chain is impossible to satisfy
  // -------------------------------------------------------------------------
  const hasCycle = order.length < nodes.length;

  return { order, hasCycle };
};

/**
 * Sorts an array of node IDs by their MCDM score descending
 * Nodes without a score default to 0
 *
 * @param {string[]} nodeIds  - Array of node IDs to sort
 * @param {object}   scores   - { nodeId: score } map
 * @returns {string[]}        - Sorted array, highest score first
 */
const sortByScore = (nodeIds, scores) => {
  return [...nodeIds].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
};

module.exports = { topologicalSort };
'@ | Set-Content -Path "backend\src\engines\graph\topological.js" -Encoding UTF8

# backend\src\engines\graph\graph.engine.js
@'
"use strict";

const { createDAG }        = require("./dag");
const { topologicalSort }  = require("./topological");

// ---------------------------------------------------------------------------
// graph.engine.js — pure function, zero DB access
//
// Builds a DAG from:
//   1. Explicit project dependencies (Project.dependencies[] from schema)
//   2. MCDM-derived conflict ordering (winner executes before loser)
//
// Then runs topological sort to produce a final execution order.
//
// Input:
//   projects   — array of plain project objects with _id and dependencies[]
//   conflicts  — array of conflict results from decision.service:
//                [{ projectAId, projectBId, scores: { pAId: score, pBId: score } }]
//   allScores  — flat { [projectId]: score } map for tie-breaking in sort
//
// Output:
//   {
//     order:    [projectId, ...]   — final execution order
//     hasCycle: boolean            — true if dependency graph has a cycle
//   }
// ---------------------------------------------------------------------------

/**
 * Builds DAG from project dependencies and conflict ordering,
 * returns topologically sorted execution order
 *
 * @param {object[]} projects   - Plain project objects [{ _id, dependencies }]
 * @param {object[]} conflicts  - [{ projectAId, projectBId, scores }]
 * @param {object}   allScores  - { projectId: mcdmScore } flat map
 * @returns {object}            - { order: string[], hasCycle: boolean }
 */
const buildExecutionOrder = (projects, conflicts = [], allScores = {}) => {
  const dag = createDAG();

  // -------------------------------------------------------------------------
  // Step 1 — Register all projects as nodes
  // Every project gets a node even if it has no edges
  // -------------------------------------------------------------------------
  for (const project of projects) {
    dag.addNode(project._id.toString());
  }

  // -------------------------------------------------------------------------
  // Step 2 — Add edges from explicit dependencies
  // Project.dependencies[] = "these must complete before me"
  // So for each dep in project.dependencies: dep → project
  // -------------------------------------------------------------------------
  for (const project of projects) {
    if (!project.dependencies || project.dependencies.length === 0) continue;

    const projectId = project._id.toString();

    for (const depId of project.dependencies) {
      const depIdStr = depId.toString();

      // Only add edge if the dependency is a known node
      // (guards against stale references to deleted projects)
      if (dag.hasNode(depIdStr)) {
        dag.addEdge(depIdStr, projectId); // dep must complete before project
      }
    }
  }

  // -------------------------------------------------------------------------
  // Step 3 — Add edges from conflict MCDM ordering
  // For each conflict, the higher-scoring project executes first
  // scores object has exactly two keys: the two conflicting project IDs
  // order[0] is winner (higher score), order[1] is loser (lower score)
  // Edge: winner → loser (winner executes before loser)
  //
  // Only add conflict edges where no dependency edge already exists in
  // the same direction — avoids redundant edges but duplication is safe
  // since addEdge is idempotent on duplicates
  // -------------------------------------------------------------------------
  for (const conflict of conflicts) {
    const { projectAId, projectBId, scores } = conflict;

    if (!projectAId || !projectBId || !scores) continue;

    const idA = projectAId.toString();
    const idB = projectBId.toString();

    // Determine winner — whichever has the higher MCDM score
    const scoreA = scores[idA] || 0;
    const scoreB = scores[idB] || 0;

    if (scoreA === scoreB) {
      // Exact tie — no ordering edge added, both treated as independent
      continue;
    }

    const winner = scoreA > scoreB ? idA : idB;
    const loser  = scoreA > scoreB ? idB : idA;

    // Only add if both nodes exist
    if (dag.hasNode(winner) && dag.hasNode(loser)) {
      dag.addEdge(winner, loser);
    }
  }

  // -------------------------------------------------------------------------
  // Step 4 — Topological sort with MCDM score tie-breaking
  // -------------------------------------------------------------------------
  const { order, hasCycle } = topologicalSort(dag, allScores);

  return { order, hasCycle };
};

module.exports = { buildExecutionOrder };
'@ | Set-Content -Path "backend\src\engines\graph\graph.engine.js" -Encoding UTF8

# backend\src\services\project.service.js
@'
"use strict";

const Project                  = require("../models/Project");
const config                   = require("../config/index");
const { runDecisionPipeline }  = require("./decision.service");
const {
  auditProjectCreated,
  auditProjectStatusUpdated,
  auditProjectAssigned,
} = require("./audit.service");
const {
  emitProjectApproved,
  emitProjectRejected,
  emitTaskAssigned,
} = require("./notification.service");

// ---------------------------------------------------------------------------
// project.service.js
//
// Full CRUD for projects plus automatic conflict detection on create.
// Role-based filtering enforced here — controllers pass req.user through.
// ---------------------------------------------------------------------------

/**
 * Returns paginated list of projects filtered by role + optional query params
 *
 * @param {object} user    - req.user: { userId, role, departmentId }
 * @param {object} query   - Parsed query params: { status, type, department, page, limit }
 * @returns {object}       - { projects, pagination }
 */
const getAllProjects = async (user, query = {}) => {
  const filter = {};

  // -------------------------------------------------------------------------
  // Role-based base filter
  // Admin sees everything; officer sees own department only
  // -------------------------------------------------------------------------
  if (user.role === "officer") {
    filter.department = user.departmentId;
  }

  if (user.role === "supervisor") {
    filter.assignedTo = user.userId;
  }

  // -------------------------------------------------------------------------
  // Optional query filters
  // -------------------------------------------------------------------------
  if (query.status)     filter.status     = query.status;
  if (query.type)       filter.type       = query.type;

  // Admin can filter by department explicitly — officers cannot override theirs
  if (query.department && user.role === "admin") {
    filter.department = query.department;
  }

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------
  const page  = Math.max(1, parseInt(query.page,  10) || 1);
  const limit = Math.min(100, parseInt(query.limit, 10) || 20);
  const skip  = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate("department", "name code")
      .populate("submittedBy", "name email")
      .populate("assignedTo",  "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  return {
    projects,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Returns a single project by ID — enforces department access for officers
 *
 * @param {string} projectId  - MongoDB project ID
 * @param {object} user       - req.user
 * @returns {object}          - Populated project document
 */
const getProjectById = async (projectId, user) => {
  const project = await Project.findById(projectId)
    .populate("department",  "name code")
    .populate("submittedBy", "name email role")
    .populate("assignedTo",  "name email role")
    .populate("dependencies","title status type")
    .lean();

  if (!project) {
    const err = new Error("Project not found");
    err.statusCode = 404;
    throw err;
  }

  // Officers can only view their own department's projects
  if (user.role === "officer") {
    if (project.department._id.toString() !== user.departmentId?.toString()) {
      const err = new Error("Access denied. This project does not belong to your department.");
      err.statusCode = 403;
      throw err;
    }
  }

  // Supervisors can only view projects assigned to them
  if (user.role === "supervisor") {
    if (project.assignedTo?._id.toString() !== user.userId?.toString()) {
      const err = new Error("Access denied. This project is not assigned to you.");
      err.statusCode = 403;
      throw err;
    }
  }

  return project;
};

/**
 * Creates a new project and automatically runs the decision pipeline
 * Department resolved from user (officer) or request body (admin)
 *
 * @param {object} body   - Validated request body
 * @param {object} user   - req.user: { userId, role, departmentId }
 * @param {string} ip     - Request IP for audit log
 * @returns {object}      - { project, clashesDetected, conflicts }
 */
const createProject = async (body, user, ip) => {
  // -------------------------------------------------------------------------
  // Resolve department
  // Officers always use their own department
  // Admins must supply department in body
  // -------------------------------------------------------------------------
  let departmentId;

  if (user.role === "admin") {
    if (!body.department) {
      const err = new Error("department is required when admin submits a project");
      err.statusCode = 400;
      throw err;
    }
    departmentId = body.department;
  } else {
    // officer
    departmentId = user.departmentId;
  }

  // -------------------------------------------------------------------------
  // Save the new project
  // -------------------------------------------------------------------------
  const project = await Project.create({
    title:         body.title,
    type:          body.type,
    description:   body.description,
    location:      body.location,
    address:       body.address,
    startDate:     body.startDate,
    endDate:       body.endDate,
    estimatedCost: body.estimatedCost,
    priority:      body.priority || "medium",
    criteria:      body.criteria || {},
    dependencies:  body.dependencies || [],
    department:    departmentId,
    submittedBy:   user.userId,
    status:        "pending",
    progress:      0,
  });

  // Audit log — fire and forget
  auditProjectCreated(user.userId, project, ip);

  // -------------------------------------------------------------------------
  // Run decision pipeline
  // Fetch candidate projects (active/planned, not this project)
  // -------------------------------------------------------------------------
  const candidates = await Project.find({
    _id:    { $ne: project._id },
    status: { $in: config.CONFLICT_CHECK_STATUSES },
  }).lean();

  const savedConflicts = await runDecisionPipeline(project, candidates);

  // -------------------------------------------------------------------------
  // Build response conflicts summary (matches API_CONTRACT shape)
  // -------------------------------------------------------------------------
  const conflictSummary = savedConflicts.map((c) => ({
    _id:          c._id,
    projectB:     c.projectA.toString() === project._id.toString()
                    ? { _id: c.projectB }
                    : { _id: c.projectA },
    overlapDates: c.overlapDates,
  }));

  return {
    project,
    clashesDetected: savedConflicts.length,
    conflicts:       conflictSummary,
  };
};

/**
 * Updates project status (admin) or progress (supervisor)
 * RBAC is enforced at route level — this service trusts the caller's role
 *
 * @param {string} projectId  - MongoDB project ID
 * @param {object} body       - { status?, progress?, comment? }
 * @param {object} user       - req.user
 * @param {string} ip         - Request IP for audit log
 * @returns {object}          - Updated project document
 */
const updateProjectStatus = async (projectId, body, user, ip) => {
  const project = await Project.findById(projectId);

  if (!project) {
    const err = new Error("Project not found");
    err.statusCode = 404;
    throw err;
  }

  const previousStatus = project.status;

  // Admin can update status
  if (user.role === "admin" && body.status) {
    const validStatuses = ["pending", "approved", "ongoing", "completed", "rejected"];
    if (!validStatuses.includes(body.status)) {
      const err = new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }
    project.status = body.status;
  }

  // Supervisor can update progress only
  if (user.role === "supervisor" && body.progress !== undefined) {
    const progress = parseInt(body.progress, 10);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      const err = new Error("Progress must be a number between 0 and 100");
      err.statusCode = 400;
      throw err;
    }
    project.progress = progress;

    // Auto-update status to ongoing when progress starts, completed at 100
    if (progress > 0 && progress < 100 && project.status === "approved") {
      project.status = "ongoing";
    }
    if (progress === 100) {
      project.status = "completed";
    }
  }

  await project.save();

  // Audit log
  if (project.status !== previousStatus) {
    auditProjectStatusUpdated(user.userId, projectId, previousStatus, project.status, ip);
  }

  // Notifications
  const deptId = project.department?.toString();
  if (body.status === "approved") emitProjectApproved(projectId, deptId);
  if (body.status === "rejected") emitProjectRejected(projectId, deptId);

  return project.populate([
    { path: "department",  select: "name code" },
    { path: "submittedBy", select: "name email" },
    { path: "assignedTo",  select: "name email" },
  ]);
};

/**
 * Assigns a project to a supervisor
 *
 * @param {string} projectId    - MongoDB project ID
 * @param {string} supervisorId - MongoDB user ID of the supervisor
 * @param {object} user         - req.user
 * @param {string} ip           - Request IP for audit log
 * @returns {object}            - Updated project document
 */
const assignProject = async (projectId, supervisorId, user, ip) => {
  const project = await Project.findById(projectId);

  if (!project) {
    const err = new Error("Project not found");
    err.statusCode = 404;
    throw err;
  }

  // Officers can only assign projects from their own department
  if (user.role === "officer") {
    if (project.department.toString() !== user.departmentId?.toString()) {
      const err = new Error("Access denied. This project does not belong to your department.");
      err.statusCode = 403;
      throw err;
    }
  }

  project.assignedTo = supervisorId;
  await project.save();

  auditProjectAssigned(user.userId, projectId, supervisorId, ip);
  emitTaskAssigned(supervisorId, projectId);

  return project.populate([
    { path: "department",  select: "name code" },
    { path: "submittedBy", select: "name email" },
    { path: "assignedTo",  select: "name email" },
  ]);
};

/**
 * Returns all projects as GeoJSON FeatureCollection for map rendering
 * Returns all non-rejected projects regardless of role (map is shared view)
 *
 * @returns {object}  - GeoJSON FeatureCollection
 */
const getMapData = async () => {
  const projects = await Project.find({
    status: { $nin: ["rejected"] },
  })
    .populate("department", "name code")
    .lean();

  const features = projects.map((p) => ({
    type:     "Feature",
    geometry: p.location,
    properties: {
      _id:        p._id,
      title:      p.title,
      type:       p.type,
      status:     p.status,
      department: p.department?.code || "",
      startDate:  p.startDate,
      endDate:    p.endDate,
      priority:   p.priority,
    },
  }));

  return {
    type:     "FeatureCollection",
    features,
  };
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProjectStatus,
  assignProject,
  getMapData,
};
'@ | Set-Content -Path "backend\src\services\project.service.js" -Encoding UTF8

# backend\src\services\conflict.service.js
@'
"use strict";

const Conflict              = require("../models/Conflict");
const { auditConflictResolved } = require("./audit.service");

// ---------------------------------------------------------------------------
// conflict.service.js
//
// All business logic for conflict fetching and resolution.
// Controllers call these functions — zero req/res logic here.
// ---------------------------------------------------------------------------

/**
 * Returns all conflicts visible to the requesting user
 * Admin sees all; officer sees only conflicts involving their department
 *
 * @param {object} user  - req.user: { userId, role, departmentId }
 * @returns {object[]}   - Array of populated conflict documents
 */
const getAllConflicts = async (user) => {
  let query = {};

  // Officers only see conflicts that involve their department's projects
  // Admin sees everything — no filter applied
  if (user.role === "officer") {
    // We need to find conflicts where projectA or projectB belongs to the
    // officer's department. This requires a two-step approach:
    // 1. Fetch conflicts with populated project data
    // 2. Filter in memory by department
    // (MongoDB $lookup on nested populate is more expensive for small sets)
    const conflicts = await Conflict.find(query)
      .populate({
        path:   "projectA",
        select: "title type status department mcdmScore",
        populate: { path: "department", select: "name code" },
      })
      .populate({
        path:   "projectB",
        select: "title type status department mcdmScore",
        populate: { path: "department", select: "name code" },
      })
      .sort({ createdAt: -1 })
      .lean();

    const deptId = user.departmentId?.toString();

    return conflicts.filter((c) => {
      const deptA = c.projectA?.department?._id?.toString();
      const deptB = c.projectB?.department?._id?.toString();
      return deptA === deptId || deptB === deptId;
    });
  }

  // Admin — return all conflicts
  return Conflict.find(query)
    .populate({
      path:   "projectA",
      select: "title type status department mcdmScore",
      populate: { path: "department", select: "name code" },
    })
    .populate({
      path:   "projectB",
      select: "title type status department mcdmScore",
      populate: { path: "department", select: "name code" },
    })
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Returns a single conflict by ID with full project details and MCDM data
 * Includes the recommendation explanation for the detail view
 *
 * @param {string} conflictId  - MongoDB conflict ID
 * @param {object} user        - req.user: { userId, role, departmentId }
 * @returns {object}           - Fully populated conflict document
 */
const getConflictById = async (conflictId, user) => {
  const conflict = await Conflict.findById(conflictId)
    .populate({
      path:   "projectA",
      populate: { path: "department", select: "name code" },
    })
    .populate({
      path:   "projectB",
      populate: { path: "department", select: "name code" },
    })
    .populate({ path: "resolvedBy", select: "name email role" })
    .lean();

  if (!conflict) {
    const err = new Error("Conflict not found");
    err.statusCode = 404;
    throw err;
  }

  // Officers can only view conflicts involving their department
  if (user.role === "officer") {
    const deptId = user.departmentId?.toString();
    const deptA  = conflict.projectA?.department?._id?.toString();
    const deptB  = conflict.projectB?.department?._id?.toString();

    if (deptA !== deptId && deptB !== deptId) {
      const err = new Error("Access denied. This conflict does not involve your department.");
      err.statusCode = 403;
      throw err;
    }
  }

  return conflict;
};

/**
 * Resolves a conflict — admin only
 * Updates status, saves resolution note, records who resolved it
 *
 * @param {string} conflictId  - MongoDB conflict ID
 * @param {string} resolution  - Admin's resolution note
 * @param {string} status      - "resolved" or "overridden"
 * @param {object} user        - req.user
 * @param {string} ip          - Request IP for audit log
 * @returns {object}           - Updated conflict document
 */
const resolveConflict = async (conflictId, resolution, status, user, ip) => {
  const conflict = await Conflict.findById(conflictId);

  if (!conflict) {
    const err = new Error("Conflict not found");
    err.statusCode = 404;
    throw err;
  }

  if (conflict.status !== "open") {
    const err = new Error(`Conflict is already ${conflict.status}`);
    err.statusCode = 400;
    throw err;
  }

  const validStatuses = ["resolved", "overridden"];
  if (!validStatuses.includes(status)) {
    const err = new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  conflict.status     = status;
  conflict.resolution = resolution;
  conflict.resolvedBy = user.userId;
  conflict.resolvedAt = new Date();

  await conflict.save();

  // Write audit log — fire and forget
  auditConflictResolved(user.userId, conflictId, resolution, ip);

  return conflict.populate([
    { path: "projectA", select: "title type status department" },
    { path: "projectB", select: "title type status department" },
    { path: "resolvedBy", select: "name email" },
  ]);
};

module.exports = {
  getAllConflicts,
  getConflictById,
  resolveConflict,
};
'@ | Set-Content -Path "backend\src\services\conflict.service.js" -Encoding UTF8

# backend\src\services\decision.service.js
@'
"use strict";

const Conflict                = require("../models/Conflict");
const Project                 = require("../models/Project");
const { detectAllConflicts }  = require("../engines/conflict/conflict.engine");
const { scoreConflict }       = require("../engines/mcdm/mcdm.engine");
const { buildExecutionOrder } = require("../engines/graph/graph.engine");
const { emitClashDetected }   = require("./notification.service");
const logger                  = require("../utils/logger");

// ---------------------------------------------------------------------------
// decision.service.js
//
// Orchestrates the full decision pipeline triggered on every new project:
//
//   Step 1 — Conflict Engine: find all existing projects that clash
//   Step 2 — MCDM Engine:     score each conflicting pair via TOPSIS
//   Step 3 — Graph Engine:    build DAG, run topological sort
//   Step 4 — Persist:         save Conflict documents to MongoDB
//   Step 5 — Notify:          emit clash:detected via Socket.io stub
//
// Engines receive plain JS objects — never Mongoose documents.
// All DB access happens here in the service, not inside engines.
// ---------------------------------------------------------------------------

/**
 * Runs the full decision pipeline for a newly submitted project.
 * Called by project.service.js immediately after saving a new project.
 *
 * @param {object} newProject        - Saved Mongoose project document
 * @param {object[]} candidateProjects - Existing active projects to check against (plain objects)
 * @returns {object[]}               - Array of saved Conflict documents
 */
const runDecisionPipeline = async (newProject, candidateProjects) => {
  // Convert newProject Mongoose doc to plain object for engines
  const newProjectPlain = newProject.toObject ? newProject.toObject() : newProject;

  // -------------------------------------------------------------------------
  // Step 1 — Conflict Engine
  // Detect all spatial + temporal clashes with existing projects
  // -------------------------------------------------------------------------
  const clashes = detectAllConflicts(newProjectPlain, candidateProjects);

  if (clashes.length === 0) {
    logger.info(`[DecisionService] No conflicts detected for project ${newProject._id}`);
    return [];
  }

  logger.info(`[DecisionService] ${clashes.length} conflict(s) detected for project ${newProject._id}`);

  // -------------------------------------------------------------------------
  // Step 2 — MCDM Engine + Step 3 — Graph Engine
  // Score each conflicting pair and determine execution order
  // -------------------------------------------------------------------------
  const savedConflicts = [];

  // Gather all involved projects (new + all conflicting) for graph ordering
  const allInvolvedProjects = [newProjectPlain, ...clashes.map((c) => c.conflictingProject)];

  // Build flat scores map for graph engine tie-breaking
  const allScores = {};

  // Collect conflict data structures for graph engine
  const conflictEdges = [];

  // Score each clash independently
  for (const clash of clashes) {
    const existingProject = clash.conflictingProject;

    // -----------------------------------------------------------------------
    // Step 2a — Check for duplicate conflict (A vs B already exists)
    // Prevent creating duplicate Conflict documents if both projects
    // submit at the same time or a re-check is triggered
    // -----------------------------------------------------------------------
    const existingConflict = await Conflict.findOne({
      $or: [
        { projectA: newProject._id, projectB: existingProject._id },
        { projectA: existingProject._id, projectB: newProject._id },
      ],
      status: { $in: ["open"] },
    });

    if (existingConflict) {
      logger.info(
        `[DecisionService] Conflict already exists for projects ${newProject._id} and ${existingProject._id} — skipping`
      );
      savedConflicts.push(existingConflict);
      continue;
    }

    // -----------------------------------------------------------------------
    // Step 2b — MCDM Engine: score this pair
    // -----------------------------------------------------------------------
    const mcdmResult = scoreConflict(newProjectPlain, existingProject);

    // Accumulate scores into flat map for graph engine
    Object.assign(allScores, mcdmResult.scores);

    // Store conflict edge data for graph engine
    conflictEdges.push({
      projectAId: newProject._id.toString(),
      projectBId: existingProject._id.toString(),
      scores:     mcdmResult.scores,
    });

    // -----------------------------------------------------------------------
    // Step 3 — Graph Engine: build execution order for this pair
    // Pass all involved projects so the DAG has full context
    // -----------------------------------------------------------------------
    const graphResult = buildExecutionOrder(
      allInvolvedProjects,
      conflictEdges,
      allScores
    );

    if (graphResult.hasCycle) {
      logger.warn(
        `[DecisionService] Cycle detected in dependency graph for project ${newProject._id} — proceeding with MCDM order only`
      );
    }

    // -----------------------------------------------------------------------
    // Step 4 — Persist Conflict document
    // -----------------------------------------------------------------------
    const conflict = await Conflict.create({
      projectA:     newProject._id,
      projectB:     existingProject._id,
      overlapArea:  clash.overlapArea,
      overlapDates: clash.overlapDates,
      status:       "open",
      recommendation: {
        order:       mcdmResult.order,
        scores:      {
          projectA: mcdmResult.scores[newProject._id.toString()],
          projectB: mcdmResult.scores[existingProject._id.toString()],
        },
        explanation: mcdmResult.explanation,
      },
    });

    // Update both projects' mcdmScore fields with computed TOPSIS scores
    await Project.findByIdAndUpdate(newProject._id, {
      mcdmScore: mcdmResult.scores[newProject._id.toString()] || null,
    });
    await Project.findByIdAndUpdate(existingProject._id, {
      mcdmScore: mcdmResult.scores[existingProject._id.toString()] || null,
    });

    savedConflicts.push(conflict);

    // -----------------------------------------------------------------------
    // Step 5 — Notify via Socket.io stub
    // Phase 4 will replace stub body with real emit
    // -----------------------------------------------------------------------
    emitClashDetected(conflict._id.toString(), [
      newProject._id.toString(),
      existingProject._id.toString(),
    ]);

    logger.info(
      `[DecisionService] Conflict saved: ${conflict._id} — ` +
      `"${newProjectPlain.title}" vs "${existingProject.title}" — ` +
      `winner: ${mcdmResult.order[0]}`
    );
  }

  return savedConflicts;
};

module.exports = { runDecisionPipeline };
'@ | Set-Content -Path "backend\src\services\decision.service.js" -Encoding UTF8

# backend\src\services\audit.service.js
@'
"use strict";

const AuditLog = require("../models/AuditLog");
const logger   = require("../utils/logger");

// ---------------------------------------------------------------------------
// audit.service.js
//
// Single responsibility: write immutable audit log entries.
// Called by every service that performs a significant state change.
//
// AuditLog documents are append-only — no updates or deletes ever.
// The model enforces this via pre-hooks (built in Phase 1).
//
// Designed to never throw — audit failure must not break the main operation.
// Errors are logged via Winston but swallowed so callers are unaffected.
// ---------------------------------------------------------------------------

/**
 * Writes an audit log entry for a significant action
 * Designed to be fire-and-forget — never throws
 *
 * @param {object} params
 * @param {string} params.userId      - ID of user performing the action
 * @param {string} params.action      - Dot-notation action string e.g. "project.created"
 * @param {string} params.resource    - Collection name e.g. "projects"
 * @param {string} params.resourceId  - ID of the affected document
 * @param {object} [params.before]    - State before the change (null for creates)
 * @param {object} [params.after]     - State after the change (null for deletes)
 * @param {string} [params.ip]        - IP address of the request
 * @returns {Promise<void>}
 */
const logAction = async ({
  userId,
  action,
  resource,
  resourceId,
  before = null,
  after  = null,
  ip     = null,
}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      resource,
      resourceId,
      before,
      after,
      ip,
    });
  } catch (err) {
    // Audit failure must never break the calling operation
    // Log the error but do not rethrow
    logger.error(`[AuditService] Failed to write audit log — action: ${action}, resource: ${resource}/${resourceId} — ${err.message}`);
  }
};

// ---------------------------------------------------------------------------
// Convenience wrappers for common actions
// These ensure consistent action string formatting across the codebase
// ---------------------------------------------------------------------------

const auditProjectCreated = (userId, project, ip) =>
  logAction({
    userId,
    action:     "project.created",
    resource:   "projects",
    resourceId: project._id,
    before:     null,
    after:      { title: project.title, status: project.status, department: project.department },
    ip,
  });

const auditProjectStatusUpdated = (userId, projectId, before, after, ip) =>
  logAction({
    userId,
    action:     "project.status_updated",
    resource:   "projects",
    resourceId: projectId,
    before:     { status: before },
    after:      { status: after },
    ip,
  });

const auditProjectAssigned = (userId, projectId, supervisorId, ip) =>
  logAction({
    userId,
    action:     "project.assigned",
    resource:   "projects",
    resourceId: projectId,
    before:     null,
    after:      { assignedTo: supervisorId },
    ip,
  });

const auditConflictResolved = (userId, conflictId, resolution, ip) =>
  logAction({
    userId,
    action:     "conflict.resolved",
    resource:   "conflicts",
    resourceId: conflictId,
    before:     { status: "open" },
    after:      { status: "resolved", resolution },
    ip,
  });

const auditDepartmentCreated = (userId, department, ip) =>
  logAction({
    userId,
    action:     "department.created",
    resource:   "departments",
    resourceId: department._id,
    before:     null,
    after:      { name: department.name, code: department.code },
    ip,
  });

const auditReportStatusUpdated = (userId, reportId, before, after, ip) =>
  logAction({
    userId,
    action:     "report.status_updated",
    resource:   "citizen_reports",
    resourceId: reportId,
    before:     { status: before },
    after:      { status: after },
    ip,
  });

module.exports = {
  logAction,
  auditProjectCreated,
  auditProjectStatusUpdated,
  auditProjectAssigned,
  auditConflictResolved,
  auditDepartmentCreated,
  auditReportStatusUpdated,
};
'@ | Set-Content -Path "backend\src\services\audit.service.js" -Encoding UTF8

# backend\src\controllers\project.controller.js
@'
"use strict";

const ProjectService = require("../services/project.service");
const { success }    = require("../utils/response");

// ---------------------------------------------------------------------------
// project.controller.js
// Controllers only handle req/res — zero business logic here
// All logic lives in project.service.js
// ---------------------------------------------------------------------------

const getAllProjects = async (req, res, next) => {
  try {
    const { projects, pagination } = await ProjectService.getAllProjects(
      req.user,
      req.query
    );
    return res.status(200).json({
      success:    true,
      message:    "Projects fetched",
      data:       projects,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await ProjectService.getProjectById(req.params.id, req.user);
    return res.status(200).json(success("Project fetched", project));
  } catch (err) {
    next(err);
  }
};

const createProject = async (req, res, next) => {
  try {
    const result = await ProjectService.createProject(
      req.body,
      req.user,
      req.ip
    );
    return res.status(201).json(success("Project submitted successfully", result));
  } catch (err) {
    next(err);
  }
};

const updateProjectStatus = async (req, res, next) => {
  try {
    const project = await ProjectService.updateProjectStatus(
      req.params.id,
      req.body,
      req.user,
      req.ip
    );
    return res.status(200).json(success("Project status updated", project));
  } catch (err) {
    next(err);
  }
};

const assignProject = async (req, res, next) => {
  try {
    const { supervisorId } = req.body;
    const project = await ProjectService.assignProject(
      req.params.id,
      supervisorId,
      req.user,
      req.ip
    );
    return res.status(200).json(success("Project assigned to supervisor", project));
  } catch (err) {
    next(err);
  }
};

const getMapData = async (req, res, next) => {
  try {
    const geoJson = await ProjectService.getMapData();
    return res.status(200).json(success("Map data fetched", geoJson));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProjectStatus,
  assignProject,
  getMapData,
};
'@ | Set-Content -Path "backend\src\controllers\project.controller.js" -Encoding UTF8

# backend\src\controllers\conflict.controller.js
@'
"use strict";

const ConflictService = require("../services/conflict.service");
const { success }     = require("../utils/response");

// ---------------------------------------------------------------------------
// conflict.controller.js
// Controllers only handle req/res — zero business logic here
// ---------------------------------------------------------------------------

const getAllConflicts = async (req, res, next) => {
  try {
    const conflicts = await ConflictService.getAllConflicts(req.user);
    return res.status(200).json(success("Conflicts fetched", conflicts));
  } catch (err) {
    next(err);
  }
};

const getConflictById = async (req, res, next) => {
  try {
    const conflict = await ConflictService.getConflictById(req.params.id, req.user);
    return res.status(200).json(success("Conflict detail fetched", conflict));
  } catch (err) {
    next(err);
  }
};

const resolveConflict = async (req, res, next) => {
  try {
    const { resolution, status } = req.body;
    const conflict = await ConflictService.resolveConflict(
      req.params.id,
      resolution,
      status,
      req.user,
      req.ip
    );
    return res.status(200).json(success("Conflict resolved", conflict));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllConflicts,
  getConflictById,
  resolveConflict,
};
'@ | Set-Content -Path "backend\src\controllers\conflict.controller.js" -Encoding UTF8

# backend\src\controllers\department.controller.js
@'
"use strict";

const Department             = require("../models/Department");
const User                   = require("../models/User");
const { success }            = require("../utils/response");
const { auditDepartmentCreated } = require("../services/audit.service");

// ---------------------------------------------------------------------------
// department.controller.js
// Departments are low-complexity — service layer is inline here
// All routes are admin-only so no RBAC filtering needed beyond middleware
// ---------------------------------------------------------------------------

const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find()
      .populate("headId", "name email")
      .sort({ name: 1 })
      .lean();
    return res.status(200).json(success("Departments fetched", departments));
  } catch (err) {
    next(err);
  }
};

const getDepartmentById = async (req, res, next) => {
  try {
    const dept = await Department.findById(req.params.id)
      .populate("headId", "name email role")
      .lean();

    if (!dept) {
      const err = new Error("Department not found");
      err.statusCode = 404;
      throw err;
    }

    return res.status(200).json(success("Department fetched", dept));
  } catch (err) {
    next(err);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      const err = new Error("name and code are required");
      err.statusCode = 400;
      throw err;
    }

    const dept = await Department.create({ name, code });

    auditDepartmentCreated(req.user.userId, dept, req.ip);

    return res.status(201).json(success("Department created", dept));
  } catch (err) {
    // Handle duplicate key — name or code already exists
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      const dupErr = new Error(`Department with this ${field} already exists`);
      dupErr.statusCode = 409;
      return next(dupErr);
    }
    next(err);
  }
};

const assignDepartmentHead = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const dept = await Department.findById(req.params.id);
    if (!dept) {
      const err = new Error("Department not found");
      err.statusCode = 404;
      throw err;
    }

    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    dept.headId = userId;
    await dept.save();

    const updated = await Department.findById(dept._id)
      .populate("headId", "name email role")
      .lean();

    return res.status(200).json(success("Department head assigned", updated));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  assignDepartmentHead,
};
'@ | Set-Content -Path "backend\src\controllers\department.controller.js" -Encoding UTF8

# backend\src\controllers\admin.controller.js
@'
"use strict";

const Project        = require("../models/Project");
const Conflict       = require("../models/Conflict");
const Department     = require("../models/Department");
const CitizenReport  = require("../models/CitizenReport");
const AuditLog       = require("../models/AuditLog");
const { success }    = require("../utils/response");

// ---------------------------------------------------------------------------
// admin.controller.js
// Admin-only endpoints: dashboard stats aggregation + audit log
// All routes protected by auth + permit("admin") at route level
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/admin/dashboard
 * Returns aggregated platform statistics matching API_CONTRACT exactly
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // Run all aggregation queries in parallel for performance
    const [
      totalProjects,
      pendingApprovals,
      activeConflicts,
      resolvedConflicts,
      totalDepartments,
      totalReports,
      unresolvedReports,
      projectsByStatusRaw,
      projectsByDeptRaw,
    ] = await Promise.all([
      // Total projects count
      Project.countDocuments(),

      // Projects awaiting admin approval
      Project.countDocuments({ status: "pending" }),

      // Open conflicts
      Conflict.countDocuments({ status: "open" }),

      // Resolved or overridden conflicts
      Conflict.countDocuments({ status: { $in: ["resolved", "overridden"] } }),

      // Active departments
      Department.countDocuments({ isActive: true }),

      // Total citizen reports
      CitizenReport.countDocuments(),

      // Unresolved citizen reports
      CitizenReport.countDocuments({ status: { $nin: ["resolved"] } }),

      // Projects grouped by status
      Project.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Projects grouped by department
      Project.aggregate([
        {
          $group: {
            _id:   "$department",
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from:         "departments",
            localField:   "_id",
            foreignField: "_id",
            as:           "dept",
          },
        },
        { $unwind: { path: "$dept", preserveNullAndEmpty: true } },
        {
          $project: {
            _id:        0,
            department: { $ifNull: ["$dept.name", "Unknown"] },
            count:      1,
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Reshape projectsByStatus array into the flat object shape from API_CONTRACT
    const projectsByStatus = {
      pending:   0,
      approved:  0,
      ongoing:   0,
      completed: 0,
      rejected:  0,
      clashed:   0,
    };
    for (const item of projectsByStatusRaw) {
      if (item._id in projectsByStatus) {
        projectsByStatus[item._id] = item.count;
      }
    }

    return res.status(200).json(
      success("Dashboard data fetched", {
        totalProjects,
        pendingApprovals,
        activeConflicts,
        resolvedConflicts,
        totalDepartments,
        citizenReports: {
          total:      totalReports,
          unresolved: unresolvedReports,
        },
        projectsByStatus,
        projectsByDepartment: projectsByDeptRaw,
      })
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/audit
 * Returns paginated audit log with optional userId + resource filters
 */
const getAuditLog = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.userId)   filter.userId   = req.query.userId;
    if (req.query.resource) filter.resource = req.query.resource;

    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const skip  = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("userId", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success:    true,
      message:    "Audit logs fetched",
      data:       logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getAuditLog,
};
'@ | Set-Content -Path "backend\src\controllers\admin.controller.js" -Encoding UTF8

# ===========================================================================
# PHASE 4 — Socket.io + Notification Service + Server + Map Components
# ===========================================================================

# backend\src\socket\socket.handler.js
@'
"use strict";

const { Server } = require("socket.io");
const config     = require("../config/index");
const logger     = require("../utils/logger");

// ---------------------------------------------------------------------------
// socket.handler.js
//
// Initialises Socket.io on the HTTP server.
// Exports:
//   initSocket(httpServer) — call once in server.js after server.listen()
//   getIO()                — returns the io instance for use in services
//
// Room strategy:
//   Every authenticated client joins two rooms on connection:
//     1. Their userId  — for personal notifications (task:assigned)
//     2. Their departmentId — for department notifications (clash:detected, project:approved)
//   Admin joins room "admin" — receives everything
//
// Client sends:  { event: "join", userId, departmentId, role }
// Server emits all events defined in HANDOFF.md Section 13
// ---------------------------------------------------------------------------

let io = null;

/**
 * Initialises Socket.io and attaches it to the HTTP server
 * Must be called once in server.js after server.listen()
 *
 * @param {http.Server} httpServer  - The Node.js HTTP server instance
 * @returns {Server}                - The Socket.io server instance
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:  config.CLIENT_ORIGIN,
      methods: ["GET", "POST"],
    },
    // Ping timeout / interval — keeps connections alive through proxies
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    logger.info(`[Socket] Client connected — socketId: ${socket.id}`);

    // -------------------------------------------------------------------------
    // join — client sends its identity so server can place it in correct rooms
    // Payload: { userId, departmentId, role }
    // -------------------------------------------------------------------------
    socket.on("join", ({ userId, departmentId, role }) => {
      if (userId) {
        socket.join(userId);
        logger.info(`[Socket] ${socket.id} joined user room: ${userId}`);
      }

      if (departmentId) {
        socket.join(departmentId);
        logger.info(`[Socket] ${socket.id} joined dept room: ${departmentId}`);
      }

      if (role === "admin") {
        socket.join("admin");
        logger.info(`[Socket] ${socket.id} joined admin room`);
      }

      // Acknowledge join
      socket.emit("joined", {
        userId,
        departmentId,
        role,
        socketId: socket.id,
      });
    });

    // -------------------------------------------------------------------------
    // disconnect
    // -------------------------------------------------------------------------
    socket.on("disconnect", (reason) => {
      logger.info(`[Socket] Client disconnected — socketId: ${socket.id} — reason: ${reason}`);
    });

    // -------------------------------------------------------------------------
    // Error handler — prevents uncaught errors from crashing the server
    // -------------------------------------------------------------------------
    socket.on("error", (err) => {
      logger.error(`[Socket] Error on ${socket.id} — ${err.message}`);
    });
  });

  logger.info("[Socket] Socket.io initialised");
  return io;
};

/**
 * Returns the active Socket.io instance
 * Throws if called before initSocket()
 *
 * @returns {Server}  - The Socket.io server instance
 */
const getIO = () => {
  if (!io) {
    throw new Error("[Socket] Socket.io not initialised. Call initSocket(server) first.");
  }
  return io;
};

// ---------------------------------------------------------------------------
// Emitter functions
// These are called by notification.service.js
// Separated here so the service never imports socket.io directly
// ---------------------------------------------------------------------------

/**
 * Emits clash:detected to the admin room AND both departments involved
 *
 * @param {string}   conflictId   - MongoDB conflict ID
 * @param {string[]} projectIds   - [projectAId, projectBId]
 * @param {string[]} departmentIds - Department IDs of the two projects (optional)
 */
const emitClashDetected = (conflictId, projectIds, departmentIds = []) => {
  if (!io) return;

  const payload = { conflictId, projectIds, timestamp: new Date().toISOString() };

  // Notify admin room
  io.to("admin").emit("clash:detected", payload);

  // Notify both departments
  for (const deptId of departmentIds) {
    if (deptId) io.to(String(deptId)).emit("clash:detected", payload);
  }

  logger.info(`[Socket] clash:detected emitted — conflict ${conflictId}`);
};

/**
 * Emits project:approved to the project's department room
 *
 * @param {string} projectId    - MongoDB project ID
 * @param {string} departmentId - Department to notify
 */
const emitProjectApproved = (projectId, departmentId) => {
  if (!io) return;

  const payload = { projectId, timestamp: new Date().toISOString() };

  if (departmentId) io.to(String(departmentId)).emit("project:approved", payload);
  io.to("admin").emit("project:approved", payload);

  logger.info(`[Socket] project:approved emitted — project ${projectId}`);
};

/**
 * Emits project:rejected to the project's department room
 *
 * @param {string} projectId    - MongoDB project ID
 * @param {string} departmentId - Department to notify
 */
const emitProjectRejected = (projectId, departmentId) => {
  if (!io) return;

  const payload = { projectId, timestamp: new Date().toISOString() };

  if (departmentId) io.to(String(departmentId)).emit("project:rejected", payload);
  io.to("admin").emit("project:rejected", payload);

  logger.info(`[Socket] project:rejected emitted — project ${projectId}`);
};

/**
 * Emits report:status_update — broadcast to all connected clients
 * (Citizens tracking their own report have no auth, so this is a global broadcast)
 *
 * @param {string} trackingId  - CNR-XXXXXX tracking ID
 * @param {string} status      - New status string
 */
const emitReportStatusUpdate = (trackingId, status) => {
  if (!io) return;

  io.emit("report:status_update", {
    trackingId,
    status,
    timestamp: new Date().toISOString(),
  });

  logger.info(`[Socket] report:status_update emitted — ${trackingId} → ${status}`);
};

/**
 * Emits task:assigned to the specific supervisor's personal room
 *
 * @param {string} supervisorId  - MongoDB user ID of the supervisor
 * @param {string} projectId     - MongoDB project ID
 */
const emitTaskAssigned = (supervisorId, projectId) => {
  if (!io) return;

  io.to(String(supervisorId)).emit("task:assigned", {
    projectId,
    timestamp: new Date().toISOString(),
  });

  logger.info(`[Socket] task:assigned emitted — supervisor ${supervisorId}`);
};

module.exports = {
  initSocket,
  getIO,
  emitClashDetected,
  emitProjectApproved,
  emitProjectRejected,
  emitReportStatusUpdate,
  emitTaskAssigned,
};
'@ | Set-Content -Path "backend\src\socket\socket.handler.js" -Encoding UTF8

# backend\src\services\notification.service.js
@'
"use strict";

const socketHandler = require("../socket/socket.handler");
const logger        = require("../utils/logger");

// ---------------------------------------------------------------------------
// notification.service.js — LIVE (Phase 4 replacement)
//
// Replaces the Phase 2 stub.
// All function signatures and module.exports are identical to the stub —
// nothing that imports this file needs to change.
//
// Delegates to socket.handler.js which holds the io instance.
// If Socket.io is not yet initialised (e.g. during tests), calls are
// silently skipped — the try/catch guards ensure no crash.
// ---------------------------------------------------------------------------

const emitClashDetected = (conflictId, projectIds, departmentIds = []) => {
  try {
    socketHandler.emitClashDetected(conflictId, projectIds, departmentIds);
  } catch (err) {
    logger.warn(`[NotificationService] emitClashDetected failed — ${err.message}`);
  }
};

const emitProjectApproved = (projectId, departmentId) => {
  try {
    socketHandler.emitProjectApproved(projectId, departmentId);
  } catch (err) {
    logger.warn(`[NotificationService] emitProjectApproved failed — ${err.message}`);
  }
};

const emitProjectRejected = (projectId, departmentId) => {
  try {
    socketHandler.emitProjectRejected(projectId, departmentId);
  } catch (err) {
    logger.warn(`[NotificationService] emitProjectRejected failed — ${err.message}`);
  }
};

const emitReportStatusUpdate = (trackingId, status) => {
  try {
    socketHandler.emitReportStatusUpdate(trackingId, status);
  } catch (err) {
    logger.warn(`[NotificationService] emitReportStatusUpdate failed — ${err.message}`);
  }
};

const emitTaskAssigned = (supervisorId, projectId) => {
  try {
    socketHandler.emitTaskAssigned(supervisorId, projectId);
  } catch (err) {
    logger.warn(`[NotificationService] emitTaskAssigned failed — ${err.message}`);
  }
};

module.exports = {
  emitClashDetected,
  emitProjectApproved,
  emitProjectRejected,
  emitReportStatusUpdate,
  emitTaskAssigned,
};
'@ | Set-Content -Path "backend\src\services\notification.service.js" -Encoding UTF8

# backend\server.js
@'
"use strict";

const http          = require("http");
const app           = require("./src/app");
const connectDB     = require("./src/config/db");
const config        = require("./src/config/index");
const logger        = require("./src/utils/logger");
const { initSocket } = require("./src/socket/socket.handler");

// ---------------------------------------------------------------------------
// Create HTTP server from Express app
// Socket.io attaches to this server instance, not to the Express app directly
// ---------------------------------------------------------------------------
const server = http.createServer(app);

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
const shutdown = (signal) => {
  logger.info(`[Server] ${signal} received — shutting down gracefully`);

  server.close(async () => {
    logger.info("[Server] HTTP server closed");

    try {
      const mongoose = require("mongoose");
      await mongoose.connection.close();
      logger.info("[DB] MongoDB connection closed");
      process.exit(0);
    } catch (err) {
      logger.error(`[Server] Error during shutdown — ${err.message}`);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error(`[Server] Unhandled Promise Rejection — ${reason}`);
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  logger.error(`[Server] Uncaught Exception — ${err.message}`);
  shutdown("uncaughtException");
});

// ---------------------------------------------------------------------------
// Boot sequence
// 1. Connect MongoDB
// 2. Start HTTP server
// 3. Attach Socket.io (must be after server.listen so the port is bound)
// ---------------------------------------------------------------------------
const start = async () => {
  try {
    await connectDB();

    server.listen(config.PORT, () => {
      logger.info(`[Server] Urban Nexus API running on port ${config.PORT}`);
      logger.info(`[Server] Environment — ${config.NODE_ENV}`);
      logger.info(`[Server] Health check — http://localhost:${config.PORT}/health`);

      // Attach Socket.io after server is listening
      initSocket(server);
      logger.info(`[Server] Socket.io attached`);
    });
  } catch (err) {
    logger.error(`[Server] Failed to start — ${err.message}`);
    process.exit(1);
  }
};

start();

module.exports = server;
'@ | Set-Content -Path "backend\server.js" -Encoding UTF8

# frontend\src\hooks\useSocket.js
@'
import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/index";
import useAuthStore         from "../store/authStore";
import useNotificationStore from "../store/notificationStore";

// ---------------------------------------------------------------------------
// useSocket.js
//
// Manages the Socket.io client connection lifecycle.
// - Connects once on mount when user is authenticated
// - Joins the correct rooms (userId, departmentId, "admin" if role=admin)
// - Listens for all 5 server events and dispatches to notificationStore
// - Disconnects cleanly on unmount
//
// Usage:
//   const { socket, connected } = useSocket();
//   — call in a top-level component (e.g. Layout.jsx) so it runs app-wide
// ---------------------------------------------------------------------------

const useSocket = () => {
  const socketRef   = useRef(null);
  const { user }    = useAuthStore();
  const { addNotification } = useNotificationStore();

  // -------------------------------------------------------------------------
  // Connect and set up listeners
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) return;

    // Prevent duplicate connections
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      transports:       ["websocket", "polling"],
      reconnection:     true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    // -----------------------------------------------------------------------
    // On connect — join rooms
    // -----------------------------------------------------------------------
    socket.on("connect", () => {
      socket.emit("join", {
        userId:       user._id,
        departmentId: user.department?._id || user.department || null,
        role:         user.role,
      });
    });

    // -----------------------------------------------------------------------
    // clash:detected
    // { conflictId, projectIds, timestamp }
    // -----------------------------------------------------------------------
    socket.on("clash:detected", (data) => {
      addNotification({
        type:      "clash",
        title:     "Conflict Detected",
        message:   "Two projects at the same location have conflicting schedules.",
        conflictId: data.conflictId,
        projectIds: data.projectIds,
        timestamp:  data.timestamp,
        read:       false,
      });
    });

    // -----------------------------------------------------------------------
    // project:approved
    // { projectId, timestamp }
    // -----------------------------------------------------------------------
    socket.on("project:approved", (data) => {
      addNotification({
        type:      "approval",
        title:     "Project Approved",
        message:   "A project in your department has been approved.",
        projectId: data.projectId,
        timestamp: data.timestamp,
        read:      false,
      });
    });

    // -----------------------------------------------------------------------
    // project:rejected
    // { projectId, timestamp }
    // -----------------------------------------------------------------------
    socket.on("project:rejected", (data) => {
      addNotification({
        type:      "rejection",
        title:     "Project Rejected",
        message:   "A project in your department has been rejected.",
        projectId: data.projectId,
        timestamp: data.timestamp,
        read:      false,
      });
    });

    // -----------------------------------------------------------------------
    // report:status_update
    // { trackingId, status, timestamp }
    // -----------------------------------------------------------------------
    socket.on("report:status_update", (data) => {
      addNotification({
        type:       "report",
        title:      "Report Updated",
        message:    `Report ${data.trackingId} is now ${data.status}.`,
        trackingId: data.trackingId,
        status:     data.status,
        timestamp:  data.timestamp,
        read:       false,
      });
    });

    // -----------------------------------------------------------------------
    // task:assigned
    // { projectId, timestamp }
    // -----------------------------------------------------------------------
    socket.on("task:assigned", (data) => {
      addNotification({
        type:      "task",
        title:     "Task Assigned",
        message:   "You have been assigned a new project.",
        projectId: data.projectId,
        timestamp: data.timestamp,
        read:      false,
      });
    });

    // -----------------------------------------------------------------------
    // Error / disconnect
    // -----------------------------------------------------------------------
    socket.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });

    // -----------------------------------------------------------------------
    // Cleanup on unmount or user change
    // -----------------------------------------------------------------------
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, addNotification]);

  // -------------------------------------------------------------------------
  // Manual emit helper — exposed for components that need to send events
  // -------------------------------------------------------------------------
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket:    socketRef.current,
    connected: socketRef.current?.connected ?? false,
    emit,
  };
};

export default useSocket;
'@ | Set-Content -Path "frontend\src\hooks\useSocket.js" -Encoding UTF8

# frontend\src\components\map\ProjectMarker.jsx
@'
import { Polygon, Tooltip, Popup } from "react-leaflet";

// ---------------------------------------------------------------------------
// ProjectMarker.jsx
//
// Renders a single project as a colored Leaflet Polygon.
// Color is determined by project TYPE (primary) and STATUS (opacity/border).
//
// GeoJSON uses [lng, lat] — Leaflet Polygon expects [[lat, lng]].
// This component handles the coordinate flip internally.
// ---------------------------------------------------------------------------

// Color palette by project type — matches Urban Nexus design system
const TYPE_COLORS = {
  road:        "#F59E0B",  // amber
  water:       "#3B82F6",  // blue
  electricity: "#F97316",  // orange
  sewage:      "#8B5CF6",  // purple
  parks:       "#10B981",  // green
  other:       "#6B7280",  // gray
};

// Border/fill opacity adjustments by status
const STATUS_STYLE = {
  pending:   { fillOpacity: 0.25, weight: 2, dashArray: "6 4" },
  approved:  { fillOpacity: 0.35, weight: 2, dashArray: null },
  ongoing:   { fillOpacity: 0.50, weight: 3, dashArray: null },
  completed: { fillOpacity: 0.15, weight: 1, dashArray: "2 6" },
  rejected:  { fillOpacity: 0.10, weight: 1, dashArray: "2 6" },
  clashed:   { fillOpacity: 0.45, weight: 3, dashArray: "8 4" },
};

const STATUS_LABELS = {
  pending:   "Pending",
  approved:  "Approved",
  ongoing:   "Ongoing",
  completed: "Completed",
  rejected:  "Rejected",
  clashed:   "Clashed",
};

/**
 * Flips GeoJSON [lng, lat] coordinates to Leaflet [lat, lng] format
 * Works for simple Polygon (first ring only — no holes needed for MVP)
 */
const flipCoords = (coordinates) => {
  // coordinates is [[[lng, lat], ...]] — GeoJSON Polygon outer ring
  const ring = coordinates[0];
  return ring.map(([lng, lat]) => [lat, lng]);
};

/**
 * Renders a project as a colored Leaflet Polygon with tooltip and popup
 *
 * @param {object} props.feature  - GeoJSON Feature with geometry + properties
 * @param {function} props.onClick - Optional click handler (projectId) => void
 */
const ProjectMarker = ({ feature, onClick }) => {
  if (!feature?.geometry?.coordinates) return null;

  const { _id, title, type, status, department, startDate, endDate } =
    feature.properties || {};

  const color       = TYPE_COLORS[type]   || TYPE_COLORS.other;
  const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.pending;

  const positions = flipCoords(feature.geometry.coordinates);

  const pathOptions = {
    color,
    fillColor:   color,
    fillOpacity: statusStyle.fillOpacity,
    weight:      statusStyle.weight,
    dashArray:   statusStyle.dashArray,
  };

  const handleClick = () => {
    if (onClick && _id) onClick(_id);
  };

  return (
    <Polygon
      positions={positions}
      pathOptions={pathOptions}
      eventHandlers={{ click: handleClick }}
    >
      {/* Tooltip — shows on hover */}
      <Tooltip sticky>
        <div className="text-xs font-medium">
          <p className="font-semibold text-sm mb-0.5">{title}</p>
          <p className="capitalize">{type} · {STATUS_LABELS[status] || status}</p>
          {department && <p className="text-gray-500">{department}</p>}
        </div>
      </Tooltip>

      {/* Popup — shows on click */}
      <Popup>
        <div className="text-sm min-w-[180px]">
          <p className="font-semibold text-base mb-1">{title}</p>
          <div className="space-y-0.5 text-gray-600">
            <p>
              <span className="font-medium">Type:</span>{" "}
              <span className="capitalize">{type}</span>
            </p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span className="capitalize">{STATUS_LABELS[status] || status}</span>
            </p>
            {department && (
              <p>
                <span className="font-medium">Dept:</span> {department}
              </p>
            )}
            {startDate && (
              <p>
                <span className="font-medium">Start:</span>{" "}
                {new Date(startDate).toLocaleDateString("en-IN")}
              </p>
            )}
            {endDate && (
              <p>
                <span className="font-medium">End:</span>{" "}
                {new Date(endDate).toLocaleDateString("en-IN")}
              </p>
            )}
          </div>
          {onClick && _id && (
            <button
              onClick={handleClick}
              className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium underline"
            >
              View Details →
            </button>
          )}
        </div>
      </Popup>
    </Polygon>
  );
};

export default ProjectMarker;
export { TYPE_COLORS, STATUS_LABELS };
'@ | Set-Content -Path "frontend\src\components\map\ProjectMarker.jsx" -Encoding UTF8

# frontend\src\components\map\MapFilters.jsx
@'
import { useState } from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";

// ---------------------------------------------------------------------------
// MapFilters.jsx
//
// Collapsible filter panel that sits on top of the map.
// Emits a `filters` object upward via onChange.
// Parent (MapView / CityMap) applies filters to the GeoJSON features.
//
// Filters:
//   type       — road | water | electricity | sewage | parks | other
//   status     — pending | approved | ongoing | completed | rejected | clashed
//   department — free-text search on department code
// ---------------------------------------------------------------------------

const PROJECT_TYPES = [
  { value: "road",        label: "Road" },
  { value: "water",       label: "Water" },
  { value: "electricity", label: "Electricity" },
  { value: "sewage",      label: "Sewage" },
  { value: "parks",       label: "Parks" },
  { value: "other",       label: "Other" },
];

const PROJECT_STATUSES = [
  { value: "pending",   label: "Pending" },
  { value: "approved",  label: "Approved" },
  { value: "ongoing",   label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "clashed",   label: "Clashed" },
];

// Status badge colors
const STATUS_COLORS = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-300",
  approved:  "bg-green-100  text-green-800  border-green-300",
  ongoing:   "bg-blue-100   text-blue-800   border-blue-300",
  completed: "bg-gray-100   text-gray-600   border-gray-300",
  clashed:   "bg-red-100    text-red-800    border-red-300",
};

const TYPE_COLORS = {
  road:        "bg-amber-100  text-amber-800  border-amber-300",
  water:       "bg-blue-100   text-blue-800   border-blue-300",
  electricity: "bg-orange-100 text-orange-800 border-orange-300",
  sewage:      "bg-purple-100 text-purple-800 border-purple-300",
  parks:       "bg-emerald-100 text-emerald-800 border-emerald-300",
  other:       "bg-gray-100   text-gray-600   border-gray-300",
};

const DEFAULT_FILTERS = {
  types:      [],  // empty = all types shown
  statuses:   [],  // empty = all statuses shown
  department: "",
};

/**
 * Collapsible filter panel for the city map
 *
 * @param {function} props.onChange  - Called with filters object when any filter changes
 * @param {number}   props.count     - Number of projects currently shown (for display)
 */
const MapFilters = ({ onChange, count = 0 }) => {
  const [filters, setFilters]     = useState(DEFAULT_FILTERS);
  const [expanded, setExpanded]   = useState(false);

  const activeCount =
    filters.types.length + filters.statuses.length + (filters.department ? 1 : 0);

  const update = (newFilters) => {
    setFilters(newFilters);
    onChange?.(newFilters);
  };

  const toggleType = (value) => {
    const updated = filters.types.includes(value)
      ? filters.types.filter((t) => t !== value)
      : [...filters.types, value];
    update({ ...filters, types: updated });
  };

  const toggleStatus = (value) => {
    const updated = filters.statuses.includes(value)
      ? filters.statuses.filter((s) => s !== value)
      : [...filters.statuses, value];
    update({ ...filters, statuses: updated });
  };

  const clearAll = () => {
    update(DEFAULT_FILTERS);
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header bar */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-emerald-600" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Filters
          </span>
          {activeCount > 0 && (
            <span className="text-xs bg-emerald-600 text-white rounded-full px-1.5 py-0.5 font-medium">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{count} projects</span>
          {expanded ? (
            <ChevronUp size={14} className="text-gray-400" />
          ) : (
            <ChevronDown size={14} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded filter body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-3">

          {/* Type filter */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Project Type
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PROJECT_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => toggleType(value)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                    filters.types.includes(value)
                      ? TYPE_COLORS[value]
                      : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Status
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PROJECT_STATUSES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => toggleStatus(value)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                    filters.statuses.includes(value)
                      ? STATUS_COLORS[value]
                      : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Department filter */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Department
            </p>
            <input
              type="text"
              placeholder="e.g. PWD, WB, ELEC"
              value={filters.department}
              onChange={(e) =>
                update({ ...filters, department: e.target.value.toUpperCase() })
              }
              className="w-full text-xs px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Clear all */}
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium"
            >
              <X size={12} />
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MapFilters;
'@ | Set-Content -Path "frontend\src\components\map\MapFilters.jsx" -Encoding UTF8

# frontend\src\components\map\DrawPolygon.jsx
@'
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Pencil, Trash2, CheckCircle } from "lucide-react";
import "leaflet/dist/leaflet.css";

// ---------------------------------------------------------------------------
// DrawPolygon.jsx
//
// A self-contained Leaflet map widget used inside ProjectForm.jsx.
// Lets officers draw a polygon on the map to define their project's location.
//
// Uses Leaflet's built-in editing API directly (no leaflet-draw dependency)
// via a custom draw-mode that tracks clicks and builds a polygon.
//
// Props:
//   value    — current GeoJSON Polygon geometry { type, coordinates } or null
//   onChange — called with GeoJSON Polygon geometry when polygon is finalised
//   center   — [lat, lng] map center default (default: Ghaziabad, UP)
// ---------------------------------------------------------------------------

// Default center: Ghaziabad, Uttar Pradesh
const DEFAULT_CENTER = [28.6692, 77.4538];
const DEFAULT_ZOOM   = 14;

// Fixes Leaflet marker icon issue in Vite/webpack builds
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon   from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

// ---------------------------------------------------------------------------
// Inner component — has access to Leaflet map instance via useMap()
// ---------------------------------------------------------------------------
const DrawControl = ({ isDrawing, onPolygonComplete, existingPolygon }) => {
  const map         = useMap();
  const pointsRef   = useRef([]);
  const markersRef  = useRef([]);
  const polylineRef = useRef(null);
  const polygonRef  = useRef(null);

  // Render existing polygon on mount / value change
  useEffect(() => {
    // Clear any existing rendered polygon
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }

    if (!existingPolygon?.coordinates?.[0]) return;

    const coords = existingPolygon.coordinates[0].map(([lng, lat]) => [lat, lng]);
    polygonRef.current = L.polygon(coords, {
      color:       "#10B981",
      fillColor:   "#10B981",
      fillOpacity: 0.25,
      weight:      2,
    }).addTo(map);

    // Fit map to polygon bounds
    map.fitBounds(polygonRef.current.getBounds(), { padding: [30, 30] });
  }, [existingPolygon, map]);

  // Manage click-to-draw when isDrawing changes
  useEffect(() => {
    if (!isDrawing) {
      // Clean up drawing state
      map.off("click", handleClick);
      clearDrawing();
      return;
    }

    // Clear previous polygon display while drawing
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }

    map.getContainer().style.cursor = "crosshair";
    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
      map.getContainer().style.cursor = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawing]);

  const handleClick = (e) => {
    const { lat, lng } = e.latlng;
    pointsRef.current.push([lat, lng]);

    // Place a small circle marker at each vertex
    const marker = L.circleMarker([lat, lng], {
      radius:      5,
      color:       "#10B981",
      fillColor:   "#10B981",
      fillOpacity: 1,
      weight:      2,
    }).addTo(map);
    markersRef.current.push(marker);

    // Draw/update preview polyline
    if (polylineRef.current) map.removeLayer(polylineRef.current);
    if (pointsRef.current.length > 1) {
      polylineRef.current = L.polyline(pointsRef.current, {
        color: "#10B981",
        weight: 2,
        dashArray: "6 4",
      }).addTo(map);
    }
  };

  const clearDrawing = () => {
    pointsRef.current = [];
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    map.getContainer().style.cursor = "";
  };

  // Exposed via ref by parent — "finalise" current drawing
  const finalise = () => {
    const pts = pointsRef.current;
    if (pts.length < 3) return null;

    // Close the polygon by repeating the first point
    const closed = [...pts, pts[0]];
    // Convert [lat, lng] → [lng, lat] for GeoJSON
    const geoCoords = [closed.map(([lat, lng]) => [lng, lat])];

    const geoJson = {
      type:        "Polygon",
      coordinates: geoCoords,
    };

    // Render the finalised polygon
    if (polygonRef.current) map.removeLayer(polygonRef.current);
    polygonRef.current = L.polygon(pts, {
      color:       "#10B981",
      fillColor:   "#10B981",
      fillOpacity: 0.25,
      weight:      2,
    }).addTo(map);

    clearDrawing();
    onPolygonComplete(geoJson);
    return geoJson;
  };

  // Expose finalise and getPoints via a ref trick
  useEffect(() => {
    if (window.__drawControlRef) {
      window.__drawControlRef.finalise   = finalise;
      window.__drawControlRef.getPoints  = () => pointsRef.current;
      window.__drawControlRef.clearDrawing = clearDrawing;
    }
  });

  return null;
};

// ---------------------------------------------------------------------------
// Public DrawPolygon component
// ---------------------------------------------------------------------------
const DrawPolygon = ({ value, onChange, center = DEFAULT_CENTER }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const controlRef = useRef({});

  // Register ref so DrawControl can expose methods
  window.__drawControlRef = controlRef.current;

  const startDrawing = () => {
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    const geo = controlRef.current.finalise?.();
    if (!geo) {
      // Not enough points — stay in draw mode
      return;
    }
    setIsDrawing(false);
    onChange?.(geo);
  };

  const clearPolygon = () => {
    controlRef.current.clearDrawing?.();
    setIsDrawing(false);
    onChange?.(null);
  };

  const hasPolygon = Boolean(value?.coordinates?.[0]?.length >= 3);

  return (
    <div className="space-y-2">
      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          style={{ height: "320px", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <DrawControl
            isDrawing={isDrawing}
            onPolygonComplete={(geo) => {
              setIsDrawing(false);
              onChange?.(geo);
            }}
            existingPolygon={value}
          />
        </MapContainer>

        {/* Drawing mode indicator */}
        {isDrawing && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg font-medium">
            Click to add vertices · 3 minimum
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!isDrawing && !hasPolygon && (
          <button
            type="button"
            onClick={startDrawing}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
          >
            <Pencil size={14} />
            Draw Area
          </button>
        )}

        {isDrawing && (
          <button
            type="button"
            onClick={finishDrawing}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
          >
            <CheckCircle size={14} />
            Finish Drawing
          </button>
        )}

        {hasPolygon && !isDrawing && (
          <>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle size={13} />
              Area defined
            </span>
            <button
              type="button"
              onClick={() => { clearPolygon(); startDrawing(); }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors ml-2"
            >
              <Pencil size={12} />
              Redraw
            </button>
            <button
              type="button"
              onClick={clearPolygon}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={12} />
              Clear
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DrawPolygon;
'@ | Set-Content -Path "frontend\src\components\map\DrawPolygon.jsx" -Encoding UTF8

# frontend\src\components\map\CityMap.jsx
@'
import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

import ProjectMarker from "./ProjectMarker";
import MapFilters    from "./MapFilters";
import useThemeStore from "../../store/themeStore";
import { getMapProjects } from "../../api/project.api";

// ---------------------------------------------------------------------------
// CityMap.jsx
//
// The full city-wide map showing all active infrastructure projects.
// Features:
//   — Fetches GeoJSON from GET /api/v1/projects/map
//   — Renders each project as a colored polygon via ProjectMarker
//   — MapFilters panel applies client-side filtering without re-fetching
//   — Light/dark tile layer switches with theme
//   — Clicking a polygon navigates to /projects/:id
//   — Conflict overlay: clashed projects pulse red
//
// Map tile providers (from HANDOFF.md Section 18.5):
//   Light: CartoDB Positron
//   Dark:  CartoDB DarkMatter
// ---------------------------------------------------------------------------

const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILES  = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Default center: Ghaziabad, UP
const DEFAULT_CENTER = [28.6692, 77.4538];
const DEFAULT_ZOOM   = 13;

// ---------------------------------------------------------------------------
// TileLayerSwitcher — swaps tile URL when theme changes
// Must be inside MapContainer to access useMap()
// ---------------------------------------------------------------------------
const TileLayerSwitcher = ({ isDark }) => {
  const map  = useMap();
  const url  = isDark ? DARK_TILES : LIGHT_TILES;

  useEffect(() => {
    // Invalidate map size after theme switch to force re-render
    setTimeout(() => map.invalidateSize(), 100);
  }, [isDark, map]);

  return (
    <TileLayer
      key={url}       // key change forces React to remount with new tiles
      url={url}
      attribution={ATTRIBUTION}
      maxZoom={19}
    />
  );
};

// ---------------------------------------------------------------------------
// Main CityMap component
// ---------------------------------------------------------------------------
const CityMap = ({ height = "100%", showFilters = true, onProjectClick }) => {
  const navigate       = useNavigate();
  const { isDark }     = useThemeStore();
  const [features, setFeatures] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filters, setFilters]   = useState({ types: [], statuses: [], department: "" });

  // -------------------------------------------------------------------------
  // Fetch GeoJSON data from backend
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getMapProjects();
        const featureList = res?.data?.features || [];
        setFeatures(featureList);
        setFiltered(featureList);
      } catch (err) {
        setError("Failed to load map data. Please refresh.");
        console.error("[CityMap] fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // -------------------------------------------------------------------------
  // Apply filters client-side whenever features or filter values change
  // -------------------------------------------------------------------------
  useEffect(() => {
    let result = [...features];

    if (filters.types.length > 0) {
      result = result.filter((f) => filters.types.includes(f.properties?.type));
    }

    if (filters.statuses.length > 0) {
      result = result.filter((f) => filters.statuses.includes(f.properties?.status));
    }

    if (filters.department) {
      result = result.filter((f) =>
        f.properties?.department
          ?.toUpperCase()
          .includes(filters.department.toUpperCase())
      );
    }

    setFiltered(result);
  }, [features, filters]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleProjectClick = useCallback((projectId) => {
    if (onProjectClick) {
      onProjectClick(projectId);
    } else {
      navigate(`/projects/${projectId}`);
    }
  }, [navigate, onProjectClick]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="relative w-full" style={{ height }}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading map data…</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white/90 dark:bg-gray-900/90 rounded-xl">
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* Filters panel */}
      {showFilters && (
        <MapFilters onChange={handleFiltersChange} count={filtered.length} />
      )}

      {/* Leaflet map */}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
        className="rounded-xl"
      >
        <TileLayerSwitcher isDark={isDark} />

        {filtered.map((feature) => (
          <ProjectMarker
            key={feature.properties?._id || Math.random()}
            feature={feature}
            onClick={handleProjectClick}
          />
        ))}
      </MapContainer>

      {/* Project count badge */}
      {!loading && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full shadow border border-gray-200 dark:border-gray-600">
          {filtered.length} of {features.length} project{features.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
};

export default CityMap;
'@ | Set-Content -Path "frontend\src\components\map\CityMap.jsx" -Encoding UTF8

# frontend\src\pages\MapView.jsx
@'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Map, Layers, AlertTriangle, RefreshCw } from "lucide-react";
import CityMap from "../components/map/CityMap";

// ---------------------------------------------------------------------------
// MapView.jsx — Full city map page
//
// Replaces the Phase 3 placeholder.
// Features:
//   — Full-height CityMap with filter panel
//   — Legend for project type colors and status patterns
//   — Click polygon → navigate to project detail
// ---------------------------------------------------------------------------

// Legend data matches ProjectMarker TYPE_COLORS exactly
const TYPE_LEGEND = [
  { label: "Road",        color: "#F59E0B" },
  { label: "Water",       color: "#3B82F6" },
  { label: "Electricity", color: "#F97316" },
  { label: "Sewage",      color: "#8B5CF6" },
  { label: "Parks",       color: "#10B981" },
  { label: "Other",       color: "#6B7280" },
];

const STATUS_LEGEND = [
  { label: "Pending",   style: "border-dashed border-2 border-gray-400 bg-gray-100" },
  { label: "Approved",  style: "bg-emerald-200 border border-emerald-400" },
  { label: "Ongoing",   style: "bg-blue-300 border border-blue-500" },
  { label: "Completed", style: "bg-gray-200 opacity-60 border border-gray-300" },
  { label: "Clashed",   style: "bg-red-200 border-2 border-dashed border-red-400" },
];

const MapView = () => {
  const navigate           = useNavigate();
  const [showLegend, setShowLegend] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <Map size={18} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              City Project Map
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              All active infrastructure projects across departments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle legend */}
          <button
            onClick={() => setShowLegend((s) => !s)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Layers size={14} />
            {showLegend ? "Hide" : "Show"} Legend
          </button>
        </div>
      </div>

      {/* Main content — map + legend */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Map — fills remaining space */}
        <div className="flex-1 relative p-4">
          <CityMap
            height="100%"
            showFilters
            onProjectClick={(id) => navigate(`/projects/${id}`)}
          />
        </div>

        {/* Legend sidebar */}
        {showLegend && (
          <div className="w-52 flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            {/* Project types */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Project Type
              </p>
              <div className="space-y-2">
                {TYPE_LEGEND.map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-sm flex-shrink-0 border"
                      style={{
                        backgroundColor: color + "55",
                        borderColor:     color,
                      }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status patterns */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Status
              </p>
              <div className="space-y-2">
                {STATUS_LEGEND.map(({ label, style }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-sm flex-shrink-0 ${style}`} />
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tip */}
            <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
              <div className="flex items-start gap-2">
                <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  Click any polygon to view project details.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
'@ | Set-Content -Path "frontend\src\pages\MapView.jsx" -Encoding UTF8

# frontend\src\pages\CitizenReport.jsx
@'
import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { MapPin, Send, Search, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icons in Vite builds
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon   from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

import { submitReport, trackReport } from "../api/report.api";

// ---------------------------------------------------------------------------
// CitizenReport.jsx — Public page, no authentication required
//
// Two sections:
//   1. Submit Report — type, description, photo, map pin drop
//   2. Track Report  — enter CNR-XXXXXX tracking ID
//
// Map pin drop: citizen taps/clicks the map to set their location.
// Coordinates feed into the form submission as latitude/longitude.
// ---------------------------------------------------------------------------

const REPORT_TYPES = [
  { value: "pothole",     label: "Pothole",       emoji: "🕳️" },
  { value: "streetlight", label: "Streetlight",   emoji: "💡" },
  { value: "water_leak",  label: "Water Leak",    emoji: "💧" },
  { value: "garbage",     label: "Garbage",       emoji: "🗑️" },
  { value: "other",       label: "Other",         emoji: "📋" },
];

const STATUS_STEPS = ["submitted", "acknowledged", "in_progress", "resolved"];
const STATUS_LABELS = {
  submitted:    "Submitted",
  acknowledged: "Acknowledged",
  in_progress:  "In Progress",
  resolved:     "Resolved",
};

const DEFAULT_CENTER = [28.6692, 77.4538]; // Ghaziabad, UP

// ---------------------------------------------------------------------------
// PinDropper — inner Leaflet component that handles map click to drop pin
// ---------------------------------------------------------------------------
const PinDropper = ({ onPinDrop }) => {
  useMapEvents({
    click(e) {
      onPinDrop({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// ---------------------------------------------------------------------------
// Submit Form
// ---------------------------------------------------------------------------
const SubmitForm = () => {
  const [form, setForm]         = useState({
    type:        "",
    description: "",
    photo:       null,
  });
  const [pin, setPin]           = useState(null); // { lat, lng }
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]     = useState(null); // { success, trackingId, error }

  const handlePinDrop = useCallback((coords) => {
    setPin(coords);
  }, []);

  const handleSubmit = async () => {
    if (!form.type) {
      alert("Please select a report type.");
      return;
    }
    if (!pin) {
      alert("Please drop a pin on the map to mark the location.");
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      // Build FormData — matches multipart/form-data spec in API_CONTRACT
      const fd = new FormData();
      fd.append("type",        form.type);
      fd.append("description", form.description);
      fd.append("latitude",    String(pin.lat));
      fd.append("longitude",   String(pin.lng));
      if (form.photo) fd.append("photo", form.photo);

      const res = await submitReport(fd);

      setResult({
        success:    true,
        trackingId: res.data.trackingId,
      });

      // Reset form
      setForm({ type: "", description: "", photo: null });
      setPin(null);
    } catch (err) {
      setResult({
        success: false,
        error:   err?.response?.data?.message || "Submission failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (result?.success) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Report Submitted
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your tracking ID is:
        </p>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl px-6 py-4">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tracking-widest">
            {result.trackingId}
          </p>
        </div>
        <p className="text-xs text-gray-400 max-w-xs">
          Save this ID to track the status of your report.
        </p>
        <button
          onClick={() => setResult(null)}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium underline"
        >
          Submit another report
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Error banner */}
      {result?.error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
        </div>
      )}

      {/* Report type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Issue Type *
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {REPORT_TYPES.map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: value }))}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                form.type === value
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
              }`}
            >
              <span className="text-xl">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          rows={3}
          placeholder="Describe the issue in detail…"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          maxLength={500}
        />
        <p className="text-xs text-gray-400 text-right mt-1">
          {form.description.length}/500
        </p>
      </div>

      {/* Map pin drop */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Location *{" "}
          <span className="font-normal text-gray-400">(tap the map to drop a pin)</span>
        </label>

        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 relative">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={14}
            style={{ height: "260px", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            />
            <PinDropper onPinDrop={handlePinDrop} />
            {pin && <Marker position={[pin.lat, pin.lng]} />}
          </MapContainer>

          {!pin && (
            <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-4">
              <div className="bg-white/90 dark:bg-gray-800/90 text-xs font-medium text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full shadow">
                <MapPin size={11} className="inline mr-1 text-emerald-500" />
                Tap to mark location
              </div>
            </div>
          )}
        </div>

        {pin && (
          <p className="text-xs text-emerald-600 mt-1.5 font-medium">
            📍 {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
            <button
              type="button"
              onClick={() => setPin(null)}
              className="ml-2 text-gray-400 hover:text-red-500"
            >
              ×
            </button>
          </p>
        )}
      </div>

      {/* Photo upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Photo <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setForm((f) => ({ ...f, photo: e.target.files[0] || null }))}
          className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400"
        />
        {form.photo && (
          <p className="text-xs text-gray-400 mt-1">{form.photo.name}</p>
        )}
      </div>

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
      >
        {submitting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
        {submitting ? "Submitting…" : "Submit Report"}
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Track Report
// ---------------------------------------------------------------------------
const TrackReport = () => {
  const [trackingId, setTrackingId] = useState("");
  const [loading, setLoading]       = useState(false);
  const [report, setReport]         = useState(null);
  const [error, setError]           = useState(null);

  const handleTrack = async () => {
    const id = trackingId.trim().toUpperCase();
    if (!id) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await trackReport(id);
      setReport(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Report not found. Check your tracking ID.");
    } finally {
      setLoading(false);
    }
  };

  const currentStep = report
    ? STATUS_STEPS.indexOf(report.status)
    : -1;

  return (
    <div className="space-y-5">
      {/* Search input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter tracking ID (CNR-XXXXXX)"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleTrack()}
          className="flex-1 px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          maxLength={10}
        />
        <button
          type="button"
          onClick={handleTrack}
          disabled={loading || !trackingId.trim()}
          className="flex items-center gap-1.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Track
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
          <AlertCircle size={15} className="text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Result */}
      {report && (
        <div className="space-y-4">
          {/* Report info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-base tracking-widest">
                  {report.trackingId}
                </p>
                <p className="text-sm text-gray-500 capitalize mt-0.5">
                  {report.type?.replace("_", " ")}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                report.status === "resolved"
                  ? "bg-emerald-100 text-emerald-700"
                  : report.status === "in_progress"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {STATUS_LABELS[report.status] || report.status}
              </span>
            </div>
            {report.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300">{report.description}</p>
            )}
            {report.assignedTo && (
              <p className="text-xs text-gray-400 mt-2">
                Assigned to: {report.assignedTo.name}
              </p>
            )}
          </div>

          {/* Progress stepper */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Progress
            </p>
            <div className="flex items-center gap-0">
              {STATUS_STEPS.map((step, idx) => {
                const done    = idx <= currentStep;
                const isLast  = idx === STATUS_STEPS.length - 1;
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        done
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-400"
                      }`}>
                        {done ? "✓" : idx + 1}
                      </div>
                      <span className={`text-[10px] font-medium whitespace-nowrap ${
                        done ? "text-emerald-600" : "text-gray-400"
                      }`}>
                        {STATUS_LABELS[step]}
                      </span>
                    </div>
                    {!isLast && (
                      <div className={`flex-1 h-0.5 mb-4 mx-1 ${
                        idx < currentStep ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-600"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main CitizenReport page
// ---------------------------------------------------------------------------
const CitizenReport = () => {
  const [tab, setTab] = useState("submit"); // "submit" | "track"

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MapPin size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Citizen Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Report infrastructure issues or track your existing complaint
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-6">
          {[
            { key: "submit", label: "Submit Report" },
            { key: "track",  label: "Track Report" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                tab === key
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {tab === "submit" ? <SubmitForm /> : <TrackReport />}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          No account required · Your location is only used to route your report
        </p>
      </div>
    </div>
  );
};

export default CitizenReport;
'@ | Set-Content -Path "frontend\src\pages\CitizenReport.jsx" -Encoding UTF8

# ===========================================================================
# PHASE 5 — Integration: Report Service, Tests, UI Components, Infrastructure
# ===========================================================================

# backend\src\services\report.service.js
@'
"use strict";

const CitizenReport              = require("../models/CitizenReport");
const { auditReportStatusUpdated } = require("./audit.service");
const { emitReportStatusUpdate }   = require("./notification.service");
const { paginate }                 = require("../utils/response");

// ---------------------------------------------------------------------------
// report.service.js
//
// All business logic for citizen report CRUD.
// Photo upload is handled upstream by multer + Cloudinary middleware in
// the route — by the time createReport runs, req.file.path is the URL.
// ---------------------------------------------------------------------------

/**
 * Creates a new citizen report
 * Photo URL comes from req.file.path set by multer-storage-cloudinary
 *
 * @param {object} body     - { type, description, latitude, longitude }
 * @param {string} photoUrl - Cloudinary URL from req.file.path (or null)
 * @returns {object}        - { trackingId, type, status, message }
 */
const createReport = async (body, photoUrl = null) => {
  const { type, description, latitude, longitude } = body;

  if (!type) {
    const err = new Error("type is required");
    err.statusCode = 400;
    throw err;
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    const err = new Error("Valid latitude and longitude are required");
    err.statusCode = 400;
    throw err;
  }

  const report = await CitizenReport.create({
    type,
    description: description || "",
    location: {
      type:        "Point",
      coordinates: [lng, lat],   // GeoJSON: [longitude, latitude]
    },
    photoUrl: photoUrl || null,
    status:   "submitted",
  });

  return {
    trackingId: report.trackingId,
    type:       report.type,
    status:     report.status,
    message:    "Use your tracking ID to check status",
  };
};

/**
 * Returns report status by tracking ID — public endpoint
 *
 * @param {string} trackingId  - CNR-XXXXXX
 * @returns {object}           - Trimmed report for public display
 */
const trackReport = async (trackingId) => {
  const report = await CitizenReport.findOne({ trackingId })
    .populate("assignedTo", "name")
    .lean();

  if (!report) {
    const err = new Error("Report not found. Check your tracking ID.");
    err.statusCode = 404;
    throw err;
  }

  // Return only public-safe fields
  return {
    trackingId:  report.trackingId,
    type:        report.type,
    status:      report.status,
    description: report.description,
    assignedTo:  report.assignedTo ? { name: report.assignedTo.name } : null,
    createdAt:   report.createdAt,
    updatedAt:   report.updatedAt,
  };
};

/**
 * Returns paginated list of all reports — admin and officer only
 *
 * @param {object} query  - { status, type, page, limit }
 * @returns {object}      - { reports, pagination }
 */
const getAllReports = async (query = {}) => {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.type)   filter.type   = query.type;

  const meta = paginate(
    await CitizenReport.countDocuments(filter),
    query.page,
    query.limit
  );

  const reports = await CitizenReport.find(filter)
    .populate("assignedTo",    "name code")
    .populate("linkedProject", "title type status")
    .sort({ createdAt: -1 })
    .skip(meta.skip)
    .limit(meta.limit)
    .lean();

  return { reports, pagination: meta };
};

/**
 * Returns a single report by MongoDB ID — admin and officer only
 *
 * @param {string} reportId  - MongoDB ObjectId
 * @returns {object}         - Full report document
 */
const getReportById = async (reportId) => {
  const report = await CitizenReport.findById(reportId)
    .populate("assignedTo",    "name code")
    .populate("linkedProject", "title type status department")
    .lean();

  if (!report) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }

  return report;
};

/**
 * Updates report status and optional department assignment
 * Emits report:status_update socket event on every status change
 *
 * @param {string} reportId    - MongoDB ObjectId
 * @param {string} status      - New status
 * @param {string} assignedTo  - Department ObjectId (optional)
 * @param {object} user        - req.user
 * @param {string} ip          - Request IP for audit log
 * @returns {object}           - Updated report document
 */
const updateReportStatus = async (reportId, status, assignedTo, user, ip) => {
  const report = await CitizenReport.findById(reportId);

  if (!report) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }

  const VALID_STATUSES = ["submitted", "acknowledged", "in_progress", "resolved"];
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  const prevStatus  = report.status;
  report.status     = status;
  if (assignedTo) report.assignedTo = assignedTo;

  await report.save();

  // Audit log — fire and forget
  auditReportStatusUpdated(user.userId, reportId, prevStatus, status, ip);

  // Real-time notification to citizen tracking this report
  emitReportStatusUpdate(report.trackingId, status);

  return report.populate("assignedTo", "name code");
};

/**
 * Assigns a report to a department
 *
 * @param {string} reportId      - MongoDB report ID
 * @param {string} departmentId  - MongoDB department ID
 * @returns {object}             - Updated report
 */
const assignReport = async (reportId, departmentId) => {
  const report = await CitizenReport.findById(reportId);

  if (!report) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }

  report.assignedTo = departmentId;
  if (report.status === "submitted") report.status = "acknowledged";

  await report.save();

  return report.populate("assignedTo", "name code");
};

/**
 * Links a citizen report to an existing project
 *
 * @param {string} reportId   - MongoDB report ID
 * @param {string} projectId  - MongoDB project ID
 * @returns {object}          - Updated report
 */
const linkReportToProject = async (reportId, projectId) => {
  const report = await CitizenReport.findByIdAndUpdate(
    reportId,
    { linkedProject: projectId },
    { new: true }
  )
    .populate("linkedProject", "title type status")
    .lean();

  if (!report) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }

  return report;
};

module.exports = {
  createReport,
  trackReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  assignReport,
  linkReportToProject,
};
'@ | Set-Content -Path "backend\src\services\report.service.js" -Encoding UTF8

# backend\src\controllers\report.controller.js
@'
"use strict";

const ReportService = require("../services/report.service");
const { success }   = require("../utils/response");

// ---------------------------------------------------------------------------
// report.controller.js — full implementation replacing Phase 1 stub
// Controllers only handle req/res — zero business logic here
// ---------------------------------------------------------------------------

const createReport = async (req, res, next) => {
  try {
    // Photo URL is set by multer-storage-cloudinary middleware
    // req.file.path = Cloudinary URL when photo is uploaded
    // req.file is undefined when no photo is provided
    const photoUrl = req.file?.path || null;
    const result   = await ReportService.createReport(req.body, photoUrl);
    return res.status(201).json(success("Report submitted successfully", result));
  } catch (err) {
    next(err);
  }
};

const trackReport = async (req, res, next) => {
  try {
    const report = await ReportService.trackReport(req.params.trackingId);
    return res.status(200).json(success("Report found", report));
  } catch (err) {
    next(err);
  }
};

const getAllReports = async (req, res, next) => {
  try {
    const { reports, pagination } = await ReportService.getAllReports(req.query);
    return res.status(200).json({
      success: true,
      message: "Reports fetched",
      data:    reports,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

const getReportById = async (req, res, next) => {
  try {
    const report = await ReportService.getReportById(req.params.id);
    return res.status(200).json(success("Report fetched", report));
  } catch (err) {
    next(err);
  }
};

const updateReportStatus = async (req, res, next) => {
  try {
    const { status, assignedTo } = req.body;
    const report = await ReportService.updateReportStatus(
      req.params.id,
      status,
      assignedTo,
      req.user,
      req.ip
    );
    return res.status(200).json(success("Report status updated", report));
  } catch (err) {
    next(err);
  }
};

const assignReport = async (req, res, next) => {
  try {
    const { departmentId } = req.body;
    const report = await ReportService.assignReport(req.params.id, departmentId);
    return res.status(200).json(success("Report assigned to department", report));
  } catch (err) {
    next(err);
  }
};

const linkReportToProject = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    const report = await ReportService.linkReportToProject(req.params.id, projectId);
    return res.status(200).json(success("Report linked to project", report));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReport,
  trackReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  assignReport,
  linkReportToProject,
};
'@ | Set-Content -Path "backend\src\controllers\report.controller.js" -Encoding UTF8

# frontend\src\store\notificationStore.js
@'
import { create } from "zustand";

// ---------------------------------------------------------------------------
// notificationStore.js
//
// Manages two lists:
//   notifications — persistent bell dropdown items (survives page nav)
//   toasts        — ephemeral pop-up alerts (auto-dismissed after 5s)
//
// useSocket.js calls addNotification() when server events arrive.
// Layout.jsx renders toasts from this store.
// Navbar.jsx reads notifications + unreadCount from this store.
// ---------------------------------------------------------------------------

let nextId = 1;

const useNotificationStore = create((set, get) => ({
  notifications: [],
  toasts:        [],
  unreadCount:   0,

  // -------------------------------------------------------------------------
  // addNotification — called by useSocket when a server event arrives
  // Adds to BOTH the persistent list AND the toast queue
  // -------------------------------------------------------------------------
  addNotification: (notif) => {
    const id = `notif-${nextId++}`;
    const full = { ...notif, id, createdAt: new Date().toISOString() };

    set((state) => ({
      notifications: [full, ...state.notifications].slice(0, 50), // cap at 50
      toasts:        [full, ...state.toasts].slice(0, 5),          // max 5 toasts
      unreadCount:   state.unreadCount + 1,
    }));
  },

  // -------------------------------------------------------------------------
  // dismissToast — removes a single toast (called by Toast auto-dismiss + X)
  // -------------------------------------------------------------------------
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  // -------------------------------------------------------------------------
  // markRead — marks a single notification as read
  // -------------------------------------------------------------------------
  markRead: (id) => {
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      const unreadCount = notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    });
  },

  // -------------------------------------------------------------------------
  // markAllRead — marks every notification as read
  // -------------------------------------------------------------------------
  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount:   0,
    }));
  },

  // -------------------------------------------------------------------------
  // clearAll — wipes the notification list entirely
  // -------------------------------------------------------------------------
  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));

export default useNotificationStore;
'@ | Set-Content -Path "frontend\src\store\notificationStore.js" -Encoding UTF8

# frontend\src\components\common\Skeleton.jsx
@'
// ---------------------------------------------------------------------------
// Skeleton.jsx — Shimmer loading placeholders
//
// Usage:
//   <Skeleton className="h-4 w-32" />
//   <Skeleton.Card />       — project card placeholder
//   <Skeleton.Table rows={5} cols={4} />  — table placeholder
//   <Skeleton.Stat />       — stats card placeholder
// ---------------------------------------------------------------------------

const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}
  />
);

// Single stats card skeleton
Skeleton.Stat = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
    <div className="h-3 w-32 bg-gray-100 dark:bg-gray-600 rounded" />
  </div>
);

// Project / conflict card skeleton
Skeleton.Card = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-600 rounded" />
      </div>
      <div className="h-6 w-16 bg-gray-100 dark:bg-gray-600 rounded-full" />
    </div>
    <div className="space-y-2">
      <div className="h-3 w-full bg-gray-100 dark:bg-gray-600 rounded" />
      <div className="h-3 w-2/3 bg-gray-100 dark:bg-gray-600 rounded" />
    </div>
    <div className="flex items-center gap-2 pt-1">
      <div className="h-3 w-20 bg-gray-100 dark:bg-gray-600 rounded" />
      <div className="h-3 w-20 bg-gray-100 dark:bg-gray-600 rounded" />
    </div>
  </div>
);

// Table skeleton
Skeleton.Table = ({ rows = 5, cols = 4 }) => (
  <div className="animate-pulse space-y-3">
    {/* Header */}
    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, r) => (
      <div
        key={r}
        className="grid gap-4 py-2 border-t border-gray-100 dark:border-gray-700"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, c) => (
          <div
            key={c}
            className="h-3 bg-gray-100 dark:bg-gray-600 rounded"
            style={{ width: `${60 + Math.random() * 35}%` }}
          />
        ))}
      </div>
    ))}
  </div>
);

// List item skeleton
Skeleton.List = ({ rows = 4 }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-1/3 bg-gray-100 dark:bg-gray-600 rounded" />
        </div>
        <div className="h-6 w-14 bg-gray-100 dark:bg-gray-600 rounded-full" />
      </div>
    ))}
  </div>
);

export default Skeleton;
'@ | Set-Content -Path "frontend\src\components\common\Skeleton.jsx" -Encoding UTF8

# frontend\src\components\common\Navbar.jsx
@'
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, LogOut, User, ChevronDown, Check, AlertTriangle, CheckCircle, XCircle, Briefcase } from "lucide-react";
import Logo           from "./Logo";
import Avatar         from "./Avatar";
import useAuthStore   from "../../store/authStore";
import useNotificationStore from "../../store/notificationStore";
import useThemeStore  from "../../store/themeStore";

// ---------------------------------------------------------------------------
// Navbar.jsx — Top navigation bar
//
// Features:
//   — Logo + app name
//   — Notification bell with unread count badge (reads notificationStore)
//   — Notification dropdown with dismiss and mark-all-read
//   — User avatar + name + role badge
//   — Logout button
// ---------------------------------------------------------------------------

const NOTIF_ICONS = {
  clash:    <AlertTriangle size={14} className="text-red-500" />,
  approval: <CheckCircle  size={14} className="text-emerald-500" />,
  rejection:<XCircle      size={14} className="text-red-400" />,
  task:     <Briefcase    size={14} className="text-blue-500" />,
  report:   <Bell         size={14} className="text-amber-500" />,
};

const ROLE_LABELS = {
  admin:      "Administrator",
  officer:    "Field Officer",
  supervisor: "Supervisor",
  citizen:    "Citizen",
};

const Navbar = () => {
  const navigate  = useNavigate();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAllRead, markRead, clearAll } =
    useNotificationStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();

  const [showNotifs,  setShowNotifs]  = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifsRef  = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifsRef.current  && !notifsRef.current.contains(e.target))  setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNotifClick = (notif) => {
    markRead(notif.id);
    setShowNotifs(false);
    if (notif.conflictId) navigate(`/conflicts/${notif.conflictId}`);
    else if (notif.projectId) navigate(`/projects/${notif.projectId}`);
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0 z-50">
      {/* Left — Logo */}
      <Link to="/" className="flex items-center gap-2.5">
        <Logo size={32} />
        <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight hidden sm:block">
          Urban Nexus
        </span>
      </Link>

      {/* Right — controls */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? "☀️" : "🌙"}
        </button>

        {/* Notification bell */}
        <div className="relative" ref={notifsRef}>
          <button
            onClick={() => { setShowNotifs((s) => !s); setShowProfile(false); }}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-11 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Notifications
                </span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                    >
                      <Check size={11} /> Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 20).map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0 ${
                        !notif.read ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {NOTIF_ICONS[notif.type] || <Bell size={14} className="text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${!notif.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile((s) => !s); setShowNotifs(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Avatar name={user?.name || "U"} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                {user?.name}
              </p>
              <p className="text-[10px] text-gray-400 capitalize">
                {ROLE_LABELS[user?.role] || user?.role}
              </p>
            </div>
            <ChevronDown size={13} className="text-gray-400 hidden sm:block" />
          </button>

          {/* Profile dropdown */}
          {showProfile && (
            <div className="absolute right-0 top-11 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">{user?.name}</p>
                <p className="text-[11px] text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
'@ | Set-Content -Path "frontend\src\components\common\Navbar.jsx" -Encoding UTF8

# frontend\src\components\common\Sidebar.jsx
@'
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Map, FolderKanban, AlertTriangle,
  ClipboardList, FileText, Users, BookOpen, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import Logo          from "./Logo";
import useAuthStore  from "../../store/authStore";

// ---------------------------------------------------------------------------
// Sidebar.jsx — Left navigation sidebar
//
// Menu items filtered by role.
// Collapsible — icon-only mode when collapsed.
// Active link highlighted with emerald accent.
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  {
    path:  "/dashboard",
    icon:  LayoutDashboard,
    label: "Dashboard",
    roles: ["admin"],
  },
  {
    path:  "/dept-dashboard",
    icon:  LayoutDashboard,
    label: "Dashboard",
    roles: ["officer"],
  },
  {
    path:  "/tasks",
    icon:  ClipboardList,
    label: "My Tasks",
    roles: ["supervisor"],
  },
  {
    path:  "/map",
    icon:  Map,
    label: "City Map",
    roles: ["admin", "officer", "supervisor"],
  },
  {
    path:  "/projects",
    icon:  FolderKanban,
    label: "Projects",
    roles: ["admin", "officer"],
  },
  {
    path:  "/conflicts",
    icon:  AlertTriangle,
    label: "Conflicts",
    roles: ["admin", "officer"],
  },
  {
    path:  "/reports",
    icon:  FileText,
    label: "Citizen Reports",
    roles: ["admin", "officer"],
  },
  {
    path:  "/audit",
    icon:  BookOpen,
    label: "Audit Log",
    roles: ["admin"],
  },
];

const Sidebar = () => {
  const { user }          = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const location          = useLocation();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <aside
      className={`flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 flex-shrink-0 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Logo strip — visible only when collapsed on mobile */}
      <div className={`h-16 flex items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0 ${collapsed ? "justify-center" : "px-4 gap-2"}`}>
        <Logo size={28} />
        {!collapsed && (
          <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">
            Urban Nexus
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
        {visibleItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
              }`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="h-12 flex items-center justify-center border-t border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
};

export default Sidebar;
'@ | Set-Content -Path "frontend\src\components\common\Sidebar.jsx" -Encoding UTF8

# frontend\src\components\common\Layout.jsx
@'
import { useEffect } from "react";
import { Outlet }    from "react-router-dom";
import Navbar        from "./Navbar";
import Sidebar       from "./Sidebar";
import useSocket     from "../../hooks/useSocket";
import useThemeStore from "../../store/themeStore";
import useNotificationStore from "../../store/notificationStore";
import { AlertTriangle, CheckCircle, XCircle, Briefcase, Bell, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Layout.jsx — Shared page layout wrapper
//
// Renders: Navbar (top) + Sidebar (left) + main content area (right)
// Initialises Socket.io connection via useSocket (runs once, app-wide)
// Renders toast notifications from notificationStore
// ---------------------------------------------------------------------------

const TOAST_STYLES = {
  clash:    "border-red-400 bg-red-50 dark:bg-red-900/30",
  approval: "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30",
  rejection:"border-red-300 bg-red-50 dark:bg-red-900/20",
  task:     "border-blue-400 bg-blue-50 dark:bg-blue-900/30",
  report:   "border-amber-400 bg-amber-50 dark:bg-amber-900/30",
};

const TOAST_ICONS = {
  clash:    <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />,
  approval: <CheckCircle  size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />,
  rejection:<XCircle      size={16} className="text-red-400 flex-shrink-0 mt-0.5" />,
  task:     <Briefcase    size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />,
  report:   <Bell         size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />,
};

// Toast notification component
const Toast = ({ notif, onDismiss }) => {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const t = setTimeout(() => onDismiss(notif.id), 5000);
    return () => clearTimeout(t);
  }, [notif.id, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full backdrop-blur-sm animate-slide-in ${
        TOAST_STYLES[notif.type] || "border-gray-300 bg-white dark:bg-gray-800"
      }`}
    >
      {TOAST_ICONS[notif.type] || <Bell size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{notif.title}</p>
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{notif.message}</p>
      </div>
      <button
        onClick={() => onDismiss(notif.id)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
};

const Layout = () => {
  // Initialise Socket.io connection — runs once when Layout mounts
  useSocket();

  const { isDark } = useThemeStore();
  const { toasts, dismissToast } = useNotificationStore();

  return (
    <div className={`${isDark ? "dark" : ""} flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Toast container — bottom right */}
      {toasts && toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end">
          {toasts.map((notif) => (
            <Toast key={notif.id} notif={notif} onDismiss={dismissToast} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Layout;
'@ | Set-Content -Path "frontend\src\components\common\Layout.jsx" -Encoding UTF8

# frontend\src\components\project\ProjectForm.jsx
@'
import { useState }       from "react";
import { useNavigate }    from "react-router-dom";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import DrawPolygon        from "../map/DrawPolygon";
import { createProject }  from "../../api/project.api";

// ---------------------------------------------------------------------------
// ProjectForm.jsx
//
// Full project submission form.
// Fields: title, type, description, address, startDate, endDate,
//         estimatedCost, priority, MCDM criteria (5 sliders), location (map draw)
//
// On success: shows conflict summary if clashes were detected, then navigates
// to /projects/:id
// ---------------------------------------------------------------------------

const TYPE_OPTIONS = [
  { value: "road",        label: "Road" },
  { value: "water",       label: "Water" },
  { value: "electricity", label: "Electricity" },
  { value: "sewage",      label: "Sewage" },
  { value: "parks",       label: "Parks" },
  { value: "other",       label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "low",      label: "Low" },
  { value: "medium",   label: "Medium" },
  { value: "high",     label: "High" },
  { value: "critical", label: "Critical" },
];

const CRITERIA_META = [
  { key: "urgency",           label: "Urgency",            hint: "How urgently is this needed?" },
  { key: "socialImpact",      label: "Social Impact",      hint: "How many citizens are affected?" },
  { key: "estimatedCost",     label: "Cost Efficiency",    hint: "Higher = lower / better cost" },
  { key: "feasibility",       label: "Feasibility",        hint: "How achievable is this?" },
  { key: "environmentImpact", label: "Env. Impact",        hint: "Higher = less environmental harm" },
];

const DEFAULT_FORM = {
  title:         "",
  type:          "road",
  description:   "",
  address:       "",
  startDate:     "",
  endDate:       "",
  estimatedCost: "",
  priority:      "medium",
  location:      null,
  criteria: {
    urgency:           5,
    socialImpact:      5,
    estimatedCost:     5,
    feasibility:       5,
    environmentImpact: 5,
  },
  dependencies: [],
};

const ProjectForm = ({ onCancel }) => {
  const navigate        = useNavigate();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null); // conflict summary after submit
  const [errors, setErrors]         = useState({});

  const setField = (key, value) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setCriteria = (key, value) =>
    setForm((f) => ({ ...f, criteria: { ...f.criteria, [key]: value } }));

  const validate = () => {
    const e = {};
    if (!form.title.trim())   e.title     = "Title is required";
    if (!form.startDate)      e.startDate = "Start date is required";
    if (!form.endDate)        e.endDate   = "End date is required";
    if (form.startDate && form.endDate && form.endDate <= form.startDate)
      e.endDate = "End date must be after start date";
    if (!form.location)       e.location  = "Please draw the project area on the map";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setSubmitting(true);

    try {
      const payload = {
        title:         form.title.trim(),
        type:          form.type,
        description:   form.description.trim(),
        address:       form.address.trim(),
        startDate:     form.startDate,
        endDate:       form.endDate,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : 0,
        priority:      form.priority,
        location:      form.location,
        criteria:      form.criteria,
        dependencies:  form.dependencies,
      };

      const res = await createProject(payload);
      const { project, clashesDetected, conflicts } = res.data;

      if (clashesDetected > 0) {
        // Show conflict summary before navigating
        setResult({ project, clashesDetected, conflicts });
      } else {
        navigate(`/projects/${project._id}`);
      }
    } catch (err) {
      setErrors({ submit: err?.response?.data?.message || "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // Conflict summary screen
  if (result) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-600 rounded-xl">
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              {result.clashesDetected} Conflict{result.clashesDetected > 1 ? "s" : ""} Detected
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              Your project was saved, but it conflicts with existing projects.
              Review the conflicts below.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {result.conflicts.map((c) => (
            <div key={c._id} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Conflicts with: {c.projectB?.title || "Unknown project"}
              </p>
              {c.overlapDates?.start && (
                <p className="text-xs text-gray-500 mt-1">
                  Overlap: {new Date(c.overlapDates.start).toLocaleDateString("en-IN")} —{" "}
                  {new Date(c.overlapDates.end).toLocaleDateString("en-IN")}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/projects/${result.project._id}`)}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            View Project
          </button>
          <button
            onClick={() => navigate("/conflicts")}
            className="flex-1 py-2.5 border border-amber-400 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-semibold rounded-xl text-sm transition-colors"
          >
            View Conflicts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Submit error */}
      {errors.submit && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
          <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
        </div>
      )}

      {/* Basic info */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Basic Information
        </h3>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Project Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g. MG Road Resurfacing Phase 2"
              className={`w-full px-4 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.title ? "border-red-400" : "border-gray-200 dark:border-gray-600"
              }`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setField("type", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {TYPE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setField("priority", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PRIORITY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Describe the scope of work…"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="Street address or landmark"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.startDate ? "border-red-400" : "border-gray-200 dark:border-gray-600"
                }`}
              />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                End Date *
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setField("endDate", e.target.value)}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.endDate ? "border-red-400" : "border-gray-200 dark:border-gray-600"
                }`}
              />
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Estimated Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Estimated Cost (₹)
            </label>
            <input
              type="number"
              min="0"
              value={form.estimatedCost}
              onChange={(e) => setField("estimatedCost", e.target.value)}
              placeholder="500000"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* Map location */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Project Area *
        </h3>
        <DrawPolygon
          value={form.location}
          onChange={(geo) => { setField("location", geo); setErrors((e) => ({ ...e, location: undefined })); }}
        />
        {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
      </section>

      {/* MCDM criteria sliders */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Priority Criteria
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Rate each criterion 1–10. These are used by the MCDM engine to score conflicting projects.
        </p>
        <div className="space-y-4">
          {CRITERIA_META.map(({ key, label, hint }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </label>
                <span className="text-sm font-bold text-emerald-600 w-6 text-right">
                  {form.criteria[key]}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={form.criteria[key]}
                onChange={(e) => setCriteria(key, Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>1 — Low</span>
                <span className="text-center text-gray-400 text-[10px]">{hint}</span>
                <span>10 — High</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle size={16} />
          )}
          {submitting ? "Submitting…" : "Submit Project"}
        </button>
      </div>
    </div>
  );
};

export default ProjectForm;
'@ | Set-Content -Path "frontend\src\components\project\ProjectForm.jsx" -Encoding UTF8

# frontend\src\components\project\ProjectList.jsx
@'
import { useState, useEffect, useCallback } from "react";
import { useNavigate }   from "react-router-dom";
import { Search, Plus, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import ProjectCard       from "./ProjectCard";
import Skeleton          from "../common/Skeleton";
import { getProjects }   from "../../api/project.api";
import useAuthStore      from "../../store/authStore";

// ---------------------------------------------------------------------------
// ProjectList.jsx
//
// Paginated, filterable list of projects.
// Used on both /projects (admin) and /dept-dashboard (officer).
// Fetches from GET /api/v1/projects with query params.
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: "",          label: "All Statuses" },
  { value: "pending",   label: "Pending" },
  { value: "approved",  label: "Approved" },
  { value: "ongoing",   label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "rejected",  label: "Rejected" },
  { value: "clashed",   label: "Clashed" },
];

const TYPE_OPTIONS = [
  { value: "",            label: "All Types" },
  { value: "road",        label: "Road" },
  { value: "water",       label: "Water" },
  { value: "electricity", label: "Electricity" },
  { value: "sewage",      label: "Sewage" },
  { value: "parks",       label: "Parks" },
  { value: "other",       label: "Other" },
];

const ProjectList = ({ onNewProject, departmentId }) => {
  const navigate     = useNavigate();
  const { user }     = useAuthStore();
  const canCreate    = user?.role === "officer" || user?.role === "admin";

  const [projects,   setProjects]   = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [status,     setStatus]     = useState("");
  const [type,       setType]       = useState("");
  const [page,       setPage]       = useState(1);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (status)       params.status     = status;
      if (type)         params.type       = type;
      if (departmentId) params.department = departmentId;

      const res  = await getProjects(params);
      let list   = res.data || [];

      // Client-side title search (backend doesn't support text search in MVP)
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(
          (p) =>
            p.title?.toLowerCase().includes(q) ||
            p.address?.toLowerCase().includes(q)
        );
      }

      setProjects(list);
      setPagination(res.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      console.error("[ProjectList] fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [page, status, type, search, departmentId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [status, type, search]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Status filter */}
          <div className="relative">
            <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="pl-7 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
            >
              {STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
          >
            {TYPE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* New project button */}
          {canCreate && (
            <button
              onClick={onNewProject}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus size={15} />
              New Project
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton.Card key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-sm font-medium">No projects found</p>
          <p className="text-xs mt-1">Try adjusting your filters or create a new project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onClick={() => navigate(`/projects/${project._id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            {pagination.total} projects · Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
'@ | Set-Content -Path "frontend\src\components\project\ProjectList.jsx" -Encoding UTF8

# frontend\src\components\conflict\ConflictList.jsx
@'
import { useState, useEffect } from "react";
import { useNavigate }        from "react-router-dom";
import { AlertTriangle, CheckCircle, ChevronRight, Clock } from "lucide-react";
import Skeleton               from "../common/Skeleton";
import Badge                  from "../common/Badge";
import { getConflicts }       from "../../api/conflict.api";

// ---------------------------------------------------------------------------
// ConflictList.jsx — paginated list of conflicts
// Used on /conflicts page.
// ---------------------------------------------------------------------------

const STATUS_TABS = [
  { key: "all",      label: "All" },
  { key: "open",     label: "Open" },
  { key: "resolved", label: "Resolved" },
];

const ConflictList = () => {
  const navigate = useNavigate();
  const [conflicts, setConflicts] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getConflicts();
        setConflicts(res.data || []);
      } catch (err) {
        console.error("[ConflictList] fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = activeTab === "all"
    ? conflicts
    : conflicts.filter((c) => c.status === activeTab);

  const openCount     = conflicts.filter((c) => c.status === "open").length;
  const resolvedCount = conflicts.filter((c) => c.status === "resolved").length;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 w-fit">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === key
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            {label}{" "}
            {key === "open" && openCount > 0 && (
              <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">
                {openCount}
              </span>
            )}
            {key === "resolved" && resolvedCount > 0 && (
              <span className="ml-1 text-xs bg-gray-300 dark:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-full px-1.5 py-0.5">
                {resolvedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <Skeleton.List rows={4} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-sm font-medium">No {activeTab === "all" ? "" : activeTab} conflicts</p>
          <p className="text-xs mt-1">All projects are running smoothly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((conflict) => (
            <button
              key={conflict._id}
              onClick={() => navigate(`/conflicts/${conflict._id}`)}
              className="w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  conflict.status === "open"
                    ? "bg-red-100 dark:bg-red-900/30"
                    : "bg-emerald-100 dark:bg-emerald-900/30"
                }`}>
                  {conflict.status === "open"
                    ? <AlertTriangle size={18} className="text-red-500" />
                    : <CheckCircle  size={18} className="text-emerald-500" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {conflict.projectA?.title || "Project A"}
                    </p>
                    <span className="text-gray-400 text-xs">vs</span>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {conflict.projectB?.title || "Project B"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={11} />
                      {conflict.overlapDates?.start
                        ? `Overlap: ${new Date(conflict.overlapDates.start).toLocaleDateString("en-IN")} – ${new Date(conflict.overlapDates.end).toLocaleDateString("en-IN")}`
                        : "Date overlap detected"}
                    </span>
                    <Badge
                      variant={conflict.status === "open" ? "danger" : "success"}
                      size="sm"
                    >
                      {conflict.status === "open" ? "Open" : "Resolved"}
                    </Badge>
                    {conflict.recommendation?.scores && (
                      <span className="text-[11px] text-gray-400">
                        MCDM scored
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight
                  size={16}
                  className="text-gray-300 group-hover:text-emerald-500 flex-shrink-0 mt-1 transition-colors"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConflictList;
'@ | Set-Content -Path "frontend\src\components\conflict\ConflictList.jsx" -Encoding UTF8

# frontend\src\components\conflict\ConflictDetail.jsx
@'
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertTriangle, CheckCircle, ArrowRight, Trophy,
  BarChart2, ChevronLeft, Loader2,
} from "lucide-react";
import Skeleton              from "../common/Skeleton";
import Badge                 from "../common/Badge";
import { getConflict, resolveConflict } from "../../api/conflict.api";
import useAuthStore          from "../../store/authStore";

// ---------------------------------------------------------------------------
// ConflictDetail.jsx
//
// Full conflict detail:
//   — Both projects side-by-side with MCDM scores
//   — Recommended execution order with explanation
//   — Resolve form (admin only)
// ---------------------------------------------------------------------------

// Horizontal MCDM score bar
const ScoreBar = ({ score }) => {
  const pct = Math.round((score || 0) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">MCDM Score</span>
        <span className="font-bold text-emerald-600">{(score || 0).toFixed(3)}</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-emerald-500 h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// Project card for side-by-side comparison
const ProjectSummary = ({ project, score, isWinner, label }) => (
  <div className={`p-4 rounded-2xl border-2 flex-1 ${
    isWinner
      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
      : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
  }`}>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      {isWinner && (
        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
          <Trophy size={11} /> Execute First
        </span>
      )}
    </div>
    <p className="font-bold text-gray-900 dark:text-white text-base mb-1 line-clamp-2">
      {project?.title || "—"}
    </p>
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <Badge variant="neutral" size="sm">{project?.type}</Badge>
      <span className="text-xs text-gray-500">{project?.department?.name || project?.department}</span>
    </div>
    {score != null && <ScoreBar score={score} />}
  </div>
);

const ConflictDetail = () => {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { user }      = useAuthStore();
  const isAdmin       = user?.role === "admin";

  const [conflict,  setConflict]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [resolution, setResolution] = useState("");
  const [resolving, setResolving]   = useState(false);
  const [resolved,  setResolved]    = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getConflict(id);
        setConflict(res.data);
      } catch (err) {
        console.error("[ConflictDetail] fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleResolve = async () => {
    if (!resolution.trim()) return;
    setResolving(true);
    try {
      const res = await resolveConflict(id, { resolution, status: "resolved" });
      setConflict(res.data);
      setResolved(true);
    } catch (err) {
      console.error("[ConflictDetail] resolve error", err);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!conflict) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Conflict not found.</p>
      </div>
    );
  }

  const scores  = conflict.recommendation?.scores || {};
  const order   = conflict.recommendation?.order  || [];
  const winnerId = order[0];
  const isAWinner = String(conflict.projectA?._id) === String(winnerId);

  const scoreA = scores.projectA ?? scores[String(conflict.projectA?._id)];
  const scoreB = scores.projectB ?? scores[String(conflict.projectB?._id)];

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
      >
        <ChevronLeft size={16} />
        Back to Conflicts
      </button>

      {/* Status header */}
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
          conflict.status === "open"
            ? "bg-red-100 dark:bg-red-900/30"
            : "bg-emerald-100 dark:bg-emerald-900/30"
        }`}>
          {conflict.status === "open"
            ? <AlertTriangle size={20} className="text-red-500" />
            : <CheckCircle  size={20} className="text-emerald-500" />
          }
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Project Conflict
          </h2>
          <p className="text-sm text-gray-500">
            {conflict.overlapDates?.start
              ? `Overlap: ${new Date(conflict.overlapDates.start).toLocaleDateString("en-IN")} – ${new Date(conflict.overlapDates.end).toLocaleDateString("en-IN")}`
              : "Spatial and temporal overlap detected"}
            {" · "}
            <Badge
              variant={conflict.status === "open" ? "danger" : "success"}
              size="sm"
            >
              {conflict.status}
            </Badge>
          </p>
        </div>
      </div>

      {/* Project comparison */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={16} className="text-emerald-600" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            MCDM Comparison
          </h3>
        </div>
        <div className="flex items-stretch gap-3">
          <ProjectSummary
            project={conflict.projectA}
            score={scoreA}
            isWinner={isAWinner}
            label="Project A"
          />
          <div className="flex items-center flex-shrink-0">
            <ArrowRight size={20} className="text-gray-300" />
          </div>
          <ProjectSummary
            project={conflict.projectB}
            score={scoreB}
            isWinner={!isAWinner}
            label="Project B"
          />
        </div>
      </div>

      {/* Recommendation */}
      {conflict.recommendation?.explanation && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1.5">
            Recommendation
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
            {conflict.recommendation.explanation}
          </p>
        </div>
      )}

      {/* Resolution section */}
      {conflict.status === "resolved" ? (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-2xl">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">
            Resolution
          </p>
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            {conflict.resolution}
          </p>
        </div>
      ) : isAdmin && !resolved ? (
        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Resolve this Conflict
          </p>
          <textarea
            rows={3}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Describe the resolution — e.g. Pipeline to proceed first. Road repair rescheduled to July 1."
            className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          <button
            onClick={handleResolve}
            disabled={resolving || !resolution.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            {resolving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
            {resolving ? "Resolving…" : "Mark as Resolved"}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ConflictDetail;
'@ | Set-Content -Path "frontend\src\components\conflict\ConflictDetail.jsx" -Encoding UTF8

# frontend\src\components\citizen\ReportForm.jsx
@'
import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Send, CheckCircle, AlertCircle, Loader2, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { submitReport } from "../../api/report.api";

// ---------------------------------------------------------------------------
// ReportForm.jsx — citizen report submission with map pin drop
// Standalone component usable in CitizenReport.jsx or any page
// ---------------------------------------------------------------------------

const REPORT_TYPES = [
  { value: "pothole",     label: "Pothole",     emoji: "🕳️" },
  { value: "streetlight", label: "Streetlight", emoji: "💡" },
  { value: "water_leak",  label: "Water Leak",  emoji: "💧" },
  { value: "garbage",     label: "Garbage",     emoji: "🗑️" },
  { value: "other",       label: "Other",       emoji: "📋" },
];

const DEFAULT_CENTER = [28.6692, 77.4538];

const PinDropper = ({ onPinDrop }) => {
  useMapEvents({ click: (e) => onPinDrop({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
};

const ReportForm = ({ onSuccess }) => {
  const [form, setForm]     = useState({ type: "", description: "", photo: null });
  const [pin,  setPin]      = useState(null);
  const [busy, setBusy]     = useState(false);
  const [err,  setErr]      = useState(null);

  const handlePinDrop = useCallback((coords) => setPin(coords), []);

  const handleSubmit = async () => {
    if (!form.type) { setErr("Please select a report type."); return; }
    if (!pin)       { setErr("Please drop a pin on the map."); return; }

    setBusy(true); setErr(null);
    try {
      const fd = new FormData();
      fd.append("type",        form.type);
      fd.append("description", form.description);
      fd.append("latitude",    String(pin.lat));
      fd.append("longitude",   String(pin.lng));
      if (form.photo) fd.append("photo", form.photo);

      const res = await submitReport(fd);
      onSuccess?.(res.data);
      setForm({ type: "", description: "", photo: null });
      setPin(null);
    } catch (e) {
      setErr(e?.response?.data?.message || "Submission failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {err && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
        </div>
      )}

      {/* Type selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Issue Type *
        </label>
        <div className="grid grid-cols-5 gap-2">
          {REPORT_TYPES.map(({ value, label, emoji }) => (
            <button key={value} type="button"
              onClick={() => setForm((f) => ({ ...f, type: value }))}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                form.type === value
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-400"
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
        <textarea rows={2} value={form.description} maxLength={500}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Describe the issue…"
          className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
      </div>

      {/* Map pin drop */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Location * <span className="font-normal text-gray-400">(tap map)</span>
        </label>
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
          <MapContainer center={DEFAULT_CENTER} zoom={14} style={{ height: 220, width: "100%" }} scrollWheelZoom>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap &copy; CARTO" />
            <PinDropper onPinDrop={handlePinDrop} />
            {pin && <Marker position={[pin.lat, pin.lng]} />}
          </MapContainer>
        </div>
        {pin && (
          <p className="text-xs text-emerald-600 mt-1 font-medium">
            <MapPin size={11} className="inline mr-1" />
            {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
            <button type="button" onClick={() => setPin(null)} className="ml-2 text-gray-400 hover:text-red-500">×</button>
          </p>
        )}
      </div>

      {/* Photo */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Photo (optional)</label>
        <input type="file" accept="image/*"
          onChange={(e) => setForm((f) => ({ ...f, photo: e.target.files[0] || null }))}
          className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
        />
      </div>

      <button type="button" onClick={handleSubmit} disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {busy ? "Submitting…" : "Submit Report"}
      </button>
    </div>
  );
};

export default ReportForm;
'@ | Set-Content -Path "frontend\src\components\citizen\ReportForm.jsx" -Encoding UTF8

# frontend\src\components\citizen\TrackReport.jsx
@'
import { useState } from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { trackReport } from "../../api/report.api";

// ---------------------------------------------------------------------------
// TrackReport.jsx — citizen report status tracker
// Standalone component — accepts trackingId input, shows stepper
// ---------------------------------------------------------------------------

const STEPS = ["submitted", "acknowledged", "in_progress", "resolved"];
const STEP_LABELS = {
  submitted:    "Submitted",
  acknowledged: "Acknowledged",
  in_progress:  "In Progress",
  resolved:     "Resolved",
};
const STATUS_COLORS = {
  submitted:    "bg-yellow-100 text-yellow-800",
  acknowledged: "bg-blue-100   text-blue-800",
  in_progress:  "bg-orange-100 text-orange-800",
  resolved:     "bg-emerald-100 text-emerald-800",
};

const TrackReport = ({ initialId = "" }) => {
  const [id,      setId]      = useState(initialId);
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleTrack = async () => {
    const tid = id.trim().toUpperCase();
    if (!tid) return;
    setLoading(true); setError(null); setReport(null);
    try {
      const res = await trackReport(tid);
      setReport(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || "Report not found.");
    } finally {
      setLoading(false);
    }
  };

  const currentStep = report ? STEPS.indexOf(report.status) : -1;

  return (
    <div className="space-y-5">
      {/* Input */}
      <div className="flex gap-2">
        <input type="text" placeholder="CNR-XXXXXX"
          value={id}
          onChange={(e) => setId(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleTrack()}
          maxLength={10}
          className="flex-1 px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button type="button" onClick={handleTrack} disabled={loading || !id.trim()}
          className="flex items-center gap-1.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Track
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {report && (
        <div className="space-y-4">
          {/* Report info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-gray-900 dark:text-white tracking-widest text-base">
                  {report.trackingId}
                </p>
                <p className="text-sm text-gray-500 capitalize mt-0.5">
                  {report.type?.replace("_", " ")}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[report.status] || "bg-gray-100 text-gray-600"}`}>
                {STEP_LABELS[report.status] || report.status}
              </span>
            </div>
            {report.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300">{report.description}</p>
            )}
            {report.assignedTo && (
              <p className="text-xs text-gray-400 mt-2">Assigned: {report.assignedTo.name}</p>
            )}
          </div>

          {/* Stepper */}
          <div className="flex items-center">
            {STEPS.map((step, idx) => {
              const done   = idx <= currentStep;
              const isLast = idx === STEPS.length - 1;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      done
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-400"
                    }`}>
                      {done ? "✓" : idx + 1}
                    </div>
                    <span className={`text-[10px] font-medium whitespace-nowrap ${done ? "text-emerald-600" : "text-gray-400"}`}>
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mb-4 mx-1 ${idx < currentStep ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-600"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackReport;
'@ | Set-Content -Path "frontend\src\components\citizen\TrackReport.jsx" -Encoding UTF8

# frontend\src\pages\Landing.jsx
@'
import { Link }      from "react-router-dom";
import { MapPin, AlertTriangle, BarChart2, GitMerge, ArrowRight, Shield } from "lucide-react";
import Logo            from "../components/common/Logo";

// ---------------------------------------------------------------------------
// Landing.jsx — Public marketing/landing page
// No authentication required
// Links to /login and /citizen-report
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: <MapPin size={22} className="text-emerald-600" />,
    title: "Geo-Aware Projects",
    desc:  "Every infrastructure project is pinned to an exact map polygon. Overlaps are caught automatically.",
  },
  {
    icon: <AlertTriangle size={22} className="text-amber-500" />,
    title: "Conflict Detection",
    desc:  "Two departments digging the same road? The system detects it before a single rupee is wasted.",
  },
  {
    icon: <BarChart2 size={22} className="text-blue-500" />,
    title: "MCDM Scoring",
    desc:  "TOPSIS algorithm scores projects on urgency, impact, cost, and feasibility to recommend priority.",
  },
  {
    icon: <GitMerge size={22} className="text-purple-500" />,
    title: "Execution Ordering",
    desc:  "A dependency graph determines the correct sequence so no project blocks another unnecessarily.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-12 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <Logo size={34} />
          <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
            Urban Nexus
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/citizen-report"
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition-colors"
          >
            Report Issue
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
          >
            Staff Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-6">
          <Shield size={12} />
          Smart Urban Infrastructure Coordination
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
          Stop Departments
          <br />
          <span className="text-emerald-600">Working in Silos</span>
        </h1>

        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Urban Nexus coordinates infrastructure projects across PWD, Water Board, Electricity,
          and Parks — detecting conflicts before they waste public money and disrupt citizens.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/login"
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-200 dark:shadow-none"
          >
            Get Started
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/citizen-report"
            className="flex items-center gap-2 px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <MapPin size={16} />
            Report an Issue
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="p-6 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl"
            >
              <div className="w-11 h-11 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                {icon}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-6 text-center text-xs text-gray-400">
        Urban Nexus — Smart City Infrastructure Platform
      </footer>
    </div>
  );
};

export default Landing;
'@ | Set-Content -Path "frontend\src\pages\Landing.jsx" -Encoding UTF8

# frontend\src\pages\NotFound.jsx
@'
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home }   from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-extrabold text-gray-200 dark:text-gray-700 mb-2 select-none">
          404
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Page not found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            <ArrowLeft size={15} />
            Go back
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            <Home size={15} />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
'@ | Set-Content -Path "frontend\src\pages\NotFound.jsx" -Encoding UTF8

# ===========================================================================
# PHASE 2 — Decision Engines + Services + Controllers
# ===========================================================================

# backend\src\tests\engines\mcdm.test.js
@'
"use strict";

const { runTopsis } = require("../../engines/mcdm/topsis");

// ---------------------------------------------------------------------------
// mcdm.test.js — TOPSIS algorithm unit tests
// ---------------------------------------------------------------------------

describe("TOPSIS — runTopsis()", () => {
  const weights = {
    urgency:           0.30,
    socialImpact:      0.25,
    estimatedCost:     0.20,
    feasibility:       0.15,
    environmentImpact: 0.10,
  };

  // -------------------------------------------------------------------------
  it("returns a score between 0 and 1 for two alternatives", () => {
    const alternatives = [
      { id: "A", urgency: 8, socialImpact: 7, estimatedCost: 5, feasibility: 8, environmentImpact: 4 },
      { id: "B", urgency: 6, socialImpact: 9, estimatedCost: 3, feasibility: 7, environmentImpact: 6 },
    ];

    const result = runTopsis(alternatives, weights);

    expect(result).toHaveLength(2);
    result.forEach(({ score }) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  // -------------------------------------------------------------------------
  it("higher criteria values produce higher score (benefit criteria)", () => {
    const alternatives = [
      { id: "HIGH", urgency: 10, socialImpact: 10, estimatedCost: 10, feasibility: 10, environmentImpact: 10 },
      { id: "LOW",  urgency: 1,  socialImpact: 1,  estimatedCost: 1,  feasibility: 1,  environmentImpact: 1 },
    ];

    const result = runTopsis(alternatives, weights);
    const scoreHigh = result.find((r) => r.id === "HIGH").score;
    const scoreLow  = result.find((r) => r.id === "LOW").score;

    // estimatedCost and environmentImpact are cost criteria (lower = better in cost sense)
    // but here HIGH still wins overall because urgency + socialImpact + feasibility dominate (0.70 weight)
    expect(scoreHigh).toBeGreaterThan(scoreLow);
  });

  // -------------------------------------------------------------------------
  it("returns 1.0 when only one alternative is provided", () => {
    const alternatives = [
      { id: "ONLY", urgency: 5, socialImpact: 5, estimatedCost: 5, feasibility: 5, environmentImpact: 5 },
    ];

    const result = runTopsis(alternatives, weights);
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(1.0);
  });

  // -------------------------------------------------------------------------
  it("returns 0.5 for two identical alternatives", () => {
    const criteria = { urgency: 7, socialImpact: 6, estimatedCost: 5, feasibility: 8, environmentImpact: 4 };
    const alternatives = [
      { id: "X", ...criteria },
      { id: "Y", ...criteria },
    ];

    const result = runTopsis(alternatives, weights);
    result.forEach(({ score }) => expect(score).toBeCloseTo(0.5, 2));
  });

  // -------------------------------------------------------------------------
  it("scores are sorted descending", () => {
    const alternatives = [
      { id: "A", urgency: 3, socialImpact: 3, estimatedCost: 8, feasibility: 3, environmentImpact: 8 },
      { id: "B", urgency: 9, socialImpact: 8, estimatedCost: 2, feasibility: 9, environmentImpact: 2 },
      { id: "C", urgency: 5, socialImpact: 5, estimatedCost: 5, feasibility: 5, environmentImpact: 5 },
    ];

    const result = runTopsis(alternatives, weights);
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score);
    }
  });

  // -------------------------------------------------------------------------
  it("all scores sum to more than 0 (not all zero)", () => {
    const alternatives = [
      { id: "P", urgency: 4, socialImpact: 6, estimatedCost: 7, feasibility: 5, environmentImpact: 3 },
      { id: "Q", urgency: 7, socialImpact: 4, estimatedCost: 5, feasibility: 8, environmentImpact: 6 },
    ];

    const result = runTopsis(alternatives, weights);
    const total = result.reduce((sum, r) => sum + r.score, 0);
    expect(total).toBeGreaterThan(0);
  });
});
'@ | Set-Content -Path "backend\src\tests\engines\mcdm.test.js" -Encoding UTF8

# backend\src\tests\engines\conflict.test.js
@'
"use strict";

const { detectConflict, detectAllConflicts } = require("../../engines/conflict/conflict.engine");

// ---------------------------------------------------------------------------
// conflict.test.js — geo + time overlap detection tests
// ---------------------------------------------------------------------------

// Helper: simple square polygon [lng, lat]
const makeSquare = (lngBase, latBase, size = 0.01) => ({
  type: "Polygon",
  coordinates: [[
    [lngBase,        latBase],
    [lngBase + size, latBase],
    [lngBase + size, latBase + size],
    [lngBase,        latBase + size],
    [lngBase,        latBase],
  ]],
});

const makeProject = (id, lngBase, latBase, start, end, size = 0.01) => ({
  _id:       id,
  location:  makeSquare(lngBase, latBase, size),
  startDate: new Date(start),
  endDate:   new Date(end),
});

describe("Conflict Engine — detectConflict()", () => {

  it("detects conflict when polygons overlap AND dates overlap", () => {
    const pA = makeProject("A", 77.20, 28.61, "2025-06-01", "2025-06-15");
    const pB = makeProject("B", 77.20, 28.61, "2025-06-05", "2025-06-20");

    const result = detectConflict(pA, pB);
    expect(result.hasConflict).toBe(true);
    expect(result.overlapDates).toBeDefined();
    expect(result.overlapDates.start).toBeDefined();
  });

  it("no conflict when polygons are completely separate", () => {
    const pA = makeProject("A", 77.20, 28.61, "2025-06-01", "2025-06-15");
    const pB = makeProject("B", 77.50, 28.90, "2025-06-01", "2025-06-15");  // far away

    const result = detectConflict(pA, pB);
    expect(result.hasConflict).toBe(false);
  });

  it("no conflict when polygons overlap but dates do NOT overlap", () => {
    const pA = makeProject("A", 77.20, 28.61, "2025-06-01", "2025-06-15");
    const pB = makeProject("B", 77.20, 28.61, "2025-07-01", "2025-07-15");  // different month

    const result = detectConflict(pA, pB);
    expect(result.hasConflict).toBe(false);
  });

  it("detects correct overlap date window", () => {
    const pA = makeProject("A", 77.20, 28.61, "2025-06-01", "2025-06-20");
    const pB = makeProject("B", 77.20, 28.61, "2025-06-10", "2025-06-30");

    const result = detectConflict(pA, pB);
    expect(result.hasConflict).toBe(true);

    const overlapStart = new Date(result.overlapDates.start).toISOString().slice(0, 10);
    const overlapEnd   = new Date(result.overlapDates.end).toISOString().slice(0, 10);

    expect(overlapStart).toBe("2025-06-10");
    expect(overlapEnd).toBe("2025-06-20");
  });

});

describe("Conflict Engine — detectAllConflicts()", () => {

  it("finds all conflicting projects from a list", () => {
    const newProject = makeProject("NEW", 77.20, 28.61, "2025-06-01", "2025-06-30");

    const existing = [
      makeProject("E1", 77.20, 28.61, "2025-06-05", "2025-06-15"),  // conflict
      makeProject("E2", 77.50, 28.90, "2025-06-01", "2025-06-30"),  // no geo overlap
      makeProject("E3", 77.20, 28.61, "2025-08-01", "2025-08-31"),  // no date overlap
      makeProject("E4", 77.20, 28.61, "2025-06-20", "2025-06-25"),  // conflict
    ];

    const conflicts = detectAllConflicts(newProject, existing);
    expect(conflicts).toHaveLength(2);

    const conflictIds = conflicts.map((c) => c.existingProject._id);
    expect(conflictIds).toContain("E1");
    expect(conflictIds).toContain("E4");
  });

  it("returns empty array when no conflicts", () => {
    const newProject = makeProject("NEW", 77.20, 28.61, "2025-06-01", "2025-06-15");
    const existing   = [makeProject("E1", 77.50, 28.90, "2025-06-01", "2025-06-15")];

    const conflicts = detectAllConflicts(newProject, existing);
    expect(conflicts).toHaveLength(0);
  });

  it("returns empty array when existing list is empty", () => {
    const newProject = makeProject("NEW", 77.20, 28.61, "2025-06-01", "2025-06-15");
    const conflicts  = detectAllConflicts(newProject, []);
    expect(conflicts).toHaveLength(0);
  });

});
'@ | Set-Content -Path "backend\src\tests\engines\conflict.test.js" -Encoding UTF8

# backend\src\tests\engines\graph.test.js
@'
"use strict";

const { createDAG }         = require("../../engines/graph/dag");
const { topologicalSort }   = require("../../engines/graph/topological");
const { buildExecutionOrder } = require("../../engines/graph/graph.engine");

// ---------------------------------------------------------------------------
// graph.test.js — DAG and Kahn's topological sort tests
// ---------------------------------------------------------------------------

describe("DAG — createDAG()", () => {

  it("adds nodes and edges correctly", () => {
    const dag = createDAG();
    dag.addNode("A");
    dag.addNode("B");
    dag.addEdge("A", "B");

    expect(dag.hasNode("A")).toBe(true);
    expect(dag.hasNode("B")).toBe(true);
    expect(dag.hasEdge("A", "B")).toBe(true);
    expect(dag.size()).toBe(2);
  });

  it("in-degree is correct after adding edges", () => {
    const dag = createDAG();
    dag.addNode("A"); dag.addNode("B"); dag.addNode("C");
    dag.addEdge("A", "B");
    dag.addEdge("A", "C");
    dag.addEdge("B", "C");

    expect(dag.getInDegree("A")).toBe(0);
    expect(dag.getInDegree("B")).toBe(1);
    expect(dag.getInDegree("C")).toBe(2);
  });

  it("silently ignores duplicate edges", () => {
    const dag = createDAG();
    dag.addNode("X"); dag.addNode("Y");
    dag.addEdge("X", "Y");
    dag.addEdge("X", "Y"); // duplicate
    expect(dag.getInDegree("Y")).toBe(1);
  });

});

describe("Topological Sort — topologicalSort()", () => {

  it("produces valid topological order for a linear chain", () => {
    const dag = createDAG();
    ["A", "B", "C", "D"].forEach((n) => dag.addNode(n));
    dag.addEdge("A", "B");
    dag.addEdge("B", "C");
    dag.addEdge("C", "D");

    const { order, hasCycle } = topologicalSort(dag, {});
    expect(hasCycle).toBe(false);
    expect(order).toEqual(["A", "B", "C", "D"]);
  });

  it("detects a cycle correctly", () => {
    const dag = createDAG();
    ["A", "B", "C"].forEach((n) => dag.addNode(n));
    dag.addEdge("A", "B");
    dag.addEdge("B", "C");
    dag.addEdge("C", "A"); // cycle

    const { hasCycle } = topologicalSort(dag, {});
    expect(hasCycle).toBe(true);
  });

  it("breaks ties using MCDM scores (higher score first)", () => {
    const dag    = createDAG();
    ["P1", "P2", "P3"].forEach((n) => dag.addNode(n));
    // No edges — all three are independent (in-degree 0 simultaneously)

    const scores = { P1: 0.60, P2: 0.90, P3: 0.75 };
    const { order, hasCycle } = topologicalSort(dag, scores);

    expect(hasCycle).toBe(false);
    // Higher scores should come first
    expect(order[0]).toBe("P2"); // 0.90
    expect(order[1]).toBe("P3"); // 0.75
    expect(order[2]).toBe("P1"); // 0.60
  });

  it("handles a diamond dependency (A→B, A→C, B→D, C→D)", () => {
    const dag = createDAG();
    ["A", "B", "C", "D"].forEach((n) => dag.addNode(n));
    dag.addEdge("A", "B");
    dag.addEdge("A", "C");
    dag.addEdge("B", "D");
    dag.addEdge("C", "D");

    const { order, hasCycle } = topologicalSort(dag, {});
    expect(hasCycle).toBe(false);
    expect(order[0]).toBe("A");
    expect(order[order.length - 1]).toBe("D");
  });

});

describe("Graph Engine — buildExecutionOrder()", () => {

  it("produces correct order from MCDM conflict result", () => {
    const projects = [
      { _id: "P1", dependencies: [] },
      { _id: "P2", dependencies: [] },
    ];

    const conflicts = [
      {
        projectA: { _id: "P1" },
        projectB: { _id: "P2" },
        recommendation: { order: ["P2", "P1"] },  // P2 wins
      },
    ];

    const allScores = { P1: 0.70, P2: 0.85 };
    const { order, hasCycle } = buildExecutionOrder(projects, conflicts, allScores);

    expect(hasCycle).toBe(false);
    expect(order.indexOf("P2")).toBeLessThan(order.indexOf("P1"));
  });

  it("respects explicit project dependencies", () => {
    const projects = [
      { _id: "P1", dependencies: [] },
      { _id: "P2", dependencies: ["P1"] }, // P2 depends on P1
    ];

    const { order, hasCycle } = buildExecutionOrder(projects, [], {});
    expect(hasCycle).toBe(false);
    expect(order.indexOf("P1")).toBeLessThan(order.indexOf("P2"));
  });

});
'@ | Set-Content -Path "backend\src\tests\engines\graph.test.js" -Encoding UTF8

# backend\src\tests\api\auth.test.js
@'
"use strict";

const request   = require("supertest");
const mongoose  = require("mongoose");
const app       = require("../../app");
const User       = require("../../models/User");
const Department = require("../../models/Department");
const config     = require("../../config/index");

// ---------------------------------------------------------------------------
// auth.test.js — API integration tests for /api/v1/auth
// Uses in-memory connection — mocks mongoose if no MONGO_URI_TEST is set
// ---------------------------------------------------------------------------

let testDept;
let testUser;
let token;

beforeAll(async () => {
  // Connect to test DB
  const uri = process.env.MONGO_URI_TEST || "mongodb://localhost:27017/urban-nexus-test";
  await mongoose.connect(uri);

  // Create a test department
  testDept = await Department.create({ name: "Test Department Auth", code: "TDA" });
});

afterAll(async () => {
  // Cleanup
  await User.deleteMany({ email: /auth\.test@/ });
  await Department.deleteOne({ code: "TDA" });
  await mongoose.connection.close();
});

// ---------------------------------------------------------------------------
describe("POST /api/v1/auth/register", () => {

  it("registers an officer successfully", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name:       "Test Officer",
        email:      "auth.test.officer@test.com",
        password:   "password123",
        role:       "officer",
        department: testDept._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("auth.test.officer@test.com");
    expect(res.body.data.role).toBe("officer");
    // Password must never be returned
    expect(res.body.data.password).toBeUndefined();

    testUser = res.body.data;
  });

  it("rejects duplicate email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name:       "Duplicate",
        email:      "auth.test.officer@test.com",  // same email
        password:   "password123",
        role:       "officer",
        department: testDept._id.toString(),
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("rejects missing required fields", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "auth.test.missing@test.com" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

});

// ---------------------------------------------------------------------------
describe("POST /api/v1/auth/login", () => {

  it("logs in with correct credentials and returns JWT", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "auth.test.officer@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(typeof res.body.data.token).toBe("string");

    token = res.body.data.token;
  });

  it("rejects wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "auth.test.officer@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects non-existent email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@nowhere.com", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

});

// ---------------------------------------------------------------------------
describe("GET /api/v1/auth/me", () => {

  it("returns user profile with valid token", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("auth.test.officer@test.com");
    expect(res.body.data.password).toBeUndefined();
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

});
'@ | Set-Content -Path "backend\src\tests\api\auth.test.js" -Encoding UTF8

# backend\src\tests\api\project.test.js
@'
"use strict";

const request    = require("supertest");
const mongoose   = require("mongoose");
const app        = require("../../app");
const User       = require("../../models/User");
const Department = require("../../models/Department");
const Project    = require("../../models/Project");

// ---------------------------------------------------------------------------
// project.test.js — API integration tests for /api/v1/projects
// ---------------------------------------------------------------------------

let dept;
let officerToken;
let adminToken;
let projectId;

// GeoJSON polygon over a small area in Ghaziabad
const testPolygon = {
  type: "Polygon",
  coordinates: [[
    [77.4538, 28.6692],
    [77.4548, 28.6692],
    [77.4548, 28.6702],
    [77.4538, 28.6702],
    [77.4538, 28.6692],
  ]],
};

beforeAll(async () => {
  const uri = process.env.MONGO_URI_TEST || "mongodb://localhost:27017/urban-nexus-test";
  await mongoose.connect(uri);

  // Create dept
  dept = await Department.create({ name: "Test Dept Projects", code: "TDP" });

  // Register officer
  await request(app).post("/api/v1/auth/register").send({
    name: "Test Officer Proj", email: "proj.test.officer@test.com",
    password: "password123", role: "officer", department: dept._id.toString(),
  });
  const loginO = await request(app).post("/api/v1/auth/login")
    .send({ email: "proj.test.officer@test.com", password: "password123" });
  officerToken = loginO.body.data.token;

  // Register admin
  await request(app).post("/api/v1/auth/register").send({
    name: "Test Admin Proj", email: "proj.test.admin@test.com",
    password: "password123", role: "admin",
  });
  const loginA = await request(app).post("/api/v1/auth/login")
    .send({ email: "proj.test.admin@test.com", password: "password123" });
  adminToken = loginA.body.data.token;
});

afterAll(async () => {
  await Project.deleteMany({ title: /Test Project/ });
  await User.deleteMany({ email: /proj\.test\./ });
  await Department.deleteOne({ code: "TDP" });
  await mongoose.connection.close();
});

// ---------------------------------------------------------------------------
describe("POST /api/v1/projects", () => {

  it("officer can create a project", async () => {
    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${officerToken}`)
      .send({
        title:         "Test Project Alpha",
        type:          "road",
        description:   "Test road resurfacing",
        address:       "Test Road, Ghaziabad",
        location:      testPolygon,
        startDate:     "2026-06-01",
        endDate:       "2026-06-30",
        estimatedCost: 300000,
        priority:      "high",
        criteria: {
          urgency: 7, socialImpact: 8, estimatedCost: 5,
          feasibility: 7, environmentImpact: 4,
        },
        dependencies: [],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.project.title).toBe("Test Project Alpha");
    expect(res.body.data.project.status).toBe("pending");
    expect(res.body.data).toHaveProperty("clashesDetected");

    projectId = res.body.data.project._id;
  });

  it("rejects project without location", async () => {
    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${officerToken}`)
      .send({
        title: "Test Project No Location", type: "water",
        startDate: "2026-06-01", endDate: "2026-06-30",
        // missing location
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects unauthenticated request", async () => {
    const res = await request(app).post("/api/v1/projects").send({ title: "x" });
    expect(res.status).toBe(401);
  });

});

// ---------------------------------------------------------------------------
describe("GET /api/v1/projects", () => {

  it("returns paginated project list for officer", async () => {
    const res = await request(app)
      .get("/api/v1/projects")
      .set("Authorization", `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/v1/projects");
    expect(res.status).toBe(401);
  });

});

// ---------------------------------------------------------------------------
describe("GET /api/v1/projects/:id", () => {

  it("returns project detail by ID", async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set("Authorization", `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(projectId);
    expect(res.body.data.title).toBe("Test Project Alpha");
  });

  it("returns 404 for non-existent ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/v1/projects/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

});

// ---------------------------------------------------------------------------
describe("PATCH /api/v1/projects/:id/status", () => {

  it("admin can approve a project", async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved", comment: "Looks good" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("approved");
  });

  it("officer cannot approve — returns 403", async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/status`)
      .set("Authorization", `Bearer ${officerToken}`)
      .send({ status: "approved" });

    expect(res.status).toBe(403);
  });

});

// ---------------------------------------------------------------------------
describe("GET /api/v1/projects/map", () => {

  it("returns GeoJSON FeatureCollection", async () => {
    const res = await request(app)
      .get("/api/v1/projects/map")
      .set("Authorization", `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.type).toBe("FeatureCollection");
    expect(Array.isArray(res.body.data.features)).toBe(true);
  });

});
'@ | Set-Content -Path "backend\src\tests\api\project.test.js" -Encoding UTF8

# frontend\Dockerfile
@'
# ===========================================================================
# Urban Nexus — Frontend Dockerfile
# Multi-stage build: node build → nginx serve
# ===========================================================================

# Stage 1 — Build the Vite React app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build

# Stage 2 — Serve with nginx
FROM nginx:1.25-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config for SPA — all routes serve index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
'@ | Set-Content -Path "frontend\Dockerfile" -Encoding UTF8

# frontend\nginx.conf
@'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback — all unmatched routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # No cache for index.html
    location = /index.html {
        add_header Cache-Control "no-store";
    }
}
'@ | Set-Content -Path "frontend\nginx.conf" -Encoding UTF8

# nginx\nginx.conf
@'
upstream backend {
    server backend:5000;
}

upstream frontend {
    server frontend:80;
}

server {
    listen 80;

    # Socket.io — must be proxied before generic /api to handle upgrades
    location /socket.io/ {
        proxy_pass         http://backend;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API routes → backend
    location /api/ {
        proxy_pass         http://backend;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Everything else → frontend SPA
    location / {
        proxy_pass         http://frontend;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }
}
'@ | Set-Content -Path "nginx\nginx.conf" -Encoding UTF8

# docker-compose.yml
@'
# ===========================================================================
# Urban Nexus — Docker Compose (FINAL — Phase 5)
# Services: mongo, backend, frontend, nginx
#
# Usage:
#   Start:   docker-compose up -d
#   Stop:    docker-compose down
#   Rebuild: docker-compose up -d --build
#   Logs:    docker-compose logs -f backend
#
# Copy backend/.env.example to backend/.env and fill all values before running
# ===========================================================================

version: "3.9"

services:

  # -------------------------------------------------------------------------
  # MongoDB
  # -------------------------------------------------------------------------
  mongo:
    image: mongo:7.0
    container_name: urban-nexus-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_DATABASE: urban-nexus
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - urban-nexus-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout:  10s
      retries:  5
      start_period: 20s

  # -------------------------------------------------------------------------
  # Backend — Node.js + Express + Socket.io
  # -------------------------------------------------------------------------
  backend:
    build:
      context:    ./backend
      dockerfile: Dockerfile
    container_name: urban-nexus-backend
    restart: unless-stopped
    depends_on:
      mongo:
        condition: service_healthy
    environment:
      NODE_ENV:               production
      PORT:                   5000
      MONGO_URI:              mongodb://mongo:27017/urban-nexus
      JWT_SECRET:             ${JWT_SECRET}
      JWT_EXPIRY:             ${JWT_EXPIRY:-7d}
      CLOUDINARY_CLOUD_NAME:  ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY:     ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET:  ${CLOUDINARY_API_SECRET}
      CLIENT_ORIGIN:          http://localhost
    volumes:
      - backend_logs:/app/logs
    networks:
      - urban-nexus-network
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:5000/health"]
      interval: 30s
      timeout:  10s
      retries:  3
      start_period: 25s

  # -------------------------------------------------------------------------
  # Frontend — React + Vite served via nginx
  # -------------------------------------------------------------------------
  frontend:
    build:
      context:    ./frontend
      dockerfile: Dockerfile
    container_name: urban-nexus-frontend
    restart: unless-stopped
    depends_on:
      - backend
    networks:
      - urban-nexus-network

  # -------------------------------------------------------------------------
  # Nginx — reverse proxy
  # Routes /api and /socket.io to backend, everything else to frontend
  # -------------------------------------------------------------------------
  nginx:
    image: nginx:1.25-alpine
    container_name: urban-nexus-nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - backend
      - frontend
    networks:
      - urban-nexus-network

# ---------------------------------------------------------------------------
# Networks
# ---------------------------------------------------------------------------
networks:
  urban-nexus-network:
    driver: bridge

# ---------------------------------------------------------------------------
# Volumes
# ---------------------------------------------------------------------------
volumes:
  mongo_data:
    driver: local
  backend_logs:
    driver: local
'@ | Set-Content -Path "docker-compose.yml" -Encoding UTF8

# README.md
@'
# Urban Nexus
**Smart Urban Projects Coordination Platform**

Indian city departments (PWD, Water Board, Electricity, Parks) submit infrastructure projects at the same location without knowing about each other. Urban Nexus is the coordination layer that detects clashes, scores priority using TOPSIS, and recommends correct execution order.

---

## Quick Start (Docker)

```bash
# 1. Clone the repo
git clone https://github.com/your-org/urban-nexus.git
cd urban-nexus

# 2. Copy backend env file and fill in values
cp backend/.env.example backend/.env
# Edit backend/.env — set JWT_SECRET and Cloudinary credentials

# 3. Start all services
docker-compose up -d

# App is now available at http://localhost
# API docs at http://localhost/api/v1/docs
```

---

## Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT_SECRET, and Cloudinary credentials
npm run dev
# API runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
# Create .env
echo "VITE_API_URL=http://localhost:5000/api/v1" > .env
echo "VITE_SOCKET_URL=http://localhost:5000"    >> .env
npm run dev
# App runs on http://localhost:3000
```

---

## Environment Variables

### `backend/.env`

| Variable               | Required | Description |
|------------------------|----------|-------------|
| `NODE_ENV`             | yes      | `development` or `production` |
| `PORT`                 | yes      | API port (default 5000) |
| `MONGO_URI`            | yes      | MongoDB connection string |
| `JWT_SECRET`           | yes      | Secret for signing JWTs (min 32 chars) |
| `JWT_EXPIRY`           | no       | Token lifetime (default `7d`) |
| `CLOUDINARY_CLOUD_NAME`| yes      | Cloudinary cloud name |
| `CLOUDINARY_API_KEY`   | yes      | Cloudinary API key |
| `CLOUDINARY_API_SECRET`| yes      | Cloudinary API secret |
| `CLIENT_ORIGIN`        | yes      | Frontend URL for CORS (e.g. `http://localhost:3000`) |

### `frontend/.env`

| Variable          | Description |
|-------------------|-------------|
| `VITE_API_URL`    | Backend API base URL |
| `VITE_SOCKET_URL` | Socket.io server URL |

---

## Architecture

```
┌─────────────┐     REST + Socket.io     ┌─────────────────────┐
│  React SPA  │ ◄──────────────────────► │  Express API        │
│  (Vite)     │                          │  Node.js + Socket.io│
└─────────────┘                          └────────┬────────────┘
                                                  │
                                         ┌────────▼────────────┐
                                         │  MongoDB            │
                                         │  (Mongoose)         │
                                         └─────────────────────┘
```

### Decision Engine Pipeline

```
New project submitted
       ↓
Conflict Engine (Turf.js geo intersection + date range overlap)
       ↓ clash found?
MCDM Engine (TOPSIS) → scores each project 0–1
       ↓
Graph Engine (Kahn's topological sort) → execution order
       ↓
Conflict document saved → Socket.io clash:detected event
```

---

## User Roles

| Role       | Access |
|------------|--------|
| admin      | Full access — approve projects, resolve conflicts, audit log |
| officer    | Submit and manage their department's projects |
| supervisor | View and update progress on assigned tasks |
| citizen    | Submit reports and track by ID (no login required) |

### Default Routes After Login

| Role       | Redirect to   |
|------------|---------------|
| admin      | /dashboard    |
| officer    | /dept-dashboard |
| supervisor | /tasks        |

---

## API

Full API documentation is available at `/api/v1/docs` (Swagger UI) when the server is running.

Base URL: `/api/v1`

Key endpoints:
- `POST /auth/login` — get JWT
- `POST /projects` — submit project (triggers conflict detection)
- `GET  /projects/map` — GeoJSON for map rendering
- `GET  /conflicts` — list all conflicts with MCDM scores
- `POST /citizen-reports` — public report submission
- `GET  /citizen-reports/track/:trackingId` — public status check
- `GET  /admin/dashboard` — aggregated stats

---

## Running Tests

```bash
cd backend

# All tests
npm test

# Watch mode
npm run test:watch

# Specific test file
npx jest src/tests/engines/mcdm.test.js
```

Tests require a running MongoDB instance. Set `MONGO_URI_TEST` to use a dedicated test database:

```bash
MONGO_URI_TEST=mongodb://localhost:27017/urban-nexus-test npm test
```

---

## Project Structure

```
urban-nexus/
├── backend/
│   ├── src/
│   │   ├── config/          # Central config — never use process.env directly
│   │   ├── engines/
│   │   │   ├── conflict/    # Geo + time overlap detection (pure functions)
│   │   │   ├── mcdm/        # TOPSIS algorithm (pure functions)
│   │   │   └── graph/       # DAG + Kahn's topological sort (pure functions)
│   │   ├── services/        # All business logic
│   │   ├── controllers/     # Request/response only — no business logic
│   │   ├── models/          # Mongoose schemas
│   │   ├── middleware/       # Auth, RBAC, validation, error handling
│   │   ├── routes/          # Express routers
│   │   ├── socket/          # Socket.io handler
│   │   └── tests/           # Jest test suites
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API calls
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level page components
│   │   ├── store/           # Zustand state stores
│   │   ├── hooks/           # useSocket, useAuth, useProjects
│   │   └── router/          # AppRouter with role-based redirects
│   └── Dockerfile
├── nginx/
│   └── nginx.conf           # Reverse proxy config
├── docker-compose.yml
└── README.md
```

---

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18 + Vite + Tailwind CSS |
| Maps      | Leaflet.js + React-Leaflet |
| Charts    | Recharts |
| Realtime  | Socket.io |
| Backend   | Node.js + Express.js |
| Auth      | JWT + bcryptjs |
| Database  | MongoDB + Mongoose |
| Geo Logic | Turf.js |
| Graph     | Custom DAG (plain JS) |
| MCDM      | Custom TOPSIS module |
| Uploads   | Cloudinary |
| Infra     | Docker + Docker Compose + Nginx |
'@ | Set-Content -Path "README.md" -Encoding UTF8

Write-Host "All files written successfully."