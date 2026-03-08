"use strict";

const { success } = require("../utils/response");

// ---------------------------------------------------------------------------
// Project Controller — STUBBED
// Full implementation in Phase 2
// All handlers return 200 "Coming soon — Phase 2"
// ---------------------------------------------------------------------------

const STUB_MESSAGE = "Coming soon — Phase 2";

const getAllProjects = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const createProject = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const updateProjectStatus = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const updateProjectProgress = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
  updateProjectProgress,
};