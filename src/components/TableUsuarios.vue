<script setup lang="ts">
import { computed } from 'vue'
import { Eye, Pencil, Trash2 } from 'lucide-vue-next'

interface Usuario {
  id: string
  username?: string
}

// Props
const props = defineProps<{
  usuarios: Usuario[]
  loading: boolean
  currentPage: number
  pageSize: number
  totalUsuarios: number
}>()

// Emits
const emit = defineEmits<{
  (e: 'view', usuario: Usuario): void
  (e: 'edit', usuario: Usuario): void
  (e: 'delete', usuario: Usuario): void
  (e: 'changePage', page: number): void
}>()

// Paginação
const totalPages = computed(() =>
  props.totalUsuarios ? Math.ceil(props.totalUsuarios / props.pageSize) : 1
)

const pagesToShow = computed<(number | string)[]>(() => {
  const total = totalPages.value
  const current = props.currentPage
  const pages: (number | string)[] = []

  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

const handlePageClick = (page: number | string) => {
  if (typeof page === 'number') emit('changePage', page)
}

const prevPage = () => {
  if (props.currentPage > 1) emit('changePage', props.currentPage - 1)
}

const nextPage = () => {
  if (props.currentPage < totalPages.value) emit('changePage', props.currentPage + 1)
}

// Itens exibidos
const startItem = computed(() =>
  props.totalUsuarios === 0 ? 0 : (props.currentPage - 1) * props.pageSize + 1
)

const endItem = computed(() =>
  Math.min(props.currentPage * props.pageSize, props.totalUsuarios)
)
</script>

<template>
  <div class="overflow-hidden rounded-xl border bg-white shadow mt-4">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y">
        <thead class="bg-slate-100">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Username</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <!-- Loading -->
          <tr v-if="props.loading">
            <td colspan="2" class="px-6 py-4 text-center text-slate-500">Carregando...</td>
          </tr>

          <!-- Empty -->
          <tr v-else-if="!props.loading && (!props.usuarios || props.usuarios.length === 0)">
            <td colspan="2" class="px-6 py-4 text-center text-slate-500">Nenhum usuário encontrado</td>
          </tr>

          <!-- Data -->
          <tr v-else v-for="usuario in props.usuarios" :key="usuario.id" class="hover:bg-slate-50">
            <td class="px-6 py-4 font-medium text-slate-900">{{ usuario.username }}</td>
            <td class="px-6 py-4 text-right">
              <div class="flex justify-end gap-3">
                <button class="text-primary hover:text-slate-800" @click="$emit('view', usuario)">
                  <Eye class="w-5 h-5" />
                </button>
                <button class="text-primary hover:text-primary-dark" @click="$emit('edit', usuario)">
                  <Pencil class="w-5 h-5" />
                </button>
                <button class="text-red-600 hover:text-red-800" @click="$emit('delete', usuario)">
                  <Trash2 class="w-5 h-5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginação -->
    <div class="flex items-center justify-between border-t px-4 py-3 bg-slate-50">
      <p class="text-sm text-slate-500">
        <span v-if="props.totalUsuarios > 0">
          Mostrando {{ startItem }} a {{ endItem }} de {{ props.totalUsuarios }}
        </span>
        <span v-else>Nenhum registro para exibir</span>
      </p>

      <div class="flex items-center gap-1">
        <button @click="prevPage" :disabled="props.currentPage === 1" class="px-2 py-1 rounded hover:bg-slate-200 disabled:opacity-50">‹</button>

        <button
          v-for="page in pagesToShow"
          :key="page"
          @click="handlePageClick(page)"
          :class="page === props.currentPage
            ? 'bg-primary text-white px-3 py-1 rounded'
            : 'px-3 py-1 rounded hover:bg-slate-100'">
          {{ page }}
        </button>

        <button @click="nextPage" :disabled="props.currentPage === totalPages" class="px-2 py-1 rounded hover:bg-slate-200 disabled:opacity-50">›</button>
      </div>
    </div>
  </div>
</template>
