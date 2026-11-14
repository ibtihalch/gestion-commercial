import api from './api'

// ── Helper ──────────────────────────────────────────────────────────────────
const unwrap = (r) => r.data.data

// ── Service ─────────────────────────────────────────────────────────────────
const bonReceptionFournisseurService = {

  getAll       : (params)      => api.get('/bons-reception-fournisseur', { params }).then(unwrap),
  getById      : (id)          => api.get(`/bons-reception-fournisseur/${id}`).then(unwrap),
  create       : (data)        => api.post('/bons-reception-fournisseur', data).then(unwrap),
  update       : (id, data)    => api.put(`/bons-reception-fournisseur/${id}`, data).then(unwrap),
  updateStatut : (id, statut)  => api.patch(`/bons-reception-fournisseur/${id}/statut`, null, { params: { statut } }).then(unwrap),
  delete       : (id)          => api.delete(`/bons-reception-fournisseur/${id}`).then(r => r.data),

  // ✅ Récupère le blob PDF
  getPdf: (id) => api.get(`/bons-reception-fournisseur/${id}/pdf`, {
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
  }).then(r => r.data),

  // ✅ Ouvre le PDF dans un nouvel onglet
  openPdf: async (id) => {
    const blob = await bonReceptionFournisseurService.getPdf(id)
    const url  = URL.createObjectURL(blob)
    window.open(url, '_blank')
  },
}

export default bonReceptionFournisseurService