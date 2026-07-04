<script setup lang="ts">
import type { EmergencyStats } from '~/server/domain/valueObjects/DashboardStats'

const props = defineProps<{ data: EmergencyStats }>()

const RADIUS = 70
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const mounted = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { mounted.value = true })
})

const percentage = computed(() => Math.round(props.data.ratio * 1000) / 10)
const dashOffset = computed(() =>
  mounted.value ? CIRCUMFERENCE * (1 - props.data.ratio) : CIRCUMFERENCE
)
</script>

<template>
  <div class="card p-6 flex flex-col">
    <h3 class="font-bold">Déblocages d'urgence</h3>
    <p class="text-xs mb-4" style="color: var(--ink-muted)">
      Part des sessions terminées en urgence
    </p>
    <div class="flex-1 flex items-center justify-center">
      <div class="relative">
        <svg width="180" height="180" viewBox="0 0 180 180" class="-rotate-90">
          <circle cx="90" cy="90" :r="RADIUS" fill="none" stroke="#e8e4d8" stroke-width="10" />
          <circle
            cx="90" cy="90" :r="RADIUS" fill="none"
            stroke="#b3391f" stroke-width="10"
            :stroke-dasharray="CIRCUMFERENCE"
            :stroke-dashoffset="dashOffset"
            style="transition: stroke-dashoffset 1.2s ease-out"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-3xl font-bold">
            <UiAnimatedNumber :value="percentage" :decimals="1" suffix=" %" />
          </span>
          <span class="text-xs mt-1" style="color: var(--ink-muted)">
            {{ data.emergencyCount }} / {{ data.total }}
          </span>
        </div>
      </div>
    </div>
    <div class="flex justify-center gap-6 text-xs mt-4" style="color: var(--ink-muted)">
      <span class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5" style="background-color: #b3391f" /> Urgence
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5" style="background-color: #e8e4d8" /> Normal
      </span>
    </div>
  </div>
</template>
