"use strict";

// ---------------------------------------------------------------------------
// time.detector.js â€” pure function, zero DB access
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
  // Normalize to Date objects â€” handles both Date and ISO string inputs
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
