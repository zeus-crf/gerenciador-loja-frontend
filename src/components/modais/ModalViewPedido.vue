<script setup lang="ts">
import { computed, watch } from 'vue'
import { X, Calendar, User, CreditCard, PieChart } from 'lucide-vue-next'

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

interface PedidoBackend {
  id: string
  cliente: { id: string; nome: string; email?: string; telefone?: string }
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
// Props e emits
// ======================
const props = defineProps<{ modelValue: boolean; pedido?: PedidoBackend | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

// Controle de exibição do modal
const internalShow = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

// Computed do pedido, garantindo parcelasPagas definido
const pedido = computed<PedidoBackend | null>(() => {
  if (!props.pedido) return null
  return {
    ...props.pedido,
    parcelasPagas: props.pedido.parcelasPagas ?? (props.pedido.parcelasTotais - props.pedido.parcelasRestantes)
  }
})

// Fechar modal
const close = () => internalShow.value = false

watch(internalShow, (val) => {
  if (val) console.log('Modal aberto, pedido atual:', pedido.value)
})

// ======================
// Funções auxiliares
// ======================
const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleString('pt-BR') : 'N/A'

const parcelasPercent = computed(() => {
  if (!pedido.value || pedido.value.parcelasTotais === 0) return 0
  return (pedido.value.parcelasPagas / pedido.value.parcelasTotais) * 100
})
</script>

<template>
  <div v-if="internalShow" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"></div>

    <div class="relative flex max-h-[90vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">

      <!-- Header -->
      <div class="flex items-center justify-between border-b px-6 py-5">
        <div class="flex flex-col gap-1">
          <div class="flex items-baseline gap-2">
            <h2 class="text-xl font-bold leading-tight">Detalhes do Pedido</h2>
            <span class="text-sm text-gray-500">#{{ pedido?.id }}</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <Calendar class="w-4 h-4" />
            <span>{{ formatDate(pedido?.dataCriacao) }}</span>
          </div>
        </div>
        <button @click="close" class="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100">
          <X />
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

        <!-- Cliente -->
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="rounded-xl border p-5">
            <div class="mb-4 flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                <User class="w-5 h-5" />
              </div>
              <h3 class="text-base font-semibold">Dados do Cliente</h3>
            </div>
            <div class="flex flex-col gap-3">
              <div>
                <p class="text-xs uppercase text-gray-500">Nome</p>
                <p class="text-sm font-medium">{{ pedido?.cliente.nome }}</p>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-500">Email</p>
                <p class="text-sm font-medium">{{ pedido?.cliente.email || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-500">Telefone</p>
                <p class="text-sm font-medium">{{ pedido?.cliente.telefone || 'N/A' }}</p>
              </div>
            </div>
          </div>

          <!-- Pagamento -->
          <div class="rounded-xl border p-5">
            <div class="mb-4 flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                <CreditCard class="w-5 h-5" />
              </div>
              <h3 class="text-base font-semibold">Status do Pagamento</h3>
            </div>
            <div>
              <span class="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-500">
                <span class="mr-1 h-2 w-2 rounded-full bg-blue-500"></span>
                {{ pedido?.statusDePagamento }}
              </span>
            </div>
          </div>

          <!-- Parcelas -->
          <div class="rounded-xl border p-5">
            <div class="mb-4 flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                <PieChart class="w-5 h-5" />
              </div>
              <h3 class="text-base font-semibold">Parcelamento</h3>
            </div>
            <div class="flex flex-col gap-4">
              <div class="flex justify-between items-end">
                <p class="text-2xl font-bold">{{ pedido?.parcelasPagas }} <span class="text-sm font-normal text-gray-500">de {{ pedido?.parcelasTotais }}</span></p>
                <span class="text-sm font-bold text-blue-500">{{ parcelasPercent.toFixed(0) }}%</span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-gray-100">
                <div class="h-full rounded-full bg-blue-500 transition-all" :style="{ width: parcelasPercent + '%' }"></div>
              </div>
            <p class="text-xs text-gray-500">
              Valor das Parcelas:
              {{
                pedido?.parcelasTotais && pedido?.itens?.length
                  ? formatCurrency(
                      (pedido.itens.reduce(
                        (acc, i) => acc + i.precoUnitario * i.quantidade,
                        0
                      )) / pedido.parcelasTotais
                    )
                  : 'N/A'
              }}
            </p>
            </div>
          </div>
        </div>

        <!-- Itens -->
        <div class="rounded-xl border overflow">
          <div class="bg-gray-50 px-6 py-4 border-b">
            <h3 class="text-lg font-bold">Itens do Pedido</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="bg-gray-50">
                  <th class="px-6 py-3 text-xs uppercase text-gray-500">Produto</th>
                  <th class="px-6 py-3 text-center text-xs uppercase text-gray-500">Qtd</th>
                  <th class="px-6 py-3 text-right text-xs uppercase text-gray-500">Preço Unit.</th>
                  <th class="px-6 py-3 text-right text-xs uppercase text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="(item, i) in pedido?.itens || []" :key="i">
                  <td class="px-6 py-4">{{ item.nomeProduto }} - Tamanho: {{ item.tamanho }}</td>
                  <td class="px-6 py-4 text-center">{{ item.quantidade }}</td>
                  <td class="px-6 py-4 text-right">{{ formatCurrency(item.precoUnitario) }}</td>
                  <td class="px-6 py-4 text-right">{{ formatCurrency(item.precoUnitario * item.quantidade) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Resumo -->
        <div class="border-t p-6 flex justify-between">
          <div>
            <p class="text-sm text-gray-500">Subtotal:</p>
            <p class="font-medium text-gray-900">{{ formatCurrency(pedido?.itens?.reduce((acc, i) => acc + i.precoUnitario * i.quantidade, 0) || 0) }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500">Total Geral:</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(pedido?.itens?.reduce((acc, i) => acc + i.precoUnitario * i.quantidade, 0) || 0) }}</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
