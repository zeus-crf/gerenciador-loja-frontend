<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import axios from 'axios'
import { X } from 'lucide-vue-next'

interface Cliente {
  id: string
  nome: string
  email?: string
  telefone?: string
  endereco?: string
  notas?: string
}

const props = defineProps<{
  modelValue: boolean
  cliente: Cliente | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved', cliente: Cliente): void
  (e: 'toast', payload: { message: string; type: 'success' | 'error' }): void
}>()

// Controle de exibição do modal
const show = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

// Formulário
const form = ref<Cliente>({
  id: '',
  nome: '',
  email: '',
  telefone: '',
  endereco: '',
  notas: ''
})

// Popula o formulário quando o modal abre
watch(show, (open) => {
  if (open && props.cliente) {
    form.value = { ...props.cliente }
  }
})

// Fechar modal
const close = () => show.value = false

// Salvar alterações
const salvar = async () => {
  const token = localStorage.getItem('token')

  if (!token) {
    emit('toast', { message: 'Usuário não autenticado', type: 'error' })
    return
  }

  if (!form.value.id) {
    emit('toast', { message: 'ID do cliente inválido', type: 'error' })
    return
  }

  try {
    const res = await axios.put(
      `http://localhost:8080/clientes/${form.value.id}`,
      form.value,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    emit('toast', { message: 'Cliente atualizado com sucesso!', type: 'success' })
    emit('saved', res.data)
    close()
  } catch (err: any) {
    const msg = err.response?.data || 'Erro ao atualizar cliente'
    emit('toast', { message: msg, type: 'error' })
  }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">

      <!-- HEADER -->
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Editar Cliente</h2>
          <p class="text-sm text-slate-500">Atualize os dados do cliente</p>
        </div>
        <button @click="close" class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200">
          <X />
        </button>
      </div>

      <!-- BODY -->
      <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <v-text-field v-model="form.nome" label="Nome" variant="outlined" />
        <v-text-field v-model="form.telefone" label="Telefone" variant="outlined" />
        <v-text-field v-model="form.email" label="Email" variant="outlined" />
        <v-text-field v-model="form.endereco" label="Endereço" variant="outlined" />
        <v-textarea v-model="form.notas" label="Notas" variant="outlined" rows="3" class="md:col-span-2" />
      </div>

      <!-- FOOTER -->
      <div class="flex justify-end gap-3 px-6 py-4 border-t bg-slate-50">
        <button @click="close" class="px-4 py-2 rounded-lg bg-slate-200">
          Cancelar
        </button>
        <button @click="salvar" class="px-4 py-2 rounded-lg bg-primary text-white">
          Salvar Alterações
        </button>
      </div>

    </div>
  </div>
</template>
