import api from './axios.config'

const reportApi = {
  submit: (formData) =>
    api.post('/citizen-reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  track: (trackingId) =>
    api.get(`/citizen-reports/track/${trackingId}`),

  getAll: (params) =>
    api.get('/citizen-reports', { params }),

  updateStatus: (id, data) =>
    api.patch(`/citizen-reports/${id}/status`, data),
}

export default reportApi