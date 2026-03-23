"use strict";

const Department             = require("../models/Department");
const User                   = require("../models/User");
const { success }            = require("../utils/response");
const { auditDepartmentCreated } = require("../services/audit.service");

// ---------------------------------------------------------------------------
// department.controller.js
// Departments are low-complexity â€” service layer is inline here
// All routes are admin-only so no RBAC filtering needed beyond middleware
// ---------------------------------------------------------------------------

const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find()
      .populate("headId", "name email")
      .sort({ name: 1 })
      .lean();
    return res.status(200).json(success("Departments fetched", departments));
  } catch (err) {
    next(err);
  }
};

const getDepartmentById = async (req, res, next) => {
  try {
    const dept = await Department.findById(req.params.id)
      .populate("headId", "name email role")
      .lean();

    if (!dept) {
      const err = new Error("Department not found");
      err.statusCode = 404;
      throw err;
    }

    return res.status(200).json(success("Department fetched", dept));
  } catch (err) {
    next(err);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      const err = new Error("name and code are required");
      err.statusCode = 400;
      throw err;
    }

    const dept = await Department.create({ name, code });

    auditDepartmentCreated(req.user.userId, dept, req.ip);

    return res.status(201).json(success("Department created", dept));
  } catch (err) {
    // Handle duplicate key â€” name or code already exists
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      const dupErr = new Error(`Department with this ${field} already exists`);
      dupErr.statusCode = 409;
      return next(dupErr);
    }
    next(err);
  }
};

const assignDepartmentHead = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const dept = await Department.findById(req.params.id);
    if (!dept) {
      const err = new Error("Department not found");
      err.statusCode = 404;
      throw err;
    }

    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    dept.headId = userId;
    await dept.save();

    const updated = await Department.findById(dept._id)
      .populate("headId", "name email role")
      .lean();

    return res.status(200).json(success("Department head assigned", updated));
  } catch (err) {
    next(err);
  }
};
const updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!dept) { const e = new Error("Department not found"); e.statusCode = 404; throw e; }
    return res.status(200).json(success("Department updated", dept));
  } catch (err) { next(err); }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    ).lean();
    if (!dept) { const e = new Error("Department not found"); e.statusCode = 404; throw e; }
    return res.status(200).json(success("Department deactivated", dept));
  } catch (err) { next(err); }
};

const getDepartmentProjects = async (req, res, next) => {
  try {
    const Project = require("../models/Project");
    const projects = await Project.find({ department: req.params.id })
      .sort({ createdAt: -1 }).lean();
    return res.status(200).json(success("Department projects fetched", projects));
  } catch (err) { next(err); }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignDepartmentHead,
  getDepartmentProjects,
};
