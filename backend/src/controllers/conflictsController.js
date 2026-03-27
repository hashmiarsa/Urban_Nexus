const Conflict = require("../models/Conflict")
const Project = require("../models/Project")
const AuditLog = require("../models/AuditLog")
const { getSuggestedStartDate } = require("../services/clashDetection")
const { detectClashes } = require("../services/clashDetection")

exports.getConflicts = async (req, res) => {
  try {
    const conflicts = await Conflict.find()
      .populate("project1 project2","title department projectType status mcdmScore officer")
      .sort("-createdAt")
    res.json(conflicts)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.resolveConflict = async (req, res) => {
  try {
    const conflict = await Conflict.findById(req.params.id)
    const { action, coordinationNote, overrideCategory, overrideReason, overrideRef } = req.body

    conflict.adminResolution = { action, coordinationNote, overrideCategory, overrideReason, overrideRef, resolvedBy: req.user._id, resolvedAt: new Date() }

    if (action === "approve_both") {
      conflict.status = "resolved_both"
      await Project.findByIdAndUpdate(conflict.project1, { status: "approved" })
      await Project.findByIdAndUpdate(conflict.project2, { status: "approved" })
    } else if (action === "reject_lower") {
      const p1 = await Project.findById(conflict.project1)
      const p2 = await Project.findById(conflict.project2)
      const lower = p1.mcdmScore < p2.mcdmScore ? p1 : p2
      const higher = p1.mcdmScore >= p2.mcdmScore ? p1 : p2
      const suggested = getSuggestedStartDate(higher)
      lower.status = "rescheduled"
      lower.suggestedDate = suggested
      await lower.save()
      conflict.suggestedDate = suggested
      conflict.status = "awaiting_officer"
    }

    await conflict.save()
    const isOverride = !!overrideCategory
    await AuditLog.create({ action: "conflict_resolved", performedBy: req.user._id, targetType: "Conflict", targetId: conflict._id, details: req.body, isOverride })
    res.json(conflict)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.officerRespond = async (req, res) => {
  try {
    const conflict = await Conflict.findById(req.params.id)
    const { action, customDate } = req.body
    const project = await Project.findById(conflict.project1)

    if (action === "custom" && new Date(customDate) < new Date(conflict.suggestedDate))
      return res.status(400).json({ message: "Custom date must be equal to or later than suggested date" })

    const newDate = action === "accept" ? conflict.suggestedDate : customDate
    project.startDate = newDate
    project.status = "pending"

    // Recheck clashes with new date
    const newClashes = await detectClashes(project)
    conflict.recheckPassed = newClashes.length === 0
    conflict.officerResponse = { action, customDate, respondedBy: req.user._id, respondedAt: new Date() }

    await project.save()
    await conflict.save()
    res.json({ conflict, recheckPassed: conflict.recheckPassed, newClashes })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
