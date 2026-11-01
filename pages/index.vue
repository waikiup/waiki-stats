<script setup lang="ts">
const { logout, isAdmin } = useDashboardAuth()
const { stats, me, scope, days, pending, error, refresh } = useDashboardStats()

onMounted(refresh)

const PERIODS = [
  { id: '7', label: '7 j' },
  { id: '30', label: '30 j' },
  { id: '90', label: '90 j' },
  { id: '365', label: '1 an' },
  { id: 'all', label: 'tout' }
]

const avgDurationMinutes = computed(() =>
  stats.value ? stats.value.overview.avgDurationSeconds / 60 : 0
)
const medianLabel = computed(() =>
  stats.value ? `médiane : ${formatDuration(stats.value.overview.medianDurationSeconds)}` : ''
)
const trend = computed(() => stats.value?.overview.weekOverWeekChange ?? null)
const periodLabel = computed(() => PERIODS.find(p => p.id === days.value)?.label ?? '')

/** Moment de la journée, regroupé depuis l'activité par heure */
const dayMoments = computed(() => {
  const slots = [
    { label: 'Matin (6 h – 12 h)', from: 6, to: 12 },
    { label: 'Après-midi (12 h – 18 h)', from: 12, to: 18 },
    { label: 'Soirée (18 h – 23 h)', from: 18, to: 23 },
    { label: 'Nuit (23 h – 6 h)', from: 23, to: 30 }
  ]
  const hourly = stats.value?.hourlyActivity ?? []
  return {
    labels: slots.map(s => s.label),
    values: slots.map(s => hourly.filter(p => (p.hour >= s.from && p.hour < s.to) || (p.hour + 24 >= s.from && p.hour + 24 < s.to)).reduce((sum, p) => sum + p.activations, 0))
  }
})

const showBreakdown = computed(() => (stats.value?.byGroup.length ?? 0) > 1)
</script>

<template>
  <main class="mx-auto max-w-7xl px-4 sm:px-6 py-10">
    <!-- En-tête -->
    <header
      class="flex flex-wrap items-end justify-between gap-4 mb-6 pb-6 border-b stagger-in"
      style="--stagger: 0; border-color: var(--rule)"
    >
      <div>
        <h1 class="text-2xl font-bold tracking-tight cursor-blink">
          {{ me?.role === 'client' ? me.name.toUpperCase().replace(/\s+/g, '_') : 'WAIKI_STATS' }}
        </h1>
        <p class="text-xs mt-2" style="color: var(--ink-muted)">
          {{ me?.role === 'client' ? 'Temps passé sans téléphone grâce aux clés Waiki' : 'Sessions de blocage d\'apps — scan NFC' }}
          <span v-if="trend !== null" :style="{ color: trend >= 0 ? 'var(--ink)' : 'var(--ribbon)' }">
            · {{ trend >= 0 ? '+' : '−' }}{{ Math.abs(trend) }} % vs semaine précédente
          </span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink v-if="isAdmin" to="/admin" class="btn">[clients & groupes]</NuxtLink>
        <button class="btn" :disabled="pending" @click="refresh">
          [{{ pending ? '…' : 'actualiser' }}]
        </button>
        <button class="btn" @click="logout">
          [quitter]
        </button>
      </div>
    </header>

    <p v-if="me?.demo" class="text-xs mb-4 px-3 py-2 border" style="border-color: var(--amber); color: var(--amber)">
      MODE DÉMO · données fictives (aucun projet Appwrite configuré)
    </p>

    <!-- Filtres -->
    <section v-if="me" class="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6 stagger-in" style="--stagger: 1">
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="label-caps mr-1">périmètre</span>
        <button
          v-for="s in me.scopes" :key="s.id"
          class="chip" :class="{ 'chip-on': scope === s.id }"
          @click="scope = s.id"
        >
          {{ s.label }}
        </button>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="label-caps mr-1">période</span>
        <button
          v-for="p in PERIODS" :key="p.id"
          class="chip" :class="{ 'chip-on': days === p.id }"
          @click="days = p.id"
        >
          {{ p.label }}
        </button>
      </div>
    </section>

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

    <!-- Pas assez de monde pour afficher quoi que ce soit (client) -->
    <div v-else-if="stats.scope.insufficientData" class="card p-10 text-center">
      <p class="font-bold">Pas encore assez de données sur « {{ stats.scope.label }} ».</p>
      <p class="text-xs mt-2" style="color: var(--ink-muted)">
        Les statistiques s'affichent dès que {{ stats.scope.minUsers }} personnes différentes ont utilisé une clé sur la période, pour qu'aucun chiffre ne permette de reconnaître quelqu'un.
      </p>
    </div>

    <!-- Dashboard -->
    <template v-else>
      <!-- Cartes de synthèse -->
      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <div class="stagger-in" style="--stagger: 2">
          <DashboardStatCard
            label="Temps sans téléphone" accent="green"
            :value="stats.overview.totalBlockedSeconds / 3600" :decimals="0" suffix=" h"
            :hint="`sur ${periodLabel === 'tout' ? 'toute la période' : periodLabel}`"
          />
        </div>
        <div class="stagger-in" style="--stagger: 3">
          <DashboardStatCard
            label="Sessions" accent="blue"
            :value="stats.overview.totalSessions"
            :hint="`${stats.overview.sessionsToday} aujourd'hui`"
          />
        </div>
        <div class="stagger-in" style="--stagger: 4">
          <DashboardStatCard
            label="Personnes différentes" accent="ink"
            :value="stats.users.totalUniqueUsers"
            :hint="`${stats.users.avgSessionsPerUser} sessions chacune en moyenne`"
          />
        </div>
        <div class="stagger-in" style="--stagger: 5">
          <DashboardStatCard
            label="Durée moyenne" accent="amber"
            :value="avgDurationMinutes" :decimals="0" suffix=" min"
            :hint="medianLabel"
          />
        </div>
      </section>

      <!-- Camemberts -->
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-4">
        <div v-if="showBreakdown" class="stagger-in" style="--stagger: 6">
          <DashboardDonutChart
            title="Répartition par lieu"
            subtitle="Heures sans téléphone"
            :labels="stats.byGroup.filter(g => !g.masked).map(g => g.name)"
            :values="stats.byGroup.filter(g => !g.masked).map(g => g.blockedSeconds)"
            :format="formatHours"
          />
        </div>
        <div class="stagger-in" style="--stagger: 7">
          <DashboardDonutChart
            title="Moment de la journée"
            subtitle="Quand les sessions démarrent"
            :labels="dayMoments.labels"
            :values="dayMoments.values"
            :format="v => `${v} sessions`"
          />
        </div>
        <div class="stagger-in" style="--stagger: 8">
          <DashboardDonutChart
            title="Fidélité"
            subtitle="Personnes selon leur nombre de sessions sur la période"
            :labels="stats.loyalty.map(b => b.label)"
            :values="stats.loyalty.map(b => b.users)"
            :format="v => `${v} pers.`"
          />
        </div>
        <div class="stagger-in" style="--stagger: 9">
          <DashboardDonutChart
            title="Durée des sessions"
            subtitle="Répartition par tranche"
            :labels="stats.durationBuckets.map(b => b.label)"
            :values="stats.durationBuckets.map(b => b.count)"
            :format="v => `${v} sessions`"
          />
        </div>
        <div class="stagger-in" style="--stagger: 10">
          <DashboardEmergencyGauge :data="stats.emergency" />
        </div>
      </section>

      <!-- Lieux + suivi admin -->
      <section v-if="showBreakdown || stats.admin" class="grid gap-4 xl:grid-cols-2 mb-4">
        <div v-if="showBreakdown" class="stagger-in" style="--stagger: 11">
          <DashboardGroupsRanking :data="stats.byGroup" :min-users="stats.scope.minUsers" />
        </div>
        <div v-if="stats.admin" class="stagger-in" style="--stagger: 12">
          <DashboardAdminAlerts :data="stats.admin" :total-sessions="stats.overview.totalSessions" />
        </div>
      </section>

      <!-- Rythme -->
      <section class="mb-4 stagger-in" style="--stagger: 13">
        <DashboardActivityHeatmap :data="stats.heatmap" />
      </section>
      <section class="grid gap-4 xl:grid-cols-2 mb-4">
        <div class="stagger-in" style="--stagger: 14">
          <DashboardHourlyActivityChart :data="stats.hourlyActivity" />
        </div>
        <div class="stagger-in" style="--stagger: 15">
          <DashboardWeekdayChart :data="stats.weekday" />
        </div>
      </section>

      <!-- Dans le temps -->
      <section class="grid gap-4 xl:grid-cols-2 mb-4">
        <div class="stagger-in" style="--stagger: 16">
          <DashboardSessionsPerDayChart :data="stats.sessionsPerDay" />
        </div>
        <div class="stagger-in" style="--stagger: 17">
          <DashboardSessionsPerMonthChart :data="stats.sessionsPerMonth" />
        </div>
      </section>

      <section v-if="isAdmin" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div class="stagger-in" style="--stagger: 18">
          <DashboardUsersPanel :data="stats.users" />
        </div>
      </section>

      <footer class="text-center text-[11px] mt-10" style="color: var(--ink-muted)">
        {{ stats.scope.label }} · {{ periodLabel }} · données générées le {{ new Date(stats.generatedAt).toLocaleString('fr-FR') }}
      </footer>
    </template>
  </main>
</template>
