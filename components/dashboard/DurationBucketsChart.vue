<script setup lang="ts">
import type { DurationBucket } from '~/server/domain/valueObjects/DashboardStats'

const props = defineProps<{ data: DurationBucket[] }>()

const barColors = ['#2f5fa8', '#3f7d51', '#c9861e', '#b3391f', '#6f6a5c', '#1c1b18']

const mounted = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { mounted.value = true })
})

const maxPercentage = computed(() =>
  Math.max(1, ...props.data.map(b => b.percentage))
)
</script>

<template>
  <div class="card p-6">
    <h3 class="font-bold">Durée des sessions</h3>
    <p class="text-xs mb-5" style="color: var(--ink-muted)">Répartition par tranche de durée</p>
    <ul class="space-y-4">
      <li v-for="(bucket, i) in data" :key="bucket.label">
        <div class="flex items-baseline justify-between text-xs mb-1.5">
          <span>{{ bucket.label }}</span>
          <span class="tabular-nums" style="color: var(--ink-muted)">
            {{ bucket.percentage }}&nbsp;% · {{ bucket.count }}
          </span>
        </div>
        <div class="h-2 overflow-hidden" style="background-color: #e8e4d8">
          <div
            class="h-full transition-all duration-700 ease-out"
            :style="{
              backgroundColor: barColors[i % barColors.length],
              width: mounted ? `${(bucket.percentage / maxPercentage) * 100}%` : '0%',
              transitionDelay: `${i * 90}ms`
            }"
          />
        </div>
      </li>
    </ul>
  </div>
</template>
