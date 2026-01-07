<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useToast } from 'vue-toastification'
import { Plus } from 'lucide-vue-next'

// Componentes
import Sidebar from '@/components/layout/Sidebar.vue'
import HeaderPage from '@/components/layout/HeaderPage.vue'
import SearchInput from '@/components/layout/SearchInput.vue'
import TablePedidos from '@/components/TablePedidos.vue'

import ModalFilters, { Filters } from '@/components/modais/ModalFilters.vue'
import ModalNewPedido from '@/components/modais/ModalNewPedido.vue'
import ModalEditPedido from '@/components/modais/ModalEditPedido.vue'
import ModalViewPedido from '@/components/modais/ModalViewPedido.vue'
import ModalDeletePedido from '@/components/modais/ModalDeletePedido.vue'
import ModalViewCliente from '@/components/modais/ModalViewCliente.vue'

// ======================
// Tipos
// ======================
interface ItemPedido {
  id?: string
  nomeProduto: string
  quantidade: number
  precoUnitario: number
  tamanho: string
  cor?: string
}

interface Cliente {
  id: string
  nome: string
  email?: string
  telefone?: string
  notas?: string
}

interface PedidoBackend {
  id: string
  cliente: Cliente
  itens: ItemPedido[]
  parcelasTotais: number
  parcelasRestantes: number
  parcelasPagas: number
  statusDePagamento: 'PAGO' | 'PENDENTE'
  dataCriacao?: string
  proximaParcelaVencimento?: string
  formaPagamento?: string
}

// ======================
// Estados
// ======================
const pedidos = ref<PedidoBackend[]>([])
const loading = ref(true)
const searchQuery = ref('')

// Filtros
const statusFilter = ref<'TODOS' | 'PAGO' | 'PENDENTE'>('TODOS')
const filterDataInicial = ref<string | null>(null)
const filterDataFinal = ref<string | null>(null)
const orderFilter = ref<'RECENTE' | 'ANTIGO'>('RECENTE')

// Modais
const showFiltersModal = ref(false)
const showNewModal = ref(false)
const showEditModal = ref(false)
const showViewPedidoModal = ref(false)
const showDeleteModal = ref(false)
const showViewClienteModal = ref(false)

// Pedido selecionado
const pedidoSelecionado = ref<PedidoBackend | null>(null)
const pedidoVisualizado = ref<PedidoBackend | null>(null)
const pedidoDeletar = ref<PedidoBackend | null>(null)
const clienteVisualizado = ref<Cliente | null>(null)

// Toast
const toast = useToast()

// ======================
// Helpers (Datas)
// ======================
const startOfDay = (date: string) => new Date(`${date}T00:00:00`)
const endOfDay = (date: string) => new Date(`${date}T23:59:59`)

// ======================
// Backend
// ======================
const carregarPedidos = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('http://localhost:8080/pedidos', {
      headers: { Authorization: `Bearer ${token}` }
    })

    pedidos.value = res.data.map((p: any) => ({
      ...p,
      cliente: { ...p.cliente, nome: p.cliente.nome },
      parcelasPagas: p.parcelasPagas ?? (p.parcelasTotais - (p.parcelasRestantes ?? 0))
    }))
  } catch (err) {
    console.error(err)
    toast.error('Erro ao carregar pedidos')
  } finally {
    loading.value = false
  }
}

onMounted(carregarPedidos)

// ======================
// Computeds: pesquisa + filtros
// ======================
const pedidosFiltrados = computed(() => {
  let resultado = [...pedidos.value]

  if (statusFilter.value !== 'TODOS') {
    resultado = resultado.filter(p => p.statusDePagamento === statusFilter.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    resultado = resultado.filter(p => {
      const cliente = p.cliente?.nome?.toLowerCase() || ''
      const itens = p.itens?.some(i => i.nomeProduto?.toLowerCase().includes(q))
      return cliente.includes(q) || itens
    })
  }

  if (filterDataInicial.value) {
    const start = startOfDay(filterDataInicial.value)
    resultado = resultado.filter(p => p.dataCriacao && new Date(p.dataCriacao) >= start)
  }

  if (filterDataFinal.value) {
    const end = endOfDay(filterDataFinal.value)
    resultado = resultado.filter(p => p.dataCriacao && new Date(p.dataCriacao) <= end)

  }

  resultado.sort((a, b) => {
    const da = a.dataCriacao ? new Date(a.dataCriacao).getTime() : 0
    const db = b.dataCriacao ? new Date(b.dataCriacao).getTime() : 0
    return orderFilter.value === 'RECENTE' ? db - da : da - db
    
  })

  return resultado
})

// ======================
// Filtros / Modais
// ======================
const abrirFiltros = () => (showFiltersModal.value = true)

const aplicarFiltros = (filters: Filters) => {
  statusFilter.value = filters.status
  filterDataInicial.value = filters.dataInicial
  filterDataFinal.value = filters.dataFinal
  orderFilter.value = filters.ordem
  toast.success('Filtro Aplicado!')
}

const limparFiltros = () => {
  statusFilter.value = 'TODOS'
  filterDataInicial.value = null
  filterDataFinal.value = null
  orderFilter.value = 'RECENTE'
  toast.success('Filtro Limpo!')
}

// ======================
// CRUD local + DELETE backend
// ======================
const adicionarPedidoNaTabela = (pedido: PedidoBackend) => {
  pedidos.value = [pedido, ...pedidos.value]
  toast.success('Pedido criado com sucesso!')
}

const atualizarPedidoNaTabela = (pedidoAtualizado: PedidoBackend) => {
  const index = pedidos.value.findIndex(p => p.id === pedidoAtualizado.id)
  if (index !== -1) pedidos.value.splice(index, 1, pedidoAtualizado)
  toast.success('Pedido atualizado!')
}

const deletarPedido = async (id: string) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Usuário não autenticado')
      return
    }

    await axios.delete(`http://localhost:8080/pedidos/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    pedidos.value = pedidos.value.filter(p => p.id !== id)
    toast.success('Pedido deletado com sucesso!')
  } catch (err: any) {
    console.error(err)
    toast.error(`Erro ao deletar pedido: ${err.response?.status || err.message}`)
  }
}

</script>

<template>
  <div class="flex h-screen">
    <Sidebar />
    <main class="flex-1 p-8 overflow-y-auto">
      <div class="mx-auto max-w-7xl flex flex-col gap-6">

        <!-- Cabeçalho -->
        <HeaderPage 
          title="Gerenciamento de Pedidos"
          subtitle="Adicione, edite e visualize informações dos pedidos"
        >
          <template #actions>
            <button
              @click="showNewModal = true"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 hover:scale-105"
            >
              <Plus class="w-4 h-4" />
              Novo Pedido
            </button>
          </template>
        </HeaderPage>

        <!-- Busca + filtros -->
        <SearchInput v-model="searchQuery" @openFilter="abrirFiltros" />

        <!-- Tabela de pedidos -->
        <TablePedidos
        :pedidos="pedidosFiltrados"
        :loading="loading"
        @edit="pedidoSelecionado = $event; showEditModal = true"
        @view="pedidoVisualizado = $event; showViewPedidoModal = true"
        @delete="pedidoDeletar = $event; showDeleteModal = true"
      />


        <!-- Modais -->
        <ModalFilters
          v-model="showFiltersModal"
          :currentFilters="{
            status: statusFilter,
            dataInicial: filterDataInicial,
            dataFinal: filterDataFinal,
            ordem: orderFilter
          }"
          @applyFilters="aplicarFiltros"
          @clearFilters="limparFiltros"
          @error="msg => toast.error(msg)"
        />

        <ModalNewPedido v-model="showNewModal" @submit="adicionarPedidoNaTabela"/>
        <ModalEditPedido v-model="showEditModal" :pedido="pedidoSelecionado" @submit="atualizarPedidoNaTabela"/>
        <ModalViewPedido v-model="showViewPedidoModal" :pedido="pedidoVisualizado" />
        <ModalDeletePedido 
          v-model="showDeleteModal" 
          :pedido="pedidoDeletar" 
          @deleted="deletarPedido"
        />
        <ModalViewCliente v-model="showViewClienteModal" :cliente="clienteVisualizado"/>
      </div>
    </main>
  </div>
</template>
