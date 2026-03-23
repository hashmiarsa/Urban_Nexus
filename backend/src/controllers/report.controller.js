"use strict";

const ReportService = require("../services/report.service");
const { success }   = require("../utils/response");

// ---------------------------------------------------------------------------
// report.controller.js â€” full implementation replacing Phase 1 stub
// Controllers only handle req/res â€” zero business logic here
// ---------------------------------------------------------------------------

const createReport = async (req, res, next) => {
  try {
    // Photo URL is set by multer-storage-cloudinary middleware
    // req.file.path = Cloudinary URL when photo is uploaded
    // req.file is undefined when no photo is provided
    const photoUrl = req.file?.path || null;
    const result   = await ReportService.createReport(req.body, photoUrl);
    return res.status(201).json(success("Report submitted successfully", result));
  } catch (err) {
    next(err);
  }
};

const trackReport = async (req, res, next) => {
  try {
    const report = await ReportService.trackReport(req.params.trackingId);
    return res.status(200).json(success("Report found", report));
  } catch (err) {
    next(err);
  }
};

const getAllReports = async (req, res, next) => {
  try {
    const { reports, pagination } = await ReportService.getAllReports(req.query);
    return res.status(200).json({
      success: true,
      message: "Reports fetched",
      data:    reports,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

const getReportById = async (req, res, next) => {
  try {
    const report = await ReportService.getReportById(req.params.id);
    return res.status(200).json(success("Report fetched", report));
  } catch (err) {
    next(err);
  }
};

const updateReportStatus = async (req, res, next) => {
  try {
    const { status, assignedTo } = req.body;
    const report = await ReportService.updateReportStatus(
      req.params.id,
      status,
      assignedTo,
      req.user,
      req.ip
    );
    return res.status(200).json(success("Report status updated", report));
  } catch (err) {
    next(err);
  }
};

const assignReport = async (req, res, next) => {
  try {
    const { departmentId } = req.body;
    const report = await ReportService.assignReport(req.params.id, departmentId);
    return res.status(200).json(success("Report assigned to department", report));
  } catch (err) {
    next(err);
  }
};

const linkReportToProject = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    const report = await ReportService.linkReportToProject(req.params.id, projectId);
    return res.status(200).json(success("Report linked to project", report));
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
