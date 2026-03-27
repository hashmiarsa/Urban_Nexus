import api from "./api"
export const getConflicts = () => api.get("/conflicts")
export const getConflict = (id) => api.get(`/conflicts/${id}`)
export const resolveConflict = (id, data) => api.put(`/conflicts/${id}/resolve`, data)
