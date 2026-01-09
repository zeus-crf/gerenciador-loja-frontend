<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import {
  LayoutDashboard,
  Briefcase,
  ReceiptText,
  Users,
  LogOut
} from 'lucide-vue-next'

const router = useRouter()

// =======================
// USUÁRIO LOGADO
// =======================
const nomeUsuario = ref('')

onMounted(() => {
  const usuarioSalvo = localStorage.getItem('usuario')

  if (usuarioSalvo) {
    try {
      const usuario = JSON.parse(usuarioSalvo)
      nomeUsuario.value = usuario.nome || 'Usuário'
    } catch {
      nomeUsuario.value = 'Usuário'
    }
  }
})

// =======================
// LOGOUT
// =======================
async function logout() {
  try {
    const token = localStorage.getItem('token')

    if (token) {
      await axios.post(
        'http://localhost:8080/auth/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
    }
  } catch (error) {
    console.warn('Erro ao deslogar no backend:', error)
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    router.push('/login')
  }
}
</script>


<template>
  <aside
  class="fixed top-0 left-0 z-40
         w-64 h-screen
         flex flex-col
         bg-white p-4
         border-r border-gray-200"
>
    <!-- TOPO (Logo + Menu) -->
    <div class="flex flex-col gap-4 flex-grow">
      <!-- Logo -->
      <div class="flex items-center gap-3 mb-6">
        <div
          class="bg-center bg-no-repeat bg-cover rounded-full size-10"
          style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCS4xbM9tMjv85kpbc49571lX31E5nHjmKOfXVjyoq970GdoVCDcInL2OPXecImsTwwGpoLsLHi_5N5WRjg79yENcHmVXizlM7bnI8_qqPm-IED56He0-h5kuocO0CEsR-kmD0LPpUL6FLMD_pLYb8fPPa-Q3vW3eemwT8soP6nFgWDgsPaR5o0MC7Grf5LzH_POAKyzKbtLl8RtaUgAaX2JS9lWFw3bJ64bbmI9cCBxZQSFJZMUQyFvnM7pYqaL6h-GBpi2ysIw0U')"
        />
        <div>
          <h1 class="text-gray-900 text-base font-medium">
            Loja de Roupas
          </h1>
          <p class="text-sm text-gray-500">{{ nomeUsuario }}</p>
        </div>
      </div>

      <!-- Menu -->
      <nav class="flex flex-col gap-2 flex-grow">
        <!-- <RouterLink
          to="/dashboard"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-primary/10"
        >
          <LayoutDashboard class="w-5 h-5" />
          <span class="text-sm font-medium">Dashboard</span>
        </RouterLink> -->

        <RouterLink
        :to="{ name: 'dashboard' }"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-primary/10"
        active-class="bg-primary/10 text-primary"
      >
        <LayoutDashboard  class="w-5 h-5" />
        <span class="text-sm font-medium">Dashboard</span>
      </RouterLink>

        <RouterLink
        :to="{ name: 'clientes' }"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-primary/10"
        active-class="bg-primary/10 text-primary"
      >
        <Briefcase  class="w-5 h-5" />
        <span class="text-sm font-medium">Clientes</span>
      </RouterLink>

      <RouterLink
        :to="{ name: 'pedidos' }"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-primary/10"
        active-class="bg-primary/10 text-primary"
      >
        <ReceiptText class="w-5 h-5" />
        <span class="text-sm font-medium">Pedidos</span>
      </RouterLink>

      <RouterLink
        :to="{ name: 'usuarios' }"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-primary/10"
        active-class="bg-primary/10 text-primary"
      >
        <Users class="w-5 h-5" />
        <span class="text-sm font-medium">Usuários</span>
      </RouterLink>



        <!-- <RouterLink
          to="/produtos"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-primary/10"
        >
          <Package class="w-5 h-5" />
          <span class="text-sm font-medium">Produtos</span>
        </RouterLink> -->
      </nav>
    </div>

    <!-- BOTÃO FIXO NO FUNDO -->
    <button
  @click="logout"
  class="flex items-center justify-center gap-2
         h-10 rounded-lg
         bg-red-500 hover:bg-red-600
         text-white
         text-sm font-bold
         mt-4
         transition-colors"
>
  <LogOut class="w-4 h-4" />
  Sair da conta
</button>

  </aside>
</template>
