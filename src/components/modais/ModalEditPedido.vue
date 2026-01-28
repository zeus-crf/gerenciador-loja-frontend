<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { Plus, Trash2, X } from 'lucide-vue-next'
import ModalNewItem from './ModalNewItem.vue'

// ======================
// Interfaces
// ======================
interface Parcela {
  numero: number
  valor: number
  dataVencimento: string
  status: 'ABERTA' | 'PAGA' | 'VENCIDA'
  paga?: boolean
}

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
  parcelas: Parcela[]
  formaPagamento: 'PIX' | 'CREDITO' | 'DEBITO' | 'DINHEIRO'
}

export interface PedidoDto {
  idCliente: string
  parcelasTotais: number
  parcelasRestantes: number
  parcelasPagas:number
  statusDePagamento: 'PAGO' | 'PENDENTE'
  formaPagamento: 'PIX' | 'CREDITO' | 'DEBITO' | 'DINHEIRO'
  dataPrimeiroVencimento: string
  valorParcelas: number
  diaVencimento: number
  itens: {
    nome: string
    quantidade: number
    preco: number
    tamanho: string
  }[]
  parcelas: Parcela[]
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
}

interface Cliente {
  id: string
  nome: string
}

// ======================
// Props / Emits
// ======================
const props = defineProps<{ modelValue: boolean; pedido?: PedidoBackend | null }>()
const emit = defineEmits(['update:modelValue', 'submit', 'toast'])

// ======================
// Form state
// ======================
const getEmptyForm = (): NovoPedido => ({
  idCliente: '',
  itens: [],
  parcelasTotais: 1,
  parcelasRestantes: 1,
  parcelasPagas: 0,
  parcelas: [],
  formaPagamento: 'CREDITO'
})

const formData = ref<NovoPedido>(getEmptyForm())
const clienteSelecionadoObj = ref<{ label: string; value: string } | null>(null)
const showItemModal = ref(false)
const clientes = ref<Cliente[]>([])

const internalShow = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const isEditMode = computed(() => !!props.pedido)

// ======================
// Funções de data seguras
// ======================
function criarDataLocal(ano: number, mes: number, dia: number): Date {
  return new Date(ano, mes - 1, dia)
}

function formatarDataLocal(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function toDateStringSafe(d?: string | Date | number[]): string {
  if (!d) return ''
  if (Array.isArray(d) && d.length === 3) {
    const [ano, mes, dia] = d
    return formatarDataLocal(criarDataLocal(ano, mes, dia))
  } else if (d instanceof Date) {
    return formatarDataLocal(d)
  } else if (typeof d === 'string') {
    const [ano, mes, dia] = d.split('T')[0].split('-').map(Number)
    return formatarDataLocal(criarDataLocal(ano, mes, dia))
  } else {
    const hoje = new Date()
    return formatarDataLocal(criarDataLocal(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate()))
  }
}

function formatDateBR(date?: string | Date) {
  if (!date) return ''
  let d: Date
  if (date instanceof Date) d = date
  else {
    const [ano, mes, dia] = toDateStringSafe(date).split('-').map(Number)
    d = criarDataLocal(ano, mes, dia)
  }
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

// ======================
// Clientes
// ======================
const clienteSelecionado = computed(() =>
  clientes.value.find(c => c.id === formData.value.idCliente)
)

watch(clienteSelecionadoObj, val => {
  formData.value.idCliente = val?.value || ''
})

const removerClienteSelecionado = () => {
  clienteSelecionadoObj.value = null
  formData.value.idCliente = ''
}

const clienteItems = computed(() =>
  clientes.value.map(c => ({ label: c.nome, value: c.id }))
)

onMounted(async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/clientes`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    clientes.value = res.data._embedded?.clienteList || res.data || []

    // Preencher cliente selecionado se for edição
    if (props.pedido) {
      const c = clientes.value.find(cl => cl.id === props.pedido!.cliente.id)
      if (c) clienteSelecionadoObj.value = { label: c.nome, value: c.id }
    }
  } catch {
    emit('toast', { message: 'Erro ao carregar clientes', type: 'error' })
  }
})

// ======================
// Itens
// ======================
const openItemModal = () => (showItemModal.value = true)
const addItemFromModal = (item: ItemPedidoForm) => {
  if (!item?.nome || item.quantidade <= 0 || item.preco <= 0) return
  formData.value.itens.push({ ...item })
}
const removeItem = (index: number) => formData.value.itens.splice(index, 1)

// ======================
// Financeiro
// ======================
const total = computed(() =>
  formData.value.itens.reduce((acc,i) => acc + i.preco*i.quantidade,0)
)
const valorParcela = computed(() =>
  total.value / Math.max(formData.value.parcelasTotais,1)
)
const formatCurrency = (v:number) =>
  v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})

// ======================
// Atualiza parcelas
// ======================
const atualizarParcelas = () => {
  const totalParcelas = formData.value.parcelasTotais
  const parcelasPagas = formData.value.parcelasPagas

  let firstDate: Date
  if (formData.value.parcelas[0]?.dataVencimento) {
    const [ano, mes, dia] = formData.value.parcelas[0].dataVencimento.split('-').map(Number)
    firstDate = criarDataLocal(ano, mes, dia)
  } else if (isEditMode.value && props.pedido?.dataPrimeiroVencimento) {
    const [ano, mes, dia] = props.pedido.dataPrimeiroVencimento.split('-').map(Number)
    firstDate = criarDataLocal(ano, mes, dia)
  } else {
    const hoje = new Date()
    firstDate = criarDataLocal(hoje.getFullYear(), hoje.getMonth()+1, hoje.getDate())
  }

  formData.value.parcelas = []
  for (let i=0; i<totalParcelas; i++) {
    const novaData = criarDataLocal(firstDate.getFullYear(), firstDate.getMonth()+1 + i, firstDate.getDate())
    formData.value.parcelas.push({
      numero: i+1,
      valor: valorParcela.value,
      status: i < parcelasPagas ? 'PAGA' : 'ABERTA',
      dataVencimento: formatarDataLocal(novaData),
      paga: i < parcelasPagas
    })
  }

  formData.value.parcelasRestantes = totalParcelas - parcelasPagas
}

// ======================
// Watch do pedido para edição
// ======================
watch(
  () => props.pedido,
  pedido => {
    if (!pedido || !isEditMode.value) return

    const parcelasConvertidas: Parcela[] = (pedido.parcelas ?? []).map(p => {
      let dataStr = ''
      if (Array.isArray(p.dataVencimento) && p.dataVencimento.length === 3) {
        const [ano, mes, dia] = p.dataVencimento
        dataStr = formatarDataLocal(criarDataLocal(ano, mes, dia))
      } else if (typeof p.dataVencimento === 'string') {
        const [ano, mes, dia] = p.dataVencimento.split('T')[0].split('-').map(Number)
        dataStr = formatarDataLocal(criarDataLocal(ano, mes, dia))
      } else {
        const hoje = new Date()
        dataStr = formatarDataLocal(criarDataLocal(hoje.getFullYear(), hoje.getMonth()+1, hoje.getDate()))
      }
      return { numero: p.numero, valor: p.valor, status: p.status, dataVencimento: dataStr, paga: p.status==='PAGA' }
    })

    Object.assign(formData.value,{
      idCliente: pedido.cliente.id,
      itens: pedido.itens.map(i=>({ id:i.id, nome:i.nomeProduto, quantidade:i.quantidade, preco:i.precoUnitario, tamanho:i.tamanho })),
      parcelasTotais: pedido.parcelasTotais,
      parcelasRestantes: pedido.parcelasRestantes,
      parcelasPagas: pedido.parcelasPagas ?? 0,
      parcelas: parcelasConvertidas,
      formaPagamento: pedido.formaPagamento ?? formData.value.formaPagamento
    })

    atualizarParcelas()
  },
  { immediate:true }
)

// ======================
// Fechar modal
// ======================
const closeModal = () => {
  internalShow.value = false
  Object.assign(formData.value,getEmptyForm())
  clienteSelecionadoObj.value = null
}

// ======================
// Salvar pedido
// ======================
const salvarPedido = async () => {
  try {
    if (!formData.value.idCliente) throw new Error('Selecione um cliente')
    if (formData.value.itens.length===0) throw new Error('Adicione itens')

    const token = localStorage.getItem('token')
    const baseUrl = import.meta.env.VITE_API_URL

    const dataPrimeiroVencimento = toDateStringSafe(formData.value.parcelas[0]?.dataVencimento)

    const payload: PedidoDto = {
      idCliente: formData.value.idCliente,
      parcelasTotais: formData.value.parcelasTotais,
      parcelasPagas: formData.value.parcelasPagas,
      parcelasRestantes: formData.value.parcelasRestantes,
      statusDePagamento: formData.value.parcelasRestantes===0 ? 'PAGO':'PENDENTE',
      formaPagamento: formData.value.formaPagamento || 'CREDITO',
      dataPrimeiroVencimento,
      valorParcelas: valorParcela.value,
      diaVencimento: formData.value.parcelas[0]
        ? new Date(toDateStringSafe(formData.value.parcelas[0].dataVencimento)).getDate()
        : new Date().getDate(),
      itens: formData.value.itens.map(i=>({nome:i.nome, quantidade:i.quantidade, preco:i.preco, tamanho:i.tamanho})),
      parcelas: formData.value.parcelas.map(p=>({ numero:p.numero, valor:p.valor, dataVencimento:toDateStringSafe(p.dataVencimento), status:p.paga?'PAGA':'ABERTA'}))
    }

    const res = isEditMode.value && props.pedido
      ? await axios.put(`${baseUrl}/pedidos/${props.pedido.id}`,payload,{headers:{Authorization:`Bearer ${token}`}})
      : await axios.post(`${baseUrl}/pedidos`,payload,{headers:{Authorization:`Bearer ${token}`}})

    const pedidoAtualizado = res.data
    const parcelasPagas = pedidoAtualizado.parcelas.filter((p:any)=>p.status==='PAGA').length
    const pedidoNormalizado = { ...pedidoAtualizado, parcelasPagas, parcelasRestantes: pedidoAtualizado.parcelasTotais - parcelasPagas, parcelas: pedidoAtualizado.parcelas.map((p:any)=>({...p, paga:p.status==='PAGA'})) }

    emit('toast',{ message: isEditMode.value ? 'Pedido atualizado com sucesso!' : 'Pedido criado com sucesso!', type:'success'})
    emit('submit',pedidoNormalizado)
    closeModal()
  } catch(err:any) {
    emit('toast',{ message: err.response?.data?.message || err.message || 'Erro ao salvar pedido', type:'error' })
  }
}

// ======================
// Parcela checkbox
// ======================
watch(()=>formData.value.parcelas.map(p=>p.paga),()=>{
  const pagas = formData.value.parcelas.filter(p=>p.paga).length
  formData.value.parcelasPagas = pagas
  formData.value.parcelasRestantes = formData.value.parcelasTotais - pagas
},{ deep:true })

const canSubmit = computed(()=>!!formData.value.idCliente && formData.value.itens.length>0)
const parcelasHeaders = [
  { title:'Parcela', key:'numero'},
  { title:'Valor', key:'valor'},
  { title:'Vencimento', key:'dataVencimento'},
  { title:'Pagar', key:'paga'},
  { title:'Status', key:'status'}
]

function togglePagamento(parcela:Parcela){
  if(parcela.status==='VENCIDA') return
  parcela.paga = !parcela.paga
  parcela.status = parcela.paga ? 'PAGA':'ABERTA'
}
</script>


<template>
  <Teleport to="body">
    <div v-if="internalShow" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div class="w-full max-w-4xl max-h-[90vh] rounded-xl bg-white shadow-2xl flex flex-col overflow-hidden">
        <!-- HEADER -->
        <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3 flex-shrink-0">
          <div class="flex flex-col leading-tight">
            <p class="text-lg font-bold text-slate-900">{{ isEditMode ? 'Editar Pedido' : 'Novo Pedido' }}</p>
            <p class="text-sm text-slate-500">{{ isEditMode ? 'Altere os dados do pedido.' : 'Preencha os dados abaixo.' }}</p>
          </div>
          <button @click="closeModal" class="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
            <X />
          </button>
        </div>

        <!-- BODY -->
        <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
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
              Cliente selecionado:
              <span class="font-semibold">{{ clienteSelecionado.nome }}</span>
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
            <button @click="openItemModal" class="mt-3 flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20">
              <Plus /> Adicionar Produto
            </button>
          </div>

           <div class="mt-4 text-right flex flex-col gap-2">
              <p class="text-sm text-slate-600">Total do Pedido:</p>
              <p class="text-2xl font-bold text-slate-900">{{ formatCurrency(total) }}</p>
              <p class="text-sm text-slate-600 mt-1">
                Restante: <span class="font-semibold text-slate-900">{{ formData.parcelasRestantes }}x de {{ formatCurrency(valorParcela) }}</span>
              </p>
          </div>
          <!-- PARCELAS -->
          <div>
          <h2 class="text-lg font-bold text-slate-900 pb-2">Parcelas</h2>

          <v-data-table
            :items="formData.parcelas"
            :headers="parcelasHeaders"
            item-key="numero"
            class="elevation-1"
            hide-default-footer
            :no-data-text="'Nenhuma parcela definida'"
          >
            <!-- Nº Parcela -->
            <template #item.numero="{ item }">
              {{ item.numero }}
            </template>

            <!-- Valor -->
            <template #item.valor="{ item }">
              {{ formatCurrency(item.valor) }}
            </template>

            <!-- Data de Vencimento -->
            <template #item.dataVencimento="{ item }">
                <v-menu
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  attach="body"
                  z-index="10000"
                >
                  <template #activator="{ props }">
                    <v-text-field
                      v-bind="props"
                      :model-value="formatDateBR(item.dataVencimento)"
                      density="compact"
                      variant="outlined"
                      hide-details
                      style="max-width: 180px"
                      readonly
                      :disabled="item.status === 'PAGA'"
                    />
                  </template>

                  <v-date-picker
                    v-model="item.dataVencimento"
                    color="primary"
                    show-adjacent-months
                  />
                </v-menu>
              </template>



            
        <!-- Pagar -->
         <template #item.paga="{ item }">
            <input
              type="checkbox"
              :checked="item.paga"
              :disabled="item.status === 'VENCIDA'"
              @click="togglePagamento(item)"
              class="checkbox-pagar"
            />
          </template>



            <!-- Status -->
            <template #item.status="{ item }">
             <v-chip
              :color="item.status === 'PAGA'
                ? 'green'
                : item.status === 'VENCIDA'
                ? 'red'
                : 'yellow'"
              :text-color="item.status === 'ABERTA' ? 'black' : 'white'"
              size="small"
            >
              {{ item.status }}
            </v-chip>

            </template>
          </v-data-table>
        </div>


          <!-- TOTAL E PARCELAS -->

              <div class="flex justify-end gap-3 items-center">
                <!-- Parcelas Totais -->
                <v-text-field
                  v-model.number="formData.parcelasTotais"
                  label="Parcelas Totais"
                  type="number"
                  min="1"
                  variant="outlined"
                  hide-details
                  style="width: 120px"
                  @change="atualizarParcelas"
                />

                <v-text-field
                :model-value="formData.parcelasPagas"
                label="Parcelas Pagas"
                type="number"
                variant="outlined"
                hide-details
                style="width: 120px"
                readonly
              />
              
              <v-select
                v-model="formData.formaPagamento"
                label="Forma de pagamento"
                :items="[
                  { title: 'Dinheiro', value: 'DINHEIRO' },
                  { title: 'Crédito', value: 'CREDITO' },
                  { title: 'Débito', value: 'DEBITO' },
                  { title: 'PIX', value: 'PIX' }
                ]"
                variant="outlined"
                hide-details
                style="width: 120px"
                attach="body"
                :menu-props="{ zIndex: 10001 }"
              />




              </div>

        </div>

        <!-- FOOTER -->
        <div class="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <button @click="closeModal" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-900 hover:bg-slate-300">Cancelar</button>
          <button @click="salvarPedido" :disabled="!canSubmit" class="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50">
            {{ isEditMode ? 'Salvar Alterações' : 'Salvar Pedido' }}
          </button>
        </div>
      </div>

      <!-- MODAL ITEM -->
      <ModalNewItem v-model="showItemModal" @add="addItemFromModal" />
    </div>
  </Teleport>
</template>

<style scoped>
.checkbox-pagar {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #16a34a; /* verde */
}

.checkbox-pagar:disabled {
  cursor: not-allowed;
  accent-color: #9ca3af; /* cinza */
}
</style>



