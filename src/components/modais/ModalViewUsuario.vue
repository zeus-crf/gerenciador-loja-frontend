<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

/* =======================
   TIPOS
======================= */
interface Usuario {
  id: string
  username: string
  createdAt?: string | null
}

/* =======================
   PROPS & EMIT
======================= */
const props = defineProps<{
  modelValue: boolean
  usuario: Usuario | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const show = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const close = () => (show.value = false)

/* =======================
   FUNÇÕES
======================= */
const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
  >
    <div
      class="flex w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
    >

      <!-- HEADER -->
      <div
        class="flex items-center justify-between gap-3 border-b border-slate-200 p-4 sm:p-6"
      >
        <p class="text-xl font-bold text-slate-900">
          Detalhes do Usuário
        </p>

        <button
          @click="close"
          class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- BODY -->
      <div class="grid grid-cols-1 gap-8 p-4 sm:p-6 md:grid-cols-2 md:gap-12">

        <!-- ESQUERDA -->
        <div class="flex flex-col gap-6">
          <!-- PERFIL -->
          <div class="flex items-center gap-4">
            <div
              class="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary"
            >
              {{ props.usuario?.username?.charAt(0)?.toUpperCase() || '?' }}
            </div>

            <div>
              <p class="text-xl font-bold text-slate-900">
                {{ props.usuario?.username || '—' }}
              </p>
              <p class="text-sm text-slate-500">
                Usuário do sistema
              </p>
            </div>
          </div>

          <!-- INFO -->
          <div class="flex flex-col">
            <div
              class="grid grid-cols-[auto_1fr] gap-x-4 border-t border-slate-200 py-4"
            >
              <p class="text-sm text-slate-500">ID</p>
              <p class="break-all text-sm text-slate-800">
                {{ props.usuario?.id || '—' }}
              </p>
            </div>

            <div
              class="grid grid-cols-[auto_1fr] gap-x-4 border-t border-slate-200 py-4"
            >
            
            </div>
          </div>
        </div>

        <!-- DIREITA -->
        <div class="flex flex-col justify-center">
          <div class="rounded-lg bg-slate-50 p-4">
            <p class="text-sm font-medium text-slate-700">
              Informações do sistema
            </p>
            <p class="mt-2 text-sm text-slate-500">
              Este usuário possui acesso ao painel administrativo e às
              funcionalidades do sistema conforme as permissões configuradas.
            </p>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div
        class="flex justify-end border-t border-slate-200 p-4 sm:p-6"
      >
        <button
          @click="close"
          class="h-10 rounded-lg bg-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-300"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>

