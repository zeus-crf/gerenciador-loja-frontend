<script setup lang="ts">
import { RouterView } from 'vue-router'
import './assets/main.css'
import { Toaster } from 'vue-sonner'
</script>

<template>
  <RouterView />
   <Toaster richColors position="top-right" />
</template>
