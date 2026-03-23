"use strict";

const Project        = require("../models/Project");
const Conflict       = require("../models/Conflict");
const Department     = require("../models/Department");
const CitizenReport  = require("../models/CitizenReport");
const AuditLog       = require("../models/AuditLog");
const { success }    = require("../utils/response");

// ---------------------------------------------------------------------------
// admin.controller.js
// Admin-only endpoints: dashboard stats aggregation + audit log
// All routes protected by auth + permit("admin") at route level
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/admin/dashboard
 * Returns aggregated platform statistics matching API_CONTRACT exactly
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // Run all aggregation queries in parallel for performance
    const [
      totalProjects,
      pendingApprovals,
      activeConflicts,
      resolvedConflicts,
      totalDepartments,
      totalReports,
      unresolvedReports,
      projectsByStatusRaw,
      projectsByDeptRaw,
    ] = await Promise.all([
      // Total projects count
      Project.countDocuments(),

      // Projects awaiting admin approval
      Project.countDocuments({ status: "pending" }),

      // Open conflicts
      Conflict.countDocuments({ status: "open" }),

      // Resolved or overridden conflicts
      Conflict.countDocuments({ status: { $in: ["resolved", "overridden"] } }),

      // Active departments
      Department.countDocuments({ isActive: true }),

      // Total citizen reports
      CitizenReport.countDocuments(),

      // Unresolved citizen reports
      CitizenReport.countDocuments({ status: { $nin: ["resolved"] } }),

      // Projects grouped by status
      Project.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Projects grouped by department
      Project.aggregate([
        {
          $group: {
            _id:   "$department",
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from:         "departments",
            localField:   "_id",
            foreignField: "_id",
            as:           "dept",
          },
        },
        { $unwind: { path: "$dept", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id:        0,
            department: { $ifNull: ["$dept.name", "Unknown"] },
            count:      1,
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Reshape projectsByStatus array into the flat object shape from API_CONTRACT
    const projectsByStatus = {
      pending:   0,
      approved:  0,
      ongoing:   0,
      completed: 0,
      rejected:  0,
      clashed:   0,
    };
    for (const item of projectsByStatusRaw) {
      if (item._id in projectsByStatus) {
        projectsByStatus[item._id] = item.count;
      }
    }

    return res.status(200).json(
      success("Dashboard data fetched", {
        totalProjects,
        pendingApprovals,
        activeConflicts,
        resolvedConflicts,
        totalDepartments,
        citizenReports: {
          total:      totalReports,
          unresolved: unresolvedReports,
        },
        projectsByStatus,
        projectsByDepartment: projectsByDeptRaw,
      })
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/audit
 * Returns paginated audit log with optional userId + resource filters
 */
const getAuditLog = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.userId)   filter.userId   = req.query.userId;
    if (req.query.resource) filter.resource = req.query.resource;

    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const skip  = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("userId", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success:    true,
      message:    "Audit logs fetched",
      data:       logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};
const User = require("../models/User");

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .populate("department", "name code")
      .sort({ createdAt: -1 }).lean();
    return res.status(200).json(success("Users fetched", users));
  } catch (err) { next(err); }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("department", "name code").lean();
    if (!user) { const e = new Error("User not found"); e.statusCode = 404; throw e; }
    return res.status(200).json(success("User fetched", user));
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("department", "name code").lean();
    if (!user) { const e = new Error("User not found"); e.statusCode = 404; throw e; }
    return res.status(200).json(success("User updated", user));
  } catch (err) { next(err); }
};

const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    ).lean();
    if (!user) { const e = new Error("User not found"); e.statusCode = 404; throw e; }
    return res.status(200).json(success("User deactivated", user));
  } catch (err) { next(err); }
};

const getAuditLogByResource = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({ resourceId: req.params.resourceId })
      .populate("userId", "name email role")
      .sort({ createdAt: -1 }).lean();
    return res.status(200).json(success("Audit log fetched", logs));
  } catch (err) { next(err); }
};

module.exports = {
  getDashboardStats,
  getAuditLog,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  getAuditLogByResource,
};

