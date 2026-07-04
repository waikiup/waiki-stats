<script setup lang="ts">
import type { UserStats } from '~/server/domain/valueObjects/DashboardStats'

defineProps<{ data: UserStats }>()
</script>

<template>
  <div class="card p-6">
    <h3 class="font-bold">Utilisateurs</h3>
    <p class="text-xs mb-6" style="color: var(--ink-muted)">Audience de l'application</p>
    <dl class="space-y-5">
      <div class="flex items-baseline justify-between gap-4 border-b pb-4" style="border-color: var(--rule)">
        <dt class="text-xs" style="color: var(--ink-muted)">Utilisateurs uniques (total)</dt>
        <dd class="text-2xl font-bold tabular-nums">
          <UiAnimatedNumber :value="data.totalUniqueUsers" />
        </dd>
      </div>
      <div class="flex items-baseline justify-between gap-4 border-b pb-4" style="border-color: var(--rule)">
        <dt class="text-xs" style="color: var(--ink-muted)">Actifs — 30 derniers jours</dt>
        <dd class="text-2xl font-bold tabular-nums">
          <UiAnimatedNumber :value="data.activeUsersLast30Days" />
        </dd>
      </div>
      <div class="flex items-baseline justify-between gap-4">
        <dt class="text-xs" style="color: var(--ink-muted)">Sessions / utilisateur (moy.)</dt>
        <dd class="text-2xl font-bold tabular-nums">
          <UiAnimatedNumber :value="data.avgSessionsPerUser" :decimals="1" />
        </dd>
      </div>
    </dl>
  </div>
</template>
