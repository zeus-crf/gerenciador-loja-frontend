import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import PedidosView from '@/views/PedidosView.vue'
import ClienteView from '@/views/ClienteView.vue'
import UsuarioView from '@/views/UsuarioView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/pedidos',
    name: 'pedidos',
    component: PedidosView
  },
  {
    path: '/clientes',
    name: 'clientes',
    component: ClienteView
  },
  {
    path: '/usuarios',
    name: 'usuarios',
    component: UsuarioView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
