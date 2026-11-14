import api from './api'

const notificationService = {
  getAll: (limit = 30) => api.get('/notifications', { params: { limit } }).then(r => r.data.data),
  getUnreadCount: () => api.get('/notifications/unread-count').then(r => r.data.data.count),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`).then(r => r.data.data),
  markAllAsRead: () => api.patch('/notifications/read-all').then(r => r.data.data),
}

export default notificationService
