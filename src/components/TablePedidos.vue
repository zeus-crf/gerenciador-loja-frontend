<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Pencil, Trash2, Eye } from 'lucide-vue-next'
import axios from 'axios'
import { useToast } from 'vue-toastification'

// Modais
import ModalEditPedido from './modais/ModalEditPedido.vue'
import ModalViewPedido from './modais/ModalViewPedido.vue'
import ModalDeletePedido from './modais/ModalDeletePedido.vue'

/* ======================
   TIPOS
====================== */
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

/* ======================
   PROPS / EMITS
====================== */
const props = defineProps<{
  pedidos: Pedido[]
  loading: boolean
  dashboard?: boolean
  limit?: number
}>()

const emit = defineEmits<{
  (e: 'deleted', id: string): void
  (e: 'updated', pedido: Pedido): void
}>()

/* ======================
   ESTADO LOCAL
====================== */
const pedidosLocal = ref<Pedido[]>([])
const toast = useToast()

// 🔥 CONTROLE CENTRAL DOS MODAIS
const modalAtivo = ref<'edit' | 'view' | 'delete' | null>(null)
const pedidoAtivo = ref<any | null>(null)

/* ======================
   SYNC PROPS → LOCAL
====================== */
watch(
  () => props.pedidos,
  (val) => {
    pedidosLocal.value = JSON.parse(JSON.stringify(val))
  },
  { immediate: true }
)

/* ======================
   HELPERS
====================== */
function resetarModal() {
  modalAtivo.value = null
  pedidoAtivo.value = null
}

/* ======================
   AÇÕES
====================== */
function editarPedido(pedido: Pedido) {
  pedidoAtivo.value = JSON.parse(JSON.stringify(pedido))
  modalAtivo.value = 'edit'
}

function visualizarPedido(pedido: Pedido) {
  pedidoAtivo.value = {
    ...JSON.parse(JSON.stringify(pedido)),
    parcelasPagas: pedido.parcelasTotais - pedido.parcelasRestantes
  }
  modalAtivo.value = 'view'
}

function abrirModalDelete(pedido: Pedido) {
  pedidoAtivo.value = JSON.parse(JSON.stringify(pedido))
  modalAtivo.value = 'delete'
}

/* ======================
   UPDATE
====================== */
function atualizarPedidoNaLista(pedidoAtualizado: Pedido) {
  const index = pedidosLocal.value.findIndex(p => p.id === pedidoAtualizado.id)
  if (index !== -1) {
    pedidosLocal.value.splice(index, 1, pedidoAtualizado)
    emit('updated', pedidoAtualizado)
  }

  toast.success('Pedido atualizado com sucesso!')
  resetarModal()
}

/* ======================
   DELETE
====================== */
async function deletarPedido(id: string) {
  try {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('Sessão expirada')

    pedidosLocal.value = pedidosLocal.value.filter(p => p.id !== id)
    emit('deleted', id)

    await axios.delete(`${import.meta.env.VITE_API_URL}/pedidos/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    toast.success('Pedido deletado!')
    resetarModal()
  } catch (err) {
    console.error(err)
    toast.error('Erro ao deletar pedido')
  }
}

/* ======================
   STATUS PAGO
====================== */
async function mudarStatusParaPago(pedido: Pedido) {
  try {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('Sessão expirada')

    const response = await axios.patch(
      `${import.meta.env.VITE_API_URL}/pedidos/${pedido.id}/status`,
      null,
      {
        params: { status: 'PAGO' },
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    emit('updated', response.data)
    toast.success('Pedido marcado como PAGO!')
  } catch (err) {
    console.error(err)
    toast.error('Erro ao atualizar status')
  }
}

/* ======================
   PAGINAÇÃO
====================== */
const currentPage = ref(1)
const pageSize = ref(8)

const totalPedidos = computed(() =>
  props.dashboard
    ? Math.min(pedidosLocal.value.length, props.limit ?? 5)
    : pedidosLocal.value.length
)

const pedidosPaginados = computed(() => {
  if (props.dashboard) return pedidosLocal.value.slice(0, props.limit ?? 5)
  const start = (currentPage.value - 1) * pageSize.value
  return pedidosLocal.value.slice(start, start + pageSize.value)
})
</script>

<template>
  <div class="mt-4">
    <div class="overflow-hidden rounded-xl border bg-white shadow">
      <table class="min-w-full divide-y">
        <thead class="bg-slate-100">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium">Cliente</th>
            <th class="px-6 py-3 text-left text-xs font-medium">Itens</th>
            <th class="px-6 py-3 text-left text-xs font-medium">Pagamento</th>
            <th class="px-6 py-3 text-left text-xs font-medium">Parcelas</th>
            <th class="px-6 py-3 text-left text-xs font-medium">Ações</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="pedido in pedidosPaginados" :key="pedido.id">
            <td class="px-6 py-4">{{ pedido.cliente.nome }}</td>
            <td class="px-6 py-4">
              {{ pedido.itens.map(i => i.nomeProduto).join(', ') }}
            </td>

            <td class="px-6 py-4">
              <span
                class="cursor-pointer rounded-full px-3 py-1 text-xs"
                :class="pedido.statusDePagamento === 'PAGO'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'"
                @click="pedido.statusDePagamento === 'PENDENTE' && mudarStatusParaPago(pedido)"
              >
                {{ pedido.statusDePagamento }}
              </span>
            </td>

            <td class="px-6 py-4">
              {{ pedido.parcelasTotais - pedido.parcelasRestantes }}/{{ pedido.parcelasTotais }}
            </td>

            <td class="px-6 py-4 flex gap-3">
              <Eye class="w-5 h-5 cursor-pointer text-primary" @click="visualizarPedido(pedido)" />
              <Pencil class="w-5 h-5 cursor-pointer text-primary" @click="editarPedido(pedido)" />
              <Trash2 class="w-5 h-5 cursor-pointer text-red-600" @click="abrirModalDelete(pedido)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 🔥 MODAIS CORRETOS (SEM v-model, COM key) -->

    <ModalEditPedido
  v-if="modalAtivo === 'edit' && pedidoAtivo"
  :key="`edit-${pedidoAtivo.id}`"
  :model-value="modalAtivo === 'edit'"
  :pedido="pedidoAtivo"
  @update:modelValue="resetarModal"
  @submit="atualizarPedidoNaLista"
/>

<ModalViewPedido
  v-if="modalAtivo === 'view' && pedidoAtivo"
  :key="`view-${pedidoAtivo.id}`"
  :model-value="modalAtivo === 'view'"
  :pedido="pedidoAtivo"
  @update:modelValue="resetarModal"
/>

<ModalDeletePedido
  v-if="modalAtivo === 'delete' && pedidoAtivo"
  :key="`delete-${pedidoAtivo.id}`"
  :model-value="modalAtivo === 'delete'"
  :pedido="pedidoAtivo"
  @update:modelValue="resetarModal"
  @deleted="deletarPedido"
/>


  </div>
</template>
