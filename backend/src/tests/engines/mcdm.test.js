"use strict";

const { runTopsis } = require("../../engines/mcdm/topsis");

// ---------------------------------------------------------------------------
// mcdm.test.js â€” TOPSIS algorithm unit tests
// ---------------------------------------------------------------------------

describe("TOPSIS â€” runTopsis()", () => {
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
