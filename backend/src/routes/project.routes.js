"use strict";
const express = require("express");
const router  = express.Router();
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
  updateProjectProgress,
  getMapData,
} = require("../controllers/project.controller");
const auth             = require("../middleware/auth.middleware");
const { permit }       = require("../middleware/rbac.middleware");
const { validateBody,
        validateParams } = require("../middleware/validate.middleware");
const { createProjectSchema,
        updateProjectSchema,
        projectIdSchema }  = require("../validators/project.validator");

router.get("/", auth, permit("admin", "officer", "supervisor"), getAllProjects);

router.get("/map", auth, permit("admin", "officer", "supervisor"), getMapData);

router.get("/:id", auth, permit("admin", "officer", "supervisor"), validateParams(projectIdSchema), getProjectById);

router.post("/", auth, permit("admin", "officer"), createProject);

router.patch("/:id", auth, permit("admin", "officer"), validateParams(projectIdSchema), validateBody(updateProjectSchema), updateProject);

router.delete("/:id", auth, permit("admin"), validateParams(projectIdSchema), deleteProject);

router.patch("/:id/status", auth, permit("admin"), validateParams(projectIdSchema), updateProjectStatus);

router.patch("/:id/progress", auth, permit("admin", "supervisor"), validateParams(projectIdSchema), async (req, res, next) => {
  try {
    const Project = require("../models/Project");
    const { progress } = req.body;
    if (progress === undefined) return res.status(400).json({ success: false, message: "progress is required" });
    const project = await Project.findByIdAndUpdate(req.params.id, { progress }, { new: true }).lean();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    return res.json({ success: true, message: "Progress updated", data: project });
  } catch (err) { next(err); }
});

router.patch("/:id/assign", auth, permit("admin", "officer"), validateParams(projectIdSchema), async (req, res, next) => {
  try {
    const Project = require("../models/Project");
    const { supervisorId } = req.body;
    if (!supervisorId) return res.status(400).json({ success: false, message: "supervisorId is required" });
    const project = await Project.findByIdAndUpdate(req.params.id, { assignedTo: supervisorId }, { new: true }).populate("department", "name code").populate("assignedTo", "name email").lean();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    return res.json({ success: true, message: "Project assigned to supervisor", data: project });
  } catch (err) { next(err); }
});

module.exports = router;



