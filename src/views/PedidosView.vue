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

interface Parcela {
  numero: number
  valor: number
  dataVencimento: string
  status: 'ABERTA' | 'PAGA' | 'VENCIDA'
  paga: boolean
}

interface PedidoBackend {
  id: string
  cliente: { id: string; nome: string; email?: string; telefone?: string }
  itens: ItemPedido[]
  parcelasTotais: number
  parcelasRestantes: number
  parcelasPagas: number
  parcelas: Parcela[]
  statusDePagamento: 'PAGO' | 'PENDENTE'
  formaPagamento: 'PIX' | 'CREDITO' | 'DEBITO' | 'DINHEIRO'
  dataCriacao?: string
  dataPrimeiroVencimento: string
  valorParcelas: number
  diaVencimento: number
  proximaParcelaVencimento?: string
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

// Selecionados
const pedidoSelecionado = ref<PedidoBackend | null>(null)
const pedidoVisualizado = ref<PedidoBackend | null>(null)
const pedidoDeletar = ref<PedidoBackend | null>(null)
const clienteVisualizado = ref<Cliente | null>(null)

const toast = useToast()

// ======================
// Helpers
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
    const baseURL = import.meta.env.VITE_API_URL

    const res = await axios.get(`${baseURL}/pedidos`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    pedidos.value = res.data.map((p: any): PedidoBackend => {
      const parcelas: Parcela[] = (p.parcelas ?? []).map((parcela: any) => ({
        numero: parcela.numero,
        valor: parcela.valor,
        dataVencimento: parcela.dataVencimento,
        status: parcela.status,
        paga: parcela.status === 'PAGA'
      }))

      const parcelasPagas = parcelas.filter(p => p.status === 'PAGA').length

      return {
        id: p.id,
        cliente: p.cliente,
        itens: p.itens,
        parcelasTotais: p.parcelasTotais,
        parcelasPagas,
        parcelasRestantes: p.parcelasTotais - parcelasPagas,
        parcelas,
        statusDePagamento: p.statusDePagamento,
        formaPagamento: ['PIX', 'CREDITO', 'DEBITO', 'DINHEIRO'].includes(p.formaPagamento)
          ? p.formaPagamento
          : 'CREDITO',
        dataCriacao: p.dataCriacao,
        dataPrimeiroVencimento:
          p.dataPrimeiroVencimento ??
          parcelas[0]?.dataVencimento ??
          new Date().toISOString().substring(0, 10),
        valorParcelas: p.valorParcelas ?? parcelas[0]?.valor ?? 0,
        diaVencimento:
          p.diaVencimento ??
          (parcelas[0]
            ? new Date(parcelas[0].dataVencimento).getDate()
            : new Date().getDate())
      }
    })
  } catch (err) {
    console.error(err)
    toast.error('Erro ao carregar pedidos')
  } finally {
    loading.value = false
  }
}

onMounted(carregarPedidos)

// ======================
// Computeds
// ======================
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
  toast.success('Filtro aplicado!')
}

const limparFiltros = () => {
  statusFilter.value = 'TODOS'
  filterDataInicial.value = null
  filterDataFinal.value = null
  orderFilter.value = 'RECENTE'
  toast.success('Filtros limpos!')
}
// ======================
// CRUD LOCAL
// ======================
const adicionarPedidoNaTabela = (pedido: PedidoBackend) => {
  pedidos.value.unshift(pedido)
  toast.success('Pedido criado com sucesso!')
}

const atualizarPedidoNaTabela = (pedidoAtualizado: PedidoBackend) => {
  const parcelasPagas = pedidoAtualizado.parcelas.filter(
    p => p.status === 'PAGA'
  ).length

  const pedidoNormalizado: PedidoBackend = {
    ...pedidoAtualizado,
    parcelasPagas,
    parcelasRestantes: pedidoAtualizado.parcelasTotais - parcelasPagas,
    parcelas: pedidoAtualizado.parcelas.map(p => ({
      ...p,
      paga: p.status === 'PAGA'
    }))
  }

  const index = pedidos.value.findIndex(p => p.id === pedidoNormalizado.id)
  if (index !== -1) {
    pedidos.value.splice(index, 1, pedidoNormalizado) // 🔥 reatividade correta
  }
  toast.success('Pedido ATUALIZADO com sucesso!')
}


const deletarPedidoLocal = (id: string) => {
  pedidos.value = pedidos.value.filter(p => p.id !== id)
  toast.success('Pedido deletado com sucesso!')
}

const handleToast = (payload: { message: string; type: 'success' | 'error' }) => {
  console.log('Toast recebido:', payload) // 🟢 teste
  toast[payload.type](payload.message)
}

</script>

<template>
  <div class="flex h-screen">
    <Sidebar />
    <main class="flex-1 ml-64 px-4 py-8 md:px-8">
      <div class="mx-auto max-w-7xl flex flex-col gap-6">

      
        <HeaderPage
          title="Gerenciamento de Pedidos"
          subtitle="Adicione, edite e visualize informações dos pedidos"
        >
          <template #actions>
           <button
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90"
            @click="showNewModal = true"
          >
            <Plus class="w-5 h-5" />
            Novo Pedido
          </button>

          </template>
        </HeaderPage>

        <SearchInput 
        v-model="searchQuery" 
        placeholder="Buscar por nome, e-mail, telefone ou notas..."
        filterType="pedido"
        @openFilter="showFiltersModal = true" 
      />


        <TablePedidos
          :pedidos="pedidosFiltrados"
          :loading="loading"
          @updated="atualizarPedidoNaTabela"
          @deleted="deletarPedidoLocal"
          @view="pedidoVisualizado = $event; showViewPedidoModal = true"
          @edit="pedidoSelecionado = $event; showEditModal = true"
        />

        <!-- Modais -->
        <ModalNewPedido
          v-model="showNewModal"
          @submit="adicionarPedidoNaTabela"
          @toast="handleToast"
        />

        <ModalEditPedido
          v-model="showEditModal"
          :pedido="pedidoSelecionado"
          @submit="atualizarPedidoNaTabela"
          @toast="handleToast"
        />

        <ModalViewPedido
          v-model="showViewPedidoModal"
          :pedido="pedidoVisualizado"
        />

        <ModalDeletePedido
          v-model="showDeleteModal"
          :pedido="pedidoDeletar"
          @deleted="deletarPedidoLocal"
          @toast="handleToast"
        />

        <ModalViewCliente
          v-model="showViewClienteModal"
          :cliente="clienteVisualizado"
        />

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
        
      </div>
    </main>
  </div>
</template>

