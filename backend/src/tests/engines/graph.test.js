"use strict";

const { createDAG }         = require("../../engines/graph/dag");
const { topologicalSort }   = require("../../engines/graph/topological");
const { buildExecutionOrder } = require("../../engines/graph/graph.engine");

// ---------------------------------------------------------------------------
// graph.test.js â€” DAG and Kahn's topological sort tests
// ---------------------------------------------------------------------------

describe("DAG â€” createDAG()", () => {

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

describe("Topological Sort â€” topologicalSort()", () => {

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
    // No edges â€” all three are independent (in-degree 0 simultaneously)

    const scores = { P1: 0.60, P2: 0.90, P3: 0.75 };
    const { order, hasCycle } = topologicalSort(dag, scores);

    expect(hasCycle).toBe(false);
    // Higher scores should come first
    expect(order[0]).toBe("P2"); // 0.90
    expect(order[1]).toBe("P3"); // 0.75
    expect(order[2]).toBe("P1"); // 0.60
  });

  it("handles a diamond dependency (Aâ†’B, Aâ†’C, Bâ†’D, Câ†’D)", () => {
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

describe("Graph Engine â€” buildExecutionOrder()", () => {

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
