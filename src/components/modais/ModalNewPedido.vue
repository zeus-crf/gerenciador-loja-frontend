<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { Plus, Trash2, X } from 'lucide-vue-next'
import ModalNewItem from './ModalNewItem.vue'

// ======================
// Interfaces
// ======================
interface ItemPedidoDto {
  nome: string
  quantidade: number
  preco: number
  tamanho: string
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

interface NovoPedido {
  idCliente: string
  itens: ItemPedidoDto[]
  parcelasTotais: number
  parcelasRestantes: number
  statusDePagamento: 'PAGO' | 'PENDENTE'
}

interface Cliente {
  id: string
  nome: string
}

// ======================
// Props / Emits
// ======================
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', pedido: PedidoBackend): void
  (e: 'error', msg: string): void
}>()

// ======================
// Controle do modal
// ======================
const internalShow = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
const close = () => (internalShow.value = false)

// ======================
// Estado do formulário
// ======================
const formData = ref<NovoPedido>({
  idCliente: '',
  itens: [],
  parcelasTotais: 1,
  parcelasRestantes: 1,
  statusDePagamento: 'PENDENTE'
})
const paymentStatusFront = ref<'paid' | 'pending' | 'installment'>('pending')

// ======================
// Clientes
// ======================
const clientes = ref<Cliente[]>([])
const clienteSelecionadoId = ref('')
const clienteSearch = ref('')

// Computed para pegar cliente selecionado
const clienteSelecionado = computed(() => {
  const found = clientes.value.find(c => c.id === clienteSelecionadoId.value)
  console.log('Computando clienteSelecionado:', clienteSelecionadoId.value, found)
  return found
})

// Carrega clientes da API
onMounted(async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('http://localhost:8080/clientes', {
      headers: { Authorization: `Bearer ${token}` }
    })
    clientes.value = res.data._embedded?.clienteList || res.data || []
    console.log('Clientes carregados:', clientes.value)
  } catch (err) {
    console.error('Erro ao carregar clientes:', err)
    emit('error', 'Erro ao carregar clientes')
  }
})

// Transforma clientes para o combobox
const clienteItems = computed(() => {
  const items = clientes.value.map(c => ({
    label: c.nome,
    value: c.id
  }))
  console.log('clienteItems:', items)
  return items
})

// Watch para sincronizar formData
watch(clienteSelecionadoId, id => {
  console.log('clienteSelecionadoId mudou:', id)
  formData.value.idCliente = id || ''
})
// ======================
// Watchers de parcelas
// ======================
watch(paymentStatusFront, status => {
  if (status === 'paid') {
    formData.value.parcelasTotais = 1
    formData.value.parcelasRestantes = 0
  }
  if (status === 'pending') {
    formData.value.parcelasTotais = 1
    formData.value.parcelasRestantes = 1
  }
  if (status === 'installment') {
    if (formData.value.parcelasTotais < 2) formData.value.parcelasTotais = 2
    formData.value.parcelasRestantes = formData.value.parcelasTotais
  }
})

watch(() => formData.value.parcelasTotais, val => {
  if (paymentStatusFront.value !== 'paid') {
    formData.value.parcelasRestantes = val
  }
})

// ======================
// Itens
// ======================
const showItemModal = ref(false)
const addItemFromModal = (item: ItemPedidoDto) => formData.value.itens.push(item)
const removeItem = (index: number) => formData.value.itens.splice(index, 1)

// ======================
// Total
// ======================
const total = computed(() =>
  formData.value.itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0)
)
const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const valorParcela = computed(() => {
  if (paymentStatusFront.value !== 'installment' || formData.value.parcelasTotais < 1) return 0
  return total.value / formData.value.parcelasTotais
})

const removerClienteSelecionado = () => {
  console.log('Removendo seleção')
  clienteSelecionadoId.value = ''
  clienteSearch.value = ''
  formData.value.idCliente = ''
}

// ======================
// Salvar Pedido
// ======================
const salvarPedido = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('Token ausente')
    if (!formData.value.idCliente) throw new Error('Selecione um cliente')
    if (formData.value.itens.length === 0) throw new Error('Adicione itens')

    formData.value.statusDePagamento =
      paymentStatusFront.value === 'paid' ? 'PAGO' : 'PENDENTE'

    const res = await axios.post('http://localhost:8080/pedidos', formData.value, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const pedidoCriado: PedidoBackend = {
      id: res.data.id,
      cliente: clienteSelecionado.value!,
      itens: formData.value.itens.map(i => ({
        nomeProduto: i.nome,
        quantidade: i.quantidade,
        precoUnitario: i.preco,
        tamanho: i.tamanho
      })),
      parcelasTotais: formData.value.parcelasTotais,
      parcelasRestantes: formData.value.parcelasRestantes,
      parcelasPagas: formData.value.parcelasTotais - formData.value.parcelasRestantes,
      statusDePagamento: formData.value.statusDePagamento,
      dataCriacao: res.data.dataCriacao
    }

    emit('submit', pedidoCriado)
    close()

    // RESET
    formData.value = { idCliente: '', itens: [], parcelasTotais: 1, parcelasRestantes: 1, statusDePagamento: 'PENDENTE' }
    clienteSelecionadoId.value = ''
    clienteSearch.value = ''
    paymentStatusFront.value = 'pending'
  } catch (err: any) {
    emit('error', err.message || 'Erro ao criar pedido')
  }
}

const canSubmit = computed(
  () => !!formData.value.idCliente && formData.value.itens.length > 0 && total.value > 0
)
</script>

<template>
  <div v-if="internalShow" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="w-full max-w-4xl rounded-xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
      <!-- HEADER -->
      <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <p class="text-lg font-bold text-slate-900">Novo Pedido</p>
          <p class="text-sm text-slate-500">Preencha os dados abaixo para criar um novo pedido.</p>
        </div>
        <button @click="close" class="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
          <X />
        </button>
      </div>

      <!-- BODY -->
      <div class="flex-grow overflow-y-auto p-6 flex flex-col gap-6">
        <!-- CLIENTE -->
        <div>
          <h2 class="text-lg font-bold text-slate-900 pb-2">Dados do Cliente</h2>
          <v-combobox
            v-model="clienteSelecionadoId"
            v-model:search-input="clienteSearch"
            :items="clienteItems"
            item-title="label"
            item-value="value"
            label="Selecione o cliente"
            clearable
            variant="outlined"
            hide-details
            :return-object="false"
          />

        <p v-if="clienteSelecionado" class="mt-2 text-sm text-slate-600">
          Cliente selecionado: <span class="font-semibold">{{ clienteSelecionado.nome }}</span>
          <X 
            class="inline ml-2 cursor-pointer" 
            @click="removerClienteSelecionado" 
          />
        </p>

        </div>

        <!-- ITENS -->
        <div>
          <h2 class="text-lg font-bold text-slate-900 pb-2">Itens do Pedido</h2>
          <table class="w-full border border-slate-200 rounded-lg overflow-hidden">
            <thead class="bg-slate-100">
              <tr>
                <th class="px-4 py-2 text-left">Produto</th>
                <th class="px-4 py-2 text-left">Qtd.</th>
                <th class="px-4 py-2 text-left">Preço Unit.</th>
                <th class="px-4 py-2 text-left">Subtotal</th>
                <th class="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in formData.itens" :key="index" class="border-b border-slate-200">
                <td class="px-4 py-2">{{ item.nome }}</td>
                <td class="px-4 py-2">{{ item.quantidade }}</td>
                <td class="px-4 py-2">{{ formatCurrency(item.preco) }}</td>
                <td class="px-4 py-2">{{ formatCurrency(item.preco * item.quantidade) }}</td>
                <td class="px-4 py-2">
                  <button @click="removeItem(index)" class="text-red-500 hover:text-red-700"><Trash2 /></button>
                </td>
              </tr>
              <tr v-if="formData.itens.length === 0">
                <td colspan="5" class="px-4 py-6 text-center text-slate-500">Nenhum item adicionado</td>
              </tr>
            </tbody>
          </table>
          <button @click="showItemModal = true" class="mt-3 flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20">
            <Plus /> Adicionar Produto
          </button>
        </div>

        <!-- TOTAL -->
        <div class="mt-4 text-right">
          <p class="text-sm text-slate-600">Total do Pedido:</p>
          <p class="text-2xl font-bold text-slate-900">{{ formatCurrency(total) }}</p>
          <p v-if="paymentStatusFront === 'installment'" class="text-sm text-slate-600">
            {{ formData.parcelasTotais }}x de <span class="font-semibold">{{ formatCurrency(valorParcela) }}</span>
          </p>
        </div>

        <!-- PAGAMENTO -->
        <div class="pt-5 border-t border-slate-200 flex flex-col gap-6">
          <h2 class="text-lg font-bold text-slate-900 tracking-tight">Detalhes do Pagamento</h2>
          <v-select
            v-model="paymentStatusFront"
            label="Status do pagamento"
            :items="[
              { title: 'Pago', value: 'paid' },
              { title: 'Pendente', value: 'pending' },
              { title: 'Parcelado', value: 'installment' }
            ]"
            variant="outlined"
            density="compact"
          />
          <div v-if="paymentStatusFront !== 'paid'" class="flex flex-col gap-1">
            <v-text-field
              v-model.number="formData.parcelasTotais"
              label="Número de parcelas totais"
              type="number"
              min="1"
              variant="outlined"
              density="comfortable"
              hide-details
            />
            <p class="text-sm text-slate-500">
              O pedido será criado com <span class="font-semibold">{{ formData.parcelasTotais }}</span> parcela(s) restante(s).
            </p>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 flex-shrink-0">
        <button @click="close" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-900 hover:bg-slate-300">Cancelar</button>
        <button @click="salvarPedido" :disabled="!canSubmit" class="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed">Salvar Pedido</button>
      </div>
    </div>

    <!-- MODAL ITEM -->
    <ModalNewItem v-model="showItemModal" @add="addItemFromModal" />
  </div>
</template>
