<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { Plus, Trash2, X } from 'lucide-vue-next'
import ModalNewItem from './ModalNewItem.vue'

interface ItemPedidoForm {
  id?: string
  nome: string
  quantidade: number
  preco: number
  tamanho: string
}

interface NovoPedido {
  idCliente: string
  itens: ItemPedidoForm[]
  parcelasTotais: number
  parcelasRestantes: number
  parcelasPagas: number
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
  parcelasPagas?: number
  statusDePagamento: 'PAGO' | 'PENDENTE'
}

interface Cliente {
  id: string
  name: string
}

/* =======================
   PROPS / EMITS
======================= */
const props = defineProps<{ modelValue: boolean; pedido?: PedidoBackend | null }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'submit', pedidoAtualizado: PedidoBackend): void
  (e: 'toast', payload: { message: string; type: 'success' | 'error' }): void
}>()

/* =======================
   ESTADO INICIAL
======================= */
const getEmptyForm = (): NovoPedido => ({
  idCliente: '',
  itens: [],
  parcelasTotais: 1,
  parcelasRestantes: 1,
  parcelasPagas: 0
})

const formData = ref<NovoPedido>(getEmptyForm())
const clienteSearch = ref('')
const paymentStatusFront = ref<'paid' | 'pending' | 'installment'>('pending')
const showItemModal = ref(false)

const internalShow = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const isEditMode = computed(() => !!props.pedido)

/* =======================
   FUNÇÕES
======================= */
const resetForm = () => {
  formData.value = getEmptyForm()
  clienteSearch.value = ''
  paymentStatusFront.value = 'pending'
}

const close = () => internalShow.value = false

const removerClienteSelecionado = () => {
  formData.value.idCliente = ''
  clienteSearch.value = ''
}

/* =======================
   WATCH MODAL
======================= */
watch(internalShow, (isOpen) => {
  if (!isOpen) return
  if (props.pedido) {
    // Popula formData para edição
    formData.value.idCliente = props.pedido.cliente.id
    formData.value.parcelasTotais = props.pedido.parcelasTotais || 1
    formData.value.parcelasRestantes = props.pedido.parcelasRestantes ?? 0
    formData.value.parcelasPagas = props.pedido.parcelasPagas !== undefined
      ? props.pedido.parcelasPagas
      : formData.value.parcelasTotais - formData.value.parcelasRestantes
    clienteSearch.value = props.pedido.cliente.nome

    // Carrega itens
    formData.value.itens = props.pedido.itens.map(i => ({
      id: i.id,
      nome: i.nomeProduto,
      preco: i.precoUnitario,
      quantidade: i.quantidade,
      tamanho: i.tamanho || ''
    }))

    if (formData.value.parcelasRestantes === 0) paymentStatusFront.value = 'paid'
    else if (formData.value.parcelasTotais > 1) paymentStatusFront.value = 'installment'
    else paymentStatusFront.value = 'pending'
  } else {
    resetForm()
  }
})

/* =======================
   CLIENTES
======================= */
const clientes = ref<Cliente[]>([])

onMounted(async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('http://localhost:8080/clientes', { headers: { Authorization: `Bearer ${token}` } })
    clientes.value = res.data._embedded?.clienteList || []
  } catch {
    emit('toast', { message: 'Erro ao carregar clientes', type: 'error' })
  }
})

watch(clienteSearch, val => {
  if (!val) {
    formData.value.idCliente = ''
    return
  }
  const cliente = clientes.value.find(c => c.name.toLowerCase() === val.toLowerCase())
  if (cliente) formData.value.idCliente = cliente.id
})

const clienteSelecionado = computed(() => clientes.value.find(c => c.id === formData.value.idCliente))

/* =======================
   ITENS
======================= */
const openItemModal = () => showItemModal.value = true

const addItemFromModal = (item: ItemPedidoForm) => {
  if (!item?.nome?.trim() || item.quantidade <= 0 || item.preco <= 0) return
  const exists = formData.value.itens.some(
    i => i.nome.trim().toLowerCase() === item.nome.trim().toLowerCase() &&
         i.tamanho.trim().toLowerCase() === item.tamanho.trim().toLowerCase()
  )
  if (!exists) formData.value.itens.push({ ...item })
}

const removeItem = (index: number) => formData.value.itens.splice(index, 1)

/* =======================
   FINANCEIRO
======================= */
const total = computed(() => formData.value.itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0))
const valorParcela = computed(() => total.value / Math.max(formData.value.parcelasTotais, 1))

watch([() => formData.value.parcelasTotais, () => formData.value.parcelasPagas], () => {
  formData.value.parcelasRestantes = Math.max(formData.value.parcelasTotais - formData.value.parcelasPagas, 0)
})

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/* =======================
   SALVAR PEDIDO
======================= */
const salvarPedido = async () => {
  try {
    const token = localStorage.getItem('token')
    console.log('Token usado:', token)

    if (!token) throw new Error('Sessão expirada. Faça login novamente.')

    const payload = {
      idCliente: formData.value.idCliente,
      parcelasTotais: formData.value.parcelasTotais,
      parcelasRestantes: formData.value.parcelasRestantes,
      parcelasPagas: formData.value.parcelasPagas,
      itens: formData.value.itens.map(i => ({
        id: i.id,
        nome: i.nome,
        preco: i.preco,
        quantidade: i.quantidade,
        tamanho: i.tamanho
      }))
    }

    console.log('Payload enviado:', payload)

    let pedidoAtualizado

    if (isEditMode.value && props.pedido) {
      console.log('Modo edição. Enviando PUT para:', `http://localhost:8080/pedidos/${props.pedido.id}`)
      
      const res = await axios.put(
        `http://localhost:8080/pedidos/${props.pedido.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      console.log('Resposta do backend:', res.data)

      const statusDePagamento = paymentStatusFront.value === 'paid'
      ? 'PAGO'
      : paymentStatusFront.value === 'pending'
        ? 'PENDENTE'
        : payload.parcelasRestantes === 0
          ? 'PAGO'
          : 'PENDENTE'


      pedidoAtualizado = {
        ...props.pedido,
        ...payload,
        statusDePagamento,
        parcelasPagas: payload.parcelasPagas,
        itens: payload.itens.map(i => ({
          id: i.id,
          nomeProduto: i.nome,
          precoUnitario: i.preco,
          quantidade: i.quantidade,
          tamanho: i.tamanho
        }))
      }

    } else {
      console.log('Modo criação. Enviando POST')
      const res = await axios.post(
        'http://localhost:8080/pedidos',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      pedidoAtualizado = res.data
    }

    console.log('Pedido atualizado:', pedidoAtualizado)
    emit('toast', { message: 'Pedido salvo com sucesso!', type: 'success' })
    emit('submit', pedidoAtualizado)
    close()

  } catch (err: any) {
    console.error('Erro ao salvar pedido:', err)
    const msg = err.response?.data?.message || err.message || 'Erro ao salvar'
    emit('toast', { message: msg, type: 'error' })
  }
}


const canSubmit = computed(() => !!formData.value.idCliente && formData.value.itens.length > 0)
</script>

<template>
  <div v-if="internalShow" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="w-full max-w-4xl rounded-xl bg-background-light shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
      <!-- HEADER -->
      <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div class="flex flex-col leading-tight">
          <p class="text-lg font-bold text-slate-900">{{ isEditMode ? 'Editar Pedido' : 'Novo Pedido' }}</p>
          <p class="text-sm text-slate-500">
            {{ isEditMode ? 'Altere os dados do pedido.' : 'Preencha os dados abaixo.' }}
          </p>
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
            v-model="clienteSearch"
            label="Digite o nome do cliente"
            :items="clientes.map(c => c.name)"
            clearable
            variant="outlined"
            hide-details
          />
          <p v-if="formData.idCliente" class="mt-2 text-sm text-slate-600">
            Cliente selecionado: <span class="font-semibold">{{ clienteSelecionado?.name }}</span>
            <X class="inline ml-2 cursor-pointer" @click="removerClienteSelecionado" />
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
                  <button @click="removeItem(index)" class="text-red-500 hover:text-red-700">
                    <Trash2 />
                  </button>
                </td>
              </tr>
              <tr v-if="formData.itens.length === 0">
                <td colspan="5" class="px-4 py-6 text-center text-slate-500">Nenhum item adicionado</td>
              </tr>
            </tbody>
          </table>
          <button @click="openItemModal" class="mt-3 flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20">
            <Plus /> Adicionar Produto
          </button>

          <!-- TOTAL -->
          <div class="mt-4 text-right">
            <p class="text-sm text-slate-600">Total do Pedido:</p>
            <p class="text-2xl font-bold text-slate-900">{{ formatCurrency(total) }}</p>
            <p class="text-sm text-slate-600">{{ formData.parcelasTotais }}x de <span class="font-semibold text-slate-900">{{ formatCurrency(valorParcela) }}</span></p>
          </div>
        </div>

        <!-- PAGAMENTO -->
        <div class="pt-6 border-t border-slate-200 flex flex-col gap-6">
          <h2 class="text-lg font-bold tracking-tight text-slate-900 pt-5">Detalhes do Pagamento</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="flex flex-col gap-2">
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
            </div>
            <div v-if="paymentStatusFront !== 'paid'" class="flex flex-col gap-2">
              <v-text-field
                v-model.number="formData.parcelasTotais"
                label="Número de parcelas totais"
                type="number"
                min="1"
                variant="outlined"
                density="comfortable"
                hide-details
              />
              <v-text-field
                v-if="isEditMode"
                v-model.number="formData.parcelasPagas"
                label="Parcelas já pagas"
                type="number"
                :min="0"
                :max="formData.parcelasTotais"
                variant="outlined"
                density="comfortable"
                hide-details
              />
              <p class="text-sm text-slate-500">
                Restam <span class="font-semibold text-slate-900">{{ formData.parcelasRestantes }}</span> parcela(s) de
                <span class="font-semibold text-slate-900">{{ formatCurrency(valorParcela) }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 flex-shrink-0">
        <button @click="close" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-900 hover:bg-slate-300">Cancelar</button>
        <button @click="salvarPedido" :disabled="!canSubmit" class="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed">
          {{ isEditMode ? 'Salvar Alterações' : 'Salvar Pedido' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Modal de Item -->
  <ModalNewItem
    v-model="showItemModal"
    @add="addItemFromModal"
  />
</template>
