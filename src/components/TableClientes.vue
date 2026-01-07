<script setup lang="ts">
import { computed } from 'vue'
import { Eye, Pencil, Trash2 } from 'lucide-vue-next'

/* ======================
   TIPOS
====================== */
export interface Cliente {
  id: string
  nome: string
  email?: string
  telefone?: string
  notas?: string
}

/* ======================
   PROPS / EMITS
====================== */
const props = defineProps<{
  clientes: Cliente[]
  loading: boolean
  currentPage: number
  pageSize: number
}>()

const emit = defineEmits<{
  (e: 'view', cliente: Cliente): void
  (e: 'edit', cliente: Cliente): void
  (e: 'delete', cliente: Cliente): void
  (e: 'changePage', page: number): void
}>()

/* ======================
   PAGINAÇÃO
====================== */
const totalClientes = computed(() => props.clientes.length)

const totalPages = computed(() =>
  Math.ceil(totalClientes.value / props.pageSize)
)

const clientesPaginados = computed(() => {
  const start = (props.currentPage - 1) * props.pageSize
  return props.clientes.slice(start, start + props.pageSize)
})

const startItem = computed(() =>
  totalClientes.value === 0
    ? 0
    : (props.currentPage - 1) * props.pageSize + 1
)

const endItem = computed(() =>
  Math.min(props.currentPage * props.pageSize, totalClientes.value)
)

const pagesToShow = computed(() => {
  const pages: number[] = []
  for (let i = 1; i <= totalPages.value; i++) {
    pages.push(i)
  }
  return pages
})

const prevPage = () => {
  if (props.currentPage > 1) {
    emit('changePage', props.currentPage - 1)
  }
}

const nextPage = () => {
  if (props.currentPage < totalPages.value) {
    emit('changePage', props.currentPage + 1)
  }
}

const goToPage = (page: number) => emit('changePage', page)
</script>

<template>
  <div class="mt-4">
    <div class="overflow-hidden rounded-xl border bg-white shadow">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y">
          <thead class="bg-slate-100">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Cliente
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Telefone
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Notas
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Ações
              </th>
            </tr>
          </thead>

          <tbody class="divide-y">
            <!-- LOADING -->
            <tr v-if="loading">
              <td colspan="5" class="px-6 py-4 text-center text-slate-500">
                Carregando...
              </td>
            </tr>

            <!-- VAZIO -->
            <tr v-else-if="!loading && totalClientes === 0">
              <td colspan="5" class="px-6 py-4 text-center text-slate-500">
                Nenhum cliente encontrado
              </td>
            </tr>

            <!-- DADOS -->
            <tr
              v-else
              v-for="cliente in clientesPaginados"
              :key="cliente.id"
              class="hover:bg-slate-50"
            >
              <td class="px-6 py-4 font-medium text-slate-900">
                {{ cliente.nome }}
              </td>

              <td class="px-6 py-4 text-slate-600">
                {{ cliente.email || '—' }}
              </td>

              <td class="px-6 py-4 text-slate-600">
                {{ cliente.telefone || '—' }}
              </td>

              <td class="px-6 py-4 text-slate-600">
                {{ cliente.notas || '—' }}
              </td>

              <td class="px-6 py-4">
                <div class="flex gap-3">
                  <button
                    class="text-primary hover:text-slate-800"
                    @click="emit('view', cliente)"
                  >
                    <Eye class="w-5 h-5" />
                  </button>

                  <button
                    class="text-primary hover:text-primary-dark"
                    @click="emit('edit', cliente)"
                  >
                    <Pencil class="w-5 h-5" />
                  </button>

                  <button
                    class="text-red-600 hover:text-red-800"
                    @click="emit('delete', cliente)"
                  >
                    <Trash2 class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINAÇÃO -->
      <div class="flex items-center justify-between border-t px-4 py-3 bg-slate-50">
        <p class="text-sm text-slate-500">
          <span v-if="totalClientes > 0">
            Mostrando {{ startItem }} a {{ endItem }} de {{ totalClientes }}
          </span>
          <span v-else>Nenhum registro para exibir</span>
        </p>

        <div class="flex items-center gap-1">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="px-2 py-1 rounded hover:bg-slate-200 disabled:opacity-50"
          >
            ‹
          </button>

          <button
            v-for="page in pagesToShow"
            :key="page"
            @click="goToPage(page)"
            :class="
              page === currentPage
                ? 'bg-primary text-white px-3 py-1 rounded'
                : 'px-3 py-1 rounded hover:bg-slate-100'
            "
          >
            {{ page }}
          </button>

          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-2 py-1 rounded hover:bg-slate-200 disabled:opacity-50"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
