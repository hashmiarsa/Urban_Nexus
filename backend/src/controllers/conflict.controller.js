"use strict";

const ConflictService = require("../services/conflict.service");
const { success }     = require("../utils/response");

// ---------------------------------------------------------------------------
// conflict.controller.js
// Controllers only handle req/res â€” zero business logic here
// ---------------------------------------------------------------------------

const getAllConflicts = async (req, res, next) => {
  try {
    const conflicts = await ConflictService.getAllConflicts(req.user);
    return res.status(200).json(success("Conflicts fetched", conflicts));
  } catch (err) {
    next(err);
  }
};

const getConflictById = async (req, res, next) => {
  try {
    const conflict = await ConflictService.getConflictById(req.params.id, req.user);
    return res.status(200).json(success("Conflict detail fetched", conflict));
  } catch (err) {
    next(err);
  }
};

const resolveConflict = async (req, res, next) => {
  try {
    const { resolution, status } = req.body;
    const conflict = await ConflictService.resolveConflict(
      req.params.id,
      resolution,
      status,
      req.user,
      req.ip
    );
    return res.status(200).json(success("Conflict resolved", conflict));
  } catch (err) {
    next(err);
  }
};
const overrideConflict = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const conflict = await ConflictService.overrideConflict(
      req.params.id,
      reason,
      req.user,
      req.ip
    );
    return res.status(200).json(success("Conflict overridden", conflict));
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
