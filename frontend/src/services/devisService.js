import api from './api'

const devisService = {
  getAll: (params) => api.get('/devis', { params }).then(r => r.data.data),
  getById: (id) => api.get(`/devis/${id}`).then(r => r.data.data),
  create: (data) => api.post('/devis', data).then(r => r.data.data),
  update: (id, data) => api.put(`/devis/${id}`, data).then(r => r.data.data),
  updateStatut: (id, statut) => api.patch(`/devis/${id}/statut`, null, { params: { statut } }).then(r => r.data.data),
  delete: (id) => api.delete(`/devis/${id}`).then(r => r.data),

  // ← nouveau : récupère le PDF avec le token JWT
  getPdf: (id) => api.get(`/devis/${id}/pdf`, { responseType: 'blob' }).then(r => r.data),
}

export default devisService