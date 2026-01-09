<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler
} from 'chart.js'
import { Line, Bar } from 'vue-chartjs'
import { computed } from 'vue'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler
)

/* ====================== PROPS ====================== */
const props = defineProps<{
  labels: string[]
  clientes: number[]
  vendas: number[]
}>()

/* ====================== LINE CHART ====================== */
const clientesData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.clientes,
      borderColor: '#11d493',
      borderWidth: 3,
      tension: 0.4,
      pointRadius: 4,
      pointBorderWidth: 2,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#11d493',
      fill: true,
      backgroundColor: (ctx: any) => {
        const canvas = ctx.chart.ctx
        const gradient = canvas.createLinearGradient(0, 0, 0, 300)
        gradient.addColorStop(0, 'rgba(17,212,147,0.3)')
        gradient.addColorStop(1, 'rgba(17,212,147,0)')
        return gradient
      }
    }
  ]
}))

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 8
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#9ca3af' }
    },
    y: {
      grid: {
        borderDash: [5, 5],
        color: 'rgba(0,0,0,0.1)'
      },
      ticks: { color: '#9ca3af' }
    }
  }
}

/* ====================== BAR CHART ====================== */
const vendasData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.vendas,
      backgroundColor: '#11d493cc',
      borderRadius: 6,
      maxBarThickness: 28
    }
  ]
}))

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#fff',
      bodyColor: '#fff',
      cornerRadius: 8
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#9ca3af' }
    },
    y: {
      grid: {
        borderDash: [5, 5],
        color: 'rgba(0,0,0,0.1)'
      },
      ticks: { color: '#9ca3af' }
    }
  }
}
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

    <!-- Crescimento de Clientes -->
    <div class="p-6 rounded-xl shadow-sm border border-[#e7f3ef] dark:border-[#1e3b32]">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="text-lg font-bold">Crescimento de Clientes</h3>
          <p class="text-sm text-text-secondary">
            Novos cadastros no período selecionado
          </p>
        </div>
      </div>

      <div class="relative h-64">
        <Line :data="clientesData" :options="lineOptions" />
      </div>
    </div>

    <!-- Volume de Vendas -->
    <div class="p-6 rounded-xl shadow-sm border border-[#e7f3ef] dark:border-[#1e3b32]">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="text-lg font-bold">Volume de Vendas</h3>
          <p class="text-sm text-text-secondary">
            Pedidos realizados no período selecionado
          </p>
        </div>
      </div>

      <div class="relative h-64">
        <Bar :data="vendasData" :options="barOptions" />
      </div>
    </div>

  </div>
</template>
