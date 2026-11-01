# Envoyer l'UID de la puce avec chaque session

Pour les apps iOS et Android. C'est ce qui permet au dashboard de dire « cette session a eu lieu à la BU Nantes 2 ».

## Le contrat

Table `sessions`, nouvelle colonne **`tagUid`** (string, 32 caractères max, facultative).

- La valeur : l'UID de la puce scannée **pour démarrer** la session.
- Format : hexadécimal, 7 octets pour nos NTAG 424, par ex. `046C6D32502390`. Majuscules/minuscules et `:` sont acceptés, le dashboard normalise.
- Pas de puce (démarrage sans scan, mode dev) : ne pas envoyer le champ, ou `null`.
- Les anciennes sessions restent sans `tagUid` : elles comptent dans « Hors groupes ».

La colonne est créée par `npm run setup:appwrite` dans ce dépôt ; tant qu'elle n'existe pas, Appwrite refuse un champ inconnu, donc **lancer le script avant de publier l'app**.

## iOS (repère dans `Waiki-ios`)

- `NFCService.tagReaderSession(_:didDetect:)` : aujourd'hui `self.finish(.success(nil))`. L'UID est dans `tag` : `if case let .miFare(t) = tag { t.identifier }` (`Data`), à convertir en hex (`map { String(format: "%02X", $0) }.joined()`) et à renvoyer à la place du `nil`.
- Le faire remonter jusqu'à `ActiveSession` (créée dans `SessionViewModel`), puis `SessionEntry` (nouveau champ `tagUid: String?`, Codable, avec valeur par défaut pour lire les anciens `sessions.json`), et enfin `SessionSyncService.sessionPayload` → `"tagUid": record.tagUid`.
- Attention aux sessions stockées par l'extension dans l'App Group (`WaikiStore.pendingSessions`) : même champ à ajouter.

## Android

- `Tag.getId()` renvoie l'UID en `ByteArray` ; même conversion hex.
- En passant : Android enregistre `dateStart` à minuit UTC au lieu de l'heure de début réelle (iOS envoie l'heure exacte). Le dashboard lit `startTime`, donc rien de faux, mais à aligner.
