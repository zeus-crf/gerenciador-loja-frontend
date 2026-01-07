<script setup lang="ts">
import { computed } from 'vue'
import { Search, Filter } from 'lucide-vue-next'

// ----------------------
// PROPS
// ----------------------
const props = defineProps<{
  modelValue: string
  placeholder?: string
  filterType?: string // tipo de filtro (cliente, pedido, etc.)
  page?: string
}>()

// ----------------------
// EMITS
// ----------------------
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'openFilter'): void
}>()

const page = props.page ?? 'default'

// ----------------------
// COMPUTED: Sincroniza v-model
// ----------------------
const internalValue = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val)
})

// ----------------------
// FUNÇÃO DO BOTÃO DE FILTRO
// ----------------------
const handleFilterClick = () => {
  emit('openFilter') // agora não precisa de parâmetro
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-white border border-gray-200">
    <!-- INPUT DE BUSCA -->
    <div class="relative flex-1 max-w-md">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <input
        type="text"
        v-model="internalValue"
        :placeholder="placeholder || 'Pesquisar...'"
        class="block w-full h-10 pl-10 pr-3 rounded-lg border-gray-200 bg-background-light focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
    </div>

    <!-- BOTÃO DE FILTRO -->
    <button
      class="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
      @click="handleFilterClick"
      v-if="page !== 'usuarios'"
    >
      <Filter class="w-4 h-4" />
      Filtros
    </button>
  </div>
</template>

<style scoped>
/* Nenhum estilo extra necessário além do Tailwind */
</style>
