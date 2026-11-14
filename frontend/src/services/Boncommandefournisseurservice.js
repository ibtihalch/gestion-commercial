import api from './api'

const bonCommandeFournisseurService = {
  getAll:       (params)       => api.get('/bons-commande-fournisseur', { params }).then(r => r.data.data),
  getById:      (id)           => api.get(`/bons-commande-fournisseur/${id}`).then(r => r.data.data),
  create:       (data)         => api.post('/bons-commande-fournisseur', data).then(r => r.data.data),
  update:       (id, data)     => api.put(`/bons-commande-fournisseur/${id}`, data).then(r => r.data.data),
  updateStatut: (id, statut)   => api.patch(`/bons-commande-fournisseur/${id}/statut`, null, { params: { statut } }).then(r => r.data.data),
  delete:       (id)           => api.delete(`/bons-commande-fournisseur/${id}`).then(r => r.data),

  downloadPdf: (id, numero) =>
    api.get(`/bons-commande-fournisseur/${id}/pdf`, { responseType: 'blob' }).then(r => {
      const url  = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `BCF-${numero}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    }),
}

export default bonCommandeFournisseurService