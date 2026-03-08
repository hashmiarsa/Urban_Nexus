"use strict";

const { success } = require("../utils/response");

// ---------------------------------------------------------------------------
// Conflict Controller — STUBBED
// Full implementation in Phase 2
// All handlers return 200 "Coming soon — Phase 2"
// ---------------------------------------------------------------------------

const STUB_MESSAGE = "Coming soon — Phase 2";

const getAllConflicts = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const getConflictById = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const resolveConflict = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

const overrideConflict = async (req, res, next) => {
  try {
    return res.status(200).json(success(STUB_MESSAGE, null));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllConflicts,
  getConflictById,
  resolveConflict,
  overrideConflict,
};