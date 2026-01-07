<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import axios from 'axios'
import { X } from 'lucide-vue-next'

/* =======================
   TIPOS
======================= */
interface Usuario {
  id: string
  username: string
}

/* =======================
   PROPS & EMITS
======================= */
const props = defineProps<{
  modelValue: boolean
  usuario: Usuario | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved', usuario: Usuario): void
  (e: 'toast', payload: { message: string; type: 'success' | 'error' }): void
}>()

/* =======================
   CONTROLE MODAL
======================= */
const show = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const close = () => (show.value = false)

/* =======================
   FORM
======================= */
const form = ref({
  id: '',
  username: '',
  password: '',
  confirmPassword: ''
})

/* =======================
   WATCH
======================= */
watch(show, (open) => {
  if (open && props.usuario) {
    form.value = {
      id: props.usuario.id,
      username: props.usuario.username,
      password: '',
      confirmPassword: ''
    }
  }
})

/* =======================
   SALVAR
======================= */
const salvar = async () => {
  const token = localStorage.getItem('token')

  if (!token) {
    emit('toast', { message: 'Usuário não autenticado', type: 'error' })
    return
  }

  if (!form.value.id) {
    emit('toast', { message: 'ID do usuário inválido', type: 'error' })
    return
  }

  if (form.value.password && form.value.password !== form.value.confirmPassword) {
    emit('toast', { message: 'As senhas não conferem', type: 'error' })
    return
  }

  const payload: any = {
    username: form.value.username
  }

  if (form.value.password) {
    payload.password = form.value.password
  }

  try {
    const res = await axios.put(
      `http://localhost:8080/usuarios/${form.value.id}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    emit('toast', { message: 'Usuário atualizado com sucesso!', type: 'success' })
    emit('saved', res.data)
    close()
  } catch (err: any) {
    const msg = err.response?.data || 'Erro ao atualizar usuário'
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
          <h2 class="text-lg font-bold text-slate-900">Editar Usuário</h2>
          <p class="text-sm text-slate-500">
            Atualize as informações do usuário
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
          label="Username"
          variant="outlined"
        />

        <v-text-field
          v-model="form.password"
          label="Nova senha"
          type="password"
          variant="outlined"
        />

        <v-text-field
          v-model="form.confirmPassword"
          label="Confirmar senha"
          type="password"
          variant="outlined"
          class="md:col-span-2"
        />
      </div>

      <!-- FOOTER -->
      <div
        class="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4"
      >
        <button
          @click="close"
          class="rounded-lg bg-slate-200 px-4 py-2"
        >
          Cancelar
        </button>

        <button
          @click="salvar"
          class="rounded-lg bg-primary px-4 py-2 text-white"
        >
          Salvar Alterações
        </button>
      </div>
    </div>
  </div>
</template>
