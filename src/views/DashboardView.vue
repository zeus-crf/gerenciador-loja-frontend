<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import Sidebar from '@/components/layout/Sidebar.vue'
import TablePedidos from '@/components/TablePedidos.vue'
import HeaderPage from '@/components/layout/HeaderPage.vue'
import { Plus,Wallet, TrendingUp, ShoppingBag, UserPlus   } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import DashboardCharts from '@/components/dashboard/DashboardCharts.vue'
import ModalNewPedido from '@/components/modais/ModalNewPedido.vue'

/* ====================== TIPOS ====================== */
type Periodo = '7d' | '30d' | '12m'

interface Cliente {
  id: string
  nome: string
  email?: string
  telefone?: string
}

interface Pedido {
  id: string
  cliente: Cliente
  itens: any[]
  parcelasTotais: number
  parcelasRestantes: number
  statusDePagamento: 'PAGO' | 'PENDENTE'
  parcelasPagas?: number
  dataCriacao?: string
}

interface Usuario {
  id: string
  username: string
  nome: string
}

interface DashboardResponse {
  totalClientes: number
  totalPedidos: number
  receitaTotal: number
}


interface ItemPedido {
  id?: string
  nomeProduto: string
  quantidade: number
  precoUnitario: number
  tamanho: string
  cor?: string
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

/* ====================== ESTADO ====================== */
const periodoSelecionado = ref<Periodo>('7d')

const carregandoDashboard = ref(false)
const loadingPedidos = ref(false)
const loadingClientes = ref(false)
const loadingUsuarios = ref(false)

const dashboard = ref<DashboardResponse>({
  totalClientes: 0,
  totalPedidos: 0,
  receitaTotal: 0
})

const pedidos = ref<Pedido[]>([])
const clientes = ref<Cliente[]>([])
const usuarios = ref<Usuario[]>([])
const showNewModal = ref(false)

const toast = useToast()

/* ====================== AXIOS ====================== */
const api = axios.create({
  baseURL: 'http://localhost:8080'
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/* ====================== API ====================== */
const carregarDashboard = async () => {
  carregandoDashboard.value = true
  try {
    const res = await api.get<DashboardResponse>('/dashboard', {
      params: { periodo: periodoSelecionado.value }
    })
    dashboard.value = res.data
  } finally {
    carregandoDashboard.value = false
  }
}

const carregarPedidos = async () => {
  loadingPedidos.value = true
  try {
    const res = await api.get<Pedido[]>('/pedidos')
    pedidos.value = res.data.map(p => ({
      ...p,
      parcelasPagas:
        p.parcelasPagas ??
        (p.parcelasTotais - (p.parcelasRestantes ?? 0))
    }))
  } finally {
    loadingPedidos.value = false
  }
}

const carregarClientes = async () => {
  loadingClientes.value = true
  try {
    const res = await api.get<Cliente[]>('/clientes')
    clientes.value = res.data
  } finally {
    loadingClientes.value = false
  }
}

const carregarUsuarios = async () => {
  loadingUsuarios.value = true
  try {
    const res = await api.get<Usuario[]>('/usuarios')
    usuarios.value = res.data
  } finally {
    loadingUsuarios.value = false
  }
}

/* ====================== LIFECYCLE ====================== */
watch(periodoSelecionado, () => {
  carregarDashboard()
  carregarGraficos()
})

onMounted(() => {
  carregarDashboard()
  carregarPedidos()
  carregarClientes()
  carregarUsuarios()
  carregarGraficos()
})

/* ====================== COMPUTEDS ====================== */
const pedidosOrdenados = computed(() =>
  [...pedidos.value].sort((a, b) => {
    const da = a.dataCriacao ? new Date(a.dataCriacao).getTime() : 0
    const db = b.dataCriacao ? new Date(b.dataCriacao).getTime() : 0
    return db - da
  })
)
const adicionarPedidoNaTabela = async (pedido: PedidoBackend) => {
  // 1️⃣ Atualiza tabela imediatamente
  pedidos.value = [pedido, ...pedidos.value]
  toast.success('Pedido criado com sucesso!')

  // 2️⃣ Se o pedido for PAGO, atualiza dashboard e gráficos
  if (pedido.statusDePagamento === 'PAGO') {
    await Promise.all([
      carregarDashboard(),
      carregarGraficos()
    ])
  }
}




const pedidosRecentes = computed(() =>
  pedidosOrdenados.value.slice(0, 5)
)

const pedidosParaTabela = computed(() =>
  pedidosRecentes.value.map(p => ({
    ...p,
    cliente: {
      id: p.cliente?.id ?? '',
      nome: p.cliente?.nome ?? 'Cliente'
    }
  }))
)

const receitaFormatada = computed(() =>
  dashboard.value.receitaTotal.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
)

/* ====================== AÇÕES ====================== */
const showNew = ref(false)
const abrirNovo = () => (showNew.value = true)

/* 🔥 RECEBE DELETE DA TABELA */
const handlePedidoDeleted = async (id: string) => {
  pedidos.value = pedidos.value.filter(p => p.id !== id)
  await carregarPedidos() // garante completar os 5
}

/* 🔥 RECEBE UPDATE DA TABELA */
const handlePedidoUpdated = async (pedido: Pedido) => {
  const index = pedidos.value.findIndex(p => p.id === pedido.id)
  if (index !== -1) pedidos.value[index] = pedido

  if (pedido.statusDePagamento === 'PAGO') {
    await Promise.all([
      carregarDashboard(),
      carregarGraficos()
    ])
  }
}

/**GRÁFICOS */
const graficos = ref({
  labels: [] as string[],
  clientes: [] as number[],
  vendas: [] as number[]
})

const carregarGraficos = async () => {
  try {
    const res = await api.get('/dashboard/graficos', {
      params: { periodo: periodoSelecionado.value }
    })
    graficos.value = res.data
  } catch (err) {
    console.error('Erro ao carregar gráficos', err)
  }
}


</script>
<template>
  <div class="flex min-h-screen">
    <Sidebar  />

    <main class="flex-1 ml-64 px-4 py-8 md:px-8">
  <!-- container ÚNICO -->
  <div class="mx-auto max-w-7xl flex flex-col gap-8">

    <!-- HEADER -->
    <HeaderPage
      title="Dashboard"
      subtitle="Acompanhe o desempenho das suas vendas e clientes"
    >
      <template #actions>
      <div class="flex gap-4">
      <div class="flex justify-end">

      <div class="w-full md:w-56">
        <v-select
          v-model="periodoSelecionado"
          label="Período"
          :items="[
            { title: 'Últimos 7 dias', value: '7d' },
            { title: 'Últimos 30 dias', value: '30d' },
            { title: 'Últimos 12 meses', value: '12m' }
          ]"
          variant="outlined"
          density="compact"
          hide-details
          
        />
        
      </div>
    </div>
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-bold"
          @click="showNewModal = true"
        >
          <Plus class="w-5 h-5" />
          Novo Pedido
        </button>
        </div>
      </template>
    </HeaderPage>

    <!-- STATS -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Receita -->
      <div
        class="p-6 rounded-xl shadow-sm
               border border-[#e7f3ef] dark:border-[#1e3b32] flex flex-col gap-4"
      >
        <!-- topo -->
        <div class="flex justify-between items-start">
          <div class="p-2 rounded-lg text-green-600 bg-green-600/20">
            <Wallet class="w-5 h-5" />
          </div>

          <span class="flex items-center gap-1 text-xs font-bold
                       text-green-600 bg-green-50 px-2 py-1 rounded-full">
            +12.5%
            <TrendingUp class="w-3.5 h-3.5" />
          </span>
        </div>

        <div>
          <p class="text-text-secondary text-md font-medium">Receita Total</p>
          <h3 class="text-2xl font-bold mt-1">{{ receitaFormatada }}</h3>
        </div>
      </div>

      <!-- Pedidos -->
      <div class="p-6 rounded-xl shadow-sm
               border border-[#e7f3ef] dark:border-[#1e3b32] flex flex-col gap-4">

          <div class="flex justify-between items-start">
          <div class="p-2 rounded-lg text-blue-600 bg-blue-600/20">
            <ShoppingBag class="w-5 h-5" />
          </div>

          <span class="flex items-center gap-1 text-xs font-bold
                       text-green-600 bg-green-50 px-2 py-1 rounded-full">
            +2.5%
            <TrendingUp class="w-3.5 h-3.5" />
          </span>
        </div>
        <p class="text-text-secondary text-md font-medium">Novos Pedidos</p>
        <h3 class="text-2xl font-bold">{{ dashboard.totalPedidos }}</h3>
      </div>

      <!-- Clientes -->
      <div class="p-6 rounded-xl shadow-sm
               border border-[#e7f3ef] dark:border-[#1e3b32] flex flex-col gap-4">
               <div class="flex justify-between items-start">
          <div class="p-2 rounded-lg text-purple-600 bg-purple-600/20">
            <UserPlus  class="w-5 h-5" />
          </div>

          <span class="flex items-center gap-1 text-xs font-bold
                       text-green-600 bg-green-50 px-2 py-1 rounded-full">
            +17.5%
            <TrendingUp class="w-3.5 h-3.5" />
          </span>
        </div>
        <p class="text-text-secondary text-md font-medium">Novos Clientes</p>
        <h3 class="text-2xl font-bold">{{ dashboard.totalClientes }}</h3>
      </div>
    </div>

    <!-- GRÁFICOS -->
    <DashboardCharts
      :labels="graficos.labels"
      :clientes="graficos.clientes"
      :vendas="graficos.vendas"
    />

    <!-- PEDIDOS RECENTES -->
    <div class="rounded-xl shadow-sm border">
      <div class="p-6 flex items-center justify-between">
        <h3 class="text-lg font-bold">Pedidos Recentes</h3>
        <span class="text-sm text-primary cursor-pointer">
         <RouterLink
        :to="{ name: 'pedidos' }"
        class="text-sm text-primary cursor-pointer"
        active-class="bg-primary/10 text-primary"
      >
        <ReceiptText class="w-5 h-5" />
        <span class="text-sm font-medium">Ver Todos</span>
      </RouterLink>
      
      
    </span>

      </div>

      <TablePedidos
        :pedidos="pedidosParaTabela"
        :loading="loadingPedidos"
        dashboard
        :limit="5"
        @deleted="handlePedidoDeleted"
        @updated="handlePedidoUpdated"
      />
    </div>

    <ModalNewPedido v-model="showNewModal" @submit="adicionarPedidoNaTabela"/>

  </div>
</main>
 </div>
  
</template>
