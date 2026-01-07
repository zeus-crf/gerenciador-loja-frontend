import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080'
})

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const listarPedidos = async () => {
  try {
    const response = await api.get('/pedidos')
    
    // 🎯 CORREÇÃO: Acessar a lista aninhada 'pedidoList'
    const pedidoList = response.data._embedded?.pedidoList || [] 
    
    return pedidoList
  } catch (error) {
    // É recomendado usar console.error para logs antes de relançar, mas o throw está ok.
    throw error
  }
}
