<script setup lang="ts">
const props = withDefaults(defineProps<{
  value: number
  duration?: number
  decimals?: number
  suffix?: string
}>(), {
  duration: 1400,
  decimals: 0,
  suffix: ''
})

const displayed = ref(0)
let rafId: number | null = null

function animateTo(target: number) {
  if (rafId) cancelAnimationFrame(rafId)
  const from = displayed.value
  const start = performance.now()
  const step = (now: number) => {
    const progress = Math.min((now - start) / props.duration, 1)
    const eased = 1 - Math.pow(1 - progress, 4)
    displayed.value = from + (target - from) * eased
    if (progress < 1) rafId = requestAnimationFrame(step)
  }
  rafId = requestAnimationFrame(step)
}

watch(() => props.value, animateTo, { immediate: true })
onUnmounted(() => { if (rafId) cancelAnimationFrame(rafId) })

const formatted = computed(() =>
  new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals
  }).format(displayed.value)
)
</script>

<template>
  <span class="tabular-nums">{{ formatted }}{{ suffix }}</span>
</template>
