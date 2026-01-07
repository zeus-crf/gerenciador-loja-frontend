<script setup lang="ts">
import { computed,ref } from 'vue';

const props = defineProps<{
    title: string;
    subtitle: string
}>();

</script>
<template>
      <div class="flex items-center justify-between">
    <!-- Título e subtítulo -->
    <div class="flex flex-col">
      <h1 class="text-3xl font-black tracking-tight text-text-main sm:text-4xl">{{ props.title }}</h1>
      <p v-if="props.subtitle" class="text-text-muted">{{ props.subtitle }}</p>
    </div>

    <!-- Slot para ações -->
    <div>
      <slot name="actions"></slot>
    </div>
  </div>
</template>