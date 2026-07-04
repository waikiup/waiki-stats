<script setup lang="ts">
const { login } = useDashboardAuth()

const key = ref('')
const error = ref(false)
const loading = ref(false)
const shake = ref(false)

async function submit() {
  if (!key.value.trim() || loading.value) return
  loading.value = true
  error.value = false
  const ok = await login(key.value.trim())
  loading.value = false
  if (ok) {
    await navigateTo('/')
  } else {
    error.value = true
    shake.value = true
    setTimeout(() => { shake.value = false }, 500)
  }
}
</script>

<template>
  <main class="min-h-screen flex items-center justify-center p-6">
    <div
      class="card w-full max-w-md p-8 stagger-in"
      :class="{ 'animate-shake': shake }"
    >
      <div class="mb-8">
        <h1 class="text-xl font-bold tracking-tight cursor-blink">WAIKI_STATS</h1>
        <p class="text-xs mt-3" style="color: var(--ink-muted)">
          Entrez votre clé d'accès pour consulter le dashboard.
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <input
          v-model="key"
          type="password"
          placeholder="clé d'accès"
          autocomplete="current-password"
          class="w-full rounded-[2px] border border-[#d9d5c9] bg-transparent px-4 py-3 text-sm outline-none transition-colors duration-200 placeholder:opacity-50 focus:border-[#1c1b18]"
        >
        <p
          class="text-xs transition-opacity duration-300"
          style="color: var(--ribbon)"
          :class="error ? 'opacity-100' : 'opacity-0'"
        >
          Clé invalide, réessayez.
        </p>
        <button
          type="submit"
          :disabled="loading || !key.trim()"
          class="w-full rounded-[2px] py-3 text-sm font-bold transition-opacity duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style="background-color: var(--ink); color: var(--paper)"
        >
          {{ loading ? '[vérification…]' : '[entrer]' }}
        </button>
      </form>
    </div>
  </main>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-7px); }
  40%, 80% { transform: translateX(7px); }
}
.animate-shake {
  animation: shake 0.45s ease;
}
</style>
