<script setup lang="ts">
import FormLogin from '@/components/form/FormLogin.vue' 
import HeaderPage from '@/components/layout/HeaderPage.vue';

</script>
<template>
  <div class="min-h-screen flex w-full font-display bg-background-light  text-text-main">
    <!-- Left side (imagem) -->
    <div class="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
      <div
        class="absolute inset-0 bg-cover bg-center opacity-80"
        style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-j4_Z2nDRu2RpBX632emQLl9JYSyRB0eMjq_QHV9HvkRNNI9ceBZp50tAS9kLczkN9dZ2JcchIPAmaav2U6OnF246uccwd4Gs5uKCxT21phmz-m9qRWFpRlp1ToJov3cvj-n7pB5Zf1Y8B8WBScrIRQnBcfmN3T1cL0qdE-RQ2zjXe-JUuS4NojKSFDXK58zo7UtFxCk6i1wjLa9T7j09mxvLEjrGmTV40-CmoMqfrsaZqjK5aqfq1hAn3QVYkP8xWBGRhi5-ocA');"
      ></div>
      <div class="absolute inset-0 bg-gradient-to-t from-background-dark/90 via-background-dark/40 to-transparent"></div>

      <div class="relative z-10 flex flex-col justify-end p-16 w-full h-full text-white">
        <div class="mb-8">
          
          <h2 class="text-4xl font-black tracking-tight leading-tight mb-4">
            Gerencie sua moda <br />com estilo.
          </h2>
          <p class="text-lg text-gray-200 max-w-md font-light">
            Acompanhe o estoque, analise as vendas e gerencie sua equipe em uma única plataforma.
          </p>
        </div>
        <div class="flex gap-2">
      <div class="h-1.5 w-8 rounded-full bg-primary"></div>
      <div class="h-1.5 w-2 rounded-full bg-white/30"></div>
      <div class="h-1.5 w-2 rounded-full bg-white/30"></div>
      </div>
      </div>
    </div>

    <!-- Right side (form) -->
    <div class="w-full lg:w-1/2 background-light flex flex-col justify-center items-center p-6 sm:p-12 xl:p-24">

      <div class="w-full max-w-[440px] flex flex-col gap-8">

        <!-- Header -->
        <HeaderPage
        title="Bem-Vindo de Volta"
        subtitle="Acesse o Painel para começar o dia"/>
        
        <FormLogin/>
        <p class="text-center text-sm mt-4">
          Não tem uma conta?
          <a href="#" class="font-bold hover:underline">Contate o administrador</a>
        </p>

      </div>

    </div>
  </div>
</template>

