<script setup lang="ts">
import type { TagGroup } from '~/server/domain/entities/TagGroup'

interface ClientItem { id: string, name: string }

const { authFetch, logout } = useDashboardAuth()

const clients = ref<ClientItem[]>([])
const groups = ref<TagGroup[]>([])
const message = ref<{ kind: 'ok' | 'error', text: string } | null>(null)
/** Code affiché une seule fois après création ou renouvellement */
const revealedCode = ref<{ client: string, code: string } | null>(null)

async function load() {
  const [c, g] = await Promise.all([
    authFetch<ClientItem[]>('/api/admin/clients'),
    authFetch<TagGroup[]>('/api/admin/groups')
  ])
  clients.value = c
  groups.value = g
}
onMounted(load)

async function run(action: () => Promise<unknown>, success?: string) {
  message.value = null
  try {
    await action()
    if (success) message.value = { kind: 'ok', text: success }
    await load()
  } catch (e: unknown) {
    message.value = { kind: 'error', text: (e as { statusMessage?: string, data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Erreur' }
  }
}

const clientName = (id: string | null) => clients.value.find(c => c.id === id)?.name ?? '—'
const groupsOf = (clientId: string) => groups.value.filter(g => g.clientId === clientId)

// ---- Clients
const newClient = ref('')
function createClient() {
  if (!newClient.value.trim()) return
  run(async () => {
    const res = await authFetch<{ name: string, code: string }>('/api/admin/clients', { method: 'POST', body: { name: newClient.value } })
    revealedCode.value = { client: res.name, code: res.code }
    newClient.value = ''
  })
}
function regenerateCode(c: ClientItem) {
  if (!confirm(`Donner un nouveau code à ${c.name} ? L'ancien ne marchera plus.`)) return
  run(async () => {
    const res = await authFetch<{ name: string, code: string }>(`/api/admin/clients/${c.id}`, { method: 'PATCH', body: { regenerateCode: true } })
    revealedCode.value = { client: res.name, code: res.code }
  })
}
function renameClient(c: ClientItem) {
  const name = prompt('Nouveau nom', c.name)
  if (name?.trim()) run(() => authFetch(`/api/admin/clients/${c.id}`, { method: 'PATCH', body: { name } }))
}
function deleteClient(c: ClientItem) {
  if (!confirm(`Supprimer ${c.name} ? Son code cesse de marcher, ses groupes restent (sans client).`)) return
  run(() => authFetch(`/api/admin/clients/${c.id}`, { method: 'DELETE' }), `${c.name} supprimé.`)
}
const copied = ref(false)
async function copyCode() {
  if (!revealedCode.value) return
  await navigator.clipboard.writeText(revealedCode.value.code)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}

// ---- Groupes
const draft = ref({ name: '', clientId: '', uids: '' })
function createGroup() {
  run(async () => {
    await authFetch('/api/admin/groups', { method: 'POST', body: { ...draft.value, clientId: draft.value.clientId || null } })
    draft.value = { name: '', clientId: draft.value.clientId, uids: '' }
  }, 'Groupe créé.')
}

const editing = ref<string | null>(null)
const editUids = ref('')
function startEdit(g: TagGroup) {
  editing.value = g.id
  editUids.value = g.uids.map(formatUid).join('\n')
}
function saveUids(g: TagGroup) {
  run(async () => {
    await authFetch(`/api/admin/groups/${g.id}`, { method: 'PATCH', body: { uids: editUids.value } })
    editing.value = null
  }, `${g.name} mis à jour.`)
}
function setGroupClient(g: TagGroup, clientId: string) {
  run(() => authFetch(`/api/admin/groups/${g.id}`, { method: 'PATCH', body: { clientId: clientId || null } }))
}
function renameGroup(g: TagGroup) {
  const name = prompt('Nouveau nom', g.name)
  if (name?.trim()) run(() => authFetch(`/api/admin/groups/${g.id}`, { method: 'PATCH', body: { name } }))
}
function deleteGroup(g: TagGroup) {
  if (!confirm(`Supprimer le groupe ${g.name} ? Ses sessions repassent dans « Hors groupes ».`)) return
  run(() => authFetch(`/api/admin/groups/${g.id}`, { method: 'DELETE' }), `${g.name} supprimé.`)
}

// ---- Import d'une liste collée
const importText = ref('')
const importClientId = ref('')
const parsed = computed(() => parseGroupList(importText.value))
/** Vérifié avant d'envoyer quoi que ce soit : un import ne s'arrête jamais à moitié */
const importConflicts = computed(() => {
  const owner = new Map<string, string>()
  for (const g of groups.value) for (const u of g.uids) owner.set(u, g.name)
  const conflicts: string[] = []
  for (const p of parsed.value) {
    for (const raw of p.uids) {
      const uid = raw.replace(/[^0-9a-fA-F]/g, '').toUpperCase()
      if (owner.has(uid)) conflicts.push(`${formatUid(uid)} est déjà dans ${owner.get(uid)}`)
      else owner.set(uid, p.name)
    }
  }
  return conflicts
})
function importGroups() {
  run(async () => {
    for (const g of parsed.value) {
      await authFetch('/api/admin/groups', { method: 'POST', body: { name: g.name, uids: g.uids, clientId: importClientId.value || null } })
    }
    const n = parsed.value.length
    importText.value = ''
    message.value = { kind: 'ok', text: `${n} groupe${n > 1 ? 's' : ''} créé${n > 1 ? 's' : ''}.` }
  })
}
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 sm:px-6 py-10">
    <header class="flex flex-wrap items-end justify-between gap-4 mb-8 pb-6 border-b" style="border-color: var(--rule)">
      <div>
        <h1 class="text-2xl font-bold tracking-tight cursor-blink">CLIENTS_&_GROUPES</h1>
        <p class="text-xs mt-2" style="color: var(--ink-muted)">Qui voit quoi : un client voit les stats des groupes de puces qui lui sont rattachés, rien d'autre.</p>
      </div>
      <div class="flex gap-2">
        <NuxtLink to="/" class="btn">[stats]</NuxtLink>
        <button class="btn" @click="logout">[quitter]</button>
      </div>
    </header>

    <p v-if="message" class="text-xs mb-6 px-3 py-2 border" :style="{ borderColor: message.kind === 'ok' ? 'var(--green)' : 'var(--ribbon)', color: message.kind === 'ok' ? 'var(--green)' : 'var(--ribbon)' }">
      {{ message.text }}
    </p>

    <!-- Code révélé -->
    <div v-if="revealedCode" class="card p-6 mb-8 border-2" style="border-color: var(--green)">
      <p class="label-caps mb-2">code d'accès de {{ revealedCode.client }}</p>
      <div class="flex flex-wrap items-center gap-3">
        <code class="text-2xl font-bold tracking-wider">{{ revealedCode.code }}</code>
        <button class="btn" @click="copyCode">[{{ copied ? 'copié' : 'copier' }}]</button>
        <button class="btn" @click="revealedCode = null">[j'ai noté]</button>
      </div>
      <p class="text-xs mt-3" style="color: var(--ink-muted)">
        Il ne s'affichera plus : seule son empreinte est gardée. Perdu ? « nouveau code » en génère un autre.
      </p>
    </div>

    <div class="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
      <!-- Clients -->
      <section>
        <h2 class="font-bold mb-4">Clients <span class="label-caps ml-1">{{ clients.length }}</span></h2>
        <form class="flex gap-2 mb-4" @submit.prevent="createClient">
          <input v-model="newClient" class="field" placeholder="Nom du client (ex. BU Nantes)">
          <button class="btn shrink-0" :disabled="!newClient.trim()">[créer]</button>
        </form>
        <ul class="space-y-2">
          <li v-for="c in clients" :key="c.id" class="card p-4">
            <div class="flex items-baseline justify-between gap-2">
              <p class="font-bold">{{ c.name }}</p>
              <span class="text-xs" style="color: var(--ink-muted)">{{ groupsOf(c.id).length }} groupe(s) · {{ groupsOf(c.id).reduce((n, g) => n + g.uids.length, 0) }} puces</span>
            </div>
            <p class="text-xs mt-1" style="color: var(--ink-muted)">{{ groupsOf(c.id).map(g => g.name).join(', ') || 'aucun groupe rattaché' }}</p>
            <div class="flex flex-wrap gap-3 mt-3 text-xs">
              <button class="underline" @click="regenerateCode(c)">nouveau code</button>
              <button class="underline" @click="renameClient(c)">renommer</button>
              <button class="underline" style="color: var(--ribbon)" @click="deleteClient(c)">supprimer</button>
            </div>
          </li>
          <li v-if="!clients.length" class="text-xs" style="color: var(--ink-muted)">Aucun client pour l'instant.</li>
        </ul>
      </section>

      <!-- Groupes -->
      <section>
        <h2 class="font-bold mb-4">Groupes de puces <span class="label-caps ml-1">{{ groups.length }}</span></h2>
        <ul class="space-y-2 mb-8">
          <li v-for="g in groups" :key="g.id" class="card p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="font-bold">{{ g.name }} <span class="text-xs font-normal" style="color: var(--ink-muted)">· {{ g.uids.length }} puces</span></p>
              <select class="field !w-auto !py-1 text-xs" :value="g.clientId ?? ''" @change="setGroupClient(g, ($event.target as HTMLSelectElement).value)">
                <option value="">— aucun client —</option>
                <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div v-if="editing === g.id" class="mt-3">
              <textarea v-model="editUids" rows="7" class="field font-mono text-xs" />
              <div class="flex gap-2 mt-2">
                <button class="btn" @click="saveUids(g)">[enregistrer]</button>
                <button class="btn" @click="editing = null">[annuler]</button>
              </div>
            </div>
            <p v-else class="text-[11px] mt-2 leading-relaxed" style="color: var(--ink-muted)">{{ g.uids.map(formatUid).join(' · ') }}</p>
            <div class="flex flex-wrap gap-3 mt-3 text-xs">
              <button v-if="editing !== g.id" class="underline" @click="startEdit(g)">modifier les puces</button>
              <button class="underline" @click="renameGroup(g)">renommer</button>
              <button class="underline" style="color: var(--ribbon)" @click="deleteGroup(g)">supprimer</button>
            </div>
          </li>
          <li v-if="!groups.length" class="text-xs" style="color: var(--ink-muted)">Aucun groupe pour l'instant.</li>
        </ul>

        <div class="grid gap-4 md:grid-cols-2">
          <!-- Un groupe -->
          <form class="card p-5 space-y-3" @submit.prevent="createGroup">
            <p class="font-bold">Nouveau groupe</p>
            <input v-model="draft.name" class="field" placeholder="Nom (ex. BU Nantes 5)">
            <select v-model="draft.clientId" class="field">
              <option value="">— aucun client —</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <textarea v-model="draft.uids" rows="6" class="field font-mono text-xs" placeholder="Un UID par ligne&#10;04:6C:6D:32:50:23:90" />
            <button class="btn w-full" :disabled="!draft.name.trim() || !draft.uids.trim()">[créer le groupe]</button>
          </form>

          <!-- Import -->
          <form class="card p-5 space-y-3" @submit.prevent="importGroups">
            <p class="font-bold">Importer une liste</p>
            <p class="text-xs" style="color: var(--ink-muted)">Colle la liste telle quelle : un nom de groupe, puis ses UID en dessous.</p>
            <textarea v-model="importText" rows="6" class="field font-mono text-xs" placeholder="BU NANTES1&#10;04:6C:6D:32:50:23:90&#10;04:93:6D:32:50:23:90&#10;&#10;BUNANTES2&#10;..." />
            <select v-model="importClientId" class="field">
              <option value="">— rattacher à aucun client —</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">rattacher à {{ c.name }}</option>
            </select>
            <p v-if="parsed.length" class="text-xs">
              {{ parsed.length }} groupe(s) lu(s) : {{ parsed.map(p => `${p.name} (${p.uids.length})`).join(', ') }}
            </p>
            <p v-if="importConflicts.length" class="text-xs" style="color: var(--ribbon)">
              Rien n'est créé tant que ces puces sont en double : {{ importConflicts.join(' · ') }}
            </p>
            <button class="btn w-full" :disabled="!parsed.length || importConflicts.length > 0">[créer {{ parsed.length || '' }} groupe(s)]</button>
          </form>
        </div>
      </section>
    </div>
  </main>
</template>
