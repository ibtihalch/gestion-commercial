import api from './api'

const entrepriseService = {
  getAll:  (params)    => api.get('/entreprises', { params }).then(r => r.data.data),
  getById: (id)        => api.get(`/entreprises/${id}`).then(r => r.data.data),
  create:  (data)      => api.post('/entreprises', data).then(r => r.data.data),
  update:  (id, data)  => api.put(`/entreprises/${id}`, data).then(r => r.data.data),
  delete:  (id)        => api.delete(`/entreprises/${id}`).then(r => r.data),

  // ── Upload logo (multipart/form-data avec JWT automatique) ──────────────────
  uploadLogo: (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/entreprises/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data.data)
  },
}

export default entrepriseService