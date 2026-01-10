<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useToast } from 'vue-toastification'
import { Plus } from 'lucide-vue-next'

// Layout
import Sidebar from '@/components/layout/Sidebar.vue'
import HeaderPage from '@/components/layout/HeaderPage.vue'
import SearchInput from '@/components/layout/SearchInput.vue'
import TableClientes from '@/components/TableClientes.vue'

// Modais
import ModalNewCliente from '@/components/modais/ModalNewCliente.vue'
import ModalEditCliente from '@/components/modais/ModalEditCliente.vue'
import ModalDeleteCliente from '@/components/modais/ModalDeleteCliente.vue'
import ModalViewCliente from '@/components/modais/ModalViewCliente.vue'
import ModalFiltersClientes from '@/components/modais/ModalFiltersClientes.vue'

// ======================
// Tipos
// ======================
interface Cliente {
  id: string
  nome: string
  email?: string
  telefone?: string
  endereco?: string
  notas?: string
  createdAt?: string
}

// ModalFiltersClientes.vue
export interface ClienteFilters {
  nome: string | null
  email: string | null
  telefone: string | null
  endereco: string | null
  dataInicial: string | null
  dataFinal: string | null
  ordenacao: 'RECENTE' | 'ANTIGO' | null
}

// ======================
// Estados
// ======================
const clientes = ref<Cliente[]>([])
const loading = ref(false)
const searchQuery = ref('')

// Modais
const showModalNew = ref(false)
const showModalEdit = ref(false)
const showModalDelete = ref(false)
const showModalView = ref(false)
const showFiltersClientes = ref(false)

const clienteSelecionado = ref<Cliente | null>(null)

// Paginação
const currentPage = ref(1)
const pageSize = ref(10)

const toast = useToast()

// ======================
// Lifecycle
// ======================
onMounted(() => {
  carregarClientes()
})

// ======================
// Backend
// ======================
const carregarClientes = async () => {
  loading.value = true
  try {
    const baseUrl = import.meta.env.VITE_API_URL
    const token = localStorage.getItem('token')
    const { data } = await axios.get(`${baseUrl}/clientes`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    clientes.value = data.map((c: any) => ({
      id: c.id,
      nome: c.nome,
      email: c.email,
      telefone: c.telefone,
      endereco: c.endereco,
      notas: c.notas,
      createdAt: c.createdAt
    }))
  } catch {
    toast.error('Erro ao carregar clientes')
  } finally {
    loading.value = false
  }
}

// ======================
// Filtros + Search
// ======================
const aplicarFiltrosClientes = async (filtros: ClienteFilters) => {
  try {
    const token = localStorage.getItem('token')

    // REMOVE campos desnecessários (search é redundante)
    const payload = {
      nome: filtros.nome || null,
      email: filtros.email || null,
      telefone: filtros.telefone || null,
      endereco: filtros.endereco || null,
      dataInicial: filtros.dataInicial || null,
      dataFinal: filtros.dataFinal || null,
      ordenacao: filtros.ordenacao || null
    }

    console.log('📤 Payload enviado:', payload)
    const baseUrl = import.meta.env.VITE_API_URL
    const { data } = await axios.post(
      `${baseUrl}/clientes/filtrar`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    clientes.value = data
    showFiltersClientes.value = false
    currentPage.value = 1
  } catch (e: any) {
    console.error(e)
    toast.error('Erro ao filtrar clientes')
  }
}

// ======================
// Ações
// ======================
const abrirNovoCliente = () => (showModalNew.value = true)

const visualizarCliente = (cliente: Cliente) => {
  clienteSelecionado.value = cliente
  showModalView.value = true
}

const editarCliente = (cliente: Cliente) => {
  clienteSelecionado.value = cliente
  showModalEdit.value = true
}

const deletarCliente = (cliente: Cliente) => {
  clienteSelecionado.value = cliente
  showModalDelete.value = true
}

const confirmarDelete = async (id: string) => {
  try {
    const token = localStorage.getItem('token')
    const baseUrl = import.meta.env.VITE_API_URL
    await axios.delete(`${baseUrl}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    toast.success('Cliente deletado com sucesso')
    carregarClientes()
  } catch {
    toast.error('Erro ao deletar cliente')
  }
}

// ======================
// Computeds
// ======================
const clientesFiltrados = computed(() => {
  if (!searchQuery.value) return clientes.value

  const q = searchQuery.value.toLowerCase()
  return clientes.value.filter(c =>
    c.nome.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q) ||
    c.telefone?.includes(q) ||
    c.endereco?.toLowerCase().includes(q) ||
    c.notas?.toLowerCase().includes(q)
  )
})

const clientesPaginados = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return clientesFiltrados.value.slice(start, start + pageSize.value)
})

// ======================
// Filtros
// ======================
const abrirFiltroClientes = () => (showFiltersClientes.value = true)
</script>

<template>
  <div class="flex min-h-screen">
    <Sidebar />

    <main class="flex-1 ml-64 px-4 py-8 md:px-8">
      <div class="mx-auto max-w-7xl flex flex-col gap-6">

        <!-- HEADER -->
        <HeaderPage
          title="Lista de Clientes"
          subtitle="Gerencie as informações de contato da sua base de clientes."
        >
          <template #actions>
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 hover:scale-105"
              @click="abrirNovoCliente"
            >
              <Plus class="w-5 h-5" />
              Adicionar Cliente
            </button>
          </template>
        </HeaderPage>

        <!-- BUSCA E FILTRO -->
        <SearchInput
          v-model="searchQuery"
          placeholder="Buscar por nome, e-mail, telefone ou notas..."
          filterType="cliente"
          @openFilter="abrirFiltroClientes"
        />

        <!-- TABELA -->
        <TableClientes
          :clientes="clientesPaginados"
          :loading="loading"
          :currentPage="currentPage"
          :pageSize="pageSize"
          @changePage="page => currentPage = page"
          @edit="editarCliente"
          @delete="deletarCliente"
          @view="visualizarCliente"
        />

        <!-- MODAIS -->
        <ModalNewCliente
          v-model="showModalNew"
          @saved="() => { carregarClientes(); toast.success('Cliente criado com sucesso') }"
        />

        <ModalEditCliente
          v-model="showModalEdit"
          :cliente="clienteSelecionado"
          @saved="() => { carregarClientes(); toast.success('Cliente atualizado com sucesso') }"
        />

        <ModalDeleteCliente
          v-model="showModalDelete"
          :cliente="clienteSelecionado"
          @confirm="confirmarDelete"
        />

        <ModalViewCliente
          v-model="showModalView"
          :cliente="clienteSelecionado"
        />

        <ModalFiltersClientes
          v-model="showFiltersClientes"
          @applyFilters="aplicarFiltrosClientes"
          @clearFilters="carregarClientes"
        />
      </div>
    </main>
  </div>
</template>
