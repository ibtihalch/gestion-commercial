import api from './api'
const utilisateurService = {
  getAll: (params) =>
    api.get('/utilisateurs', { params }).then(r => ({
      data:          r.data.data,
      totalElements: r.data.totalElements,
      totalPages:    r.data.totalPages,
      currentPage:   r.data.currentPage,
    })),

  getById: (id) =>
    api.get(`/utilisateurs/${id}`).then(r => r.data.data),

  getMe: () =>
    api.get('/utilisateurs/me').then(r => r.data),

  create: (data) =>
    api.post('/utilisateurs', data).then(r => r.data.data),

  update: (id, data) =>
    api.put(`/utilisateurs/${id}`, data).then(r => r.data.data),

  delete: (id) =>
    api.delete(`/utilisateurs/${id}`).then(() => true),

  // ← NOUVEAU
  toggleActif: (id) =>
    api.patch(`/utilisateurs/${id}/toggle-actif`).then(r => r.data.data),

  uploadAvatar: (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/utilisateurs/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data.url)
  },
}

export default utilisateurService