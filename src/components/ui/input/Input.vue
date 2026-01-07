<script setup lang="ts">
import { computed } from 'vue';

// 1. Defina o evento update:modelValue
const emit = defineEmits(['update:modelValue']);

// 2. Defina as props, incluindo modelValue e todas as props que você usa (como type e placeholder)
const props = defineProps<{
    modelValue: string | number; // O valor que v-model vai controlar
    type?: string;
    placeholder?: string;
    class?: string; // Para classes extras
    required?: boolean; // Se você quiser que o required seja dinâmico
    label?: string;
}>();

// O computed value lida com a leitura e escrita do valor.
// Quando o input muda, ele emite o evento que atualiza a prop 'email' no componente pai.
const inputValue = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
});
</script>

<template>
    <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold">{{ props.label }}</span>
    <input
        v-model="inputValue"
        
        :type="props.type || 'text'" 
        
        :placeholder="props.placeholder || 'ex: Usuari0'"
        
        :required="props.required"

        :class="[
            'form-input w-full rounded-lg border border-[#cfe7df] bg-background-light text-text-main focus:border-primary h-12 px-4 text-base placeholder:text-text-main/60 transition-all',
            props.class 
        ]"
    />
    </label>
</template>