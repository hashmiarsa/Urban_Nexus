const Project = require("../models/Project")
const Conflict = require("../models/Conflict")
const AuditLog = require("../models/AuditLog")
const { calculateMCDM } = require("../services/mcdmEngine")
const { detectClashes } = require("../services/clashDetection")
const { notifyClashDetected, notifyProjectApproved, notifyProjectRejected } = require("../services/notificationService")

exports.getProjects = async (req, res) => {
  try {
    const filter = {}
    if (req.user.role === "officer")    filter.officer = req.user._id
    if (req.user.role === "supervisor") filter.supervisor = req.user._id
    const projects = await Project.find(filter).populate("officer supervisor","name email department").sort("-createdAt")
    res.json(projects)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("officer supervisor clashes")
    if (!project) return res.status(404).json({ message: "Project not found" })
    res.json(project)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.createProject = async (req, res) => {
  try {
    const projectData = { ...req.body, officer: req.user._id, department: req.user.department }

    // Calculate MCDM score
    const mcdm = await calculateMCDM(projectData)
    projectData.mcdmScore = mcdm.score
    projectData.mcdmBreakdown = mcdm.breakdown

    const project = await Project.create(projectData)

    // Detect clashes
    const clashes = await detectClashes(project)
    if (clashes.length > 0) {
      project.hasClash = true
      for (const clash of clashes) {
        const conflict = await Conflict.create({
          project1: project._id,
          project2: clash.projectId,
          clashTypes: clash.clashTypes,
          severity: clash.severity,
        })
        project.clashes.push(conflict._id)
        const otherProject = await Project.findById(clash.projectId)
        await notifyClashDetected(req.user._id, project, otherProject)
      }
      await project.save()
    }

    await AuditLog.create({ action: "project_created", performedBy: req.user._id, targetType: "Project", targetId: project._id })
    res.status(201).json({ project, mcdm, clashesDetected: clashes.length })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
    await AuditLog.create({ action: "project_updated", performedBy: req.user._id, targetType: "Project", targetId: project._id })
    res.json(project)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.approveProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("officer")
    project.status = "approved"
    project.adminNote = req.body.note
    await project.save()
    await notifyProjectApproved(project.officer._id, project)
    await AuditLog.create({ action: "project_approved", performedBy: req.user._id, targetType: "Project", targetId: project._id })
    res.json(project)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.rejectProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("officer")
    project.status = "rejected"
    project.rejectionReason = req.body.reason
    project.suggestedDate = req.body.suggestedDate
    await project.save()
    await notifyProjectRejected(project.officer._id, project, req.body.suggestedDate)
    await AuditLog.create({ action: "project_rejected", performedBy: req.user._id, targetType: "Project", targetId: project._id, details: { reason: req.body.reason } })
    res.json(project)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.updateProgress = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    project.progress = req.body.progress
    if (req.body.progress === 100) {
      project.status = "completed"
      project.actualEndDate = new Date()
    }
    await project.save()
    await AuditLog.create({ action: "progress_updated", performedBy: req.user._id, targetType: "Project", targetId: project._id, details: { progress: req.body.progress } })
    res.json(project)
  } catch (err) { res.status(500).json({ message: err.message }) }
}
