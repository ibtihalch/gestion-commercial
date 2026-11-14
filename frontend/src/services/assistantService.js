import api from './api' // adapte le nom du fichier selon où est ce code exactement

const assistantService = {
  chat: async (message) => {
    const response = await api.post('/assistant/chat', { message })
    return response.data.data // { reply, intent }
  },
  clearHistory: async () => {
    const response = await api.delete('/assistant/history')
    return response.data.data
  },
}

export default assistantService
