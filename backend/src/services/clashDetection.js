// Clash Detection — 4 step process
const config = require("../config/staticConfig")
const Project = require("../models/Project")

function getGeoBuffer(projectType, area) {
  const base = config.geoBuffer[projectType] || 15
  const sizeBuffers = config.sizeBuffer
  const sizeEntry = sizeBuffers.find(s => area <= s.maxArea)
  const extra = sizeEntry ? sizeEntry.extra : 40
  return base + extra
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000 // meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function hasTimeOverlap(start1, end1, start2, end2) {
  return new Date(start1) <= new Date(end2) && new Date(start2) <= new Date(end1)
}

function getWorkTypeConflict(type1, type2) {
  return config.conflictMatrix[type1]?.[type2] || "compatible"
}

async function detectClashes(newProject) {
  const clashes = []

  // Step 1 — Get all active/approved/pending projects in same ward
  const candidates = await Project.find({
    "location.ward": newProject.location.ward,
    status: { $in: ["pending","approved","active"] },
    _id: { $ne: newProject._id }
  })

  for (const candidate of candidates) {
    // Step 2 — Geographic check
    const dist = haversineDistance(
      newProject.location.centerCoords.lat,
      newProject.location.centerCoords.lng,
      candidate.location.centerCoords.lat,
      candidate.location.centerCoords.lng
    )
    const buffer1 = getGeoBuffer(newProject.projectType, newProject.location.area || 0)
    const buffer2 = getGeoBuffer(candidate.projectType, candidate.location.area || 0)
    if (dist > buffer1 + buffer2) continue

    // Step 3 — Time overlap check
    if (!hasTimeOverlap(newProject.startDate, newProject.endDate, candidate.startDate, candidate.endDate)) continue

    // Step 4 — Work type conflict
    const conflict = getWorkTypeConflict(newProject.projectType, candidate.projectType)
    if (conflict === "compatible") continue

    clashes.push({
      projectId:  candidate._id,
      severity:   conflict,
      clashTypes: ["geographic","timeline","worktype"],
      distance:   Math.round(dist),
    })
  }

  return clashes
}

function getSuggestedStartDate(higherPriorityProject) {
  const endDate = new Date(higherPriorityProject.endDate)
  const bufferDays = config.bufferDays[higherPriorityProject.projectType] || 7
  const suggested = new Date(endDate)
  suggested.setDate(suggested.getDate() + bufferDays)
  return suggested
}

module.exports = { detectClashes, getSuggestedStartDate }
