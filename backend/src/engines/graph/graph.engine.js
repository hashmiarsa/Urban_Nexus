"use strict";

const { createDAG }        = require("./dag");
const { topologicalSort }  = require("./topological");

// ---------------------------------------------------------------------------
// graph.engine.js â€” pure function, zero DB access
//
// Builds a DAG from:
//   1. Explicit project dependencies (Project.dependencies[] from schema)
//   2. MCDM-derived conflict ordering (winner executes before loser)
//
// Then runs topological sort to produce a final execution order.
//
// Input:
//   projects   â€” array of plain project objects with _id and dependencies[]
//   conflicts  â€” array of conflict results from decision.service:
//                [{ projectAId, projectBId, scores: { pAId: score, pBId: score } }]
//   allScores  â€” flat { [projectId]: score } map for tie-breaking in sort
//
// Output:
//   {
//     order:    [projectId, ...]   â€” final execution order
//     hasCycle: boolean            â€” true if dependency graph has a cycle
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
  // Step 1 â€” Register all projects as nodes
  // Every project gets a node even if it has no edges
  // -------------------------------------------------------------------------
  for (const project of projects) {
    dag.addNode(project._id.toString());
  }

  // -------------------------------------------------------------------------
  // Step 2 â€” Add edges from explicit dependencies
  // Project.dependencies[] = "these must complete before me"
  // So for each dep in project.dependencies: dep â†’ project
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
  // Step 3 â€” Add edges from conflict MCDM ordering
  // For each conflict, the higher-scoring project executes first
  // scores object has exactly two keys: the two conflicting project IDs
  // order[0] is winner (higher score), order[1] is loser (lower score)
  // Edge: winner â†’ loser (winner executes before loser)
  //
  // Only add conflict edges where no dependency edge already exists in
  // the same direction â€” avoids redundant edges but duplication is safe
  // since addEdge is idempotent on duplicates
  // -------------------------------------------------------------------------
  for (const conflict of conflicts) {
    const { projectAId, projectBId, scores } = conflict;

    if (!projectAId || !projectBId || !scores) continue;

    const idA = projectAId.toString();
    const idB = projectBId.toString();

    // Determine winner â€” whichever has the higher MCDM score
    const scoreA = scores[idA] || 0;
    const scoreB = scores[idB] || 0;

    if (scoreA === scoreB) {
      // Exact tie â€” no ordering edge added, both treated as independent
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
  // Step 4 â€” Topological sort with MCDM score tie-breaking
  // -------------------------------------------------------------------------
  const { order, hasCycle } = topologicalSort(dag, allScores);

  return { order, hasCycle };
};

module.exports = { buildExecutionOrder };
