<script setup lang="ts">
import { ref } from 'vue';
import { login } from '@/services/authService' 


const props = defineProps<{
    disabled?: boolean;
    placeholder?: string;
    class?:string
}>();


</script>
<template>
    <button
            type="submit"
            :disabled="disabled"
            :class="class"
        >
            <span v-if="!disabled">{{ props.placeholder }}</span>
            <span v-else class="animate-pulse">Autenticando...</span>
            <span class="material-symbols-outlined ml-2"></span>
        </button>

</template>
