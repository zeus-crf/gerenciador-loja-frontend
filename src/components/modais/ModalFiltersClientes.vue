<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Check, Calendar, Filter } from 'lucide-vue-next'

/* ================= INTERFACE ================= */
export interface ClienteFilters {
  nome: string
  email: string
  telefone: string
  endereco: string
  dataInicial: string
  dataFinal: string
  ordenacao: 'RECENTE' | 'ANTIGO'
}

/* ================= PROPS ================= */
const props = defineProps<{
  modelValue: boolean
  currentFilters?: Partial<ClienteFilters>
}>()

/* ================= EMITS ================= */
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'applyFilters', filters: ClienteFilters): void
  (e: 'clearFilters'): void
  (e: 'error', msg: string): void
}>()

/* ================= STATE ================= */
const emptyFilters: ClienteFilters = {
  nome: '',
  email: '',
  telefone: '',
  endereco: '',
  dataInicial: '',
  dataFinal: '',
  ordenacao: 'RECENTE'
}

const formData = ref<ClienteFilters>({ ...emptyFilters })

/* ================= SYNC COM PAI ================= */
watch(
  () => props.currentFilters,
  (newFilters) => {
    if (newFilters) {
      formData.value = { ...emptyFilters, ...newFilters }
    }
  },
  { immediate: true }
)

/* ================= MODAL ================= */
const internalShow = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const close = () => (internalShow.value = false)

/* ================= HELPERS ================= */
const normalize = (value: string | null | undefined) =>
  value?.trim() ?? ''

/* ================= ACTIONS ================= */
const clearFilters = () => {
  formData.value = { ...emptyFilters }
  emit('clearFilters')
  close()
}

const applyFilters = () => {
  // Normaliza e garante string
  const payload: ClienteFilters = {
    nome: normalize(formData.value.nome),
    email: normalize(formData.value.email),
    telefone: normalize(formData.value.telefone),
    endereco: normalize(formData.value.endereco),
    dataInicial: normalize(formData.value.dataInicial),
    dataFinal: normalize(formData.value.dataFinal),
    ordenacao: formData.value.ordenacao || 'RECENTE'
  }

  if (payload.dataInicial && payload.dataFinal && payload.dataInicial > payload.dataFinal) {
    emit('error', 'A data inicial não pode ser maior que a data final')
    return
  }

  emit('applyFilters', payload)
  close()
}
</script>

<template>
  <div
    v-if="internalShow"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
  >
    <div class="w-full max-w-2xl rounded-xl bg-background-light shadow-2xl overflow-hidden">

      <!-- HEADER -->
      <div class="flex justify-between items-center p-6 border-b border-slate-200">
        <div>
          <p class="text-xl font-bold text-slate-900">Filtrar Clientes</p>
          <p class="text-sm text-slate-500">Refine a lista de clientes usando os critérios abaixo.</p>
        </div>
        <button @click="close" class="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
          <X />
        </button>
      </div>

      <!-- BODY -->
      <div class="p-6 flex flex-col gap-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="flex flex-col">
            <p class="pb-2 text-sm font-medium text-slate-700 flex items-center gap-2">
              <Calendar class="w-5 h-5" /> Data Inicial
            </p>
            <input type="date" v-model="formData.dataInicial"
              class="form-input h-11 w-full rounded-lg border border-slate-300 p-2.5 focus:border-primary focus:outline-none" />
          </label>

          <label class="flex flex-col">
            <p class="pb-2 text-sm font-medium text-slate-700 flex items-center gap-2">
              <Calendar class="w-5 h-5" /> Data Final
            </p>
            <input type="date" v-model="formData.dataFinal"
              class="form-input h-11 w-full rounded-lg border border-slate-300 p-2.5 focus:border-primary focus:outline-none" />
          </label>
        </div>

        <!-- ORDENAÇÃO -->
        <div>
          <h2 class="text-lg font-bold text-slate-900 pb-2 flex items-center gap-2">
            <Filter class="w-5 h-5" /> Ordenação
          </h2>

          <div class="flex gap-2">
            <label v-for="o in ['RECENTE','ANTIGO']" :key="o"
              class="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-slate-300 p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
              <input type="radio" class="form-radio h-4 w-4 text-primary" name="filter_order" :value="o" v-model="formData.ordenacao" />
              <span class="ml-3 text-sm font-medium text-slate-800">{{ o==='RECENTE'?'Mais recente':'Mais antigo' }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
        <button @click="clearFilters" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-900 hover:bg-slate-300">Limpar Filtros</button>
        <button @click="applyFilters" class="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 flex items-center gap-1">
          <Check class="w-4 h-4" /> Aplicar Filtros
        </button>
      </div>

    </div>
  </div>
</template>
