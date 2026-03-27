import api from "./api"
export const getComplaints = () => api.get("/complaints")
export const getComplaint = (id) => api.get(`/complaints/${id}`)
export const createComplaint = (data) => api.post("/complaints", data)
