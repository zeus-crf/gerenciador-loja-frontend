<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Pencil, Trash2, Eye } from 'lucide-vue-next'
import axios from 'axios'
import { useToast } from 'vue-toastification'

// Modais
import ModalEditPedido from './modais/ModalEditPedido.vue'
import ModalViewPedido from './modais/ModalViewPedido.vue'
import ModalDeletePedido from './modais/ModalDeletePedido.vue'

// ======================
// Tipos
// ======================
interface ItemPedido {
  nomeProduto: string
  quantidade: number
  precoUnitario: number
  tamanho: string
}

interface Pedido {
  id: string
  cliente: {
    id: string
    nome: string
  }
  itens: ItemPedido[]
  parcelasTotais: number
  parcelasRestantes: number
  statusDePagamento: 'PAGO' | 'PENDENTE'
}

interface PedidoView extends Pedido {
  parcelasPagas: number
}

// ======================
// Props
// ======================
const props = defineProps<{
  pedidos: Pedido[]
  loading: boolean
}>()

// ======================
// Estado Local
// ======================
const pedidosLocal = ref<Pedido[]>([])
const toast = useToast()

const showEditModal = ref(false)
const pedidoSelecionado = ref<Pedido | null>(null)

const showViewModal = ref(false)
const pedidoVisualizado = ref<PedidoView | null>(null)

const showDeleteModal = ref(false)
const pedidoParaDeletar = ref<Pedido | null>(null)

// ======================
// Sync props → local
// ======================
watch(
  () => props.pedidos,
  (val) => {
    pedidosLocal.value = [...val]
  },
  { immediate: true }
)

// ======================
// Ações
// ======================
const editarPedido = (pedido: Pedido) => {
  pedidoSelecionado.value = { ...pedido }
  showEditModal.value = true
}

const visualizarPedido = (pedido: Pedido) => {
  pedidoVisualizado.value = {
    ...pedido,
    parcelasPagas: pedido.parcelasTotais - pedido.parcelasRestantes
  }
  showViewModal.value = true
}

const abrirModalDelete = (pedido: Pedido) => {
  pedidoParaDeletar.value = pedido
  showDeleteModal.value = true
}

const atualizarPedidoNaLista = (pedidoAtualizado: Pedido) => {
  const index = pedidosLocal.value.findIndex(p => p.id === pedidoAtualizado.id)
  if (index !== -1) {
    pedidosLocal.value.splice(index, 1, pedidoAtualizado)
  }
  showEditModal.value = false
  toast.success('Pedido atualizado com sucesso!')
}

const deletarPedido = async (id: string) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('Sessão expirada')

    await axios.delete(`http://localhost:8080/pedidos/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    pedidosLocal.value = pedidosLocal.value.filter(p => p.id !== id)
    showDeleteModal.value = false
    toast.success('Pedido deletado!')
  } catch (err) {
    console.error(err)
    toast.error('Erro ao deletar pedido')
  }
}

// ======================
// Paginação
// ======================
const currentPage = ref(1)
const pageSize = ref(8)

const totalPedidos = computed(() => pedidosLocal.value.length)
const totalPages = computed(() =>
  Math.ceil(totalPedidos.value / pageSize.value)
)

const pedidosPaginados = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return pedidosLocal.value.slice(start, start + pageSize.value)
})

const startItem = computed(() =>
  totalPedidos.value === 0
    ? 0
    : (currentPage.value - 1) * pageSize.value + 1
)

const endItem = computed(() =>
  Math.min(currentPage.value * pageSize.value, totalPedidos.value)
)

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const nextPage = () => goToPage(currentPage.value + 1)
const prevPage = () => goToPage(currentPage.value - 1)

/** 👉 Paginação inteligente (1 … x x x … n) */
const pagesToShow = computed<(number | string)[]>(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages: (number | string)[] = []

  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')

  pages.push(total)

  return pages
})

/** 👉 Evita erro string | number */
const handlePageClick = (page: number | string) => {
  if (typeof page === 'number') {
    goToPage(page)
  }
}

watch(totalPedidos, () => {
  currentPage.value = 1
})
</script>

<template>
  <div class="mt-4">
    <div class="overflow-hidden rounded-xl border bg-white shadow">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y">
          <thead class="bg-slate-100">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cliente</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Itens</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pagamento</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Parcelas</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ações</th>
            </tr>
          </thead>

          <tbody class="divide-y">
            <tr v-if="loading">
              <td colspan="5" class="px-6 py-4 text-center text-slate-500">Carregando...</td>
            </tr>

            <tr v-else-if="!loading && totalPedidos === 0">
              <td colspan="5" class="px-6 py-4 text-center text-slate-500">Nenhum pedido encontrado</td>
            </tr>

            <tr
              v-else
              v-for="pedido in pedidosPaginados"
              :key="pedido.id"
              class="hover:bg-slate-50"
            >
              <td class="px-6 py-4 font-medium text-slate-900">
                {{ pedido.cliente?.nome || 'N/A' }}
              </td>

              <td class="px-6 py-4 text-slate-600">
                {{
                  pedido.itens.length
                    ? pedido.itens.map(i => i.nomeProduto).join(', ')
                    : 'Sem itens'
                }}
              </td>

              <td class="px-6 py-4">
                <span
                  class="rounded-full px-3 py-1 text-xs font-medium"
                  :class="
                    pedido.statusDePagamento === 'PAGO'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  "
                >
                  {{ pedido.statusDePagamento }}
                </span>
              </td>

              <td class="px-6 py-4 text-slate-600">
                {{ pedido.parcelasTotais - pedido.parcelasRestantes }}/{{ pedido.parcelasTotais }}
              </td>

              <td class="px-6 py-4">
                <div class="flex gap-3">
                  <button class="text-primary hover:text-slate-800" @click="visualizarPedido(pedido)">
                    <Eye class="w-5 h-5" />
                  </button>
                  <button class="text-primary hover:text-primary-dark" @click="editarPedido(pedido)">
                    <Pencil class="w-5 h-5" />
                  </button>
                  <button class="text-red-600 hover:text-red-800" @click="abrirModalDelete(pedido)">
                    <Trash2 class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINAÇÃO -->
      <div class="flex items-center justify-between border-t px-4 py-3 bg-slate-50">
        <p class="text-sm text-slate-500">
          <span v-if="totalPedidos > 0">
            Mostrando {{ startItem }} a {{ endItem }} de {{ totalPedidos }}
          </span>
          <span v-else>Nenhum registro para exibir</span>
        </p>

        <div class="flex items-center gap-1">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="px-2 py-1 rounded hover:bg-slate-200"
          >
            ‹
          </button>

          <button
            v-for="page in pagesToShow"
            :key="page"
            @click="handlePageClick(page)"
            :disabled="page === '...'"
            :class="
              page === currentPage
                ? 'bg-primary text-white px-3 py-1 rounded'
                : 'px-3 py-1 rounded hover:bg-slate-100'
            "
          >
            {{ page }}
          </button>

          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-2 py-1 rounded hover:bg-slate-200"
          >
            ›
          </button>
        </div>
      </div>
    </div>

    <!-- MODAIS -->
    <ModalEditPedido
      v-model="showEditModal"
      :pedido="pedidoSelecionado"
      @submit="atualizarPedidoNaLista"
    />

    <ModalViewPedido
      v-model="showViewModal"
      :pedido="pedidoVisualizado"
    />

    <ModalDeletePedido
      v-model="showDeleteModal"
      :pedido="pedidoParaDeletar"
      @deleted="deletarPedido"
    />
  </div>
</template>
