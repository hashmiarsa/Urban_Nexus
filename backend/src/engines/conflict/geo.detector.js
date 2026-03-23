"use strict";

const turf = require("@turf/turf");

// ---------------------------------------------------------------------------
// geo.detector.js â€” pure function, zero DB access
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

  // Quick boolean check first â€” cheaper than computing full intersection
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
  // not a real spatial conflict â€” treat as no conflict
  if (!overlapArea) {
    return { intersects: false, overlapArea: null };
  }

  return { intersects: true, overlapArea };
};

module.exports = { detectGeoConflict };
