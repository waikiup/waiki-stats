/**
 * Prépare Appwrite pour la v2 (à lancer une fois, sans risque de le relancer) :
 *   - table `tag_groups` (groupes de puces)
 *   - table `clients`    (clients B2B et hash de leur code)
 *   - colonne `tagUid` + index sur `sessions` (rien n'est modifié dans les lignes existantes)
 *
 *   npm run setup:appwrite
 *
 * La clé API du .env doit avoir les droits tables.write, columns.write, indexes.write.
 */
import { Client, TablesDB, TablesDBIndexType } from 'node-appwrite'

const env = process.env
const db = env.NUXT_APPWRITE_DATABASE_ID || 'main'
const sessions = env.NUXT_APPWRITE_SESSIONS_TABLE_ID || 'sessions'
const tagGroups = env.NUXT_APPWRITE_TAG_GROUPS_TABLE_ID || 'tag_groups'
const clients = env.NUXT_APPWRITE_CLIENTS_TABLE_ID || 'clients'

if (!env.NUXT_APPWRITE_PROJECT_ID || !env.NUXT_APPWRITE_API_KEY) {
  console.error('NUXT_APPWRITE_PROJECT_ID et NUXT_APPWRITE_API_KEY manquent dans .env')
  process.exit(1)
}

const tables = new TablesDB(
  new Client()
    .setEndpoint(env.NUXT_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(env.NUXT_APPWRITE_PROJECT_ID)
    .setKey(env.NUXT_APPWRITE_API_KEY)
)

/** Exécute une étape ; « existe déjà » (409) compte comme un succès */
async function step(label, fn) {
  try {
    await fn()
    console.log(`✓ ${label}`)
  } catch (e) {
    if (e?.code === 409) console.log(`= ${label} (déjà là)`)
    else { console.error(`✗ ${label} : ${e?.message ?? e}`); process.exitCode = 1 }
  }
}

// Les colonnes sont créées de façon asynchrone par Appwrite : on attend qu'elles soient prêtes avant l'index
async function waitColumn(tableId, key) {
  for (let i = 0; i < 30; i++) {
    const col = await tables.getColumn({ databaseId: db, tableId, key })
    if (col.status === 'available') return
    await new Promise(r => setTimeout(r, 1000))
  }
  throw new Error(`colonne ${tableId}.${key} toujours pas disponible`)
}

await step(`table ${tagGroups}`, () => tables.createTable({ databaseId: db, tableId: tagGroups, name: tagGroups }))
await step(`${tagGroups}.name`, () => tables.createStringColumn({ databaseId: db, tableId: tagGroups, key: 'name', size: 128, required: true }))
await step(`${tagGroups}.uids`, () => tables.createStringColumn({ databaseId: db, tableId: tagGroups, key: 'uids', size: 32, required: false, array: true }))
await step(`${tagGroups}.clientId`, () => tables.createStringColumn({ databaseId: db, tableId: tagGroups, key: 'clientId', size: 64, required: false }))

await step(`table ${clients}`, () => tables.createTable({ databaseId: db, tableId: clients, name: clients }))
await step(`${clients}.name`, () => tables.createStringColumn({ databaseId: db, tableId: clients, key: 'name', size: 128, required: true }))
await step(`${clients}.codeHash`, () => tables.createStringColumn({ databaseId: db, tableId: clients, key: 'codeHash', size: 64, required: true }))
await step(`index ${clients}.codeHash`, async () => {
  await waitColumn(clients, 'codeHash')
  await tables.createIndex({ databaseId: db, tableId: clients, key: 'idx_codeHash', type: TablesDBIndexType.Unique, columns: ['codeHash'] })
})

await step(`${sessions}.tagUid`, () => tables.createStringColumn({ databaseId: db, tableId: sessions, key: 'tagUid', size: 32, required: false }))
await step(`index ${sessions}.tagUid`, async () => {
  await waitColumn(sessions, 'tagUid')
  await tables.createIndex({ databaseId: db, tableId: sessions, key: 'idx_tagUid', type: TablesDBIndexType.Key, columns: ['tagUid'] })
})
