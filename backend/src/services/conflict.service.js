"use strict";

const Conflict              = require("../models/Conflict");
const { auditConflictResolved } = require("./audit.service");

// ---------------------------------------------------------------------------
// conflict.service.js
//
// All business logic for conflict fetching and resolution.
// Controllers call these functions â€” zero req/res logic here.
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
  // Admin sees everything â€” no filter applied
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

  // Admin â€” return all conflicts
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
 * Resolves a conflict â€” admin only
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

  // Write audit log â€” fire and forget
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
