<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  value: number
  suffix?: string
  decimals?: number
  hint?: string
  accent?: 'ink' | 'blue' | 'red' | 'green' | 'amber'
}>(), {
  suffix: '',
  decimals: 0,
  hint: '',
  accent: 'ink'
})

const accentColors: Record<string, string> = {
  ink: 'var(--ink)',
  blue: 'var(--blue)',
  red: 'var(--ribbon)',
  green: 'var(--green)',
  amber: 'var(--amber)'
}

const color = computed(() => accentColors[props.accent])
</script>

<template>
  <div class="card p-5 border-t-2" :style="{ borderTopColor: color }">
    <p class="label-caps mb-3 flex items-center gap-2">
      <span class="w-2 h-2 inline-block" :style="{ backgroundColor: color }" />
      {{ label }}
    </p>
    <p class="text-3xl font-bold leading-none" :style="{ color }">
      <UiAnimatedNumber :value="value" :suffix="suffix" :decimals="decimals" />
    </p>
    <p v-if="hint" class="text-xs mt-2" style="color: var(--ink-muted)">{{ hint }}</p>
  </div>
</template>
