<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Check, Calendar, Filter } from 'lucide-vue-next'

/* ================= INTERFACE ================= */
export interface Filters {
  status: 'PAGO' | 'PENDENTE' | 'TODOS'
  dataInicial: string | null
  dataFinal: string | null
  ordem: 'RECENTE' | 'ANTIGO'
}

/* ================= PROPS ================= */
const props = defineProps<{
  modelValue: boolean
  currentFilters?: Filters
}>()

/* ================= EMITS ================= */
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'applyFilters', filters: Filters): void
  (e: 'clearFilters'): void
  (e: 'error', msg: string): void
}>()

/* ================= STATE ================= */
const formData = ref<Filters>({
  status: 'TODOS',
  dataInicial: null,
  dataFinal: null,
  ordem: 'RECENTE'
})

/* ================= SYNC COM PAI ================= */
watch(
  () => props.currentFilters,
  (newFilters) => {
    if (newFilters) {
      formData.value = { ...newFilters }
    }
  },
  { immediate: true }
)

/* ================= MODAL ================= */
const internalShow = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const close = () => {
  internalShow.value = false
}

/* ================= ACTIONS ================= */
const clearFilters = () => {
  formData.value = {
    status: 'TODOS',
    dataInicial: null,
    dataFinal: null,
    ordem: 'RECENTE'
  }
  emit('clearFilters')
  close()
}

const applyFilters = () => {
  const { dataInicial, dataFinal } = formData.value

  if (dataInicial && dataFinal && dataInicial > dataFinal) {
    emit('error', 'A data inicial não pode ser maior que a data final')
    return
  }

  emit('applyFilters', { ...formData.value })
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
          <p class="text-xl font-bold text-slate-900">Filtrar Pedidos</p>
          <p class="text-sm text-slate-500">
            Refine a lista de pedidos usando os critérios abaixo.
          </p>
        </div>

        <button @click="close" class="h-10 w-10 flex items-center justify-center rounded-lg
                                   bg-slate-100 hover:bg-slate-200 text-slate-600">
          <X />
        </button>
      </div>

      <!-- BODY -->
      <div class="p-6 flex flex-col gap-6">

        <!-- STATUS -->
        <div>
          <h2 class="text-lg font-bold text-slate-900 pb-2 flex items-center gap-2">
            <Filter class="w-5 h-5" />
            Status do Pagamento
          </h2>

          <div class="flex flex-wrap gap-2">
            <label
              v-for="s in ['PAGO', 'PENDENTE', 'TODOS']"
              :key="s"
              class="flex flex-1 cursor-pointer items-center justify-center rounded-lg
                     border border-slate-300 p-3
                     has-[:checked]:border-primary
                     has-[:checked]:bg-primary/10"
            >
              <input
                type="radio"
                class="form-radio h-4 w-4 text-primary"
                name="filter_status"
                :value="s"
                v-model="formData.status"
              />
              <span class="ml-3 text-sm font-medium text-slate-800">
                {{ s === 'TODOS' ? 'Todos' : s === 'PAGO' ? 'Pago' : 'Pendente' }}
              </span>
            </label>
          </div>
        </div>

        <!-- DATAS -->
        <div>
          <h2 class="text-lg font-bold text-slate-900 pb-2 flex items-center gap-2">
            <Calendar class="w-5 h-5" />
            Período de Criação
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="flex flex-col">
              <p class="pb-2 text-sm font-medium text-slate-700">Data Inicial</p>
              <input
                type="date"
                v-model="formData.dataInicial"
                class="form-input h-11 w-full rounded-lg
                       border border-slate-300 p-2.5
                       focus:border-primary focus:outline-none"
              />
            </label>

            <label class="flex flex-col">
              <p class="pb-2 text-sm font-medium text-slate-700">Data Final</p>
              <input
                type="date"
                v-model="formData.dataFinal"
                class="form-input h-11 w-full rounded-lg
                       border border-slate-300 p-2.5
                       focus:border-primary focus:outline-none"
              />
            </label>
          </div>
        </div>

        <!-- ORDENAÇÃO -->
        <div>
          <h2 class="text-lg font-bold text-slate-900 pb-2 flex items-center gap-2">
            <Filter class="w-5 h-5" />
            Ordenação
          </h2>

          <div class="flex gap-2">
            <label
              v-for="o in ['RECENTE', 'ANTIGO']"
              :key="o"
              class="flex flex-1 cursor-pointer items-center justify-center rounded-lg
                     border border-slate-300 p-3
                     has-[:checked]:border-primary
                     has-[:checked]:bg-primary/10"
            >
              <input
                type="radio"
                class="form-radio h-4 w-4 text-primary"
                name="filter_order"
                :value="o"
                v-model="formData.ordem"
              />
              <span class="ml-3 text-sm font-medium text-slate-800">
                {{ o === 'RECENTE' ? 'Mais recente' : 'Mais antigo' }}
              </span>
            </label>
          </div>
        </div>

      </div>

      <!-- FOOTER -->
      <div class="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
        <button @click="clearFilters"
                class="px-4 py-2 rounded-lg bg-slate-200 text-slate-900 hover:bg-slate-300">
          Limpar Filtros
        </button>

        <button @click="applyFilters"
                class="px-4 py-2 rounded-lg bg-primary text-white
                       hover:bg-primary/90 flex items-center gap-1">
          <Check class="w-4 h-4" />
          Aplicar Filtros
        </button>
      </div>

    </div>
  </div>
</template>
