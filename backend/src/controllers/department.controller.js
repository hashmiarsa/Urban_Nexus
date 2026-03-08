"use strict";

const { success } = require("../utils/response");

// ---------------------------------------------------------------------------
// Department Controller — STUBBED
// Full implementation in Phase 2
// All handlers return 200 "Coming soon — Phase 2"
// ---------------------------------------------------------------------------

const STUB_MESSAGE = "Coming soon — Phase 2";

const getAllDepartments = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const getDepartmentById = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const assignDepartmentHead = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const getDepartmentProjects = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
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