import api from '@/services/api'

interface LoginPayload {
  username: string
  password: string
}

export async function login(payload) {
  const response = await api.post('/auth/login', payload)
  return response.data
}