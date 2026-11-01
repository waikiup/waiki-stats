<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'

const props = withDefaults(defineProps<{
  title: string
  subtitle?: string
  labels: string[]
  values: number[]
  /** Formatage des valeurs dans la légende et l'infobulle */
  format?: (value: number) => string
}>(), {
  subtitle: '',
  format: (v: number) => String(v)
})

const DONUT_COLORS = ['#2f5fa8', '#3f7d51', '#c9861e', '#b3391f', '#7a5c9e', '#2d8a8a', '#6f6a5c', '#1c1b18', '#a3a08f', '#d4a373']

const total = computed(() => props.values.reduce((a, b) => a + b, 0))

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [{
    data: props.values,
    backgroundColor: props.labels.map((_, i) => DONUT_COLORS[i % DONUT_COLORS.length]),
    borderColor: '#fbfaf7',
    borderWidth: 2,
    hoverOffset: 6
  }]
}))

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (item: { dataIndex: number }) => {
          const v = props.values[item.dataIndex] ?? 0
          return `${props.format(v)} · ${percent(v)}`
        }
      }
    }
  }
}))

function percent(v: number): string {
  return total.value === 0 ? '0 %' : `${Math.round((v / total.value) * 1000) / 10} %`
}
</script>

<template>
  <div class="card p-6 flex flex-col">
    <h3 class="font-bold">{{ title }}</h3>
    <p v-if="subtitle" class="text-xs mb-4" style="color: var(--ink-muted)">{{ subtitle }}</p>
    <div v-if="total === 0" class="flex-1 flex items-center justify-center text-xs py-10" style="color: var(--ink-muted)">
      aucune donnée sur la période
    </div>
    <template v-else>
      <div class="h-48">
        <Doughnut :data="chartData" :options="options" />
      </div>
      <ul class="mt-5 space-y-1.5 text-xs">
        <li v-for="(label, i) in labels" :key="label" class="flex items-center justify-between gap-3">
          <span class="flex items-center gap-2 min-w-0">
            <span class="w-2.5 h-2.5 shrink-0" :style="{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }" />
            <span class="truncate">{{ label }}</span>
          </span>
          <span class="tabular-nums shrink-0" style="color: var(--ink-muted)">
            {{ format(values[i] ?? 0) }} · {{ percent(values[i] ?? 0) }}
          </span>
        </li>
      </ul>
    </template>
  </div>
</template>
