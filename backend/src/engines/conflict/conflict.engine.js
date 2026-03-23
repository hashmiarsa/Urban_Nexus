"use strict";

const { detectGeoConflict }  = require("./geo.detector");
const { detectTimeConflict } = require("./time.detector");

// ---------------------------------------------------------------------------
// conflict.engine.js â€” pure function, zero DB access
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
  // Guard â€” both projects must have valid location geometry
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
  // Step 1 â€” Geographic check (cheaper than always doing both)
  // If polygons don't intersect, skip time check entirely
  // -------------------------------------------------------------------------
  const geoResult = detectGeoConflict(projectA.location, projectB.location);

  if (!geoResult.intersects) {
    return { hasConflict: false, overlapArea: null, overlapDates: null };
  }

  // -------------------------------------------------------------------------
  // Step 2 â€” Temporal check
  // Polygons overlap â€” now check if date ranges also overlap
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
  // Both checks pass â€” genuine conflict
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
