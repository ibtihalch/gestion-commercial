import api from './api'

const factureClientService = {
  getAll      : (params)       => api.get('/factures-client', { params }).then(r => r.data.data),
  getById     : (id)           => api.get(`/factures-client/${id}`).then(r => r.data.data),
  create      : (data)         => api.post('/factures-client', data).then(r => r.data.data),
  update      : (id, data)     => api.put(`/factures-client/${id}`, data).then(r => r.data.data),
  updateStatut: (id, statut)   => api.patch(`/factures-client/${id}/statut`, null, { params: { statut } }).then(r => r.data.data),
  delete      : (id)           => api.delete(`/factures-client/${id}`).then(r => r.data),

  getStats    : (entrepriseId) => api.get('/factures-client/stats', { params: { entrepriseId } }).then(r => r.data.data),

  getPdf: (id) => api.get(`/factures-client/${id}/pdf`, {
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
  }).then(r => r.data),

  openPdf: async (id) => {
    const blob = await factureClientService.getPdf(id)
    const url  = URL.createObjectURL(blob)
    window.open(url, '_blank')
  },
}

export default factureClientService