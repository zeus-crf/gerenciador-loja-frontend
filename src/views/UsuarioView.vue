<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { useToast } from 'vue-toastification'

// Components
import Sidebar from '@/components/layout/Sidebar.vue'
import HeaderPage from '@/components/layout/HeaderPage.vue'
import SearchInput from '@/components/layout/SearchInput.vue'
import TableUsuarios from '@/components/TableUsuarios.vue'

import ModalNewUsuario from '@/components/modais/ModalNewUsuario.vue'
import ModalEditUsuario from '@/components/modais/ModalEditUsuario.vue'
import ModalDeleteUsuario from '@/components/modais/ModalDeleteUsuario.vue'
import ModalViewUsuario from '@/components/modais/ModalViewUsuario.vue'
import { Plus } from 'lucide-vue-next'

/* ======================
   TIPOS
====================== */
interface Usuario {
  id: string
  username: string
}

/* ======================
   STATE
====================== */
const usuarios = ref<Usuario[]>([])
const usuarioSelecionado = ref<Usuario | null>(null)

const loading = ref(false)
const searchQuery = ref('')

const showNew = ref(false)
const showEdit = ref(false)
const showDelete = ref(false)
const showView = ref(false)

/* ======================
   PAGINAÇÃO
====================== */
const currentPage = ref(1)
const pageSize = ref(10)

/* ======================
   AUTH
====================== */
const toast = useToast()

// ✅ ID DO USUÁRIO LOGADO (vem do token)
const usuarioLogadoId = ref<string>('')

function carregarUsuarioLogado() {
  const token = localStorage.getItem('token')
  if (!token) return

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    usuarioLogadoId.value = payload.id
  } catch {
    usuarioLogadoId.value = ''
  }
}

/* ======================
   LIFECYCLE
====================== */
onMounted(() => {
  carregarUsuarioLogado()
  carregarUsuarios()
})

/* ======================
   METHODS
====================== */
async function carregarUsuarios() {
  const token = localStorage.getItem('token')
  if (!token) {
    toast.error('Sessão expirada. Faça login novamente.')
    return
  }

  loading.value = true

  try {
    const response = await axios.get('http://localhost:8080/usuarios', {
      headers: { Authorization: `Bearer ${token}` },
    })
    usuarios.value = response.data
  } catch {
    toast.error('Erro ao carregar usuários')
  } finally {
    loading.value = false
  }
}

function abrirNovo() {
  showNew.value = true
}

function visualizar(u: Usuario) {
  usuarioSelecionado.value = u
  showView.value = true
}

function editar(u: Usuario) {
  usuarioSelecionado.value = u
  showEdit.value = true
}

function deletar(u: Usuario) {
  usuarioSelecionado.value = u
  showDelete.value = true
}

async function confirmarDelete(id: string) {
  try {
    const token = localStorage.getItem('token')

    if (!token) {
      toast.error('Sessão expirada. Faça login novamente.')
      return
    }

    await axios.delete(`http://localhost:8080/usuarios/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    toast.success('Usuário removido')
    carregarUsuarios()

  } catch (error: any) {
    const status = error.response?.status

    console.log('STATUS REAL:', status)

    if (status === 403) {
      toast.warning('Você não pode excluir o usuário que está logado')
    } else if (status === 401) {
      toast.error('Não autorizado. Faça login novamente.')
    } else {
      toast.error('Erro ao deletar usuário')
    }
  }
}



/* ======================
   COMPUTEDS
====================== */
const usuariosFiltrados = computed(() => {
  if (!searchQuery.value) return usuarios.value
  return usuarios.value.filter(u =>
    u.username.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const usuariosPaginados = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return usuariosFiltrados.value.slice(start, start + pageSize.value)
})

watch(searchQuery, () => {
  currentPage.value = 1
})
</script>

<template>
  <div class="flex min-h-screen bg-background-light">
    <Sidebar />

    <main class="flex-1 px-4 py-8 md:px-8">
      <div class="mx-auto max-w-7xl flex flex-col gap-6">

        <HeaderPage
          title="Usuários"
          subtitle="Gerencie os usuários do sistema"
        >
          <template #actions>
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-bold"
              @click="abrirNovo"
            >
              <Plus class="w-5 h-5" />
              Novo Usuário
            </button>
          </template>
        </HeaderPage>

        <SearchInput
          v-model="searchQuery"
          placeholder="Buscar por username..."
          page="usuarios"
        />

        <TableUsuarios
        :usuarios="usuariosPaginados"         
        :loading="loading"
        :currentPage="currentPage"
        :pageSize="pageSize"
        :totalUsuarios="usuariosFiltrados.length"
        @changePage="page => currentPage = page"
        @view="visualizar"
        @edit="editar"
        @delete="deletar"
      />




        <ModalNewUsuario
          v-model="showNew"
          @saved="() => { carregarUsuarios(); toast.success('Usuário criado') }"
        />

        <ModalViewUsuario
          v-model="showView"
          :usuario="usuarioSelecionado"
        />

        <ModalDeleteUsuario
        v-model="showDelete"
        :usuario="usuarioSelecionado"
        :usuario-logado-id="usuarioLogadoId"
        @confirm="confirmarDelete"
      />


        <ModalEditUsuario
            v-model="showEdit"
            :usuario="usuarioSelecionado"
            @saved="() => { carregarUsuarios(); toast.success('Usuário atualizado') }"
            />

      </div>
    </main>
  </div>
</template>
