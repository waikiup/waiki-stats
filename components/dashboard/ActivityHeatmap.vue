<script setup lang="ts">
const props = defineProps<{ data: number[][] }>()

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const max = computed(() => Math.max(1, ...props.data.flat()))

function cellStyle(v: number) {
  const alpha = v === 0 ? 0.04 : 0.12 + (v / max.value) * 0.88
  return { backgroundColor: `rgba(47, 95, 168, ${alpha.toFixed(2)})` }
}
</script>

<template>
  <div class="card p-6">
    <h3 class="font-bold">Quand le téléphone est posé</h3>
    <p class="text-xs mb-4" style="color: var(--ink-muted)">Sessions lancées, par jour et par heure (plus c'est foncé, plus il y en a)</p>
    <div class="overflow-x-auto">
      <div class="heat min-w-[560px]">
        <span />
        <span v-for="h in 24" :key="`h${h}`" class="text-center">{{ (h - 1) % 3 === 0 ? h - 1 : '' }}</span>
        <template v-for="(row, d) in data" :key="DAYS[d]">
          <span class="pr-2">{{ DAYS[d] }}</span>
          <i v-for="(v, h) in row" :key="h" :style="cellStyle(v)" :title="`${DAYS[d]} ${h} h : ${v} session${v > 1 ? 's' : ''}`" />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.heat {
  display: grid;
  grid-template-columns: 36px repeat(24, 1fr);
  gap: 3px;
  font-size: 10px;
  color: var(--ink-muted);
  align-items: center;
}
.heat i {
  display: block;
  aspect-ratio: 1;
  border-radius: 2px;
}
</style>
