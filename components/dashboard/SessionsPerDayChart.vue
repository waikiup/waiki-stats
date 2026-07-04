<script setup lang="ts">
import { Line } from 'vue-chartjs'
import type { DailySessionsPoint } from '~/server/domain/valueObjects/DashboardStats'

const props = defineProps<{ data: DailySessionsPoint[] }>()

const dayLabel = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const fullDayLabel = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
})

const chartData = computed(() => ({
  labels: props.data.map(p => dayLabel.format(new Date(`${p.date}T12:00:00`))),
  datasets: [
    {
      label: 'Sessions',
      data: props.data.map(p => p.count),
      borderColor: '#3f7d51',
      backgroundColor: 'rgba(63, 125, 81, 0.10)',
      fill: true,
      stepped: true as const,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#3f7d51',
      borderWidth: 1.5
    }
  ]
}))

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 900, easing: 'easeOutQuart' as const },
  interaction: { mode: 'index' as const, intersect: false },
  scales: {
    x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } },
    y: { beginAtZero: true, ticks: { precision: 0 } }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (items: Array<{ dataIndex: number }>) => {
          const point = props.data[items[0]!.dataIndex]
          return point ? fullDayLabel.format(new Date(`${point.date}T12:00:00`)) : ''
        },
        label: (item: { parsed: { y: number } }) =>
          `${item.parsed.y} session${item.parsed.y > 1 ? 's' : ''}`
      }
    }
  }
}))
</script>

<template>
  <div class="card p-6">
    <h3 class="font-bold">Sessions par jour</h3>
    <p class="text-xs mb-4" style="color: var(--ink-muted)">
      Nombre de sessions sur les 30 derniers jours
    </p>
    <div class="h-72">
      <Line :data="chartData" :options="options" />
    </div>
  </div>
</template>
