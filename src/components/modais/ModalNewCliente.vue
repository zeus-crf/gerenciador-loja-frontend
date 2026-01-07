<script setup lang="ts">
import { ref, computed } from 'vue'
import axios from 'axios'
import { X } from 'lucide-vue-next'

interface ClienteForm {
  nome: string
  email?: string
  telefone?: string
  endereco?: string
  notas?: string
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved'): void
  (e: 'toast', payload: { message: string; type: 'success' | 'error' }): void
}>()

const show = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const close = () => show.value = false

// ======================
// Form
// ======================
const form = ref<ClienteForm>({
  nome: '',
  email: '',
  telefone: '',
  endereco: '',
  notas: ''
})

// ======================
// Actions
// ======================
const salvar = async () => {
  if (!form.value.nome.trim()) {
    emit('toast', { message: 'Nome é obrigatório', type: 'error' })
    return
  }

  try {
    const token = localStorage.getItem('token')

    await axios.post(
      'http://localhost:8080/clientes',
      form.value,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    emit('toast', { message: 'Cliente criado com sucesso!', type: 'success' })
    emit('saved')

    // reset
    form.value = {
      nome: '',
      email: '',
      telefone: '',
      endereco: '',
      notas: ''
    }

    close()
  } catch (err) {
    emit('toast', { message: 'Erro ao criar cliente', type: 'error' })
  }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">

      <!-- HEADER -->
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Novo Cliente</h2>
          <p class="text-sm text-slate-500">Cadastre um novo cliente</p>
        </div>
        <button @click="close" class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200">
          <X />
        </button>
      </div>

      <!-- BODY (LAYOUT AJUSTADO) -->
      <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Linha 1 -->
        <v-text-field
          v-model="form.nome"
          label="Nome *"
          variant="outlined"
          autofocus
        />

        <v-text-field
          v-model="form.telefone"
          label="Telefone"
          variant="outlined"
        />

        <!-- Linha 2 -->
        <v-text-field
          v-model="form.email"
          label="Email"
          variant="outlined"
        />

        <v-text-field
          v-model="form.endereco"
          label="Endereço"
          variant="outlined"
        />

        <!-- Linha 3 -->
        <v-textarea
          v-model="form.notas"
          label="Notas"
          variant="outlined"
          rows="3"
          class="md:col-span-2"
        />
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
          @click="salvar"
          class="px-4 py-2 rounded-lg bg-primary text-white"
        >
          Salvar Cliente
        </button>
      </div>

    </div>
  </div>
</template>
