<script setup lang="ts">
import type { GroupBreakdownItem } from '~/server/domain/valueObjects/DashboardStats'

const props = defineProps<{ data: GroupBreakdownItem[], minUsers: number }>()

const max = computed(() => Math.max(1, ...props.data.map(g => g.blockedSeconds)))
</script>

<template>
  <div class="card p-6">
    <h3 class="font-bold">Classement des lieux</h3>
    <p class="text-xs mb-5" style="color: var(--ink-muted)">Heures sans téléphone sur la période</p>
    <table class="w-full text-xs">
      <thead>
        <tr class="text-left" style="color: var(--ink-muted)">
          <th class="font-normal pb-2">Lieu</th>
          <th class="font-normal pb-2 w-2/5" />
          <th class="font-normal pb-2 text-right">heures</th>
          <th class="font-normal pb-2 text-right">sessions</th>
          <th class="font-normal pb-2 text-right">pers.</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="g in data" :key="g.groupId ?? 'outside'" class="border-t" style="border-color: var(--rule)">
          <td class="py-2 pr-2">{{ g.name }}</td>
          <td class="py-2 pr-2">
            <div class="h-1.5" style="background-color: #e8e4d8">
              <div class="h-full" style="background-color: var(--green)" :style="{ width: `${(g.blockedSeconds / max) * 100}%` }" />
            </div>
          </td>
          <template v-if="g.masked">
            <td colspan="3" class="py-2 text-right" style="color: var(--ink-muted)">moins de {{ minUsers }} personnes</td>
          </template>
          <template v-else>
            <td class="py-2 text-right tabular-nums">{{ Math.round(g.blockedSeconds / 3600) }}</td>
            <td class="py-2 text-right tabular-nums">{{ g.sessions }}</td>
            <td class="py-2 text-right tabular-nums">{{ g.users }}</td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>
