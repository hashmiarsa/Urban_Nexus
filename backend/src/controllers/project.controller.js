"use strict";

const ProjectService = require("../services/project.service");
const { success }    = require("../utils/response");

// ---------------------------------------------------------------------------
// project.controller.js
// Controllers only handle req/res â€” zero business logic here
// All logic lives in project.service.js
// ---------------------------------------------------------------------------

const getAllProjects = async (req, res, next) => {
  try {
    const { projects, pagination } = await ProjectService.getAllProjects(
      req.user,
      req.query
    );
    return res.status(200).json({
      success:    true,
      message:    "Projects fetched",
      data:       projects,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await ProjectService.getProjectById(req.params.id, req.user);
    return res.status(200).json(success("Project fetched", project));
  } catch (err) {
    next(err);
  }
};

const createProject = async (req, res, next) => {
  try {
    const result = await ProjectService.createProject(
      req.body,
      req.user,
      req.ip
    );
    return res.status(201).json(success("Project submitted successfully", result));
  } catch (err) {
    next(err);
  }
};

const updateProjectStatus = async (req, res, next) => {
  try {
    const project = await ProjectService.updateProjectStatus(
      req.params.id,
      req.body,
      req.user,
      req.ip
    );
    return res.status(200).json(success("Project status updated", project));
  } catch (err) {
    next(err);
  }
};

const assignProject = async (req, res, next) => {
  try {
    const { supervisorId } = req.body;
    const project = await ProjectService.assignProject(
      req.params.id,
      supervisorId,
      req.user,
      req.ip
    );
    return res.status(200).json(success("Project assigned to supervisor", project));
  } catch (err) {
    next(err);
  }
};

const getMapData = async (req, res, next) => {
  try {
    const geoJson = await ProjectService.getMapData();
    return res.status(200).json(success("Map data fetched", geoJson));
  } catch (err) {
    next(err);
  }
};
const updateProject = async (req, res, next) => {
  try {
    const project = await ProjectService.updateProject(
      req.params.id,
      req.body,
      req.user,
      req.ip
    );
    return res.status(200).json(success("Project updated", project));
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    await ProjectService.deleteProject(req.params.id, req.user, req.ip);
    return res.status(200).json(success("Project deleted", null));
  } catch (err) {
    next(err);
  }
};

const updateProjectProgress = async (req, res, next) => {
  try {
    const project = await ProjectService.updateProjectProgress(
      req.params.id,
      req.body,
      req.user,
      req.ip
    );
    return res.status(200).json(success("Project progress updated", project));
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
  assignProject,
  getMapData,
};
