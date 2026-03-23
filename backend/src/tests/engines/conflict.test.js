"use strict";

const { detectConflict, detectAllConflicts } = require("../../engines/conflict/conflict.engine");

// ---------------------------------------------------------------------------
// conflict.test.js â€” geo + time overlap detection tests
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

describe("Conflict Engine â€” detectConflict()", () => {

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

describe("Conflict Engine â€” detectAllConflicts()", () => {

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
