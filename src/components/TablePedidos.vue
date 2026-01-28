<script setup lang="ts">
import { ref, computed } from 'vue'
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

interface Parcela {
  numero: number
  valor: number
  dataVencimento: string
  status: 'ABERTA' | 'PAGA' | 'VENCIDA'
  paga?: boolean
}
export interface PedidoTable {
  id: string

  cliente: {
    id: string
    nome: string
    telefone?: string
    email?: string
  }

  itens: {
    nomeProduto: string
  }[]

  statusDePagamento: 'PAGO' | 'PENDENTE'
  formaPagamento: 'PIX' | 'CREDITO' | 'DEBITO' | 'DINHEIRO'

  parcelasTotais: number
  parcelasRestantes: number

  
  parcelas?: Parcela[]

  proximaParcelaVencimento?: string
  dataCriacao?: string
}


interface PedidoBackend {
  id: string
  cliente: { id: string; nome: string }
  itens: {
    id?: string
    nomeProduto: string
    precoUnitario: number
    quantidade: number
    tamanho: string
  }[]
  parcelasTotais: number
  parcelasRestantes: number
  parcelasPagas: number
  parcelas: Parcela[]
  statusDePagamento: 'PAGO' | 'PENDENTE'
  formaPagamento: 'PIX' | 'CREDITO' | 'DEBITO' | 'DINHEIRO'
  dataPrimeiroVencimento: string
  valorParcelas: number
  diaVencimento: number
  dataCriacao?: string

  // necessário porque é criado no computed
  proximaParcelaVencimento?: string
}



// Pedido usado no modal de visualização
interface PedidoView extends PedidoBackend {
  parcelasPagas: number
}



// ======================
// Props / Emits
// ======================
const props = defineProps<{
  pedidos: PedidoBackend[]
  loading: boolean
  dashboard?: boolean
  limit?: number
}>()

const emit = defineEmits<{
  (e: 'deleted', id: string): void
  (e: 'updated', pedido: PedidoBackend): void
}>()

// ======================
// Estado local
// ======================
const toast = useToast()
const modalAtivo = ref<'edit' | 'view' | 'delete' | null>(null)
const pedidoAtivo = ref<PedidoView | null>(null)

// ======================
// Utils
// ======================
function formatarData(data: number[] | string | undefined) {
  if (!data) return '—'

  let dateObj: Date

  if (Array.isArray(data)) {
    const [ano, mes, dia] = data
    dateObj = new Date(ano, mes - 1, dia)
  } else {
    // Corrigido: cria data local a partir da string sem deslocamento de fuso
    const [ano, mes, dia] = data.split('-').map(Number)
    dateObj = new Date(ano, mes - 1, dia)
  }

  return dateObj.toLocaleDateString('pt-BR')
}


// ======================
// Funções de modal
// ======================
function resetarModal() {
  modalAtivo.value = null
  pedidoAtivo.value = null
}

function editarPedido(pedido: PedidoBackend | PedidoTable) {
  pedidoAtivo.value = JSON.parse(JSON.stringify(pedido))
  modalAtivo.value = 'edit'
}


function visualizarPedido(pedido: PedidoBackend | PedidoTable) {
  pedidoAtivo.value = {
    ...JSON.parse(JSON.stringify(pedido)),
    parcelasPagas:
      'parcelasTotais' in pedido && 'parcelasRestantes' in pedido
        ? pedido.parcelasTotais - pedido.parcelasRestantes
        : 0
  } as PedidoView

  modalAtivo.value = 'view'
}

function abrirModalDelete(pedido: PedidoBackend | PedidoTable) {
  pedidoAtivo.value = JSON.parse(JSON.stringify(pedido))
  modalAtivo.value = 'delete'
}
// ======================
// Atualizar / Deletar
// ======================
function atualizarPedidoNaLista(pedidoAtualizado: PedidoBackend) {
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

  emit('updated', pedidoNormalizado)
}



async function deletarPedido(id: string) {
  try {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('Sessão expirada')

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

// ======================
// Mudar status pagamento
// ======================
async function mudarStatusParaPago(pedido: PedidoBackend | PedidoTable) {
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

    atualizarPedidoNaLista(response.data as PedidoBackend)
    toast.success('Pedido marcado como PAGO!')
  } catch (err) {
    console.error(err)
    toast.error('Erro ao atualizar status')
  }
}



// ======================
// Paginação
// ======================
const currentPage = ref(1)
const pageSize = ref(8)

const totalPedidos = computed(() => props.pedidos.length)
const totalPages = computed(() => Math.ceil(totalPedidos.value / pageSize.value))

const pedidosPaginados = computed(() => {
  let lista = props.pedidos

  if (props.dashboard) {
    // Ordena por data de criação decrescente e pega os últimos 5 pedidos
    lista = [...lista]
      .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
      .slice(0, 5)
  } else {
    // Paginação normal
    const start = (currentPage.value - 1) * pageSize.value
    lista = lista.slice(start, start + pageSize.value)
  }

  return lista.map(p => {
    const proximaParcela = p.parcelas
  ?.filter(parcela => parcela.status === 'ABERTA')
  .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime())[0]

    const pedidoMapeado = {
      ...p,
      proximaParcelaVencimento: proximaParcela
        ? formatarData(proximaParcela.dataVencimento)
        : '—'
    }

    console.log('[Pedidos Paginados] Pedido:', pedidoMapeado)

    return pedidoMapeado
  })
})




const startItem = computed(() =>
  totalPedidos.value === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1
)

const endItem = computed(() =>
  Math.min(currentPage.value * pageSize.value, totalPedidos.value)
)

const pagesToShow = computed(() => {
  const pages: number[] = []
  for (let i = 1; i <= totalPages.value; i++) pages.push(i)
  return pages
})

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}
const goToPage = (page: number) => (currentPage.value = page)
</script>


<template>
  <div class="mt-4">
    <div class="overflow-hidden rounded-xl border bg-white shadow">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-100">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cliente</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Itens</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pagamento</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Forma de pagamento</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Parcelas</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Dia de Vencimento</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ações</th>
            </tr>
          </thead>

          <tbody class="bg-white divide-y divide-slate-200">
            <tr v-if="props.loading">
              <td colspan="5" class="px-6 py-6 text-center text-slate-500">Carregando...</td>
            </tr>

            <tr v-else-if="!props.loading && pedidosPaginados.length === 0">
              <td colspan="5" class="px-6 py-6 text-center text-slate-400">Nenhum pedido encontrado</td>
            </tr>

            <tr v-else v-for="pedido in pedidosPaginados" :key="pedido.id" class="hover:bg-slate-50">
              <td class="px-6 py-4 font-medium text-slate-900">{{ pedido.cliente.nome }}</td>
              <td class="px-6 py-4 font-medium text-slate-900">{{ pedido.itens.map(i => i.nomeProduto).join(', ') }}</td>
              <td class="px-6 py-4 text-sm">
                <span
                  class="cursor-pointer rounded-full px-3 py-1 text-xs font-medium"
                  :class="pedido.statusDePagamento === 'PAGO' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
                  @click="pedido.statusDePagamento === 'PENDENTE' && mudarStatusParaPago(pedido)"
                >
                  {{ pedido.statusDePagamento }}
                </span>
              </td>
              <td class="px-6 py-4 font-medium text-slate-900">{{ pedido.formaPagamento }}</td>
              <td class="px-6 py-4 text-sm text-slate-700">{{ pedido.parcelasTotais - pedido.parcelasRestantes }}/{{ pedido.parcelasTotais }}</td>
              <td class="px-6 py-4 font-medium text-slate-900">{{ pedido.proximaParcelaVencimento  || '-'}}</td>
              <td class="px-6 py-4 flex gap-3">
                <Eye class="w-5 h-5 cursor-pointer text-primary" @click="visualizarPedido(pedido)" />
                <Pencil class="w-5 h-5 cursor-pointer text-primary" @click="editarPedido(pedido)" />
                <Trash2 class="w-5 h-5 cursor-pointer text-red-600" @click="abrirModalDelete(pedido)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINAÇÃO -->
      
<div v-if="!props.dashboard" class="flex items-center justify-between border-t px-4 py-3 bg-slate-50">
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
      class="px-2 py-1 rounded hover:bg-slate-200 disabled:opacity-50"
    >
      ‹
    </button>

    <button
      v-for="page in pagesToShow"
      :key="page"
      @click="goToPage(page)"
      :class="page === currentPage
        ? 'bg-primary text-white px-3 py-1 rounded'
        : 'px-3 py-1 rounded hover:bg-slate-100'"
    >
      {{ page }}
    </button>

    <button
      @click="nextPage"
      :disabled="currentPage === totalPages"
      class="px-2 py-1 rounded hover:bg-slate-200 disabled:opacity-50"
    >
      ›
    </button>
  </div>
</div>
</div>


    <!-- MODAIS -->
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
