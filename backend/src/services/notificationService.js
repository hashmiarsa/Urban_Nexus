const Notification = require("../models/Notification")

async function createNotification({ recipient, type, title, message, link, data }) {
  return await Notification.create({ recipient, type, title, message, link, data })
}

async function notifyClashDetected(officer, project, clashWith) {
  return createNotification({
    recipient: officer,
    type: "clash_detected",
    title: "Clash Detected",
    message: `Your project "${project.title}" has a clash with "${clashWith.title}". Admin will review.`,
    link: `/officer/conflicts`,
    data: { projectId: project._id }
  })
}

async function notifyProjectApproved(officer, project) {
  return createNotification({
    recipient: officer,
    type: "project_approved",
    title: "Project Approved",
    message: `Your project "${project.title}" has been approved and is now active.`,
    link: `/officer/projects/${project._id}`,
    data: { projectId: project._id }
  })
}

async function notifyProjectRejected(officer, project, suggestedDate) {
  return createNotification({
    recipient: officer,
    type: "project_rejected",
    title: "Project Rescheduled",
    message: `Your project "${project.title}" has been rescheduled. Suggested start: ${new Date(suggestedDate).toLocaleDateString()}.`,
    link: `/officer/projects/${project._id}`,
    data: { projectId: project._id, suggestedDate }
  })
}

async function notifyEarlyCompletion(nextProjectOfficer, completedProject, availableDate) {
  return createNotification({
    recipient: nextProjectOfficer,
    type: "early_completion",
    title: "Project Slot Available Earlier",
    message: `"${completedProject.title}" completed early. You can now start from ${new Date(availableDate).toLocaleDateString()}.`,
    data: { availableDate }
  })
}

module.exports = {
  createNotification,
  notifyClashDetected,
  notifyProjectApproved,
  notifyProjectRejected,
  notifyEarlyCompletion,
}
