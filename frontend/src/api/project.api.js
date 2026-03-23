import api from "./axios.config";

const projectApi = {
  getAll:          (params) => api.get("/projects", { params }),
  getById:         (id)     => api.get(`/projects/${id}`),
  create:          (data)   => api.post("/projects", data),
  updateStatus:    (id, data) => api.patch(`/projects/${id}/status`, data),
  assign:          (id, data) => api.patch(`/projects/${id}/assign`, data),
  updateProgress:  (id, data) => api.patch(`/projects/${id}/progress`, data),
  getMapData:      ()       => api.get("/projects/map"),
  getMapProjects:  ()       => api.get("/projects/map"),
  getDepartments:  ()       => api.get("/departments"),
};

export default projectApi;

