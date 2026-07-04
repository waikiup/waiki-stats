<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import type { HourlyActivityPoint } from '~/server/domain/valueObjects/DashboardStats'

const props = defineProps<{ data: HourlyActivityPoint[] }>()

const chartData = computed(() => ({
  labels: props.data.map(p => `${p.hour}h`),
  datasets: [
    {
      label: 'Activations',
      data: props.data.map(p => p.activations),
      backgroundColor: '#2f5fa8',
      hoverBackgroundColor: '#1c1b18'
    },
    {
      label: 'Désactivations',
      data: props.data.map(p => p.deactivations),
      backgroundColor: '#c9861e',
      hoverBackgroundColor: '#1c1b18'
    }
  ]
}))

// Échelle calée sur la valeur max observée (petite marge pour ne pas coller au bord)
const yMax = computed(() => {
  const max = Math.max(1, ...props.data.flatMap(p => [p.activations, p.deactivations]))
  return Math.ceil(max * 1.05)
})

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 900,
    easing: 'easeOutQuart' as const,
    delay: (ctx: { dataIndex: number }) => ctx.dataIndex * 18
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, max: yMax.value, ticks: { precision: 0 } }
  },
  plugins: {
    legend: {
      position: 'top' as const,
      align: 'end' as const,
      labels: { boxWidth: 10, boxHeight: 10 }
    }
  }
}))
</script>

<template>
  <div class="card p-6">
    <h3 class="font-bold">Activité par heure</h3>
    <p class="text-xs mb-4" style="color: var(--ink-muted)">
      Activations et désactivations selon l'heure de la journée
    </p>
    <div class="h-72">
      <Bar :data="chartData" :options="options" />
    </div>
  </div>
</template>
