"use strict";

const { success } = require("../utils/response");

// ---------------------------------------------------------------------------
// Admin Controller — STUBBED
// Full implementation in Phase 2 and Phase 5
// All handlers return 200 "Coming soon — Phase 2"
// ---------------------------------------------------------------------------

const STUB_MESSAGE = "Coming soon — Phase 2";

const getDashboardStats = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const getAuditLog = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const getAuditLogByResource = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  getAuditLog,
  getAuditLogByResource,
};