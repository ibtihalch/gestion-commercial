import api from './api'

const dashboardService = {

  // Stats globales (inchangé)
  getStats: (entrepriseId) =>
    api.get('/dashboard/stats', { params: { entrepriseId } })
       .then(r => r.data.data),

  // CA mensuel réel — annee optionnel (défaut = année courante côté backend)
  getCaMensuel: (entrepriseId, annee) =>
    api.get('/dashboard/ca-mensuel', { params: { entrepriseId, annee } })
       .then(r => r.data.data),
}

export default dashboardService