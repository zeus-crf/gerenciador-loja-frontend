<script setup lang="ts">
import { ref, computed } from 'vue'

// =====================
// Interfaces
// =====================
interface ItemPedidoDto {
  nome: string
  quantidade: number
  preco: number
  tamanho: string
}

// =====================
// Props / Emits
// =====================
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'add', item: ItemPedidoDto): void
}>()

// =====================
// Controle do modal
// =====================
const internalShow = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const close = () => {
  internalShow.value = false
}

// =====================
// Novo item
// =====================
const newItem = ref({
  nomeProduto: '',
  tamanho: '',
  quantidade: 1,
  valorUnitario: 0
})

// =====================
// Validação
// =====================
const canAddItem = computed(() => {
  const nome = newItem.value.nomeProduto.trim()
  const tamanho = newItem.value.tamanho.trim()

  return (
    nome !== '' &&
    tamanho !== '' &&
    newItem.value.quantidade > 0 &&
    newItem.value.valorUnitario > 0
  )
})

// =====================
// Emitir item
// =====================
const addItemFromModal = () => {
  if (!canAddItem.value) return

  emit('add', {
    nome: `${newItem.value.nomeProduto} (${newItem.value.tamanho})`,
    quantidade: newItem.value.quantidade,
    preco: newItem.value.valorUnitario,
    tamanho: newItem.value.tamanho
  })

  // reset
  newItem.value = {
    nomeProduto: '',
    tamanho: '',
    quantidade: 1,
    valorUnitario: 0
  }

  close()
}
</script>
<template>
  <div
    v-if="internalShow"
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
  >
    <div
      class="w-full max-w-lg rounded-xl bg-background-light shadow-2xl p-6"
    >
      <!-- HEADER -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold flex items-center gap-2">
          Adicionar Item
        </h3>

        <button
          @click="internalShow = false"
          class="h-9 w-9 flex items-center justify-center rounded-lg
                 bg-slate-100 hover:bg-slate-200 text-slate-600"
        >
          <X />
        </button>
      </div>

      <!-- BODY -->
      <div class="flex flex-col gap-4">
        <!-- NOME -->
        <v-text-field
          v-model="newItem.nomeProduto"
          label="Nome do item"
          placeholder="ex: camisa"
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
        />

        <!-- TAMANHO -->
        <v-text-field
          v-model="newItem.tamanho"
          label="Tamanho"
          placeholder="ex: G"
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
        />

        <!-- QUANTIDADE -->
        <v-text-field
          v-model.number="newItem.quantidade"
          label="Quantidade"
          type="number"
          min="1"
          variant="outlined"
          density="comfortable"
          hide-details
        />

        <!-- PREÇO -->
        <v-text-field
          v-model.number="newItem.valorUnitario"
          label="Preço unitário"
          type="number"
          min="0"
          variant="outlined"
          density="comfortable"
          hide-details
          prefix="R$"
        />
      </div>

      <!-- FOOTER -->
      <div class="mt-6 flex justify-end gap-3">
        <button
          @click="internalShow = false"
          class="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300"
        >
          Cancelar
        </button>

        <button
        @click="addItemFromModal"
        :disabled="!canAddItem"
        class="px-4 py-2 rounded-lg bg-primary text-white
                hover:bg-primary/90
                disabled:opacity-50 disabled:cursor-not-allowed"
        >
        Adicionar
        </button>

      </div>
    </div>
  </div>
</template>

