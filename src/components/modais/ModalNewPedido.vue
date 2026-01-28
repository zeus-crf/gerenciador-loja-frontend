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
}

interface Parcela {
  numero: number
  valor: number
  dataVencimento: string
  status: 'ABERTA' | 'PAGA' | 'VENCIDA'
}

interface PedidoBackend {
  id: string
  cliente: { id: string; nome: string }
  itens: ItemPedido[]
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
  proximaParcelaVencimento?: string
}

interface NovoPedido {
  id?: string
  idCliente: string
  itens: ItemPedidoDto[]
  parcelasTotais: number
  parcelasRestantes: number
  statusDePagamento: 'PAGO' | 'PENDENTE'
  formaPagamento?: string
  dataPrimeiroVencimento?: Date
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

const clienteSelecionadoObj = ref<{ label: string; value: string } | null>(null)
watch(clienteSelecionadoObj, val => {
  formData.value.idCliente = val?.value || ''
})

// ======================
// Controle do modal
// ======================
const internalShow = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
const close = () => (internalShow.value = false)
const menu = ref(false)

// ======================
// Estado do formulário
// ======================
const formData = ref<NovoPedido>({
  id: undefined,
  idCliente: '',
  itens: [],
  parcelasTotais: 1,
  parcelasRestantes: 1,
  statusDePagamento: 'PENDENTE',
  formaPagamento: undefined,
  dataPrimeiroVencimento: undefined
})

const paymentStatusFront = ref<'paid' | 'pending' | 'installment'>('pending')

// ======================
// Clientes
// ======================
const clientes = ref<Cliente[]>([])
const clienteSelecionadoId = ref('')
const clienteSearch = ref('')

const clienteSelecionado = computed(() =>
  clientes.value.find(c => c.id === clienteSelecionadoId.value)
)

onMounted(async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL
    const token = localStorage.getItem('token')
    const res = await axios.get(`${baseUrl}/clientes`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    clientes.value = res.data._embedded?.clienteList || res.data || []
  } catch {
    emit('error', 'Erro ao carregar clientes')
  }
})

const clienteItems = computed(() =>
  clientes.value.map(c => ({ label: c.nome, value: c.id }))
)
watch(clienteSelecionadoId, id => {
  formData.value.idCliente = id || ''
})

// ======================
// Watchers de parcelas
// ======================
watch(paymentStatusFront, status => {
  if (status === 'paid') {
    formData.value.parcelasTotais = 1
    formData.value.parcelasRestantes = 0
    formData.value.dataPrimeiroVencimento = undefined
  }
  if (status === 'pending') {
    formData.value.parcelasTotais = 1
    formData.value.parcelasRestantes = 1
    formData.value.dataPrimeiroVencimento = undefined
  }
  if (status === 'installment') {
    if (formData.value.parcelasTotais < 2) formData.value.parcelasTotais = 2
    formData.value.parcelasRestantes = formData.value.parcelasTotais
  }
})

watch(() => formData.value.parcelasTotais, val => {
  if (paymentStatusFront.value === 'installment') {
    formData.value.parcelasRestantes = val
  }
})

// ======================
// Itens
// ======================
const showItemModal = ref(false)
const addItemFromModal = (item: ItemPedidoDto) => {
  formData.value.itens.push({
    nome: item.nome,
    quantidade: item.quantidade,
    preco: item.preco,
    tamanho: item.tamanho
  })
}
const removeItem = (index: number) => formData.value.itens.splice(index, 1)

// ======================
// Total e parcelas
// ======================
const total = computed(() =>
  formData.value.itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0)
)

const valorParcela = computed(() => {
  if (paymentStatusFront.value !== 'installment') return 0
  return total.value / formData.value.parcelasTotais
})

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// ======================
// Normalizar pedido
// ======================
const normalizarPedido = (p: any): PedidoBackend => {
  const parcelas = p.parcelas ?? []
  return {
    id: p.id,
    cliente: p.cliente,
    itens: p.itens.map((i: any) => ({
      id: i.id,
      nomeProduto: i.nomeProduto ?? i.nome,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario ?? i.preco,
      tamanho: i.tamanho
    })),
    parcelasTotais: p.parcelasTotais ?? parcelas.length,
    parcelasRestantes: p.parcelasRestantes ?? parcelas.filter((x: any) => x.status !== 'PAGA').length,
    parcelasPagas: p.parcelasPagas ?? parcelas.filter((x: any) => x.status === 'PAGA').length,
    parcelas,
    statusDePagamento: p.statusDePagamento,
    formaPagamento: ["PIX", "CREDITO", "DEBITO", "DINHEIRO"].includes(p.formaPagamento)
      ? (p.formaPagamento as "PIX" | "CREDITO" | "DEBITO" | "DINHEIRO")
      : "CREDITO",
    dataCriacao: p.dataCriacao,
    dataPrimeiroVencimento: p.dataPrimeiroVencimento ?? (parcelas[0]?.dataVencimento ?? new Date().toISOString().substring(0, 10)),
    valorParcelas: p.valorParcelas ?? (parcelas[0]?.valor ?? 0),
    diaVencimento: p.diaVencimento ?? (parcelas[0] ? new Date(parcelas[0].dataVencimento).getDate() : new Date().getDate()),
    proximaParcelaVencimento: parcelas.find((x: any) => x.status !== 'PAGA')?.dataVencimento
  }
}
// ======================
// Função para gerar parcelas
// ======================
function gerarParcelas(): Parcela[] {
  if (!formData.value.dataPrimeiroVencimento) return []

  const parcelas: Parcela[] = []
  const dia = formData.value.dataPrimeiroVencimento.getDate()
  const mes = formData.value.dataPrimeiroVencimento.getMonth()
  const ano = formData.value.dataPrimeiroVencimento.getFullYear()
  const total = formData.value.parcelasTotais
  const valor = total > 0 ? total / formData.value.parcelasTotais : 0

  for (let i = 0; i < total; i++) {
    // Cria data local e mantém o mesmo dia
    const novaData = new Date(ano, mes + i, dia)

    parcelas.push({
      numero: i + 1,
      valor,
      status: 'ABERTA',
      // Formato YYYY-MM-DD mas **local**, sem deslocamento UTC
      dataVencimento: `${novaData.getFullYear()}-${String(novaData.getMonth() + 1).padStart(2, '0')}-${String(novaData.getDate()).padStart(2, '0')}`
    })
  }

  return parcelas
}

// ======================
// Salvar pedido
// ======================
const salvarPedido = async () => {
  try {
    if (!formData.value.idCliente) throw new Error('Selecione um cliente')
    if (formData.value.itens.length === 0) throw new Error('Adicione itens')
    if (paymentStatusFront.value === 'installment' && !formData.value.dataPrimeiroVencimento)
      throw new Error('Informe a data de vencimento da primeira parcela')

    formData.value.statusDePagamento =
      paymentStatusFront.value === 'paid' ? 'PAGO' : 'PENDENTE'

    const baseUrl = import.meta.env.VITE_API_URL
    const token = localStorage.getItem('token')

    // Gera as parcelas caso seja parcelado
    const parcelas = paymentStatusFront.value === 'installment' ? gerarParcelas() : []

    const valorParcelasCalculado =
      paymentStatusFront.value === 'installment'
        ? parcelas[0]?.valor || 0
        : total.value

    const payload = {
      ...formData.value,
      parcelas,
      valorParcelas: valorParcelasCalculado,
      diaVencimento: formData.value.dataPrimeiroVencimento
        ? formData.value.dataPrimeiroVencimento.getDate()
        : new Date().getDate(),
      formaPagamento: formData.value.formaPagamento ?? 'CREDITO'
    }

    let res
    if (formData.value.id) {
      // edição
      res = await axios.put(`${baseUrl}/pedidos/${formData.value.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } else {
      // criação
      res = await axios.post(`${baseUrl}/pedidos`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
    }

    emit('submit', normalizarPedido(res.data))
    close()

    // reset do form
    formData.value = {
      id: undefined,
      idCliente: '',
      itens: [],
      parcelasTotais: 1,
      parcelasRestantes: 1,
      statusDePagamento: 'PENDENTE',
      formaPagamento: undefined,
      dataPrimeiroVencimento: undefined
    }
    paymentStatusFront.value = 'pending'
    clienteSelecionadoId.value = ''
    clienteSearch.value = ''
  } catch (err: any) {
    emit('error', err.message || 'Erro ao criar/atualizar pedido')
  }
}

const canSubmit = computed(
  () =>
    !!formData.value.idCliente &&
    formData.value.itens.length > 0 &&
    total.value > 0
)

const removerClienteSelecionado = () => {
  clienteSelecionadoId.value = ''
  clienteSearch.value = ''
  formData.value.idCliente = ''
}

// ======================
// Data formatada
// ======================
const dataPrimeiroVencimentoFormatada = computed({
  get: () => {
    const valor = formData.value.dataPrimeiroVencimento
    if (!valor) return ''

    let d: Date
    if (typeof valor === 'string') {
      // aqui garantimos que é string
      const [ano, mes, dia] = (valor as string).split('-').map(Number)
      d = new Date(ano, mes - 1, dia)
    } else {
      d = valor
    }

    return new Intl.DateTimeFormat('pt-BR').format(d)
  },
  set: (val: string) => {
    const [dia, mes, ano] = val.split('/').map(Number)
    if (dia && mes && ano) formData.value.dataPrimeiroVencimento = new Date(ano, mes - 1, dia)
  }
})

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
              v-model="clienteSelecionadoObj"
              :items="clienteItems"
              item-title="label"
              item-value="value"
              label="Selecione o cliente"
              clearable
              variant="outlined"
              hide-details
              return-object
            />

          <p v-if="clienteSelecionado" class="mt-2 text-sm text-slate-600">
            Cliente selecionado: <span class="font-semibold">{{ clienteSelecionado.nome }}</span>
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
          <h2 class="text-lg font-bold text-slate-900">Detalhes do Pagamento</h2>

          <v-select
            v-model="paymentStatusFront"
            label="Status do pagamento"
            :items="[
              { title: 'Pago', value: 'paid' },
              { title: 'Pendente', value: 'pending' },
              { title: 'Parcelado', value: 'installment' }
            ]"
            variant="outlined"
          />

          <v-select
            v-if="paymentStatusFront !== 'pending'"
            v-model="formData.formaPagamento"
            label="Forma de pagamento"
            :items="[
              { title: 'Dinheiro', value: 'DINHEIRO' },
              { title: 'Crédito', value: 'CREDITO' },
              { title: 'Débito', value: 'DEBITO' },
              { title: 'PIX', value: 'PIX' }
            ]"
            variant="outlined"
          />

          <div v-if="paymentStatusFront === 'installment'" class="flex gap-4 items-end">
            <v-text-field
              v-model.number="formData.parcelasTotais"
              label="Total de parcelas"
              type="number"
              min="2"
              variant="outlined"
            />
            <v-menu v-model="menu" :close-on-content-click="false" :nudge-width="200" transition="scale-transition" offset-y min-width="auto">
              <template #activator="{ props: menuProps }">
                <v-text-field v-model="dataPrimeiroVencimentoFormatada" label="Data da primeira parcela" readonly v-bind="menuProps" variant="outlined" />
              </template>
              <v-date-picker
              v-model="formData.dataPrimeiroVencimento"
              locale="pt-BR"
              :min="new Date()"
              @input="menu = false"
            />
            </v-menu>
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
