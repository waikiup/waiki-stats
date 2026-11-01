<script setup lang="ts">
import type { AdminExtras } from '~/server/domain/valueObjects/DashboardStats'

const props = defineProps<{ data: AdminExtras, totalSessions: number }>()

const coverage = computed(() =>
  props.totalSessions === 0 ? 0 : Math.round((props.data.taggedSessions / props.totalSessions) * 1000) / 10
)
</script>

<template>
  <div class="card p-6">
    <h3 class="font-bold">Suivi des puces <span class="label-caps ml-1">admin</span></h3>
    <p class="text-xs mb-5" style="color: var(--ink-muted)">Ce que les clients ne voient pas</p>
    <dl class="space-y-4 text-xs">
      <div class="border-b pb-4" style="border-color: var(--rule)">
        <dt style="color: var(--ink-muted)">Sessions qui disent quelle puce les a lancées</dt>
        <dd class="text-2xl font-bold tabular-nums mt-1">{{ coverage }} %</dd>
        <dd style="color: var(--ink-muted)">{{ data.taggedSessions }} sur {{ totalSessions }} · monte quand les téléphones passent à la nouvelle version de l'app</dd>
      </div>
      <div class="border-b pb-4" style="border-color: var(--rule)">
        <dt style="color: var(--ink-muted)">Groupes sans aucun scan sur la période</dt>
        <dd class="mt-1">
          <span v-if="!data.silentGroups.length">aucun</span>
          <span v-else style="color: var(--ribbon)">{{ data.silentGroups.join(', ') }}</span>
        </dd>
      </div>
      <div>
        <dt style="color: var(--ink-muted)">Puces scannées, déclarées dans aucun groupe</dt>
        <dd v-if="!data.unknownTags.length" class="mt-1">aucune</dd>
        <dd v-else class="mt-1 space-y-1">
          <p v-for="t in data.unknownTags" :key="t.uid" class="flex justify-between">
            <span>{{ formatUid(t.uid) }}</span>
            <span class="tabular-nums" style="color: var(--ink-muted)">{{ t.sessions }} sessions</span>
          </p>
        </dd>
      </div>
    </dl>
  </div>
</template>
