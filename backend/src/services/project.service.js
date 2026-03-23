"use strict";

const Project                  = require("../models/Project");
const config                   = require("../config/index");
const { runDecisionPipeline }  = require("./decision.service");
const {
  auditProjectCreated,
  auditProjectStatusUpdated,
  auditProjectAssigned,
} = require("./audit.service");
const {
  emitProjectApproved,
  emitProjectRejected,
  emitTaskAssigned,
} = require("./notification.service");

// ---------------------------------------------------------------------------
// project.service.js
//
// Full CRUD for projects plus automatic conflict detection on create.
// Role-based filtering enforced here â€” controllers pass req.user through.
// ---------------------------------------------------------------------------

/**
 * Returns paginated list of projects filtered by role + optional query params
 *
 * @param {object} user    - req.user: { userId, role, departmentId }
 * @param {object} query   - Parsed query params: { status, type, department, page, limit }
 * @returns {object}       - { projects, pagination }
 */
const getAllProjects = async (user, query = {}) => {
  const filter = {};

  // -------------------------------------------------------------------------
  // Role-based base filter
  // Admin sees everything; officer sees own department only
  // -------------------------------------------------------------------------
  if (user.role === "officer") {
    filter.department = user.departmentId;
  }

  if (user.role === "supervisor") {
    filter.assignedTo = user.userId;
  }

  // -------------------------------------------------------------------------
  // Optional query filters
  // -------------------------------------------------------------------------
  if (query.status)     filter.status     = query.status;
  if (query.type)       filter.type       = query.type;

  // Admin can filter by department explicitly â€” officers cannot override theirs
  if (query.department && user.role === "admin") {
    filter.department = query.department;
  }

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------
  const page  = Math.max(1, parseInt(query.page,  10) || 1);
  const limit = Math.min(100, parseInt(query.limit, 10) || 20);
  const skip  = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate("department", "name code")
      .populate("submittedBy", "name email")
      .populate("assignedTo",  "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  return {
    projects,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Returns a single project by ID â€” enforces department access for officers
 *
 * @param {string} projectId  - MongoDB project ID
 * @param {object} user       - req.user
 * @returns {object}          - Populated project document
 */
const getProjectById = async (projectId, user) => {
  const project = await Project.findById(projectId)
    .populate("department",  "name code")
    .populate("submittedBy", "name email role")
    .populate("assignedTo",  "name email role")
    .populate("dependencies","title status type")
    .lean();

  if (!project) {
    const err = new Error("Project not found");
    err.statusCode = 404;
    throw err;
  }

  // Officers can only view their own department's projects
  if (user.role === "officer") {
    if (project.department._id.toString() !== user.departmentId?.toString()) {
      const err = new Error("Access denied. This project does not belong to your department.");
      err.statusCode = 403;
      throw err;
    }
  }

  // Supervisors can only view projects assigned to them
  if (user.role === "supervisor") {
    if (project.assignedTo?._id.toString() !== user.userId?.toString()) {
      const err = new Error("Access denied. This project is not assigned to you.");
      err.statusCode = 403;
      throw err;
    }
  }

  return project;
};

/**
 * Creates a new project and automatically runs the decision pipeline
 * Department resolved from user (officer) or request body (admin)
 *
 * @param {object} body   - Validated request body
 * @param {object} user   - req.user: { userId, role, departmentId }
 * @param {string} ip     - Request IP for audit log
 * @returns {object}      - { project, clashesDetected, conflicts }
 */
const createProject = async (body, user, ip) => {
  // -------------------------------------------------------------------------
  // Resolve department
  // Officers always use their own department
  // Admins must supply department in body
  // -------------------------------------------------------------------------
  let departmentId;

  if (user.role === "admin") {
    if (!body.department) {
      const err = new Error("department is required when admin submits a project");
      err.statusCode = 400;
      throw err;
    }
    departmentId = body.department;
  } else {
    // officer
    departmentId = user.departmentId;
  }

  // -------------------------------------------------------------------------
  // Save the new project
  // -------------------------------------------------------------------------
  const project = await Project.create({
    title:         body.title,
    type:          body.type,
    description:   body.description,
    location:      body.location,
    address:       body.address,
    startDate:     body.startDate,
    endDate:       body.endDate,
    estimatedCost: body.estimatedCost,
    priority:      body.priority || "medium",
    criteria:      body.criteria || {},
    dependencies:  body.dependencies || [],
    department:    departmentId,
    submittedBy:   user.userId,
    status:        "pending",
    progress:      0,
  });

  // Audit log â€” fire and forget
  auditProjectCreated(user.userId, project, ip);

  // -------------------------------------------------------------------------
  // Run decision pipeline
  // Fetch candidate projects (active/planned, not this project)
  // -------------------------------------------------------------------------
  const candidates = await Project.find({
    _id:    { $ne: project._id },
    status: { $in: config.CONFLICT_CHECK_STATUSES },
  }).lean();

  const savedConflicts = await runDecisionPipeline(project, candidates);

  // -------------------------------------------------------------------------
  // Build response conflicts summary (matches API_CONTRACT shape)
  // -------------------------------------------------------------------------
  const conflictSummary = savedConflicts.map((c) => ({
    _id:          c._id,
    projectB:     c.projectA.toString() === project._id.toString()
                    ? { _id: c.projectB }
                    : { _id: c.projectA },
    overlapDates: c.overlapDates,
  }));

  return {
    project,
    clashesDetected: savedConflicts.length,
    conflicts:       conflictSummary,
  };
};

/**
 * Updates project status (admin) or progress (supervisor)
 * RBAC is enforced at route level â€” this service trusts the caller's role
 *
 * @param {string} projectId  - MongoDB project ID
 * @param {object} body       - { status?, progress?, comment? }
 * @param {object} user       - req.user
 * @param {string} ip         - Request IP for audit log
 * @returns {object}          - Updated project document
 */
const updateProjectStatus = async (projectId, body, user, ip) => {
  const project = await Project.findById(projectId);

  if (!project) {
    const err = new Error("Project not found");
    err.statusCode = 404;
    throw err;
  }

  const previousStatus = project.status;

  // Admin can update status
  if (user.role === "admin" && body.status) {
    const validStatuses = ["pending", "approved", "ongoing", "completed", "rejected"];
    if (!validStatuses.includes(body.status)) {
      const err = new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }
    project.status = body.status;
  }

  // Supervisor can update progress only
  if (user.role === "supervisor" && body.progress !== undefined) {
    const progress = parseInt(body.progress, 10);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      const err = new Error("Progress must be a number between 0 and 100");
      err.statusCode = 400;
      throw err;
    }
    project.progress = progress;

    // Auto-update status to ongoing when progress starts, completed at 100
    if (progress > 0 && progress < 100 && project.status === "approved") {
      project.status = "ongoing";
    }
    if (progress === 100) {
      project.status = "completed";
    }
  }

  await project.save();

  // Audit log
  if (project.status !== previousStatus) {
    auditProjectStatusUpdated(user.userId, projectId, previousStatus, project.status, ip);
  }

  // Notifications
  const deptId = project.department?.toString();
  if (body.status === "approved") emitProjectApproved(projectId, deptId);
  if (body.status === "rejected") emitProjectRejected(projectId, deptId);

  return project.populate([
    { path: "department",  select: "name code" },
    { path: "submittedBy", select: "name email" },
    { path: "assignedTo",  select: "name email" },
  ]);
};

/**
 * Assigns a project to a supervisor
 *
 * @param {string} projectId    - MongoDB project ID
 * @param {string} supervisorId - MongoDB user ID of the supervisor
 * @param {object} user         - req.user
 * @param {string} ip           - Request IP for audit log
 * @returns {object}            - Updated project document
 */
const assignProject = async (projectId, supervisorId, user, ip) => {
  const project = await Project.findById(projectId);

  if (!project) {
    const err = new Error("Project not found");
    err.statusCode = 404;
    throw err;
  }

  // Officers can only assign projects from their own department
  if (user.role === "officer") {
    if (project.department.toString() !== user.departmentId?.toString()) {
      const err = new Error("Access denied. This project does not belong to your department.");
      err.statusCode = 403;
      throw err;
    }
  }

  project.assignedTo = supervisorId;
  await project.save();

  auditProjectAssigned(user.userId, projectId, supervisorId, ip);
  emitTaskAssigned(supervisorId, projectId);

  return project.populate([
    { path: "department",  select: "name code" },
    { path: "submittedBy", select: "name email" },
    { path: "assignedTo",  select: "name email" },
  ]);
};

/**
 * Returns all projects as GeoJSON FeatureCollection for map rendering
 * Returns all non-rejected projects regardless of role (map is shared view)
 *
 * @returns {object}  - GeoJSON FeatureCollection
 */
const getMapData = async () => {
  const projects = await Project.find({
    status: { $nin: ["rejected"] },
  })
    .populate("department", "name code")
    .lean();

  const features = projects.map((p) => ({
    type:     "Feature",
    geometry: p.location,
    properties: {
      _id:        p._id,
      title:      p.title,
      type:       p.type,
      status:     p.status,
      department: p.department?.code || "",
      startDate:  p.startDate,
      endDate:    p.endDate,
      priority:   p.priority,
    },
  }));

  return {
    type:     "FeatureCollection",
    features,
  };
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProjectStatus,
  assignProject,
  getMapData,
};
