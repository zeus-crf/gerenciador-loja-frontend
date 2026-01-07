<script setup lang="ts">
import Input from '@/components/ui/input/Input.vue'
import InputPassword from '@/components/ui/input/InputPassword.vue'
import Button from '../ui/button/Button.vue'
import { toast } from 'vue-sonner'
import { ref } from 'vue'
import { login } from '@/services/authService'
import { useRouter } from 'vue-router'

const router = useRouter()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await login({
      username: username.value,
      password: password.value
    })

    // Salvar token corretamente
    const token = response.data?.token ?? response.token
    localStorage.setItem('token', token)

    toast.success('Login realizado com sucesso')
    router.push('/pedidos')

  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || 'Usuário ou senha inválidos'
    toast.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleLogin" class="flex flex-col gap-5">
    <Input
      v-model="username"
      type="text"
      placeholder="ex: Usuari0"
      :required="true"
      label="Usuário" 
    />

    <InputPassword
      v-model="password" 
      placeholder="Sua senha"
      :required="true"
      label="Senha"
    />

    <p v-if="errorMessage" class="text-red-600 text-sm font-medium">
      {{ errorMessage }}
    </p>

    <Button
      :disabled="loading"
      placeholder="Entrar"
      class="flex w-full items-center justify-center rounded-lg h-12 bg-primary 
             hover:bg-primary-hover active:scale-[0.99] transition-all font-bold"
    >
      Entrar
    </Button>
  </form>
</template>
