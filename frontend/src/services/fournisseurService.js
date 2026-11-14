import api from './api'

const fournisseurService = {
  getAll: (params) => api.get('/fournisseurs', { params }).then(r => r.data.data),
  getById: (id) => api.get(`/fournisseurs/${id}`).then(r => r.data.data),
  create: (data) => api.post('/fournisseurs', data).then(r => r.data.data),
  update: (id, data) => api.put(`/fournisseurs/${id}`, data).then(r => r.data.data),
  delete: (id) => api.delete(`/fournisseurs/${id}`).then(r => r.data),
  toggleActif: (id) => api.patch(`/fournisseurs/${id}/toggle-actif`).then(r => r.data.data), // ← nouveau
}

export default fournisseurService