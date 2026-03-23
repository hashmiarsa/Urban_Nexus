"use strict";

// ---------------------------------------------------------------------------
// topological.js â€” Kahn's algorithm for topological sort, zero DB access
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
// they are ordered by their MCDM score â€” higher score executes first.
//
// Input:
//   dag     â€” DAG instance from dag.js
//   scores  â€” optional { [nodeId]: number } MCDM scores for tie-breaking
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
  // Step 1 â€” Initialize queue with all zero in-degree nodes
  // These are projects with no prerequisites â€” can start immediately
  // -------------------------------------------------------------------------
  let queue = nodes.filter((node) => inDegreeMap.get(node) === 0);

  // Sort initial queue by MCDM score descending for deterministic output
  queue = sortByScore(queue, scores);

  // -------------------------------------------------------------------------
  // Step 2 â€” Process queue
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
        // This neighbour's prerequisites are all done â€” it's ready
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
  // Step 3 â€” Cycle detection
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
