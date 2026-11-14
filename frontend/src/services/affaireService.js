import api from './api'

const affaireService = {
  getAll: (params) => api.get('/affaires', { params }).then(r => r.data.data),
  getById: (id) => api.get(`/affaires/${id}`).then(r => r.data.data),
  create: (data) => api.post('/affaires', data).then(r => r.data.data),
  update: (id, data) => api.put(`/affaires/${id}`, data).then(r => r.data.data),
  delete: (id) => api.delete(`/affaires/${id}`).then(r => r.data),
  toggleActif: (id) => api.patch(`/affaires/${id}/toggle-actif`).then(r => r.data.data), // ← nouveau
}

export default affaireService