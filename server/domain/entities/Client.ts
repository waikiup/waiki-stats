/**
 * Un client B2B (ex. « BU Nantes ») qui se connecte avec son code d'accès
 * et ne voit que les statistiques de ses propres groupes de puces.
 */
export interface Client {
  id: string
  name: string
  /** SHA-256 du code d'accès : le code en clair n'est jamais stocké */
  codeHash: string
  createdAt: Date | null
}
