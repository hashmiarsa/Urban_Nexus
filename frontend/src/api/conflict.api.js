import api from './axios.config'

const conflictApi = {
  getAll: (params) =>
    api.get('/conflicts', { params }),

  getById: (id) =>
    api.get(`/conflicts/${id}`),

  resolve: (id, data) =>
    api.patch(`/conflicts/${id}/resolve`, data),
}

export default conflictApi