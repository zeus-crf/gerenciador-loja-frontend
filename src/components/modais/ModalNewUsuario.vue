<script setup lang="ts">
import { ref, computed } from 'vue'
import axios from 'axios'
import { X } from 'lucide-vue-next'

/* ======================
   TIPOS
====================== */
interface UsuarioForm {
  username: string
  password: string
  confirmPassword: string
}

/* ======================
   PROPS / EMITS
====================== */
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved'): void
  (e: 'toast', payload: { message: string; type: 'success' | 'error' }): void
}>()

/* ======================
   CONTROLE MODAL
====================== */
const show = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const close = () => (show.value = false)

/* ======================
   FORM
====================== */
const form = ref<UsuarioForm>({
  username: '',
  password: '',
  confirmPassword: ''
})

/* ======================
   ACTIONS
====================== */
const salvar = async () => {
  if (!form.value.username.trim()) {
    emit('toast', { message: 'Username é obrigatório', type: 'error' })
    return
  }

  if (!form.value.password) {
    emit('toast', { message: 'Senha é obrigatória', type: 'error' })
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    emit('toast', { message: 'As senhas não coincidem', type: 'error' })
    return
  }

  try {
    const token = localStorage.getItem('token')

    await axios.post(
      'http://localhost:8080/usuarios',
      {
        username: form.value.username,
        password: form.value.password
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    emit('toast', { message: 'Usuário criado com sucesso!', type: 'success' })
    emit('saved')

    // reset
    form.value = {
      username: '',
      password: '',
      confirmPassword: ''
    }

    close()
  } catch (err: any) {
    const msg = err.response?.data || 'Erro ao criar usuário'
    emit('toast', { message: msg, type: 'error' })
  }
}
</script>
<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
  >
    <div class="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">

      <!-- HEADER -->
      <div class="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900">
            Novo Usuário
          </h2>
          <p class="text-sm text-slate-500">
            Cadastre um novo usuário
          </p>
        </div>

        <button
          @click="close"
          class="rounded-lg bg-slate-100 p-2 hover:bg-slate-200"
        >
          <X />
        </button>
      </div>

      <!-- BODY -->
      <div class="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">

        <v-text-field
          v-model="form.username"
          label="Username *"
          variant="outlined"
          autofocus
        />

        <div></div>

        <v-text-field
          v-model="form.password"
          label="Senha *"
          type="password"
          variant="outlined"
        />

        <v-text-field
          v-model="form.confirmPassword"
          label="Confirmar Senha *"
          type="password"
          variant="outlined"
        />

      </div>

      <!-- FOOTER -->
      <div
        class="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4"
      >
        <button
          @click="close"
          class="rounded-lg bg-slate-200 px-4 py-2 hover:bg-slate-300"
        >
          Cancelar
        </button>

        <button
          @click="salvar"
          class="rounded-lg bg-primary px-4 py-2 text-white"
        >
          Salvar Usuário
        </button>
      </div>

    </div>
  </div>
</template>
