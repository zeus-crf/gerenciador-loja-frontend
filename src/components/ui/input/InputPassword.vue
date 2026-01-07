<script setup lang="ts">
import { computed, ref } from 'vue';
import { Eye, EyeOff } from 'lucide-vue-next'; // Importando os ícones

// Define o evento para o v-model
const emit = defineEmits(['update:modelValue']);

// Define as propriedades (props)
const props = defineProps<{
    modelValue: string | number;
    placeholder?: string;
    required?: boolean;
    label?: string;
    class?: string; // Mantendo o class para estilos externos
}>()

// Computed property para lidar com o v-model
const inputValue = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
});

// Estado reativo para controlar a visibilidade da senha
const showPassword = ref(false)
</script>

<template>
    <label class="flex flex-col gap-2">
        <span v-if="props.label" class="text-sm font-semibold">{{ props.label }}</span>
        
        <div class="relative">
            <input
                v-model="inputValue"
                
                :type="showPassword ? 'text' : 'password'"
                
                :placeholder="props.placeholder || 'Digite sua senha'"
                
                :required="props.required"

                :class="[
                    'form-input w-full rounded-lg border border-[#cfe7df] bg-background-light text-text-main focus:border-primary h-12 px-4 text-base placeholder:text-text-main/60 transition-all pr-10', // pr-10 para dar espaço ao ícone
                    props.class 
                ]"
            />
            
            <button
                type="button"
                class="absolute right-0 top-0 h-full px-3 flex items-center"
                
                @click.prevent.stop="showPassword = !showPassword" 
            >
                <EyeOff v-if="showPassword" class="h-5 w-5 text-gray-400" />
                <Eye v-else class="h-5 w-5 text-gray-400" />
            </button>
        </div>
    </label>
</template>