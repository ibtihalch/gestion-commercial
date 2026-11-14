import api from './api'

// ── Helper ──────────────────────────────────────────────────────────────────
const unwrap = (r) => r.data.data

// ── Service ─────────────────────────────────────────────────────────────────
const bonLivraisonService = {

  getAll        : (params)       => api.get('/bons-livraison', { params }).then(unwrap),
  getById       : (id)           => api.get(`/bons-livraison/${id}`).then(unwrap),
  create        : (data)         => api.post('/bons-livraison', data).then(unwrap),
  update        : (id, data)     => api.put(`/bons-livraison/${id}`, data).then(unwrap),
  updateStatut  : (id, statut)   => api.patch(`/bons-livraison/${id}/statut`, null, { params: { statut } }).then(unwrap),
  delete        : (id)           => api.delete(`/bons-livraison/${id}`).then(r => r.data),

  // ✅ Récupère le blob PDF
  getPdf: (id) => api.get(`/bons-livraison/${id}/pdf`, {
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
  }).then(r => r.data),

  // ✅ Ouvre le PDF dans un nouvel onglet
  openPdf: async (id) => {
    const blob = await bonLivraisonService.getPdf(id)
    const url  = URL.createObjectURL(blob)
    window.open(url, '_blank')
  },
}

export default bonLivraisonService