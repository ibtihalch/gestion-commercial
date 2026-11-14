import api from './api'

const authService = {
  login: async (login, motDePasse) => {
    const res = await api.post('/auth/login', { login, motDePasse })
    return res.data.data
  },
  register: async (data) => {
    const res = await api.post('/auth/register', data)
    return res.data
  },
}

export default authService
