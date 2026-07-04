<script setup lang="ts">
const { logout } = useDashboardAuth()
const { stats, pending, error, refresh } = useDashboardStats()

onMounted(refresh)

const totalBlockedLabel = computed(() =>
  stats.value ? formatDuration(stats.value.overview.totalBlockedSeconds) : ''
)
const avgDurationMinutes = computed(() =>
  stats.value ? stats.value.overview.avgDurationSeconds / 60 : 0
)
const medianLabel = computed(() =>
  stats.value ? `médiane : ${formatDuration(stats.value.overview.medianDurationSeconds)}` : ''
)
const trend = computed(() => stats.value?.overview.weekOverWeekChange ?? null)
</script>

<template>
  <main class="mx-auto max-w-7xl px-4 sm:px-6 py-10">
    <!-- En-tête -->
    <header
      class="flex flex-wrap items-end justify-between gap-4 mb-8 pb-6 border-b stagger-in"
      style="--stagger: 0; border-color: var(--rule)"
    >
      <div>
        <h1 class="text-2xl font-bold tracking-tight cursor-blink">WAIKI_STATS</h1>
        <p class="text-xs mt-2" style="color: var(--ink-muted)">
          Sessions de blocage d'apps — scan NFC
          <span v-if="trend !== null" :style="{ color: trend >= 0 ? 'var(--ink)' : 'var(--ribbon)' }">
            · {{ trend >= 0 ? '+' : '−' }}{{ Math.abs(trend) }} % vs semaine précédente
          </span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn" :disabled="pending" @click="refresh">
          [{{ pending ? '…' : 'actualiser' }}]
        </button>
        <button class="btn" @click="logout">
          [quitter]
        </button>
      </div>
    </header>

    <!-- Erreur -->
    <div v-if="error" class="card p-6 text-center stagger-in" style="color: var(--ribbon)">
      {{ error }}
      <button class="underline ml-2" @click="refresh">Réessayer</button>
    </div>

    <!-- Squelette de chargement -->
    <div v-else-if="!stats" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="i in 8"
        :key="i"
        class="card h-28 animate-pulse"
        :class="i > 4 ? 'sm:col-span-2 h-80' : ''"
      />
    </div>

    <!-- Dashboard -->
    <template v-else>
      <!-- Cartes de synthèse -->
      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <div class="stagger-in" style="--stagger: 1">
          <DashboardStatCard
            label="Sessions totales" accent="blue"
            :value="stats.overview.totalSessions"
            :hint="`${stats.overview.sessionsToday} aujourd'hui`"
          />
        </div>
        <div class="stagger-in" style="--stagger: 2">
          <DashboardStatCard
            label="Temps bloqué cumulé" accent="green"
            :value="stats.overview.totalBlockedSeconds / 3600" :decimals="0" suffix=" h"
            :hint="totalBlockedLabel"
          />
        </div>
        <div class="stagger-in" style="--stagger: 3">
          <DashboardStatCard
            label="Durée moyenne" accent="amber"
            :value="avgDurationMinutes" :decimals="0" suffix=" min"
            :hint="medianLabel"
          />
        </div>
        <div class="stagger-in" style="--stagger: 4">
          <DashboardStatCard
            label="Heure de pointe" accent="red"
            :value="stats.overview.peakHour ?? 0" suffix=" h"
            hint="le plus d'activations"
          />
        </div>
      </section>

      <!-- Graphiques principaux -->
      <section class="grid gap-4 xl:grid-cols-2 mb-4">
        <div class="stagger-in" style="--stagger: 5">
          <DashboardHourlyActivityChart :data="stats.hourlyActivity" />
        </div>
        <div class="stagger-in" style="--stagger: 6">
          <DashboardSessionsPerDayChart :data="stats.sessionsPerDay" />
        </div>
      </section>

      <!-- Sessions par mois -->
      <section class="mb-4 stagger-in" style="--stagger: 7">
        <DashboardSessionsPerMonthChart :data="stats.sessionsPerMonth" />
      </section>

      <!-- Répartitions et utilisateurs -->
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div class="stagger-in" style="--stagger: 8">
          <DashboardDurationBucketsChart :data="stats.durationBuckets" />
        </div>
        <div class="stagger-in" style="--stagger: 9">
          <DashboardEmergencyGauge :data="stats.emergency" />
        </div>
        <div class="stagger-in md:col-span-2 xl:col-span-1" style="--stagger: 10">
          <DashboardUsersPanel :data="stats.users" />
        </div>
      </section>

      <footer class="text-center text-[11px] mt-10" style="color: var(--ink-muted)">
        données générées le {{ new Date(stats.generatedAt).toLocaleString('fr-FR') }}
      </footer>
    </template>
  </main>
</template>
