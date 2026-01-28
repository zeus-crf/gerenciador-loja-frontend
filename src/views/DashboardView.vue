    <script setup lang="ts">
    import { ref, computed, watch, onMounted, nextTick } from 'vue'
    import axios from 'axios'
    import Sidebar from '@/components/layout/Sidebar.vue'
    import TablePedidos from '@/components/TablePedidos.vue'
    import HeaderPage from '@/components/layout/HeaderPage.vue'
    import { Plus, Wallet, TrendingUp, ShoppingBag, UserPlus } from 'lucide-vue-next'
    import { useToast } from 'vue-toastification'
    import DashboardCharts from '@/components/dashboard/DashboardCharts.vue'
    import ModalNewPedido from '@/components/modais/ModalNewPedido.vue'
    import ModalEditPedido from '@/components/modais/ModalEditPedido.vue'

    /* ====================== TIPOS ====================== */
    type Periodo = '7d' | '30d' | '12m' | 'mes' | 'custom'

    interface DashboardResponse {
      totalClientes: number
      totalPedidos: number
      receitaTotal: number
    }

    interface Parcela {
      numero: number
      valor: number
      dataVencimento: string
      status: 'ABERTA' | 'PAGA' | 'VENCIDA'
      paga: boolean
    }

    interface ItemPedido {
      id?: string
      nomeProduto: string
      quantidade: number
      precoUnitario: number
      tamanho: string
      cor?: string
    }

    export interface PedidoBackend {
      id: string
      cliente: { id: string; nome: string }
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
    }

    /* ====================== ESTADO ====================== */
    const toast = useToast()
    const periodoSelecionado = ref<Periodo>('7d')
    const carregandoDashboard = ref(false)
    const loadingPedidos = ref(false)

    const showNewModal = ref(false)
    const showEditModal = ref(false)
    const showViewPedidoModal = ref(false)
    const menuPeriodo = ref(false)

    const pedidoSelecionado = ref<PedidoBackend | null>(null)
    const pedidoVisualizado = ref<PedidoBackend | null>(null)
const periodoRange = ref<[string | null, string | null]>([null, null])




    const dashboard = ref<DashboardResponse>({
      totalClientes: 0,
      totalPedidos: 0,
      receitaTotal: 0
    })

    const pedidos = ref<PedidoBackend[]>([])

    /* ====================== AXIOS ====================== */
    const api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080'
    })

    api.interceptors.request.use(config => {
      const token = localStorage.getItem('token')
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })

    /* ====================== COMPUTEDS ====================== */
const dataInicioCustom = computed(() => periodoRange.value[0])

const dataFimCustom = computed(() => periodoRange.value[1])

    const receitaFormatada = computed(() =>
      dashboard.value.receitaTotal.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
    )


const formatarData = (date: string | null) => {
  return date
}



    /* ====================== API ====================== */
    const carregarDashboard = async () => {
      carregandoDashboard.value = true
      try {
        const params: any = { periodo: periodoSelecionado.value }

        if (periodoSelecionado.value === 'custom') {
          if (!dataInicioCustom.value || !dataFimCustom.value) return
          params.dataInicio = dataInicioCustom.value
          params.dataFim = dataFimCustom.value
        }

        const res = await api.get('/dashboard', { params })
        dashboard.value = res.data
      } finally {
        carregandoDashboard.value = false
      }
    }

    const carregarPedidos = async () => {
      loadingPedidos.value = true
      try {
        const res = await api.get('/pedidos')
        pedidos.value = res.data
      } finally {
        loadingPedidos.value = false
      }
    }

    /* ====================== GRÁFICOS ====================== */
    const graficos = ref({
      labels: [] as string[],
      clientes: [] as number[],
      vendas: [] as number[]
    })

    const carregarGraficos = async () => {
      const params: any = { periodo: periodoSelecionado.value }

      if (periodoSelecionado.value === 'custom') {
        if (!dataInicioCustom.value || !dataFimCustom.value) return
        params.dataInicio = dataInicioCustom.value
        params.dataFim = dataFimCustom.value
      }

      const res = await api.get('/dashboard/graficos', { params })
      graficos.value = res.data
    }

    /* ====================== WATCHERS ====================== */
    watch(periodoSelecionado, async (novo) => {
      if (novo === 'custom') {
        periodoRange.value = [null, null]
        await nextTick()
        menuPeriodo.value = true
        return
      }

      periodoRange.value = [null, null]
      menuPeriodo.value = false
      carregarDashboard()
      carregarGraficos()
    })

watch(periodoRange, (range) => {
  const [inicio, fim] = range

  if (
    periodoSelecionado.value === 'custom' &&
    inicio !== null &&
    fim !== null
  ) {
    menuPeriodo.value = false
    carregarDashboard()
    carregarGraficos()
  }
})

console.log('Custom:', {
  inicio: dataInicioCustom.value,
  fim: dataFimCustom.value
})




    onMounted(() => {
      carregarDashboard()
      carregarPedidos()
      carregarGraficos()
    })

    /* ====================== AÇÕES ====================== */
    const adicionarPedidoNaTabela = (pedido: PedidoBackend) => {
      pedidos.value.unshift(pedido)
      toast.success('Pedido criado com sucesso!')
    }

    const atualizarPedidoNaTabela = (pedidoAtualizado: PedidoBackend) => {
      const i = pedidos.value.findIndex(p => p.id === pedidoAtualizado.id)
      if (i !== -1) pedidos.value.splice(i, 1, pedidoAtualizado)
    }

    const handlePedidoDeleted = (id: string) => {
      pedidos.value = pedidos.value.filter(p => p.id !== id)
    }

    const abrirModalEdicao = (pedido: PedidoBackend) => {
      pedidoSelecionado.value = pedido
      showEditModal.value = true
    }

    const abrirModalVisualizacao = (pedido: PedidoBackend) => {
      pedidoVisualizado.value = pedido
      showViewPedidoModal.value = true
    }
    </script>

    <template>
      <div class="flex min-h-screen">
        <Sidebar />

        <main class="flex-1 ml-64 px-4 py-8 md:px-8">
          <div class="mx-auto max-w-7xl flex flex-col gap-8">

            <HeaderPage
              title="Dashboard"
              subtitle="Acompanhe o desempenho das suas vendas e clientes"
            >
              <template #actions>
                <div class="flex gap-4">

                  <div class="w-full md:w-72 flex flex-col gap-2">
                    <v-select
                      v-model="periodoSelecionado"
                      label="Período"
                      :items="[
                        { title: 'Últimos 7 dias', value: '7d' },
                        { title: 'Últimos 30 dias', value: '30d' },
                        { title: 'Últimos 12 meses', value: '12m' },
                        { title: 'Este mês', value: 'mes' }
                      ]"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />

                   <v-menu
  v-model="menuPeriodo"
  :close-on-content-click="false"
  persistent
>
<v-date-picker
  v-model="periodoRange"
  range
/>


</v-menu>

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
              <div class="p-6 rounded-xl shadow-sm border flex flex-col gap-4">
                <div class="flex justify-between items-start">
                  <div class="p-2 rounded-lg text-green-600 bg-green-600/20">
                    <Wallet class="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p class="text-text-secondary text-md font-medium">Receita Total</p>
                  <h3 class="text-2xl font-bold mt-1">{{ receitaFormatada }}</h3>
                </div>
              </div>

            <!-- Pedidos -->
  <div
    class="p-6 rounded-xl shadow-sm
          border border-[#e7f3ef] dark:border-[#1e3b32]
          flex flex-col gap-4"
  >
    <!-- topo -->
    <div class="flex justify-between items-start">
      <div class="p-2 rounded-lg text-blue-600 bg-blue-600/20">
        <ShoppingBag class="w-5 h-5" />
      </div>

      <span
        class="flex items-center gap-1 text-xs font-bold
              text-green-600 bg-green-50 px-2 py-1 rounded-full"
      >
        +2.5%
        <TrendingUp class="w-3.5 h-3.5" />
      </span>
    </div>

    <div>
      <p class="text-text-secondary text-md font-medium">
        Novos Pedidos
      </p>
      <h3 class="text-2xl font-bold">
        {{ dashboard.totalPedidos }}
      </h3>
    </div>
  </div>


              <!-- Clientes -->
            <!-- Clientes -->
  <div
    class="p-6 rounded-xl shadow-sm
          border border-[#e7f3ef] dark:border-[#1e3b32]
          flex flex-col gap-4"
  >
    <!-- topo -->
    <div class="flex justify-between items-start">
      <div class="p-2 rounded-lg text-purple-600 bg-purple-600/20">
        <UserPlus class="w-5 h-5" />
      </div>

      <span
        class="flex items-center gap-1 text-xs font-bold
              text-green-600 bg-green-50 px-2 py-1 rounded-full"
      >
        +17.5%
        <TrendingUp class="w-3.5 h-3.5" />
      </span>
    </div>

    <div>
      <p class="text-text-secondary text-md font-medium">
        Novos Clientes
      </p>
      <h3 class="text-2xl font-bold">
        {{ dashboard.totalClientes }}
      </h3>
    </div>
  </div>

            </div>

            <DashboardCharts
              :labels="graficos.labels"
              :clientes="graficos.clientes"
              :vendas="graficos.vendas"
            />

            <TablePedidos
              :pedidos="pedidos"
              :loading="loadingPedidos"
              dashboard
              :limit="5"
              @deleted="handlePedidoDeleted"
              @updated="atualizarPedidoNaTabela"
              @edit="abrirModalEdicao"
              @view="abrirModalVisualizacao"
            />

            <ModalNewPedido
              v-model="showNewModal"
              @submit="adicionarPedidoNaTabela"
            />

          </div>
        </main>
      </div>
    </template>
