<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import { X } from 'lucide-vue-next'

/* =======================
   TIPOS
======================= */
interface Cliente {
  id: string
  nome: string
  email?: string
  telefone?: string
  endereco?: string
  createdAt?: string | null
}

interface Pedido {
  id: string
  data_criacao: string
  valorTotal: number
  statusDePagamento: 'PAGO' | 'PENDENTE'
}

/* =======================
   PROPS & EMIT
======================= */
const props = defineProps<{
  modelValue: boolean
  cliente: Cliente | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const show = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const close = () => (show.value = false)

/* =======================
   ESTADO
======================= */
const pedidos = ref<Pedido[]>([])
const loadingPedidos = ref(false)

/* =======================
   COMPUTED
======================= */
const pedidosRecentes = computed(() => pedidos.value.slice(0, 3))
const totalGasto = computed(() =>
  pedidos.value.reduce((sum, p) => sum + p.valorTotal, 0)
)

const ticketMedio = computed(() => {
  if (pedidos.value.length === 0) return 0
  return totalGasto.value / pedidos.value.length
})

/* =======================
   FUNÇÕES AUX
======================= */
const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatMoney = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/* =======================
   WATCHER
======================= */
watch(
  () => props.cliente,
  async (cliente) => {
    if (!cliente) {
      pedidos.value = []
      return
    }

    // Trata createdAt
    if (!cliente.createdAt) {
      cliente.createdAt = '-'
    } else {
      const parsedDate = new Date(cliente.createdAt)
      cliente.createdAt = isNaN(parsedDate.getTime()) ? '-' : parsedDate.toISOString()
    }

    // Carrega pedidos do cliente
    loadingPedidos.value = true
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.get(
        `http://localhost:8080/pedidos/cliente/${cliente.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      pedidos.value = (data || []).map((p: any) => ({
        id: p.id,
        data_criacao: p.dataCriacao ? new Date(p.dataCriacao).toISOString() : '',
        valorTotal: p.valorTotal ?? p.valor_total ?? 0,
        statusDePagamento: ['PAGO'].includes(p.statusDePagamento) ? 'PAGO' : 'PENDENTE'
      })).sort(
        (a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()
      )
    } catch (err) {
      pedidos.value = []
      console.error('Erro ao buscar pedidos:', err)
    } finally {
      loadingPedidos.value = false
    }
  },
  { immediate: true }
)
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="flex w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">

      <!-- HEADER -->
      <div class="flex items-center justify-between gap-3 border-b border-slate-200 p-4 sm:p-6">
        <p class="text-xl font-bold text-slate-900">Detalhes do Cliente</p>
        <button @click="close" class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- BODY -->
      <div class="grid grid-cols-1 gap-8 p-4 sm:p-6 md:grid-cols-2 md:gap-12">
        <!-- ESQUERDA -->
        <div class="flex flex-col gap-6">
          <!-- PERFIL -->
          <div class="flex items-center gap-4">
            <div class="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
              {{ props.cliente?.nome?.charAt(0) || '?' }}
            </div>
            <div>
              <p class="text-xl font-bold text-slate-900">{{ props.cliente?.nome || '—' }}</p>
              <p class="text-sm text-slate-500">{{ props.cliente?.email || '—' }}</p>
              <p class="text-sm text-slate-500">{{ props.cliente?.telefone || '—' }}</p>
            </div>
          </div>

          <!-- INFO -->
          <div class="flex flex-col">
            <div class="grid grid-cols-[auto_1fr] gap-x-4 border-t border-slate-200 py-4">
              <p class="text-sm text-slate-500">Endereço</p>
              <p class="text-sm text-slate-800">{{ props.cliente?.endereco || '—' }}</p>
            </div>



            <div class="grid grid-cols-[auto_1fr] gap-x-4 border-t border-slate-200 py-4">
              <p class="text-sm text-slate-500">Cliente desde</p>
              <p class="text-sm font-medium text-slate-800">{{ formatDate(props.cliente?.createdAt) }}</p>
            </div>

            <div class="grid grid-cols-[auto_1fr] gap-x-4 border-t border-slate-200 py-4">
              <p class="text-sm text-slate-500">Total gasto</p>
              <p class="text-sm font-medium text-slate-800">{{ formatMoney(totalGasto) }}</p>
            </div>

            <div class="grid grid-cols-[auto_1fr] gap-x-4 border-t border-slate-200 py-4">
              <p class="text-sm text-slate-500">Ticket Médio</p>
              <p class="text-sm font-medium text-slate-800">{{ formatMoney(ticketMedio) }}</p>
            </div>
          </div>
        </div>

        <!-- DIREITA -->
        <div class="flex flex-col">
          <h3 class="text-lg font-bold text-slate-900">Compras Recentes</h3>
          <div class="mt-4 flex flex-col gap-2">
            <div v-for="pedido in pedidosRecentes" :key="pedido.id" class="flex items-center gap-4 rounded-lg bg-slate-50 p-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">🛍️</div>
              <div class="flex-1">
                <p class="text-sm font-medium text-slate-800">Pedido #{{ pedido.id }}</p>
                <p class="text-xs text-slate-500">{{ formatDate(pedido.data_criacao) }} — {{ formatMoney(pedido.valorTotal) }}</p>
              </div>
              <div :class="pedido.statusDePagamento === 'PAGO' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'" class="rounded-full px-2.5 py-0.5 text-xs font-medium">
                {{ pedido.statusDePagamento === 'PAGO' ? 'Pago' : 'Pendente' }}
              </div>
            </div>
            <p v-if="!loadingPedidos && pedidosRecentes.length === 0" class="text-sm text-slate-500">Nenhuma compra encontrada</p>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="flex justify-end border-t border-slate-200 p-4 sm:p-6">
        <button @click="close" class="h-10 rounded-lg bg-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-300">Fechar</button>
      </div>
    </div>
  </div>
</template>
