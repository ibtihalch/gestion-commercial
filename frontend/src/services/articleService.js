import api from './api'

const articleService = {
  // Articles
  getAll: (params) => api.get('/articles', { params }).then(r => r.data.data),
  getById: (id) => api.get(`/articles/${id}`).then(r => r.data.data),
  getAlertes: () => api.get('/articles/alertes').then(r => r.data.data),
  create: (data) => api.post('/articles', data).then(r => r.data.data),
  update: (id, data) => api.put(`/articles/${id}`, data).then(r => r.data.data),
  delete: (id) => api.delete(`/articles/${id}`).then(r => r.data),
  toggleActif: (id) => api.patch(`/articles/${id}/toggle-actif`).then(r => r.data.data), // ← nouveau

  // Familles
  getAllFamilles: (params) => api.get('/familles', { params }).then(r => r.data.data),
  createFamille: (data) => api.post('/familles', data).then(r => r.data.data),
  updateFamille: (id, data) => api.put(`/familles/${id}`, data).then(r => r.data.data),
  deleteFamille: (id) => api.delete(`/familles/${id}`).then(r => r.data),

  // Sous-familles
  getAllSousFamilles: (params) => api.get('/sous-familles', { params }).then(r => r.data.data),
  getSousFamillesByFamille: (familleId) =>
    api.get(`/familles/${familleId}/sous-familles`).then(r => r.data.data),
  createSousFamille: (data) => api.post('/sous-familles', data).then(r => r.data.data),
  updateSousFamille: (id, data) => api.put(`/sous-familles/${id}`, data).then(r => r.data.data),
  deleteSousFamille: (id) => api.delete(`/sous-familles/${id}`).then(r => r.data),
}

export default articleService