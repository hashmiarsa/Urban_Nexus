"use strict";

// ---------------------------------------------------------------------------
// dag.js â€” Directed Acyclic Graph data structure, zero DB access
//
// Represents project execution dependencies as a directed graph.
// An edge A â†’ B means "A must complete before B can start".
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
  // Tracks incoming edge count per node â€” needed for Kahn's algorithm
  const inDegree = new Map();

  // -------------------------------------------------------------------------
  // addNode â€” registers a node in the graph
  // Idempotent â€” calling twice with same id is safe
  // -------------------------------------------------------------------------
  const addNode = (nodeId) => {
    const id = String(nodeId);
    if (!adjacencyList.has(id)) {
      adjacencyList.set(id, new Set());
      inDegree.set(id, 0);
    }
  };

  // -------------------------------------------------------------------------
  // addEdge â€” adds a directed edge from â†’ to
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
  // getNodes â€” returns all node IDs as an array
  // -------------------------------------------------------------------------
  const getNodes = () => Array.from(adjacencyList.keys());

  // -------------------------------------------------------------------------
  // getEdges â€” returns all edges as array of [from, to] pairs
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
  // getNeighbours â€” returns array of nodes that depend on this node
  // i.e. nodes that have an incoming edge from nodeId
  // -------------------------------------------------------------------------
  const getNeighbours = (nodeId) => {
    const id = String(nodeId);
    if (!adjacencyList.has(id)) return [];
    return Array.from(adjacencyList.get(id));
  };

  // -------------------------------------------------------------------------
  // getInDegree â€” returns number of incoming edges for a node
  // Used by Kahn's algorithm to find nodes with no prerequisites
  // -------------------------------------------------------------------------
  const getInDegree = (nodeId) => {
    const id = String(nodeId);
    return inDegree.get(id) || 0;
  };

  // -------------------------------------------------------------------------
  // getInDegreeMap â€” returns a copy of the full inDegree map
  // Kahn's algorithm needs a mutable copy to decrement during sort
  // -------------------------------------------------------------------------
  const getInDegreeMap = () => new Map(inDegree);

  // -------------------------------------------------------------------------
  // hasNode â€” checks if a node exists
  // -------------------------------------------------------------------------
  const hasNode = (nodeId) => adjacencyList.has(String(nodeId));

  // -------------------------------------------------------------------------
  // hasEdge â€” checks if a directed edge exists from â†’ to
  // -------------------------------------------------------------------------
  const hasEdge = (from, to) => {
    const fromId = String(from);
    const toId   = String(to);
    if (!adjacencyList.has(fromId)) return false;
    return adjacencyList.get(fromId).has(toId);
  };

  // -------------------------------------------------------------------------
  // size â€” returns number of nodes in the graph
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
