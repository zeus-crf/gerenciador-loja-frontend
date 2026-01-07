<script setup lang="ts">
import { computed } from 'vue'
import { X, Trash2 } from 'lucide-vue-next'

// ======================
// Tipos
// ======================
interface Pedido {
  id: string
  cliente: { nome: string }
}

// ======================
// Props / Emits
// ======================
const props = defineProps<{
  modelValue: boolean
  pedido?: Pedido | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'deleted', id: string): void
}>()

// ======================
// Controle modal
// ======================
const show = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const close = () => show.value = false

const confirmar = () => {
  if (props.pedido) {
    emit('deleted', props.pedido.id)
  }
  close()
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">

      <!-- HEADER -->
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <h2 class="text-lg font-bold text-slate-900">Excluir Pedido</h2>
        <button @click="close" class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200">
          <X />
        </button>
      </div>

      <!-- BODY -->
      <div class="p-6 text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Trash2 class="text-red-600" />
        </div>

        <p class="text-slate-700">
          Tem certeza que deseja excluir o pedido do cliente
          <strong>{{ pedido?.cliente.nome }}</strong>?
        </p>

        <p class="mt-2 text-sm text-slate-500">
          Esta ação não poderá ser desfeita.
        </p>
      </div>

      <!-- FOOTER -->
      <div class="flex justify-end gap-3 px-6 py-4 border-t bg-slate-50">
        <button
          @click="close"
          class="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300"
        >
          Cancelar
        </button>

        <button
          @click="confirmar"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
        >
          <Trash2 class="w-4 h-4" />
          Excluir
        </button>
      </div>

    </div>
  </div>
</template>
