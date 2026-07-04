<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import type { MonthlySessionsPoint } from '~/server/domain/valueObjects/DashboardStats'

const props = defineProps<{ data: MonthlySessionsPoint[] }>()

const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' })
const fullMonthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

function monthDate(month: string): Date {
  return new Date(`${month}-15T12:00:00`)
}

const chartData = computed(() => ({
  labels: props.data.map(p => monthLabel.format(monthDate(p.month))),
  datasets: [
    {
      label: 'Sessions',
      data: props.data.map(p => p.count),
      backgroundColor: '#b3391f',
      hoverBackgroundColor: '#1c1b18',
      maxBarThickness: 48
    }
  ]
}))

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 900,
    easing: 'easeOutQuart' as const,
    delay: (ctx: { dataIndex: number }) => ctx.dataIndex * 40
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { precision: 0 } }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (items: Array<{ dataIndex: number }>) => {
          const point = props.data[items[0]!.dataIndex]
          return point ? fullMonthLabel.format(monthDate(point.month)) : ''
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
    <h3 class="font-bold">Sessions par mois</h3>
    <p class="text-xs mb-4" style="color: var(--ink-muted)">
      Nombre de sessions sur les 12 derniers mois
    </p>
    <div class="h-64">
      <Bar :data="chartData" :options="options" />
    </div>
  </div>
</template>
