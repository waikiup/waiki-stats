<script setup lang="ts">
import { Bar } from 'vue-chartjs'

const props = defineProps<{ data: number[] }>()

const LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const chartData = computed(() => ({
  labels: LABELS,
  datasets: [{
    data: props.data,
    backgroundColor: props.data.map((_, i) => (i >= 5 ? '#c9861e' : '#2f5fa8')),
    borderRadius: 2
  }]
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } },
  plugins: { legend: { display: false } }
}
</script>

<template>
  <div class="card p-6">
    <h3 class="font-bold">Jour de la semaine</h3>
    <p class="text-xs mb-4" style="color: var(--ink-muted)">Sessions lancées, week-end en orange</p>
    <div class="h-64">
      <Bar :data="chartData" :options="options" />
    </div>
  </div>
</template>
