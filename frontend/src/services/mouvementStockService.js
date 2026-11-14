import api from './api'

const mouvementStockService = {
  getAll: (params) => api.get('/mouvements-stock', { params }).then(r => r.data.data),
  create: (data) => api.post('/mouvements-stock', data).then(r => r.data.data),
}

export default mouvementStockService
