// Clash Detection — geographic + timeline
export function hasTimelineClash(project1, project2) {
  const start1 = new Date(project1.startDate)
  const end1   = new Date(project1.endDate)
  const start2 = new Date(project2.startDate)
  const end2   = new Date(project2.endDate)
  return start1 <= end2 && start2 <= end1
}
export function hasGeographicClash(project1, project2, bufferKm = 0.5) {
  if (!project1.coordinates || !project2.coordinates) return false
  const R = 6371
  const dLat = (project2.coordinates.lat - project1.coordinates.lat) * Math.PI / 180
  const dLon = (project2.coordinates.lng - project1.coordinates.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(project1.coordinates.lat * Math.PI / 180) *
    Math.cos(project2.coordinates.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return distance <= bufferKm
}
