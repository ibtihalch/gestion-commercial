import api from './api'

const factureFournisseurService = {
  getAll:        (params)       => api.get('/factures-fournisseur', { params }).then(r => r.data.data),
  getById:       (id)           => api.get(`/factures-fournisseur/${id}`).then(r => r.data.data),
  create:        (data)         => api.post('/factures-fournisseur', data).then(r => r.data.data),
  update:        (id, data)     => api.put(`/factures-fournisseur/${id}`, data).then(r => r.data.data),
  updateStatut:  (id, statut)   => api.patch(`/factures-fournisseur/${id}/statut`, null, { params: { statut } }).then(r => r.data.data),
  delete:        (id)           => api.delete(`/factures-fournisseur/${id}`).then(r => r.data),

  downloadPdf: async (id, numero) => {
    const response = await api.get(`/factures-fournisseur/${id}/pdf`, {
      responseType: 'blob',
    })
    const url      = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link     = document.createElement('a')
    link.href      = url
    link.download  = `facture-fournisseur-${numero || id}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}

export default factureFournisseurService