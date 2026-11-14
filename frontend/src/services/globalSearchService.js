import api from './api'

const globalSearchService = {
  search: (query, limit = 5) => api.get('/search', { params: { q: query, limit } }).then(r => r.data.data),
}

export default globalSearchService
