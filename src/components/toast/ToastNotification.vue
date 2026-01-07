<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, XCircle, X } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean;
  message: string;
  type: 'success' | 'error';
}>();

const emits = defineEmits<{
  (e: 'update:show', value: boolean): void;
}>();

const internalShow = computed({
  get: () => props.show,
  set: (val) => emits('update:show', val),
});

const classes = computed(() => {
  switch (props.type) {
    case 'success':
      return {
        bgColor: 'bg-green-500',
        icon: CheckCircle,
        ringColor: 'ring-green-300',
        iconColor: 'text-green-100',
      };
    case 'error':
      return {
        bgColor: 'bg-red-500',
        icon: XCircle,
        ringColor: 'ring-red-300',
        iconColor: 'text-red-100',
      };
    default:
      return {};
  }
});

const closeToast = () => {
  internalShow.value = false;
};
</script>

<template>
<Transition
enter-active-class="transition ease-out duration-300"
enter-from-class="transform opacity-0 translate-x-full"
enter-to-class="transform opacity-100 translate-x-0"
leave-active-class="transition ease-in duration-300"
leave-from-class="transform opacity-100 translate-x-0"
leave-to-class="transform opacity-0 translate-x-full"
>
<div
v-if="internalShow"
:class="[classes.bgColor, 'fixed right-4 top-4 z-50 flex items-center p-4 rounded-lg shadow-xl text-white max-w-sm ring-1 ring-opacity-50', classes.ringColor]"
>
  <component :is="classes.icon" class="h-6 w-6 mr-3 flex-shrink-0" :class="classes.iconColor" />

  <p class="text-sm font-medium flex-grow break-words pr-2">
    {{ message }}
  </p>

  <button @click="closeToast" class="ml-auto flex-shrink-0 text-white opacity-70 hover:opacity-100 transition">
    <X class="h-5 w-5" />
  </button>
</div>
</Transition>
</template>