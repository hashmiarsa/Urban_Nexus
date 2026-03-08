"use strict";

const { success } = require("../utils/response");

// ---------------------------------------------------------------------------
// Report Controller — STUBBED
// Full implementation in Phase 5
// All handlers return 200 "Coming soon — Phase 2"
// ---------------------------------------------------------------------------

const STUB_MESSAGE = "Coming soon — Phase 2";

const createReport = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const trackReport = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const getAllReports = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const getReportById = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const updateReportStatus = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const assignReport = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const linkReportToProject = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReport,
  trackReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  assignReport,
  linkReportToProject,
};