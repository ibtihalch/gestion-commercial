import api from './api'

const clientService = {
  getAll: (params) => api.get('/clients', { params }).then(r => r.data.data),
  getById: (id) => api.get(`/clients/${id}`).then(r => r.data.data),
  create: (data) => api.post('/clients', data).then(r => r.data.data),
  update: (id, data) => api.put(`/clients/${id}`, data).then(r => r.data.data),
  delete: (id) => api.delete(`/clients/${id}`).then(r => r.data),
  toggleActif: (id) => api.patch(`/clients/${id}/toggle-actif`).then(r => r.data.data), // ← nouveau
}

export default clientService